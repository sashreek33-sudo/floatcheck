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
- The CPM engine (`runCPM`) does a genuine topological sort, forward pass (max of predecessor early-finishes), and backward pass (min of successor late-starts) — it's not hardcoded, and it responds correctly to input changes.
- The crashing algorithm (`crashProject`) genuinely re-runs the full CPM after every compression step rather than just subtracting durations.
- The DCMA-14 checks implement the real standard, with the 4 unassessable checks marked as gaps rather than silently omitted or faked.

**Prototype-stage / not yet trustworthy:**
- **Tested only on synthetic data.** The two `.xer` files in this repo were hand-generated to exercise the demo, not exported from a real P6 database. This has never parsed a real project's export. See the open questions below for the kinds of real-world XER structures likely to break it.
- **The "Generate Narrative" button will not currently work as shipped** — the `fetch` call to `https://api.anthropic.com/v1/messages` sends no `x-api-key` (or any auth) header, and the Anthropic API does not support unauthenticated direct-from-browser calls. This needs either a backend proxy that holds the key, or a client-side key-entry flow with the `anthropic-dangerous-direct-browser-access` header, before it can produce a narrative at all.
- **Single calendar, single working-day pattern assumed.** All date math (`addWorkdays`/`subWorkdays`) treats every activity as Monday–Friday with no holidays, regardless of what the XER's `CALENDAR` table actually says.
- The visual design is a generated dark-mode dashboard aesthetic — not usability-tested with a practitioner.

## Files

| File | Purpose |
|---|---|
| `schedule-variance-agent.html` | The app — everything in one file. |
| `schedule-explainer.md` | Domain-theory explainer (CPM, float, crashing, DCMA-14, XER format) written to build understanding of the engineering underneath the tool. |
| `update_2026-06-01_previous.xer` | Synthetic demo schedule — previous update. |
| `update_2026-06-15_current.xer` | Synthetic demo schedule — current update, 2 weeks later. |

## Running it

No install. Open `schedule-variance-agent.html` directly in a browser, or click "Load demo update pair" to see it running against the two synthetic XER files above without needing to upload anything.
