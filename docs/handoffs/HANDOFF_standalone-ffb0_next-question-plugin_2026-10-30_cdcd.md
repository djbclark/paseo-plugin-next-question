---
schema_version: 1
handoff_id: cdcd
parent_handoff_ids: []
lineage: none
chain: [standalone-ffb0]
repo: paseo-plugin-next-question
workspace: main
branch: main
head_sha: 8f3533348d79122d9c4f8530c451a4d681176cd0
created_at: 2026-10-30T22:46:00-04:00
writer: omp
---
# Handoff — next-question plugin, paseo-screen, and the Orca clean-up brief

## The Goal

djbclark asked for a way to cycle to the next Paseo agent tab that is waiting for input (a picklist, a
permission, a plan), across all workspaces. It had to be a plugin, not a change to Paseo core, in its own
GitHub repo `paseo-plugin-next-question`. Later he added: install, enable and use `paseo-screen` for GUI
control, and tell the djbclark-ade lead (`1e61c979-2e8c-4435-89bd-a8fbba047341`) to make the docs show we
left Orca (and herdr except `herdr4paseo` and `paseo4herdr`).

## Where We Are

1. The plugin is finished, public and tagged: https://github.com/djbclark/paseo-plugin-next-question, `v0.1.0`
   at `main` `8f35333`. It is installed on the local daemon as plugin id `next-question` (directory install).
2. `paseo-screen` is installed and enabled (registry `kevguy/screen`, pin `1df9050d3721d927aa73655ad2cb4b4b53f42db9`,
   plugin id `paseo-screen`). Live view was verified. CORRECTION (2026-10-30, later): a forwarded Cmd+Shift+U did NOT prove the shortcut works in the desktop app; see Evidence item 3.
3. The lead has been briefed twice through `relay.py`: `pnq-orca-docs` (delivered, acked receipt) and
   `pnq-toolchain` (queued while the lead was busy). Both expectations were open at handoff time. The lead also
   sent a message to this agent (`ee4a895d-8f52-4e49-99a6-7d5a5d4b083f`) that was queued until this turn ended.
4. The registry listing is deferred by djbclark (below).

## What We Tried

1. **`orca computer` for GUI control.** The `computer-use` skill stub (`~/.agents/skills/computer-use/SKILL.md`,
   untracked, installed by Orca on 2026-10-17) sends every GUI task to `orca computer`. I ran `orca open`, which
   started the Orca app. djbclark said Orca is retired. I quit it and replaced the stub with a RETIRED notice.
   Lesson: a skill stub outside any repo can outlive the plan that retired its backend.
2. **A first `typecheck exit=$?` read through `| head`.** The exit code was `head`'s, not `tsc`'s. Re-run to a
   file with `rc=$?` before trusting it.
3. **Settings API for the shortcut binding.** Rejected: `useSettings` is a React hook and the binding is read by a
   plain `keydown` listener, so it would need a server entry plus an RPC. Used `localStorage` in `client/web.ts`.
4. **Escape to cancel recording.** Paseo's own window-capture keydown handler (`use-keyboard-shortcuts.ts:397`)
   runs first and leaves the settings page. Cancel by clicking the button again.
5. **Picking the viewer's stage element.** My first selector matched a 16 px sidebar icon. The real stage is the one
   large `div[tabindex=0]` (about 1080 x 675).
6. **`agents.list` JSON has no `archivedAt` field.** Prove archive state by trying to re-archive: the CLI answers
   "already archived".
7. **Two edit mistakes** (an off-by-one range in `index.client.tsx`, a range that stopped short in `directory.ts`),
   both caught by the tool's syntax warning and fixed.

## Key Decisions

I kept the plugin client-only and put the pure logic in `shared/` so Node can test it. The queue orders by
longest-waiting first and advances by comparing keys against the last agent opened, so the cycle still moves when
that agent was answered and left the queue. Only the `needs_input` bucket is enabled, and adding another bucket is
one union member plus one matcher. The shortcut binding is per device (`localStorage`), not a host setting, because
a keybinding belongs to the keyboard. I did not contribute to `paseo-next-check`: it only queues finished replies and
has no licence. `djbclark-ade` edits go through the lead, because that repo is the lead's project (its `AGENTS.md`
order 11).

## Decisions

