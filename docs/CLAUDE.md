> **Note (added 2026-09-29 for this public copy):** this is the unedited
> working context file that Claude Code loads at the start of every session
> on this project. It is published as a snapshot. Its "What this project is"
> and "Current status" sections lag the code: the shadow bot now trades
> SOL-USD and GEOD-USD (set in `bot_config.json`), and a backtest harness and
> a second, backtest-only strategy (`rsi_meanrev_v1`) have been added since it
> was written. The running bot still uses `ema_rsi_v1` in SHADOW mode.
> The design rules and safety guardrails below still apply.

# Trading Bot Project - Context for Claude Code

This file is auto-loaded by Claude Code at the start of each session in this
directory. It exists to keep Claude Code aligned with design decisions made
in a separate planning conversation (claude.ai chat), so changes made here
don't drift from the original reasoning. Read this before making any change
to strategy_engine.py, db.py, init_db.py, or bot_loop.py. Dashboard-only
(HTML/CSS/JS) changes to dashboard.py are lower-risk and don't require the
same care.

## What this project is

A cryptocurrency trading bot running on a Raspberry Pi 5, using the Coinbase
Advanced Trade API (via coinbase-advanced-py SDK). Currently evaluates
BTC-USD and ETH-USD every 5 minutes using an EMA crossover + RSI filter
momentum strategy (see strategy_engine.py, STRATEGY_VERSION = "ema_rsi_v1").

**This bot runs in SHADOW (paper trading) mode only. It has never placed a
real order.** Going live is a deliberate, not-yet-built step - see
"Safety rules" below before ever changing this.

## Architecture

- `init_db.py` - creates the SQLite schema (run once, safe to re-run)
- `db.py` - shared database helper module; all DB access should go through
  this, not raw SQL scattered across files
- `indicators.py` - pure math (EMA, RSI), no API or DB dependencies
- `strategy_engine.py` - the decision logic; produces action + rationale
- `bot_loop.py` - main loop, runs as systemd service `trading_bot.service`
- `dashboard.py` - read-only FastAPI dashboard, runs as systemd service
  `trading_bot_dashboard.service` on port 8048. Originally a single
  Overview page; Claude Code has since added additional views (Analytics,
  Exceptions, Timeline) alongside Overview, plus a day/night theme toggle.
  Since Claude Code owns this file directly (see "File ownership" below),
  the planning chat may not have full visibility into these views'
  internals - if asked to modify them, read the current file first rather
  than assuming its structure matches this document exactly.
- `data/trading_bot.db` - SQLite database (not committed anywhere, local only)
- `/etc/trading_bot/secrets.env` - Coinbase API credentials (root/pi5 owned,
  chmod 600). **Only bot_loop.py should ever load this file.**
- `/etc/trading_bot/dashboard_secrets.env` - dashboard Basic Auth credentials.
  **Only dashboard.py should ever load this file.** This separation is
  deliberate: the dashboard process must never have access to Coinbase
  credentials, even if compromised.

## Design philosophy (why the schema looks the way it does)

This isn't just a trade logger - it's a decision audit trail, built around
a specific concern: **a trade can succeed for the wrong reason, or fail
despite sound logic.** Outcome (P&L) and reasoning validity are tracked
separately on purpose:

- `decisions` table logs EVERY evaluation cycle, including HOLD/SKIP - not
  just cycles that resulted in a trade. This is intentional. The absence of
  a trade is still a decision worth auditing.
- `decision_reviews` is a separate table for human review, decoupled from
  outcome. `reasoning_valid` asks "was the logic sound" independent of
  whether the trade made money. This is how we catch "won for the wrong
  reason" cases, which are dangerous because a naive P&L-only view would
  reinforce them.
- `strategy_versions` has an explicit `promoted_to_live_at` /
  `approved_by` gate. Moving a strategy from shadow to live must be a
  deliberate, logged action - never automatic, never implicit.
- `guardrails` (position size limits, max trades/day, max drawdown) are
  stored as versioned config, separate from strategy logic. The strategy
  can be wrong; guardrails are the independent circuit breaker regardless
  of what the strategy "wants" to do.
- `drift_metrics` exists to catch when market assumptions (volatility,
  volume regime) stop matching what a strategy was validated against -
  a different failure mode than a bad individual decision.
