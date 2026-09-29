# trading_bot Dashboard — Screenshot Gallery

A public, static timeline of screenshots from the `trading_bot` project's
dashboard (that project itself is private). This repo exists solely to make
those screenshots viewable without exposing anything else about the project.

**Live gallery:** https://john-schubert.github.io/trading_bot_dashboard_gallery/

Newest capture is shown first; scroll down to see how the dashboard has
looked over time. Click any thumbnail for a full-size view.

## How it was built

- [`docs/CLAUDE.md`](docs/CLAUDE.md) - the working context file Claude Code
  loads every session: architecture, the decision-audit-trail design, safety
  rules (shadow mode only, credential isolation, manual kill switch), and the
  file-ownership split between the planning chat and Claude Code.
- [`docs/PLANNING_CHAT_SYNC.md`](docs/PLANNING_CHAT_SYNC.md) - the log kept
  whenever Claude Code touched a file owned by the planning chat.

## Adding a new snapshot

Whenever the dashboard's look changes and you want to record it:

```bash
scripts/add_snapshot.sh "optional note about what changed"
```

This copies the current PNGs from `/home/pi5/trading_bot/screenshots/` into
a new dated folder under `snapshots/`, and appends one entry to
`manifest.json`. It does not commit or push automatically - review what
changed, then:

```bash
git add snapshots/<date> manifest.json
git commit -m "Add <date> snapshot"
git push
```

The gallery page (`index.html`) is static and reads entirely from
`manifest.json` at load time, so no other files need to change when adding
a new snapshot.
