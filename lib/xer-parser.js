// FloatCheck — XER file parsing (extracted verbatim from floatcheck.html).
//
// Plain script, not an ES module: browsers block `type="module"` fetches over
// file:// with a CORS error, and this app needs to keep working when opened
// directly as a local file, not just when served over http(s). So this file
// attaches its exports to a shared `window.FloatCheckLib` namespace object
// instead of using `export` — load it with a plain <script src="lib/xer-parser.js">
// before any code that calls parseXER().
//
// No calculation logic here differs from the pre-extraction version in
// floatcheck.html - this is a pure copy/paste, not a rewrite.
(function(global){
  'use strict';

  function parseXER(text){
    const lines = text.split(/\r?\n/);
    const data = { header:{}, project:{}, wbs:{}, tasks:[], notes:{}, preds:{}, calendars:{} };
    let currentTable = null, headers = [];

    for(const raw of lines){
      if(!raw) continue;
      if(raw.startsWith('ERMHDR')){
        const p = raw.split('\t');
        data.header = { date:p[2], projName:p[4] };
        continue;
      }
      if(raw.startsWith('%T')){ currentTable = raw.split('\t')[1]; headers=[]; continue; }
      if(raw.startsWith('%F')){ headers = raw.split('\t').slice(1); continue; }
      if(raw.startsWith('%E')){ currentTable=null; continue; }
      if(raw.startsWith('%R') && currentTable){
        const vals = raw.split('\t').slice(1);
        const row = {};
        headers.forEach((h,i)=> row[h]=vals[i] !== undefined ? vals[i] : '');
        if(currentTable === 'PROJECT'){ data.project = row; }
        else if(currentTable === 'PROJWBS'){ data.wbs[row.wbs_id] = row.wbs_short_name; }
        else if(currentTable === 'CALENDAR'){ data.calendars[row.clndr_id] = row.clndr_name; }
        else if(currentTable === 'TASK'){ data.tasks.push(row); }
        else if(currentTable === 'TASKNOTE'){
          if(!data.notes[row.task_id]) data.notes[row.task_id] = [];
          data.notes[row.task_id].push(row.task_memo);
        }
        else if(currentTable === 'TASKPRED'){
          if(!data.preds[row.task_id]) data.preds[row.task_id] = [];
          data.preds[row.task_id].push({ pred_task_id: row.pred_task_id, lag_hr: parseFloat(row.lag_hr_cnt)||0, pred_type: row.pred_type||'PR_FS' });
        }
      }
    }
    // Duplicate task_code detection: every downstream lookup (prevMap/currMap/byCode etc.)
    // is keyed by task_code, so a duplicate silently lets the later row clobber the earlier
    // one. Surfaced as a UI warning (updateParseWarnings) rather than fixed by re-keying,
    // which would ripple through every rendering function - see README known limitations.
    const codeCounts = {};
    data.tasks.forEach(t=> { codeCounts[t.task_code] = (codeCounts[t.task_code]||0) + 1; });
    data.duplicateCodes = Object.keys(codeCounts).filter(c=> codeCounts[c] > 1);

    // attach wbs name + notes + predecessor codes + duration (days) to each task
    const idToCode = {}; data.tasks.forEach(t=> idToCode[t.task_id]=t.task_code);
    data.tasks.forEach(t=>{
      t.wbs_name = data.wbs[t.wbs_id] || '';
      t.notes = data.notes[t.task_id] || [];
      const rawEdges = data.preds[t.task_id] || [];
      t.pred_edges = rawEdges.map(e=> ({ code: idToCode[e.pred_task_id], lag_hr: e.lag_hr, pred_type: e.pred_type })).filter(e=>e.code);
      t.pred_codes = t.pred_edges.map(e=>e.code);
      // For an in-progress activity, remaining duration (what's actually left to do) is the
      // correct driver for forward-pass dates - not the original planned duration. This is a
      // partial fix: it doesn't use act_start_date or retained-logic/progress-override
      // semantics, so it's not full data-date awareness - see README known limitations.
      // remain_drtn_hr_cnt isn't in every XER export (e.g. neither demo file here carries it),
      // so this falls back to target_drtn_hr_cnt whenever it's absent.
      const useRemaining = t.status_code === 'TK_Active' && t.remain_drtn_hr_cnt !== undefined && t.remain_drtn_hr_cnt !== '';
      const durHrs = useRemaining ? t.remain_drtn_hr_cnt : t.target_drtn_hr_cnt;
      t.dur_days = Math.round((parseFloat(durHrs)||0)/8);
    });
    // successor count per task (for open-end / missing-logic checks)
    const succCount = {}; data.tasks.forEach(t=> succCount[t.task_code]=0);
    data.tasks.forEach(t=> t.pred_codes.forEach(p=> { if(succCount[p]!==undefined) succCount[p]++; }));
    data.tasks.forEach(t=> t.succ_count = succCount[t.task_code]||0);
    return data;
  }

  global.FloatCheckLib = global.FloatCheckLib || {};
  global.FloatCheckLib.parseXER = parseXER;
})(window);
