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
