// Planning Toolkit — shared session store for a parsed programme.
//
// Plain script (not type="module"), same reasoning as xer-parser.js: this
// app must keep working when opened directly as a local file:// page, and
// module scripts fail there with a CORS error. Load after xer-parser.js is
// fine either order-wise (this module doesn't call parseXER itself), but by
// convention it sits alongside the other /lib scripts.
//
// What this holds: the raw output of FloatCheckLib.parseXER() — tasks, wbs,
// calendars, notes, preds, header, project, duplicateCodes — plus the
// original file name. That object is already plain strings/numbers/arrays/
// objects (parseXER never attaches a Date or a function to it), so it
// round-trips through JSON.stringify/parse with no custom (de)serialization.
//
// Deliberately NOT stored here: CPM results or float. Both floatcheck.html
// and leadtime.html already call FloatCheckLib.runCPM() fresh from the raw
// task list every time they render — that's cheap, deterministic, and is
// the existing pattern in both files. Persisting a second, separately
// serialized copy of CPM output (which contains Date objects and would need
// its own revive step) would just create a second place that can drift from
// the source data for no real benefit.
//
// Slots: 'current' | 'previous' | 'baseline'. LeadTime (one file) only ever
// touches 'current'. FloatCheck (comparison) touches 'current' + 'previous',
// and optionally 'baseline' for CPLI/BEI — same three concepts it already
// has in its own upload row. index.html's single dropzone always writes to
// 'current' before routing to a tool.
(function(global){
  'use strict';

  const STORAGE_KEY = 'planningtoolkit.session.v1';
  const VALID_SLOTS = ['current', 'previous', 'baseline'];

  function readStore(){
    try{
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if(!raw) return {};
      const parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed;
    }catch(err){
      // Corrupt or unreadable (private-browsing quota, hand-edited storage,
      // a future shape change) - never let a bad session block the page.
      // Wipe it so the next write starts clean instead of failing forever.
      try{ sessionStorage.removeItem(STORAGE_KEY); }catch(_e){}
      return {};
    }
  }

  function writeStore(store){
    try{
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    }catch(err){
      // Quota exceeded, sessionStorage disabled, or private-browsing mode in
      // a browser that throws on write - the session store is a convenience,
      // not a requirement, so fail silently and let the caller's normal
      // upload flow keep working exactly as if no session existed.
      return false;
    }
  }

  function assertSlot(slot){
    if(VALID_SLOTS.indexOf(slot) === -1){
      throw new Error(`Unknown session slot "${slot}" - expected one of ${VALID_SLOTS.join(', ')}`);
    }
  }

  // save: persist a parsed programme (parseXER() output) into a named slot.
  // Returns true if the write succeeded, false if storage was unavailable -
  // callers should treat false as "carry on without session support",
  // never as an error to surface to the user.
  function save(slot, parsedData, fileName){
    assertSlot(slot);
    const store = readStore();
    store[slot] = { data: parsedData, fileName: fileName || '', savedAt: new Date().toISOString() };
    return writeStore(store);
  }

  // load: returns { data, fileName, savedAt } for a slot, or null if that
  // slot is empty or storage is unavailable/corrupt.
  function load(slot){
    assertSlot(slot);
    const store = readStore();
    return store[slot] || null;
  }

  function has(slot){
    return !!load(slot);
  }

  function clear(slot){
    assertSlot(slot);
    const store = readStore();
    delete store[slot];
    writeStore(store);
  }

  function clearAll(){
    try{ sessionStorage.removeItem(STORAGE_KEY); }catch(_e){}
  }

  global.FloatCheckLib = global.FloatCheckLib || {};
  global.FloatCheckLib.session = { save, load, has, clear, clearAll };
})(window);
