# paseo-plugin-next-question

Paseo client-only plugin (no server entry). Cycles through agents in the `needs_input` bucket.

- `npm run typecheck` and `npm test` before every commit. Tests cover `shared/` only; it has no DOM, React or Node imports besides test files.
- DOM globals live only in `client/web.ts`, declared locally. The tsconfig has no DOM lib.
- Adding a bucket: extend `WaitingBucket` in `shared/queue.ts`, add its matcher, list it in `ENABLED_BUCKETS`.
- `MATCHERS.needs_input` restates `deriveAgentStateBucket` from `@getpaseo/protocol`, which plugins cannot import. Re-check it when Paseo changes that rule.
- Reload after source edits: `paseo plugin reload next-question`. Never restart the daemon.
