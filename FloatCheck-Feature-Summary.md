# FloatCheck — What This Tool Does

A single-file HTML app for Primavera P6 (.xer) schedule analysis. No backend,
no build step, no account required — everything runs client-side in your
browser. Live at: https://sashreek33-sudo.github.io/floatcheck/floatcheck.html

Pitch line from the site: "See what changed in your schedule — in seconds,
not hours." Every number is calculated by code (exact, repeatable); AI (where
wired up) is only used to explain what the numbers mean in plain English.

Currently supports Primavera P6 (.xer) files only.

## The five core tools (landing page menu)

1. **Update Comparison** — Compare two schedule updates and see exactly what
   slipped, why, and what it means for your finish date. Produces an Activity
   Variance Register (prior finish vs. current finish, variance, prior/
   current total float, CRITICAL/near-critical/stable flags), a "Project
   Finish — Dimension Check" bar showing net slip in working days, and a
   count of newly-critical activities.

2. **Schedule Health Check** — Runs the industry-standard DCMA 14-point audit
   (plus a 15th check this session added: out-of-sequence progress — see
   below) to catch structural schedule problems before they cause real
   delays.

3. **3-Week Look-ahead** — Auto-generates the filtered activity list for your
   next site meeting: what's active or starting soon, nothing else.

4. **Crashing Workbench** — Models what it would cost to recover lost time,
   using your own cost assumptions. Supports side-by-side scenario
   comparison (e.g. Scenario A vs. Scenario B at a different cost
   multiplier) so you can compare recovery options directly.

5. **Critical Path Timeline** — Shows your schedule's real critical path,
   freshly recalculated from your file (not just whatever P6 last flagged).

## Additional tabs inside the app

- **Full Report** — combined narrative-style report, printable/exportable to
  PDF.
- **Site Brief** — one-page, print-ready summary combining newly-critical/
  near-critical activities with the 3-week look-ahead, designed to be handed
  out at a site meeting.
- **Float Watchlist** — sorts all activities by float *change* (not just
  current float level), flags erosion severity: RAPID EROSION (>10 days
  lost), ERODING (>5 days), IMPROVING, STEADY.
- **Update Trend** *(new)* — accepts 3 or more update files (not just a
  before/after pair) and tracks float and finish-date drift per activity
  across the whole series. Files are auto-sorted by their own data date.
  Activities that don't appear in every file (added mid-project or dropped
  from scope) are explicitly flagged as "ADDED @ UPDATE n" / "DROPPED AFTER
  UPDATE n" rather than silently skipped.
- **Progress Report Narrative** (inside Update Comparison) — AI-drafted plain
  -English narrative grounded in the computed numbers. *Not yet wired to a
  live AI backend* — shows an honest "not available yet" message instead of
  an error.

## Data-quality and risk features

- **Data-completeness snapshot** — shown before any analysis: count of
  activities missing dates, Notebook entry count, and number of calendars
  detected in the file (multiple calendars is flagged as a caveat, since the
  CPM engine currently assumes one calendar).
- **Duplicate task-code detection** — warns if the file has non-unique
  activity codes.
- **Weather-risk flagging** — keyword-based badge on weather-sensitive
  activities (e.g. piling, excavation) that are already critical or
  near-critical. Explicitly labelled as "basic keyword match, not live
  weather data."
- **Out-of-sequence progress detection** *(new)* — flags any active/complete
  activity whose predecessor logic implies it shouldn't have started yet
  (Finish-to-Start predecessor not complete, or Start-to-Start predecessor
  not yet started). Finish-to-Finish/Start-to-Finish relationships are
  excluded from this check.
- **Baseline mode** *(new)* — optional third file upload (a true baseline,
  distinct from the previous/current pair) that enables two DCMA metrics
  which are otherwise "Not assessable": CPLI (Critical Path Length Index)
  and BEI (Baseline Execution Index).

## Export / output

- **Excel export** — Activity Variance Register, 3-Week Look-ahead, and DCMA
  Health Check tables all export to real .xlsx-compatible files with
  AutoFilter, header styling, and colour-coded rows.
- **Print/PDF** — Full Report, Look-ahead, and Site Brief all have dedicated
  print stylesheets, verified against real print-to-PDF output (not just
  on-screen).

## What's NOT yet available (known, documented gaps)

- AI narrative features (Progress Report Narrative, Full Report AI summary)
  have the UI and prompts built but can't reach Claude yet — no backend
  exists to hold an API key server-side.
- Only Finish-to-Start relationship logic is used in the CPM engine — SS/FF/
  SF relationship *types* aren't yet factored into date math (only into the
  new out-of-sequence check, which is a detection layer, not a scheduling
  change).
- One calendar is assumed for all CPM date math, even if the file defines
  more than one (this is now detected and flagged, just not yet corrected
  for).
- No resource loading / overallocation analysis yet — the demo data doesn't
  even contain resource-assignment tables, so this would need real
  resource-loaded P6 data to build against safely.
- No accounts, no saved projects, no "Meeting Actions" tool — none of these
  exist despite being mentioned in early drafts of the privacy page.

## Bugs found and fixed along the way (for context, not action items)

Crashing already-complete/active activities was possible (fixed with a
status floor); lag on relationships was parsed but silently discarded (now
applied both directions in CPM); in-progress activity duration now uses
remaining duration when the file provides it instead of always the original
planned duration; circular predecessor logic now throws a clear error
instead of silently truncating; Excel export was breaking on activity names
containing "&"; the weather keyword list missed "Secant pile wall"; two real
print-to-PDF bugs (report overflow onto a blank page, and dark-theme colours
leaking into printed output) were caught and fixed.
