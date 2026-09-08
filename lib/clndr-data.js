// FloatCheck — parses the P6 XER CALENDAR table's clndr_data field: a
// nested, parenthesized structured-text blob describing a calendar's
// working week and exception (holiday) dates. Not delimited like the rest
// of an XER file - a tree, not flat records.
//
// Plain script (see xer-parser.js's header comment for why: no
// `type="module"`, so this keeps working when a page is opened directly as
// a local file). Standalone - no dependency on xer-parser.js or
// cpm-engine.js, and nothing in this session's app calls it yet. This is
// Phase 1 only: the parser and its self-test, nothing wired up.
//
// Grammar this parser assumes, confirmed against a real public sample
// before writing any code (see the session's own design discussion, not
// reproduced here) - every node has the same three-part shape:
//   (0||KEY(VALUE)(CHILD)(CHILD)...)
// i.e. a key, then a parenthesized value string, then a parenthesized
// group holding zero or more child nodes of the same shape. No comma or
// other separator between children - they're told apart purely by paren
// balance, which is what makes this format awkward to parse with a regex
// and why this is a real recursive-descent parser instead of one.
//
// Day index: 1=Sunday through 7=Saturday (per spec this was built against -
// not ISO weekday numbering, don't reuse Date.getUTCDay() indices here
// without converting).
// A day is working if ANY node anywhere in its subtree has a value matching
// `s|HH:MM|f|HH:MM` (a work-hour span) - checked recursively rather than at
// a fixed depth, since how many levels a shift sits at isn't something this
// parser assumes. An empty day node (no such span anywhere under it) is
// non-working - this literally follows the spec; a span present but
// zero-length (e.g. `s|00:00|f|00:00`, seen in some real P6 exports as an
// alternate "non-working" encoding) still counts as working under this
// rule, on purpose - not a case the spec this was built against covers, so
// not guessed at here.
// Exception dates live under an `Exceptions` node, each as a `d|<integer>`
// value - the integer is a day count from epoch 1899-12-30 (the OLE
// Automation date system, not the Excel 1900-leap-bug serial system -
// confirmed by computing a real offset by hand before writing this: 43831
// days from that epoch lands on 2020-01-01, a sane date, not garbage).
(function(global){
  'use strict';

  // ---------- Generic recursive-descent parser for the (0||K(V)(C...)) tree ----------

  // Given `str` and a position immediately AFTER an opening '(', returns the
  // balanced content up to (not including) its matching ')', plus the index
  // right after that closing paren. Counts nested parens rather than just
  // scanning to the next ')', since a value or children group can itself
  // contain further parenthesized structure.
  function scanBalanced(str, pos){
    let depth = 1, i = pos;
    while(i < str.length && depth > 0){
      if(str[i] === '(') depth++;
      else if(str[i] === ')') depth--;
      i++;
    }
    if(depth !== 0) return null; // unbalanced - malformed input
    return { content: str.slice(pos, i-1), next: i };
  }

  // Parses one node starting at `pos` (which must point at the '(' of a
  // "(0||" marker). Returns { key, value, children, next } or null if this
  // position isn't a well-formed node - callers treat null as "stop
  // parsing here" rather than throwing, per the "never throw" rule.
  function parseNode(str, pos){
    if(str.slice(pos, pos+4) !== '(0||') return null;
    let i = pos + 4;
    const keyEnd = str.indexOf('(', i);
    if(keyEnd === -1) return null;
    const key = str.slice(i, keyEnd);
    i = keyEnd;
    if(str[i] !== '(') return null;
    const valueScan = scanBalanced(str, i+1);
    if(!valueScan) return null;
    const value = valueScan.content;
    i = valueScan.next;
    if(str[i] !== '(') return null;
    const childrenScan = scanBalanced(str, i+1);
    if(!childrenScan) return null;
    i = childrenScan.next;
    if(str[i] !== ')') return null; // this node's own closing paren
    i = i + 1;

    const children = [];
    let cp = 0;
    const childStr = childrenScan.content;
    while(cp < childStr.length){
      // Skip anything between sibling nodes that isn't the start of the
      // next one - not just whitespace-per-/\s/. Real P6 exports have been
      // seen padding this exact spot with literal ASCII DEL (0x7F)
      // characters, which \s does not match; advancing past "not a paren"
      // instead of "not whitespace" handles that (and any other stray
      // separator byte) without needing to enumerate every real-world
      // padding character by hand. Confirmed against a real file before
      // writing this, not a hypothetical.
      while(cp < childStr.length && childStr[cp] !== '(') cp++;
      if(cp >= childStr.length) break;
      const child = parseNode(childStr, cp);
      if(!child) break; // malformed remainder - stop, keep what parsed so far
      children.push(child);
      cp = child.next;
    }

    return { key, value, children, next: i };
  }

  // Depth-first search for the first node anywhere in the tree with the
  // given key (case-sensitive, matching XER's own naming).
  function findNodeByKey(node, key){
    if(!node) return null;
    if(node.key === key) return node;
    for(const child of node.children){
      const found = findNodeByKey(child, key);
      if(found) return found;
    }
    return null;
  }

  // True if this node or anything under it carries a working-hour span
  // value (`s|HH:MM|f|HH:MM`) - recursive, not depth-limited, since a shift
  // node's exact nesting depth under a day node isn't assumed fixed.
  const SPAN_RE = /^s\|\d{2}:\d{2}\|f\|\d{2}:\d{2}$/;
  function hasWorkSpan(node){
    if(!node) return false;
    if(SPAN_RE.test(node.value)) return true;
    return node.children.some(hasWorkSpan);
  }

  // Collects every `d|<integer>` value anywhere under this node - used for
  // Exceptions, walked generically rather than assuming a fixed depth for
  // the same reason as hasWorkSpan above.
  const EXCEPTION_RE = /^d\|(\d+)$/;
  function collectExceptionOffsets(node, out){
    if(!node) return;
    const m = EXCEPTION_RE.exec(node.value);
    if(m) out.push(parseInt(m[1], 10));
    node.children.forEach(c => collectExceptionOffsets(c, out));
  }

  // OLE Automation date epoch: day 0 = 1899-12-30. Not the Excel serial
  // system (which has a 1900-leap-year bug baked in) - a plain day count
  // from this date, confirmed by hand before writing this function (see
  // file header comment).
  const OLE_EPOCH_MS = Date.UTC(1899, 11, 30);
  function offsetToISODate(offsetDays){
    const d = new Date(OLE_EPOCH_MS + offsetDays * 86400000);
    const p = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}`;
  }

  // ---------- Public entry point ----------

  function parseClndrData(blob){
    try{
      if(!blob || typeof blob !== 'string' || !blob.trim()) return null;

      const start = blob.indexOf('(0||');
      if(start === -1) return null;
      const root = parseNode(blob, start);
      if(!root) return null;

      const daysOfWeek = findNodeByKey(root, 'DaysOfWeek');
      if(!daysOfWeek) return null; // no working-week info at all - nothing usable to return

      const workingDays = new Set();
      for(let day = 1; day <= 7; day++){
        const dayNode = daysOfWeek.children.find(c => c.key === String(day));
        if(dayNode && hasWorkSpan(dayNode)) workingDays.add(day);
      }

      const exceptions = new Set();
      const exceptionsNode = findNodeByKey(root, 'Exceptions');
      if(exceptionsNode){
        const offsets = [];
        collectExceptionOffsets(exceptionsNode, offsets);
        offsets.forEach(off => exceptions.add(offsetToISODate(off)));
      }

      return { workingDays, exceptions };
    }catch(err){
      return null; // never throw - an unparseable blob is reported as null, not a crash
    }
  }

  // ---------- Self-test ----------
  // Hand-built, not from a real file (none in this repo carries clndr_data -
  // confirmed before writing this). Mon-Sat working (Sat a half day, still
  // "working" per the spec), Sunday non-working, one exception date.
  (function selfTest(){
    const testBlob =
      '(0||CalendarData()(' +
        '(0||DaysOfWeek()(' +
          '(0||1()())' +                                   // Sunday - no span at all - non-working
          '(0||2()((0||0(s|08:00|f|16:30)())))' +           // Monday
          '(0||3()((0||0(s|08:00|f|16:30)())))' +           // Tuesday
          '(0||4()((0||0(s|08:00|f|16:30)())))' +           // Wednesday
          '(0||5()((0||0(s|08:00|f|16:30)())))' +           // Thursday
          '(0||6()((0||0(s|08:00|f|16:30)())))' +           // Friday
          '(0||7()((0||0(s|08:00|f|12:00)())))' +           // Saturday - half day, still working
        '))' +
        '(0||Exceptions()(' +
          '(0||0(d|46023)())' +                             // 2026-01-01
        '))' +
      '))';

    const result = parseClndrData(testBlob);
    const expectedWorkingDays = [2,3,4,5,6,7]; // Mon-Sat, Sunday excluded
    const expectedExceptions = ['2026-01-01'];

    const pass = !!result
      && result.workingDays.size === expectedWorkingDays.length
      && expectedWorkingDays.every(d => result.workingDays.has(d))
      && !result.workingDays.has(1)
      && result.exceptions.size === expectedExceptions.length
      && expectedExceptions.every(d => result.exceptions.has(d));

    // Also confirm the "never throw, return null" contract for bad input,
    // since that's as much a part of this function's spec as the happy path.
    const nullPass = parseClndrData(null) === null
      && parseClndrData('') === null
      && parseClndrData('not a valid blob at all') === null;

    // Real-world padding case: the same calendar as testBlob above, but with
    // literal ASCII DEL (0x7F) characters between sibling nodes instead of
    // nothing - exactly what a real P6 export (confirmed directly against
    // Final Rev 02 Final.xer's "EMIRAL ALGERIA" calendar before writing this)
    // uses in place of the spaces/newlines a hand-built blob would use. Must
    // parse to the identical result as the unpadded version - proves the
    // fix generically skips non-paren separator bytes, not just this one
    // byte value by name.
    const DEL = String.fromCharCode(127);
    const pad = DEL + DEL;
    const paddedTestBlob =
      '(0||CalendarData()(' + pad +
        '(0||DaysOfWeek()(' + pad +
          '(0||1()())' + pad +
          '(0||2()((0||0(s|08:00|f|16:30)())))' + pad +
          '(0||3()((0||0(s|08:00|f|16:30)())))' + pad +
          '(0||4()((0||0(s|08:00|f|16:30)())))' + pad +
          '(0||5()((0||0(s|08:00|f|16:30)())))' + pad +
          '(0||6()((0||0(s|08:00|f|16:30)())))' + pad +
          '(0||7()((0||0(s|08:00|f|12:00)())))' + pad +
        '))' + pad +
        '(0||Exceptions()(' + pad +
          '(0||0(d|46023)())' + pad +
        '))' + pad +
      '))';
    const paddedResult = parseClndrData(paddedTestBlob);
    const paddedPass = !!paddedResult
      && paddedResult.workingDays.size === result.workingDays.size
      && [...result.workingDays].every(d => paddedResult.workingDays.has(d))
      && paddedResult.exceptions.size === result.exceptions.size
      && [...result.exceptions].every(d => paddedResult.exceptions.has(d));

    if(pass && nullPass && paddedPass){
      console.log('[clndr-data.js] self-test PASS');
    } else {
      console.error('[clndr-data.js] self-test FAIL', { result, pass, nullPass, paddedResult, paddedPass });
    }
  })();

  global.FloatCheckLib = global.FloatCheckLib || {};
  global.FloatCheckLib.parseClndrData = parseClndrData;
})(window);
