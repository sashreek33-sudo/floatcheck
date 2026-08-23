# FloatCheck — Session Summary

Covers everything built and decided across this session. Written 2026-08-23.
For the live, granular tracking of the current 10-addition/5-phase plan, see
[PROGRESS.md](PROGRESS.md) — this file is the higher-level "how did we get
here" picture.

**Live site:** https://sashreek33-sudo.github.io/floatcheck/floatcheck.html
**Repo:** https://github.com/sashreek33-sudo/floatcheck (public)

## What FloatCheck is

A single-file HTML app (`floatcheck.html`) for construction schedule
analysis. No backend, no build step, no dependencies beyond two Google Fonts.
Reads Primavera P6 XER exports entirely client-side. Started as "Planning
Engineer Toolkit," renamed to FloatCheck partway through this session.

## Current state of the application

**Front door:** a proper landing page — hero with a split-colour "Float/Check"
wordmark, a large readable pitch line, a de-emphasised code-vs-AI trust
paragraph, and a 5-card tool menu (Update Comparison, Schedule Health Check,
3-Week Look-ahead, Crashing Workbench, Critical Path Timeline) each with a
small hand-drawn line-art icon reusing the app's own dimension-line visual
language. Clicking a card transitions into the app shell (not just a scroll)
with a "Uploading for: X" context line and routes to that tool's tab once
analysis runs.

**Visual identity:** graphite background, copper accent, Barlow Condensed /
IBM Plex Sans / IBM Plex Mono type system, corner registration marks, an
ANSI-style drawing title block (project no., dwg no., REV letter, drawn/
checked/approved-by, scale), a rotated "REV A" ink-stamp, and a faint
"DRAFT — NOT FOR ISSUE" watermark — both the title block and watermark are
gated to only appear once real project data has loaded (not on the landing
page or the plain upload screen).

**Tabs in the running app:** Update Comparison, Schedule Health Check,
3-Week Look-ahead, Critical Path Timeline, Full Report, Site Brief, Float
Watchlist — plus the Crashing Workbench and Progress Report Narrative living
inside Update Comparison.

**Tables read like a real P6 grid:** WBS shown as grouping bands (not a
repeated column) with activities indented beneath, zebra striping, tighter
rows, and a red/black hazard-stripe treatment reserved specifically for
CRITICAL flags (with a colour legend explaining red/amber/green). Export to
Excel (real AutoFilter, header fill, colour-coded rows) is available on the
Activity Variance Register, Look-ahead, and DCMA Health Check tables. Print
stylesheets exist for the Full Report (PDF export), the Look-ahead tab, and
the Site Brief — all verified against real headless-Chrome print-to-PDF
output, not just eyeballed on screen.

**AI features (Progress Report Narrative, Full Report):** fully built,
including the prompts and the deterministic-vs-AI split (numbers come from
code, prose comes from Claude), but neither can actually reach Claude yet —
there's no backend to hold the API key. Both show the same shared, calm
"not wired up yet" message rather than an error, by design.

## What's fixed (bugs found and corrected)

- **`crashProject`** no longer lets already-complete/active activities be
  crashed (status floor).
- **Duplicate `task_code`** values are now detected at parse time and shown
  as a visible warning banner.
- **Lag (`lag_hr`)** is now applied in both the forward and backward CPM
  pass (previously parsed but silently discarded).
- **`TK_Active` duration** now uses `remain_drtn_hr_cnt` when the XER
  provides it, instead of always using the original planned duration.
- **Circular predecessor logic** now throws a clear error instead of
  silently truncating the topological sort.
- Removed dead `taskIdIndex` code left over from an earlier parser iteration.
- **Narrative error state**: was showing a raw, alarming red error + a
  "Retry" button that implied a fixable problem — replaced with an honest,
  calm, shared message component (also reused for Full Report).