- `trades` captures full tax-relevant cost basis: fee_amount_usd,
  gas_cost_usd, slippage_usd, cost_basis_usd (BUY), proceeds_usd (SELL).
  User needs this traceable back to each buy/sell for tax filing
  (~4 months out from Sept 2026 as of this writing). Do not simplify away
  these fields.

## Safety rules - do not violate these

1. **Never add code that places a real order** (any Coinbase endpoint that
   executes a trade) without the user explicitly asking for it AND
   confirming they understand it will use real funds. `bot_loop.py`
   currently only ever calls `db.log_trade()` (a simulated/paper record),
   never a live Coinbase order-placement endpoint.
2. **`MODE` defaults to `"SHADOW"`** in bot_loop.py. Never change this
   default. Going live is a manual, explicit decision the user makes later.
3. **Never let dashboard.py load `/etc/trading_bot/secrets.env`** (the
   Coinbase credentials). The dashboard is read-only and must stay
   decoupled from trading credentials entirely.
4. The kill switch (`bot_state.kill_switch_active`) is designed to require
   manual clearing (`db.clear_kill_switch()`), not auto-reset from bot
   code. Don't change this to auto-clear.

## User conventions (apply to all files in this project)

- **Underscores, never dashes**, in file and directory names
  (`trading_bot`, not `trading-bot`).
- When editing a file, **provide the complete file content**, don't give
  snippets/diffs expecting manual copy-paste merging.
- Formal tone in any user-facing written content (emails etc.) - not
  relevant to code itself, but relevant if this project ever generates
  user-facing text/reports.

## Current status (as of Sept 2026)

Built and working: schema, db.py, indicators.py, strategy_engine.py
(ema_rsi_v1), bot_loop.py (running as systemd service, SHADOW mode only,
with reserve-floor/tradable-pool position sizing via shadow_account),
dashboard.py (running as systemd service, port 8048, Basic Auth +
WebSocket live updates, multiple views including Overview/Analytics/
Exceptions/Timeline, day/night theme toggle).

Not yet built: kill-switch/pause controls beyond raw SQL (no CLI/dashboard
button yet), drift_metrics population (table exists, nothing writes to it),
decision_reviews workflow/tooling, shadow-mode backtesting against a fixed
historical dataset, any live-trading execution path.

## File ownership - avoid two editors clobbering the same file

**`dashboard.py` is edited by Claude Code ONLY, going forward.** The
planning chat (claude.ai) gives written specs for dashboard.py changes -
it does not generate or transfer new versions of this file anymore. This
rule exists because the chat has no visibility into edits Claude Code
makes directly on disk; the chat previously overwrote local Claude Code
timezone-display changes by regenerating the file from its own stale
copy. Two editors touching one file without syncing state will always
eventually clobber each other - single ownership per file avoids this.

**`db.py`, `bot_loop.py`, `init_db.py` are edited by the planning chat
ONLY.** These carry the audit-trail/safety design reasoning described
above and are transferred via download + scp, following the existing
workflow. Claude Code should treat these as read-only reference unless
the user explicitly says otherwise for a specific one-off change.

If asked to modify db.py, bot_loop.py, or init_db.py, Claude Code should
flag this back to the user rather than proceeding, per this rule.

## External API calls from dashboard.py (credential isolation still applies)

dashboard.py may call Coinbase's PUBLIC, unauthenticated market data
endpoints directly (e.g. get_public_candles, via a RESTClient() instance
created with NO api_key/api_secret arguments) for things like price
charts. This is safe and intentional - public endpoints require no
credentials and this does not violate the credential isolation rule
above. dashboard.py must still never load /etc/trading_bot/secrets.env
or instantiate an authenticated Coinbase client. Note that unauthenticated
requests are rate-limited more aggressively than authenticated ones, so
any polling loop for public data should run on a slower cadence (e.g.
60s) than the 15s WebSocket push used for internal DB-backed data.

## When to bring changes back to the planning chat instead of just doing them here

Dashboard visual/UX tweaks: fine to do directly here.

Anything touching strategy_engine.py signal logic, db.py schema, guardrails,
or the shadow-to-live promotion path: flag it back to the user rather than
implementing unilaterally, since these carry the design reasoning above and
should stay consistent with it.
