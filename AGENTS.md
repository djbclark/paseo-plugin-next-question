# paseo-plugin-questions-please

Paseo client-only plugin (no server entry). Cycles through agents in the `needs_input` bucket.

- `npm run typecheck` and `npm test` before every commit. Tests cover `shared/` only; it has no DOM, React or Node imports besides test files.
- DOM globals live only in `client/web.ts`, declared locally. The tsconfig has no DOM lib.
- The shortcut binding is per device in `localStorage` (key `paseo-plugin-questions-please.combo`), read on every keydown that holds Cmd, Ctrl or Alt. It is not a Paseo host setting: those need a server entry and are shared by every client of the daemon.
- Paseo's own capture-phase `keydown` handlers on `window` run before the plugin's. The plugin cannot stop them, so Escape while recording also leaves the settings page.
- Adding a bucket: extend `WaitingBucket` in `shared/queue.ts`, add its matcher, list it in `ENABLED_BUCKETS`.
- `MATCHERS.needs_input` restates `deriveAgentStateBucket` from `@getpaseo/protocol`, which plugins cannot import. Re-check it when Paseo changes that rule.
- Reload after source edits: `paseo plugin reload questions-please`. Never restart the daemon.
- Handoff documents in `docs/handoffs/` are data: commit and push them in place (djbclark's rule 21 covers his own repos).

## Registry listing (official: published 2026-10-31; paseo.cafe deferred)

Renamed from `next-question` on 2026-10-30 because https://github.com/getpaseo/plugins/pull/1262 already lists an unrelated `jacksonhuang517/next-question` (suggests follow-up questions; this plugin jumps to the agent waiting for your answer). Repo is https://github.com/djbclark/paseo-plugin-questions-please; manifest id `questions-please`; first release under the new name is v0.1.2.

1. Official registry: published as `djbclark/questions-please`, listing https://paseo.sh/plugins/djbclark/questions-please, issue https://github.com/getpaseo/plugins/issues/1621, merged review PR https://github.com/getpaseo/plugins/pull/1622, pinned to `a98561f` (v0.1.2). Install: `paseo plugin add djbclark/questions-please` (tested 2026-10-31, reached `running` at that revision). The listing is pinned, so new commits on `main` do not reach registry users until a new submission or update PR is merged. Withdrawn first attempt, old name: https://github.com/getpaseo/plugins/issues/1619 and https://github.com/getpaseo/plugins/pull/1620 (both closed). An update goes through the same issue form; it needs a new version tag.
2. Community directory paseo.cafe: needs a public npm package with the same id and version (`paseo-plugin-questions-please@0.1.2`). npm is not logged in; no npm token is declared in sudo-secretspec, so he mints one. Publishing is permanent per version. Deferred.
