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
  function workdaysBetween(d1, d2){
    if(!d1 || !d2) return 0;
    let sign = 1, a=d1, b=d2;
    if(b < a){ sign=-1; a=d2; b=d1; }
    let days=0, cur=new Date(a);
    while(cur < b){
      cur.setUTCDate(cur.getUTCDate()+1);
      const wd = cur.getUTCDay();
      if(wd!==0 && wd!==6) days++;
    }
    return sign*days;
  }
  function addWorkdays(start, days){
    let d = new Date(start), added=0;
    while(added<days){ d.setUTCDate(d.getUTCDate()+1); const wd=d.getUTCDay(); if(wd!==0&&wd!==6) added++; }
    return d;
  }
  function subWorkdays(end, days){
    let d = new Date(end), removed=0;
    while(removed<days){ d.setUTCDate(d.getUTCDate()-1); const wd=d.getUTCDay(); if(wd!==0&&wd!==6) removed++; }
    return d;
  }
  function offsetWorkdays(date, signedDays){
    if(signedDays>0) return addWorkdays(date, signedDays);
    if(signedDays<0) return subWorkdays(date, -signedDays);
    return date;
  }

  // CPM forward/backward pass. durOverride: optional map code->duration days (used during crash iterations)
  // Lag (FS relationships only - SS/FF/SF are not modelled, see README known limitations)
  // is applied here: each predecessor edge carries lag_hr from the XER, converted to
  // workdays with the same 8hr/day assumption used for durations elsewhere.
  function runCPM(tasks, projectStart, durOverride){
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
    const ES={}, EF={};
    order.forEach(code=>{
      const t = byCode[code];
      if(t.pred_edges.length===0){ ES[code]=new Date(projectStart); }
      else { ES[code] = t.pred_edges.reduce((m,e)=>{
        const efp = EF[e.code]; if(!efp) return m;
        const constraint = offsetWorkdays(efp, lagWorkdays(e.lag_hr));
        return (!m||constraint>m) ? constraint : m;
      }, null); }
      EF[code] = addWorkdays(ES[code], dur(code));
    });
    const projFinish = order.reduce((m,c)=> !m||EF[c]>m?EF[c]:m, null);

    const succ = {}; tasks.forEach(t=> succ[t.task_code]=[]);
    tasks.forEach(t=> t.pred_edges.forEach(e=> { (succ[e.code] ||= []).push({ code: t.task_code, lag_hr: e.lag_hr }); }));

    const LF={}, LS={};
    for(let i=order.length-1;i>=0;i--){
      const code = order[i];
      const s = succ[code]||[];
      if(s.length===0){ LF[code]=projFinish; }
      else { LF[code] = s.reduce((m,se)=>{
        const lsSc = LS[se.code]; if(!lsSc) return m;
        const constraint = offsetWorkdays(lsSc, -lagWorkdays(se.lag_hr));
        return (!m||constraint<m) ? constraint : m;
      }, null); }
      LS[code] = subWorkdays(LF[code], dur(code));
    }
    const TF = {};
    order.forEach(code=> TF[code] = global.FloatCheckLib.computeTotalFloat(EF[code], LF[code], workdaysBetween));

    return { order, ES, EF, LS, LF, TF, projFinish, byCode };
  }

  global.FloatCheckLib = global.FloatCheckLib || {};
  Object.assign(global.FloatCheckLib, {
    parseDate, workdaysBetween, addWorkdays, subWorkdays, offsetWorkdays, runCPM
  });
})(window);
