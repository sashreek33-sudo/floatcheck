// FloatCheck — float calculation (extracted from floatcheck.html's runCPM).
//
// Plain script (see xer-parser.js's header comment for why: no `type="module"`,
// so this keeps working when the app is opened directly as a local file).
// Load before cpm-engine.js.
//
// IMPORTANT: only total float exists in this app today. In the original
// inline script it wasn't a standalone function - it was one line inside
// runCPM's backward pass: `TF[code] = workdaysBetween(EF[code], LF[code])`.
// That line is extracted here unchanged (same maths, just named and moved).
// Free float is NOT implemented anywhere in FloatCheck currently, so there
// is nothing to extract for it - it has deliberately not been added here,
// per this refactor being a pure extraction with no new features.
(function(global){
  'use strict';

  // Total float = the workday span between an activity's early finish and
  // late finish. workdaysBetween is calendar arithmetic owned by
  // cpm-engine.js and passed in here rather than duplicated, so there's a
  // single implementation of "workdays between two dates" in the app.
  function computeTotalFloat(earlyFinish, lateFinish, workdaysBetweenFn){
    return workdaysBetweenFn(earlyFinish, lateFinish);
  }

  global.FloatCheckLib = global.FloatCheckLib || {};
  global.FloatCheckLib.computeTotalFloat = computeTotalFloat;
})(window);
