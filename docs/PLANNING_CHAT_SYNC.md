# Sync log for the planning chat (claude.ai)

Claude Code appends an entry here any time it touches a file the planning
chat owns (`db.py`, `bot_loop.py`, `init_db.py`) as an explicitly-approved
one-off exception to the normal file-ownership split in `CLAUDE.md`. Paste
the relevant entry (or the whole file) into the planning chat to keep it
in sync with what changed on disk.

---

## 2026-09-04

**Files touched:** `init_db.py`, `bot_loop.py`
**Why:** Preparing the repo to be shared/distributed (git/GitHub) while
keeping personal config out of the distributed code. No logic or values
changed - purely added inline placeholder comments so someone else
cloning the repo knows which constants are theirs to edit.

- `init_db.py`: the `shadow_account` seed INSERT (`starting_balance_usd`,
  `reserve_floor_usd`, `per_trade_pct`) was refactored into named
  variables, each with a `## CHANGE THIS to your own ...` comment.
  Verified against a throwaway DB that the seeded values are unchanged
  (250.0 / 50.0 / 0.5).
- `bot_loop.py`: `SYMBOLS = ["BTC-USD", "ETH-USD"]` got a
  `## CHANGE THIS to your own trading pairs` comment. No other change.

Live production values are unaffected either way - `data/trading_bot.db`
is gitignored and was never going to be part of the distributed repo, and
this refactor doesn't touch the running database.
