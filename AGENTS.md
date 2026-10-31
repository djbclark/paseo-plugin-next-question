# paseo-plugin-next-question

Paseo client-only plugin (no server entry). Cycles through agents in the `needs_input` bucket.

- `npm run typecheck` and `npm test` before every commit. Tests cover `shared/` only; it has no DOM, React or Node imports besides test files.
- DOM globals live only in `client/web.ts`, declared locally. The tsconfig has no DOM lib.
- The shortcut binding is per device in `localStorage` (key `paseo-plugin-next-question.combo`), read on every keydown that holds Cmd, Ctrl or Alt. It is not a Paseo host setting: those need a server entry and are shared by every client of the daemon.
- Paseo's own capture-phase `keydown` handlers on `window` run before the plugin's. The plugin cannot stop them, so Escape while recording also leaves the settings page.
- Adding a bucket: extend `WaitingBucket` in `shared/queue.ts`, add its matcher, list it in `ENABLED_BUCKETS`.
- `MATCHERS.needs_input` restates `deriveAgentStateBucket` from `@getpaseo/protocol`, which plugins cannot import. Re-check it when Paseo changes that rule.
- Reload after source edits: `paseo plugin reload next-question`. Never restart the daemon.
