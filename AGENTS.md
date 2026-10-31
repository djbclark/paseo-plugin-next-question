# paseo-plugin-next-question

Paseo client-only plugin (no server entry). Cycles through agents in the `needs_input` bucket.

- `npm run typecheck` and `npm test` before every commit. Tests cover `shared/` only; it has no DOM, React or Node imports besides test files.
- DOM globals live only in `client/web.ts`, declared locally. The tsconfig has no DOM lib.
- The shortcut binding is per device in `localStorage` (key `paseo-plugin-next-question.combo`), read on every keydown that holds Cmd, Ctrl or Alt. It is not a Paseo host setting: those need a server entry and are shared by every client of the daemon.
- Paseo's own capture-phase `keydown` handlers on `window` run before the plugin's. The plugin cannot stop them, so Escape while recording also leaves the settings page.
- Adding a bucket: extend `WaitingBucket` in `shared/queue.ts`, add its matcher, list it in `ENABLED_BUCKETS`.
- `MATCHERS.needs_input` restates `deriveAgentStateBucket` from `@getpaseo/protocol`, which plugins cannot import. Re-check it when Paseo changes that rule.
- Reload after source edits: `paseo plugin reload next-question`. Never restart the daemon.
- Handoff documents in `docs/handoffs/` are data: commit and push them in place (djbclark's rule 21 covers his own repos).

## Open: registry listing (official registry filed 2026-10-30; paseo.cafe deferred)

1. Official registry (paseo.sh/plugins): filed 2026-10-30 by Grok Bot in djbclark's signed-in browser: issue https://github.com/getpaseo/plugins/issues/1619 (label `submission`, Sidebar + Utils), bot review PR https://github.com/getpaseo/plugins/pull/1620 (open, no reviews yet at filing). The form has no description box, so the `Pin: tag v0.1.1` hint was not sent: the submission records only the repo URL, and the reviewer pins a supplied ref or resolves `main` (453e64d = v0.1.1 at filing). Do not push new commits to `main` until the PR merges, or the pinned commit may differ from the tested one. Registry ids are owner-namespaced (`djbclark/next-question`); the older https://github.com/getpaseo/plugins/pull/1262 listing `jacksonhuang517/next-question` is a different plugin with the same short name, so watch the PR for a name-overlap comment. Install after approval: `paseo plugin add djbclark/next-question`.
2. Community directory paseo.cafe: needs a public npm package with the same id and version (`paseo-plugin-next-question@0.1.1`). npm is not logged in; no npm token is declared in sudo-secretspec, so he mints one. Publishing is permanent per version. Deferred.
