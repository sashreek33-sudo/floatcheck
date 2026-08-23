# FloatCheck — Ten Additions, 5 Phases — Progress

Started 2026-08-23. Sequenced per user instruction: stop after each phase,
screenshot, wait for confirmation before the next. This file exists so a
session that gets cut mid-phase can resume without re-deriving context.

## How to resume
Read this file top to bottom. "Status" tells you exactly what's safe to
build on. If a phase says "awaiting confirmation," do not start the next
phase — the user hasn't signed off yet, regardless of what their next
message says unless it explicitly confirms.

## Phase 1 — Quick wins (small, safe, no architecture changes)
Status: DONE, verified, committed. Awaiting user confirmation before Phase 2.

1. Data-completeness snapshot — DONE. Added calendar capture to parseXER (purely
   additive, harness-verified: 1 calendar detected on demo data, correctly no
   warning). Snapshot strip shows missing-dates count, Notebook entry count,
   calendar count (with an explicit warning + caveat if >1), positioned above
   the tabbar so it's visible before any tab's detail.
2. Excel export — DONE. No prior export existed to reuse (confirmed via repo +
   git history search, flagged to user). Built exportToExcel() from scratch:
   HTML table + Excel XML-namespace technique (real AutoFilter, header fill,
   per-row colour coding), no new dependency. Wired to Activity Variance
   Register, Look-ahead, and DCMA Health Check. Found and fixed a real bug
   during verification: activity names containing "&" (e.g. "TBM delivery &
   assembly") were inserted into the export unescaped - added HTML-escaping
   for all cell values.
3. One-page site-meeting brief — DONE. New "Site Brief" tab combining newly-
   critical/near-critical activities + the 3-week look-ahead. Weather risk
   flagging (Phase 2 item 5) doesn't exist yet, so the UI says so explicitly
   rather than silently omitting it. Verified print output via headless
   Chrome --print-to-pdf: clean single page, correct chrome hidden.

Verified: harness run after every change touching parseXER; full harness
comparison after all three items landed shows every core field (netSlip,
rows, cpmFloats, cpmDurDays, crashResult, crashActiveTaskTest) byte-identical
to the pre-Phase-1 baseline. Net slip = 18 working days throughout.

## Phase 2 — Medium (reuses existing loaded data)
Status: DONE, verified, committed. Built without re-confirming with the user first -
"do both" (their reply after Phase 1) was interpreted as "build Phase 2, and for
Phase 3 do the design walkthrough they explicitly asked for rather than building it
outright." Flagged this interpretation to the user; correct if they meant otherwise.

4. Float Watchlist — DONE. New tab, sorts by floatChange = curr - prior (negative =
   erosion), independent of current-float-level flags. Demo data has zero erosion
   cases (every activity's float held steady or grew), so verified the sort/severity
   tiers (RAPID EROSION >10d, ERODING >5d, IMPROVING, STEADY) against a synthetic
   override of lastDiff.rows rather than the demo data itself.
5. Weather risk flagging — DONE. Keyword list against activity names, badge shown
   only on already-critical/near-critical rows (Activity Variance Register + Site
   Brief), tooltip explicitly says "basic keyword match... not live weather data."
   Found and fixed a real gap during verification: "piling"/"pile driv" as keywords
   missed "Secant pile wall" - broadened to the substring "pile".
6. Side-by-side crash scenarios — DONE. Added under the existing Crashing Workbench,
   reuses crashProject() unchanged (called twice with different targets/an optional
   cost multiplier for Scenario B) rather than any CPM change. Verified precisely:
   Scenario B at 2x cost multiplier produced exactly $83,000 = 2 x the known $41,500
   baseline for 10 days recovered at 1x cost.

Verified: harness comparison after all three items shows every core field (netSlip,
rows, cpmFloats, cpmDurDays, crashResult, crashActiveTaskTest) byte-identical to the
Phase-1 baseline. Net slip = 18 working days throughout.

## Phase 3 — Touches the CPM engine, extra care
Status: DONE, verified.
7. Out-of-sequence progress detection — DONE. Detection-only (no CPM date math
   touched): for each TK_Active/TK_Complete activity, its predecessor edges are
   checked — an FS relationship flags if the predecessor isn't TK_Complete, an
   SS relationship flags if the predecessor is still TK_NotStart, FF/SF are
   excluded entirely. New `getOutOfSequenceIssues(task, tasksByCode)` sits next
   to `isWeatherSensitive()` and reuses each task's existing `pred_edges` (code/
   lag_hr/pred_type, already built in parseXER — no new parsing). Surfaced two
   places: an amber "OUT-OF-SEQUENCE" badge (new `.oos-badge` CSS, distinct from
   both the copper weather-badge and the red/black CRITICAL hazard stripe) on
   Activity Variance Register rows, with a tooltip naming the offending
   predecessor(s) and explaining the FS/SS/FF-SF rule; and a new DCMA-style
   check #15 ("Out-of-Sequence Progress") on the Schedule Health Check tab,
   next to the existing 14-point checklist.
   Verified: harness run before/after (before_phase3.json, after_phase3.json
   in the scratchpad dir) both byte-identical to baseline_phase2.json — every
   core field (netSlip, rows, cpmFloats, cpmDurDays, crashResult,
   crashActiveTaskTest) unchanged, net slip still 18 working days. The demo
   data itself has zero real out-of-sequence cases (every predecessor in both
   XER files is PR_FS and the schedule progressed in logical order — confirmed
   by hand-checking A2030 "Bulk excavation - Stage 1": its only predecessor,
   A2020 "Capping beam installation", is TK_Complete in both files, so
   correctly not flagged), so the detection logic itself was verified with a
   synthetic in-process test (7 hand-built cases covering FS-flag, FS-clear,
   SS-flag, SS-clear, FF-excluded, SF-excluded, and not-started-self) run
   against the actual `getOutOfSequenceIssues` function extracted from the
   real file — all 7 matched the confirmed design exactly.

## Phase 4 — Accepting more than 2 files
Status: BUILT, not yet reviewed by user (design question below was resolved by
explicit user instruction rather than a live back-and-forth, so flag for a
close look before treating this as fully signed off).

8. Baseline mode — DONE. Added a 3rd, optional dropzone (Baseline (.xer)) beside
   Previous/Current. Wholly additive: `baselineData` is a new global that nothing
   else reads, so the existing previous/current flow is untouched when it's null
   (verified - see below). When present, `computeCPLIBEI()` runs the same `runCPM`
   engine against the baseline file to get its own critical-path length, and
   compares baseline-due-by-data-date activities against actual TK_Complete status
   in the current file - wires real numbers into DCMA checks 13 (CPLI) and 14
   (BEI), which previously always read "Not assessable". Both checks still read
   "Not assessable - no baseline file loaded" (their prior static message,
   unchanged) when no baseline is supplied.
9. Multi-update trend tracking — DONE. New "Update Trend" tab, wholly separate
   from the 2-file prevData/currData/lastDiff pipeline (its own N-file upload
   widget, own state array `trendSeries`, own render functions) so it can't
   affect the existing comparison flow. Files are parsed with the unmodified
   `parseXER`, then auto-sorted by each file's own ERMHDR data date (no manual
   ordering required). `computeTrendRows()` unions every activity code seen
   across the whole series and walks each one's presence array to find its
   first/last appearance.
   → Design question resolution: per the user's instruction accompanying this
     task, activities that don't appear in every update are flagged explicitly
     - "ADDED @ UPDATE n" (first index > 0) or "DROPPED AFTER UPDATE n" (last
     index < series length - 1) - shown as a badge on the activity row, not
     silently dropped and not shown as a blank gap. Table sorts by total float
     change (first appearance to last), reusing the Float Watchlist's severity
     tiers (RAPID EROSION / ERODING / IMPROVING / STEADY) and row-highlight
     convention for consistency.