- **Excel export**: activity names containing `&` (e.g. "TBM delivery &
  assembly") were breaking the exported HTML unescaped — fixed.
- **Weather-sensitivity keywords**: "piling"/"pile driv" missed "Secant pile
  wall" — broadened to the substring "pile".
- **Print output**: two real bugs caught via actual print-to-PDF testing —
  the Full Report spilled onto a near-blank second page (app-navigation text
  bleeding into print), and the Look-ahead's WBS bands/flagged rows carried
  dark-theme colours into print (a solid dark bar, washed-out tints). Both
  fixed and reverified.

## What's still pending / roadmapped (known limitations, not bugs)

From the original parser/CPM risk assessment, still undone by design
(each is a genuine rework, not a quick patch — documented in the README):

- **SS/FF/SF relationship types** — `runCPM` still treats every relationship
  as Finish-to-Start.
- **Multiple calendars** — the CPM engine still assumes one calendar for all
  date math. (Phase 1 added *detection* — the data-completeness snapshot now
  flags if a file defines more than one calendar — but the engine still
  doesn't use per-calendar logic.)
- **Full actuals/data-date awareness** — Phase 1 added a partial fix
  (`remain_drtn_hr_cnt` for `TK_Active`), but proper retained-logic/
  progress-override semantics are still not implemented.
- **WBS parent-chain reconstruction** — still shows immediate parent only,
  not a full path.
- **Duplicate `task_code` — full fix** — still detected/flagged only;
  activities are still keyed by `task_code` everywhere downstream.
- **Missing Anthropic API auth** — Narrative and Full Report need a backend
  proxy (e.g. Cloudflare Workers) to hold the key server-side. Deliberately
  not hardcoded client-side. Not in scope until that backend is built.

## The 10-addition / 5-phase plan (current active work)

Full detail lives in [PROGRESS.md](PROGRESS.md). Status as of this summary:

- **Phase 1 (quick wins)** — ✅ done, verified, committed: data-completeness
  snapshot, Excel export, one-page Site Brief.
- **Phase 2 (medium)** — ✅ done, verified, committed: Float Watchlist,
  weather risk flagging, side-by-side crash scenarios.
- **Phase 3 (touches the CPM engine)** — ⏳ **awaiting your confirmation.**
  I've given you the design walkthrough for item 7 (out-of-sequence progress
  detection: FS requires predecessor `TK_Complete`, SS requires predecessor
  not `TK_NotStart`, FF/SF excluded from the check entirely) but have not
  implemented it — you asked for this discussion explicitly before any
  build here, same as the earlier lag fix.
- **Phase 4 (baseline mode + multi-update trend tracking)** — not started.
  Item 9 has an open design question you haven't answered yet: how to
  handle an activity code that doesn't appear in every file in a multi-
  update series (added mid-project, or dropped from scope). I'm supposed to
  propose an approach and get your confirmation before building.
- **Phase 5 (resource loading/overallocation)** — not started. This is a
  genuinely new parsing capability (reading XER resource-assignment tables,
  which nothing currently touches); you asked for a real-file risk
  assessment before committing to the UI, the same way the original
  parser/CPM risk assessment worked at the start of this session.

## Pending instructions from you that aren't done yet

1. **Phase 3 confirmation** — the out-of-sequence detection design proposal
   above is waiting on your sign-off before I build it.
2. **Phase 4 design question** — needs your input on the multi-update
   activity-code-mismatch handling before Phase 4 starts at all.
3. **Phase 5 risk assessment** — needs to happen (and be shown to you)
   before the resource-loading UI gets built.
4. **Meeting Actions tool** — you referenced this multiple times (privacy
   notice draft, "AI features" list) as if it already existed. It does not
   exist anywhere in this repo or its git history — confirmed by search each
   time it came up. Not built. If you still want it, it needs to be
   explicitly requested as new work (same shape as Narrative/Full Report:
   full UI + prompt logic, but shows the same shared "not wired up" message
   until a backend exists).
5. **Supabase accounts / saved projects** — same situation as Meeting
   Actions: referenced as if it exists (privacy notice draft mentioned
   "saved projects (if signed in)"), confirmed not to exist anywhere in this
   project. The privacy notice was deliberately written to describe only
   what's real today rather than include this.

## Notes on how this session worked

- Every change touching `parseXER`/`runCPM`/`crashProject` was verified with
  a headless harness against both demo XER files before and after, comparing
  full JSON output — net slip has held at **18 working days** through every
  single change in this entire session, including all of Phase 1 and 2.
- Print-related changes were verified with real headless-Chrome
  `--print-to-pdf` output, not just visual inspection — this is what caught
  the two print bugs listed above.
- `PROGRESS.md` was created mid-session specifically so a usage-limit reset
  wouldn't lose track of the phase plan or its open design questions — it
  did in fact get used for exactly that once already.
