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
Status: NOT STARTED
4. Float Watchlist (rate of float change prev→curr, not just current level)
5. Weather risk flagging (keyword match against outdoor/weather-sensitive work — explicitly
   labelled in UI as a basic keyword pass, not live weather data)
6. Side-by-side crash scenarios (two cost/target inputs compared)

## Phase 3 — Touches the CPM engine, extra care
Status: NOT STARTED — DESIGN DISCUSSION REQUIRED BEFORE BUILDING
7. Out-of-sequence progress detection (active/complete status vs. incomplete predecessor)
   → Must walk the user through the detection approach and get confirmation before
     implementing, per their explicit instruction (same pattern as the lag fix).

## Phase 4 — Accepting more than 2 files
Status: NOT STARTED — DESIGN DISCUSSION REQUIRED BEFORE BUILDING
8. Baseline mode (3rd file upload, closes CPLI/BEI "Not assessable" gaps)
9. Multi-update trend tracking (N files, float erosion/finish drift over time)
   → Open design question to raise with the user before implementing: how to
     handle an activity code that doesn't appear in every file in the series
     (added mid-project, or dropped from scope). Propose an approach, get
     confirmation, then build.

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