Verification done (documented in full in the session's final report):
- Real headless-browser check (Load Demo + Run Variance Analysis, no baseline
  file supplied): Net Slip still reads +18 wd, matching SUMMARY.md's documented
  baseline for this repo, confirming the no-baseline/2-file path is unchanged.
- Real headless-browser check with a hand-built synthetic baseline XER (reusing
  the demo project's task/calendar structure, dated earlier, all TK_NotStart):
  CPLI computed 1.00, BEI computed 0.86 (6/7 baseline-due activities complete) -
  both now numeric instead of "Not assessable", and correctly revert to "Not
  assessable - no baseline file loaded" when baselineData is cleared.
- Real headless-browser check of the Update Trend tab with a 3-file synthetic
  series (minimal 2-3 activity XERs built inline): file list, KPI counts,
  ADDED/DROPPED badges, float-by-update series text, and severity sort all
  rendered correctly with no console errors.
- Node-level check (vm-sandboxed execution of the actual unmodified script
  extracted from floatcheck.html, not a reimplementation): ran `computeTrendRows`
  against three hand-built synthetic XERs derived from the repo's own demo files
  (one with an activity dropped from the baseline, one with an activity dropped
  from "current") - confirmed added/dropped flags, first/last-seen indices, and
  per-activity float-by-update points all come out correct.
- Limitation: this repo ships only two real demo XER files
  (update_2026-06-01_previous.xer, update_2026-06-15_current.xer). No real
  third/Nth-file XER existed to test against, so the baseline and trend
  scenarios above use hand-built synthetic files derived from the real demo
  data's structure (same task codes/calendar/WBS, edited durations/dates/
  statuses) rather than genuine additional P6 exports. The CPLI/BEI formulas
  themselves (a simplified DCMA-style CPLI using the current run's worst total
  float, and a straightforward planned-vs-actual-complete BEI) are a reasonable
  read of the standard definitions but haven't been checked against a real
  contractor's baseline file or cross-checked with P6's own CPLI/BEI output -
  worth a second look before relying on the exact numbers in a live claim.

## Phase 5 — New parsing capability
Status: NOT STARTED — RISK ASSESSMENT REQUIRED BEFORE FULL COMMIT TO UI
10. Resource loading / overallocation (extend parseXER to read resource
    assignment tables, e.g. TASKRSRC/RSRC/ACCOUNT as applicable)
    → Treat with the same rigor as the original parser risk assessment: read
      the real XER resource-table structure, assess real-file risk, report to
      user BEFORE building the full UI on top of it.

## Verification convention (unchanged from all prior work)
- After any change touching parseXER/runCPM/crashProject: re-run the headless
  harness at /private/tmp/claude-501/-Users-sash-CIVIL-X-AI/8b8657ac-8cff-492e-adba-a2468ff3f9bf/scratchpad/verify.mjs
  against both demo XER files (paths already correct in that script - it points
  at /Users/sash/floatcheck/floatcheck.html and the two demo .xer files there).
  Net slip must stay at 18 working days unless the phase is specifically
  changing that calculation - if it changes, that must be an intentional,
  explained result of the phase's own work, not a side effect.
- Compare each new harness run's JSON output against the previous saved run
  (files named after_*.json in that scratchpad dir) to confirm nothing
  unrelated shifted.
- For anything print-related: verify with a real headless Chrome
  --print-to-pdf render, not just visual inspection of the screen version -
  this caught two real bugs in earlier phases (Full Report pagination,
  Look-ahead print colours) that would have been missed otherwise.

## Known open items unrelated to this phase plan (context for later)
- "Meeting Actions" tool and Supabase-backed accounts/saved-projects were
  referenced by the user in earlier turns as if they exist - they do not
  exist anywhere in this repo or its git history. Flagged each time; not
  built unless/until explicitly requested as new work.
- Missing Anthropic API auth (Narrative/Full Report) remains an intentional,
  documented gap pending a backend proxy - not in scope for this phase plan.
