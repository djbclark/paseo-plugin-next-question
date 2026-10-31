# paseo-plugin-next-question

Paseo client-only plugin (no server entry). Cycles through agents in the `needs_input` bucket.

- `npm run typecheck` and `npm test` before every commit. Tests cover `shared/` only; it has no DOM, React or Node imports besides test files.
- DOM globals live only in `client/web.ts`, declared locally. The tsconfig has no DOM lib.
- The shortcut binding is per device in `localStorage` (key `paseo-plugin-next-question.combo`), read on every keydown that holds Cmd, Ctrl or Alt. It is not a Paseo host setting: those need a server entry and are shared by every client of the daemon.
- Paseo's own capture-phase `keydown` handlers on `window` run before the plugin's. The plugin cannot stop them, so Escape while recording also leaves the settings page.
- Adding a bucket: extend `WaitingBucket` in `shared/queue.ts`, add its matcher, list it in `ENABLED_BUCKETS`.
- `MATCHERS.needs_input` restates `deriveAgentStateBucket` from `@getpaseo/protocol`, which plugins cannot import. Re-check it when Paseo changes that rule.
- Reload after source edits: `paseo plugin reload next-question`. Never restart the daemon.

## Open: registry listing (deferred by djbclark, 2026-10-30)

Resurface when djbclark asks, or at the next release. v0.1.0 is tagged and ready.

1. Official registry (paseo.sh/plugins): needs no npm. Open the form at `https://github.com/getpaseo/plugins/issues/new?template=submit-plugin.yml&title=Next+question&source=https%3A%2F%2Fgithub.com%2Fdjbclark%2Fpaseo-plugin-next-question&categories=Sidebar%2CUtils`. He clicks Submit (the form is what applies the `submission` label). Then confirm with `gh issue list --repo getpaseo/plugins --author djbclark`.
2. Community directory paseo.cafe: needs a public npm package with the same id and version. npm is not logged in; no npm token is declared in sudo-secretspec, so he mints one. Publishing is permanent per version.
