# Planning Engineer Toolkit

A single-file HTML web app for construction schedule analysis. No backend, no build step, no dependencies beyond two Google Fonts — open `schedule-variance-agent.html` in a browser and it runs. It reads Primavera P6 XER exports (P6's tab-delimited schedule interchange format) entirely client-side; the file never leaves the browser except for the one step described under "AI narrative" below.

## What it does

Upload two XER exports (a previous update and a current update) and it runs four modules:

1. **Update Comparison** — diffs the two schedules by activity code: finish-date variance, total float erosion, newly-critical activities, and a dimension-line visual of the net program slip. Reads `TASKNOTE` (P6's Notebook field) so any planner commentary logged against an activity shows up next to its variance.
2. **DCMA-14 Schedule Health Check** — implements the US DCMA 14-point schedule quality audit (logic gaps, leads/lags, relationship-type mix, high-duration and high-float activities, negative float, invalid dates, missed activities, and a float-consistency check against P6's own stored float). 4 of the 14 checks — hard constraints, resource loading, CPLI, and BEI — are marked **"Not assessable"** rather than faked, because a plain XER export doesn't carry that data.
3. **3-Week Look-ahead** — filters the current schedule to activities starting or already active within a configurable window (2–6 weeks) from the data date, with predecessor-completion status, formatted for a site meeting.
4. **Crashing Workbench** — a real CPM engine (forward/backward pass) plus a greedy least-cost crashing algorithm. Given cost/max-crash inputs per activity, it compresses the cheapest currently-critical activity one day at a time and **re-derives the critical path after every step**, since criticality can shift between chains as compression proceeds.

## AI narrative

The "Generate Narrative" button in the Update Comparison tab sends a structured JSON summary of already-computed results (dates, variances, float, Notebook text) to the Anthropic API and asks Claude to turn it into report prose. It does **not** send the raw XER file. The prompt explicitly instructs the model not to invent causes for activities with no logged Notebook entry.

## Status — what's real vs. prototype

**Solid:**
- The CPM engine (`runCPM`) does a genuine topological sort, forward pass (max of predecessor early-finishes, offset by lag), and backward pass (min of successor late-starts, offset by lag) — it's not hardcoded, and it responds correctly to input changes. Guards against circular predecessor logic with a clear error rather than silently truncating.
- The crashing algorithm (`crashProject`) genuinely re-runs the full CPM after every compression step rather than just subtracting durations, and won't compress activities that are already complete or in progress.
- The DCMA-14 checks implement the real standard, with the 4 unassessable checks marked as gaps rather than silently omitted or faked.
- The parser flags duplicate activity codes visibly in the UI rather than letting one silently overwrite the other in every downstream calculation.

**Fixed this pass** (see commit history for detail):
- `crashProject` no longer allows crashing `TK_Complete`/`TK_Active` activities; the crash-workbench inputs are disabled and labelled for those rows.
- Duplicate `task_code` values are detected at parse time and surfaced as a visible warning banner (detection only — activities are still keyed by `task_code` downstream, so a duplicate is flagged, not fully disambiguated).
- `runCPM` now applies FS relationship lag (`lag_hr`) in both the forward and backward pass, converted to workdays.
- `TK_Active` activities use `remain_drtn_hr_cnt` instead of `target_drtn_hr_cnt` when the field is present in the export (a partial fix — see limitations below for what's still missing).
- `runCPM` throws a clear error on a circular predecessor chain instead of silently truncating the walk.
- Removed dead code (`taskIdIndex`) left over from an earlier iteration of the parser.

**Prototype-stage / not yet trustworthy:**
- **Tested only on synthetic data.** The two `.xer` files in this repo were hand-generated to exercise the demo, not exported from a real P6 database. This has never parsed a real project's export.
- **The "Generate Narrative" button will not currently work as shipped** — the `fetch` call to `https://api.anthropic.com/v1/messages` sends no `x-api-key` (or any auth) header, and the Anthropic API does not support unauthenticated direct-from-browser calls. This needs a backend proxy (e.g. a small Cloudflare Workers function) that holds the key server-side before it can produce a narrative at all — deliberately not fixed by hardcoding a key client-side, since this is headed toward a public static site. Scoped as its own piece of work, not part of this pass.
- The visual design is a generated dark-mode dashboard aesthetic — not usability-tested with a practitioner.

## Known limitations (roadmap, not bugs)

These are real gaps for a production XER file, but each is a genuine rebuild of part of the CPM engine rather than a contained fix — documented here rather than rushed:

- **SS/FF/SF relationship types.** `runCPM` only models Finish-to-Start logic. Start-to-Start, Finish-to-Finish, and Start-to-Finish relationships (routine on real infrastructure schedules — e.g. MEP first-fix overlapping structural walls) are not modelled; every relationship is treated as FS regardless of what `pred_type` actually says. Fixing this means reworking the forward pass so a single activity can be constrained by mixed early-start-driven and early-finish-driven predecessors, not just adding a branch.
- **Multiple calendars.** All date math (`addWorkdays`/`subWorkdays`) assumes one calendar: Monday–Friday, no holidays, for every activity. Real P6 schedules typically carry 2–4 calendars (office, site, 24/7 for continuous operations like a TBM drive). The XER `CALENDAR` table is parsed for display but never consulted in the date arithmetic. This needs per-activity working-day calculus and a parser for P6's packed calendar work-pattern format.
- **Full actuals/data-date awareness.** The partial fix above (remaining duration for active work) is not the same as proper data-date semantics — using `act_start_date` as the real early-start anchor for started work, and retained-logic vs. progress-override handling for out-of-sequence progress. That's a genuine rework of how `runCPM` treats `TK_Active`/`TK_Complete` activities.
- **WBS parent-chain reconstruction.** Each activity's WBS is shown as its immediate parent's short name only, not a full path — `PROJWBS`'s `parent_wbs_id` isn't read. Lower priority than the above: this is a display gap, not a calculation error, and would be cheap to add whenever it's worth doing (a tree walk over already-fetched data, no CPM logic involved).
- **Duplicate `task_code` — full fix.** Currently detected and flagged (see above), but activities are still keyed by `task_code` in every downstream map. A complete fix would re-key everything by `task_id` instead, which ripples through the variance table, look-ahead, and crash workbench rendering.

## Files

| File | Purpose |
|---|---|
| `schedule-variance-agent.html` | The app — everything in one file. |
| `schedule-explainer.md` | Domain-theory explainer (CPM, float, crashing, DCMA-14, XER format) written to build understanding of the engineering underneath the tool. |
| `update_2026-06-01_previous.xer` | Synthetic demo schedule — previous update. |
| `update_2026-06-15_current.xer` | Synthetic demo schedule — current update, 2 weeks later. |

## Running it

No install. Open `schedule-variance-agent.html` directly in a browser, or click "Load demo update pair" to see it running against the two synthetic XER files above without needing to upload anything.
