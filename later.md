# Later

Things intentionally deferred, not forgotten. Each entry should carry enough
context to pick up cold.

## Demo XER — extend for a visible tiebreak in LeadTime's ranking

**What:** Add 2-3 long-lead activities to the shared demo XER, landing in a
similar days-remaining window but with meaningfully different total float,
so LeadTime's sort (days_remaining ascending, then total_float ascending)
visibly demonstrates the tiebreak instead of only being correct-but-unseen.

**Why now isn't the time:** The current demo (as of the LeadTime + toolkit
shell work) only produces one overdue outlier and three comfortable-float
items — nothing collides on countdown, so the float tiebreak never has
anything to actually break. Real files will show this naturally; the demo
doesn't, and it's the first thing anyone clicking "Try the demo" sees.

**Requires when done:**
- Harness re-run comparing before/after JSON output.
- Confirm FloatCheck's net slip stays **+18 working days** — the demo XER
  is shared across FloatCheck's comparison/health-check/trend features too,
  not LeadTime-only, so this isn't a LeadTime-scoped edit.
- Re-verify LeadTime's own demo output (row count, sort order) against the
  new data.

**Status:** Not started. Flagged 2026-08-31.

## Implement free float in the CPM engine

**What:** `lib/cpm-engine.js` / `lib/float.js` currently only compute total
float. Free float (the delay an activity can absorb without pushing its
immediate successors, as distinct from total float's delay-without-pushing-
the-project-finish) isn't implemented anywhere in the toolkit.

**Why it matters:** Both FloatCheck's and LeadTime's UI and copy have been
deliberately careful to say "total float" rather than implying free float
exists (e.g. LeadTime's footer/labels) - this entry is the record of that
being a real gap, not an oversight, so nobody adds a "free float" label
somewhere without the calculation existing to back it up.

**Requires when done:**
- Same rigor as any other cpm-engine.js change: harness re-run confirming
  total float and every other existing output stays byte-identical, since
  free float would be new/additive, not a replacement.
- Decide where it surfaces first (DCMA health check has a natural slot;
  LeadTime's ranking doesn't need it for the current sort formula).

**Status:** Not started. Flagged 2026-09-02.

## Decide light vs. dark theme for the whole toolkit

**What:** The toolkit is dark end-to-end right now (floatcheck.html,
leadtime.html, index.html's app shell - all re-themed to match on
2026-09-01/02). A light theme was explored once for index.html's shell
before being reverted back to dark to match the two tool pages. If light
is ever wanted, it's a decision for the *whole* toolkit, not just the
shell - it would mean re-theming floatcheck.html and leadtime.html too,
which is a much larger change than the shell alone (their tables, KPI
strips, flags/badges, forms, print stylesheets, and the CRITICAL/WARN/OK
semantic colors would all need new values chosen for a light background).

**Why not decided now:** No indication either tool page's dark theme is a
problem for real use - this is purely a preference call, not a bug fix,
and re-theming two working, verified tools is a large enough job that it
shouldn't happen as a side effect of a shell redesign.

**Requires when done:** A real decision (not a default), then the same
scope as the original theme rebuild - new token values, every component
in both tool pages re-verified, screenshots for comparison.

**Status:** Undecided - staying dark until a decision is made. Flagged
2026-09-02.
