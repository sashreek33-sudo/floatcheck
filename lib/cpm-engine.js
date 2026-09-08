// FloatCheck — CPM engine: date/workday arithmetic, forward/backward pass,
// critical path (extracted verbatim from floatcheck.html).
//
// Plain script (see xer-parser.js's header comment for why). Load after
// float.js, since runCPM calls FloatCheckLib.computeTotalFloat.
//
// No calculation logic differs from the pre-extraction version - pure
// copy/paste, not a rewrite. crashProject() is NOT moved here: it's a
// feature built on top of runCPM (greedy crashing), not part of the core
// CPM engine itself, and stays in floatcheck.html using the runCPM exported
// from this file.
(function(global){
  'use strict';

  function parseDate(s){
    if(!s) return null;
    const d = s.trim().split(' ')[0];
    const [y,m,day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m-1, day));
  }
  // Shared working-day test used by workdaysBetween/addWorkdays/subWorkdays
  // below, factored into one place so all three apply the exact same rule -
  // written once rather than duplicating the cal/no-cal branch three times
  // with the risk of one copy drifting from the others.
  // cal is the activity's parsed calendar - { workingDays: Set<1-7>,
  // exceptions: Set<'YYYY-MM-DD'> } - or undefined. undefined (no calendar
  // resolved: no calendars map passed to runCPM, no clndr_id on the
  // activity, no matching entry, or a clndr_data that didn't parse) falls
  // through to exactly today's Mon-Fri check - byte-identical to the
  // pre-calendar-aware behaviour for every existing caller.
  // Day index mapping: getUTCDay() is 0=Sunday...6=Saturday; clndr_data's
  // own day index is 1=Sunday...7=Saturday - so wd+1 converts one to the
  // other, done here rather than by the caller.
  function isWorkingDay(date, cal){
    const wd = date.getUTCDay();
    if(!cal) return wd!==0 && wd!==6;
    if(!cal.workingDays.has(wd+1)) return false;
    const dateStr = date.toISOString().slice(0,10);
    return !cal.exceptions.has(dateStr);
  }
  function workdaysBetween(d1, d2, cal){
    if(!d1 || !d2) return 0;
    let sign = 1, a=d1, b=d2;
    if(b < a){ sign=-1; a=d2; b=d1; }
    let days=0, cur=new Date(a);
    while(cur < b){
      cur.setUTCDate(cur.getUTCDate()+1);
      if(isWorkingDay(cur, cal)) days++;
    }
    return sign*days;
  }
  function addWorkdays(start, days, cal){
    let d = new Date(start), added=0;
    while(added<days){ d.setUTCDate(d.getUTCDate()+1); if(isWorkingDay(d, cal)) added++; }
    return d;
  }
  function subWorkdays(end, days, cal){
    let d = new Date(end), removed=0;
    while(removed<days){ d.setUTCDate(d.getUTCDate()-1); if(isWorkingDay(d, cal)) removed++; }
    return d;
  }
  function offsetWorkdays(date, signedDays, cal){
    if(signedDays>0) return addWorkdays(date, signedDays, cal);
    if(signedDays<0) return subWorkdays(date, -signedDays, cal);
    return date;
  }

  // CPM forward/backward pass. durOverride: optional map code->duration days (used during crash iterations)
  // Lag (FS relationships only - SS/FF/SF are not modelled, see README known limitations)
  // is applied here: each predecessor edge carries lag_hr from the XER, converted to
  // workdays with the same 8hr/day assumption used for durations elsewhere.
  // calendars: optional map clndr_id -> {clndr_name, parsed} (xer-parser.js's
  // shape) used to resolve each activity's own working-day pattern. Every
  // existing caller that doesn't pass this argument gets calFor() resolving
  // to undefined for every activity, which is exactly the signal
  // addWorkdays/subWorkdays/workdaysBetween/offsetWorkdays already treat as
  // "use Mon-Fri" - so omitting it is byte-identical to today's behaviour.
  function runCPM(tasks, projectStart, durOverride, calendars){
    const byCode = {}; tasks.forEach(t=> byCode[t.task_code]=t);
    const visited={}, inProgress={}, order=[];
    function visit(code){
      if(visited[code]) return;
      if(inProgress[code]) throw new Error(`Circular logic detected in predecessor chain at activity ${code} - this schedule's logic is not a valid network and cannot be scheduled.`);
      inProgress[code] = true;
      const t = byCode[code];
      if(!t){ inProgress[code]=false; return; }
      t.pred_codes.forEach(p=> visit(p));
      inProgress[code] = false;
      visited[code]=true;
      order.push(code);
    }
    tasks.forEach(t=> visit(t.task_code));

    const dur = code => (durOverride && durOverride[code]!==undefined) ? durOverride[code] : byCode[code].dur_days;
    const lagWorkdays = lag_hr => Math.round((lag_hr||0)/8);
    // Resolves an activity's own parsed calendar, or undefined on any miss
    // (no calendars map, no clndr_id, id not found, or clndr_data that
    // didn't parse) - never throws, never fabricates a calendar.
    const calFor = code => calendars?.[byCode[code]?.clndr_id]?.parsed ?? undefined;
    const ES={}, EF={};
    order.forEach(code=>{
      const t = byCode[code];
      const cal = calFor(code);
      if(t.pred_edges.length===0){ ES[code]=new Date(projectStart); }
      else { ES[code] = t.pred_edges.reduce((m,e)=>{
        const efp = EF[e.code]; if(!efp) return m;
        // Lag is measured on the PREDECESSOR's own calendar, not the
        // successor's - matching sched_calendar_on_relationship_lag =
        // rcal_Predecessor, confirmed as what real P6 files use before
        // wiring this in (not assumed).
        const constraint = offsetWorkdays(efp, lagWorkdays(e.lag_hr), calFor(e.code));
        return (!m||constraint>m) ? constraint : m;
      }, null); }
      EF[code] = addWorkdays(ES[code], dur(code), cal);
    });
    const projFinish = order.reduce((m,c)=> !m||EF[c]>m?EF[c]:m, null);

    const succ = {}; tasks.forEach(t=> succ[t.task_code]=[]);
    tasks.forEach(t=> t.pred_edges.forEach(e=> { (succ[e.code] ||= []).push({ code: t.task_code, lag_hr: e.lag_hr }); }));

    const LF={}, LS={};
    for(let i=order.length-1;i>=0;i--){
      const code = order[i];
      const cal = calFor(code);
      const s = succ[code]||[];
      if(s.length===0){ LF[code]=projFinish; }
      else { LF[code] = s.reduce((m,se)=>{
        const lsSc = LS[se.code]; if(!lsSc) return m;
        // `code` (this loop's own activity) is the predecessor in every
        // code->se relationship here (succ[code] holds code's own
        // successors) - so its already-resolved `cal` is the right
        // predecessor calendar for the lag, same convention as the
        // forward pass above.
        const constraint = offsetWorkdays(lsSc, -lagWorkdays(se.lag_hr), cal);
        return (!m||constraint<m) ? constraint : m;
      }, null); }
      LS[code] = subWorkdays(LF[code], dur(code), cal);
    }
    const TF = {};
    order.forEach(code=> TF[code] = global.FloatCheckLib.computeTotalFloat(EF[code], LF[code], workdaysBetween, calFor(code)));

    return { order, ES, EF, LS, LF, TF, projFinish, byCode };
  }

  global.FloatCheckLib = global.FloatCheckLib || {};
  Object.assign(global.FloatCheckLib, {
    parseDate, workdaysBetween, addWorkdays, subWorkdays, offsetWorkdays, runCPM
  });
})(window);