- [decision] Client-only plugin with `shared/` pure logic; rejected: a server entry with Paseo host settings; because the shortcut is read by a non-React listener and a binding belongs to the device
- [decision] Only the `needs_input` bucket is enabled, others added by extending `WaitingBucket`; rejected: enabling failed and ready-to-review now; because djbclark asked for needs_input only
- [decision] Install paseo-screen from the registry pin; rejected: the npm 0.1.1 package; because the registry artifact is reviewed and pinned
- [decision] Relay the toolchain-prompt change to the lead; rejected: editing `djbclark-ade` myself; because order 11 makes it the lead's project and the lead has open PRs
- [ruling] "Why are you using orca? We have phased that out in favor of paseo." (djbclark, 2026-10-30)
- [ruling] "make sure all doc makes it obvious that we have moved away from herdr (except for herdr4paseo and paseo4herdr) and completly away from orca and bb" (djbclark, 2026-10-30)
- [ruling] "Install, enable and use paseo-screen." (djbclark, 2026-10-30)
- [ruling] "actually let's just do 3 for now, resurface 2/1 later" (djbclark, 2026-10-30)
- [ruling] "2. Add both" (djbclark, 2026-10-30)

## Relations

- decided_in [[HANDOFF_standalone-ffb0_next-question-plugin_2026-10-30_cdcd]]

## Evidence & Data

1. Repo: `main` `8f3533348d79122d9c4f8530c451a4d681176cd0`, tag `v0.1.0`, 21 unit tests pass (`npm test`), `npm run typecheck` clean, `npm pack --dry-run` lists 16 files.
2. In the real app: the sidebar count read "(3)" with real agents waiting; five shortcut presses alternated across two waiting agents; answering one dropped the count and removed it from the cycle.
3. Desktop app: CORRECTED. An earlier note here said a Cmd+Shift+U sent through paseo-screen moved the host window. That was a mistake (screenshots six minutes apart, djbclark had switched windows himself). A controlled retest at 22:57 found the shortcut does NOT jump in his desktop app, before or after a plugin reload, while Cmd+K forwarded through paseo-screen did open the Command Center. A "Check the shortcut" panel was added to diagnose it.
4. paseo-screen: about 10 fps, no permission prompt (Screen Recording and Accessibility were already granted).
5. Relay records: expectations `pnq-orca-docs` and `pnq-toolchain` for `1e61c979`; the brief is `/tmp/pnq-brief-lead.md` (temporary file).
6. Test agents `pnq-test-1`, `-2`, `-3`, `pnq-shot`, `pnq-desktop` were started on the live daemon and archived.
7. Context for the last two rulings: "3" was the option "Do not submit yet" and "2/1" the routes "official registry now, npm plus paseo.cafe too" and "official registry from GitHub only". "2. Add both" answered whether to add next-question and paseo-screen to `docs/apply-toolchain-prompt.md` (AGENTS.md rule 5).

## Operator Feedback

djbclark picks options through the `steps` prompts and wants one question at a time. He corrects tool choices
directly (the Orca question). He wants things done unasked where the rules say so, and asks before anything outward.

## Where We're Going

1. **THE next action:** read the lead's reply and act on it. Run
   `python3 -I ~/src/djbclark-ade/skills/session-finder/relay.py --pending > /tmp/p.txt; grep -E "pnq-" /tmp/p.txt`
   (read the file, not a pipe). A `[relay from ...]` message from the lead also arrives as a prompt in this session.
2. Ask djbclark whether `paseo-screen` should stay enabled when idle (anyone paired can control the Mac). Disable with `paseo plugin disable paseo-screen`.
3. Ask djbclark what "bb" means. I told the lead my guess (`bigteam`) is unconfirmed.
4. Registry listing, deferred: see "Open: registry listing" in `AGENTS.md` (official registry via the prefilled form; paseo.cafe needs npm and a token).
5. Untested for paseo-screen: mouse clicks, drags, clipboard, multiple displays.
6. If the lead asks for an Opus edit of `~/.agents/AGENTS.md` items 4, 26 and 30, that file is Opus-only.

## Detached jobs

none. No bigteam job records were created. Nothing assumes a background task survives.

## Quick Start

```bash
cd ~/src/paseo-plugin-next-question
git status -sb && git log --oneline -5
npm run typecheck && npm test
paseo plugin ls | grep -E "next-question|paseo-screen"
paseo plugin reload next-question      # after any source edit
python3 -I ~/src/djbclark-ade/skills/session-finder/relay.py --pending > /tmp/p.txt; grep pnq- /tmp/p.txt
```
