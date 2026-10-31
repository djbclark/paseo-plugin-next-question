# paseo-plugin-next-question

A [Paseo](https://paseo.sh) plugin that jumps to the next agent waiting for your input.
See [OVERVIEW.md](OVERVIEW.md) for what it does and its limits.

```sh
paseo plugin install github:djbclark/paseo-plugin-next-question
```

Requires Paseo 0.14 or newer and plugins enabled on the daemon.

## Develop

```sh
npm install
npm run typecheck
npm test
paseo plugin install "$PWD"        # then: paseo plugin reload next-question
paseo plugin logs next-question
```

## Layout

| Path | Role |
| --- | --- |
| `shared/queue.ts` | Which agents are in the queue and the cycle order. Add a bucket here to cycle through more than `needs_input`. |
| `shared/shortcut.ts` | The key combination: what can be bound, matching, parsing a stored value, display text. |
| `client/jump.tsx` | The one screen every entry point opens. Navigation is only handed to screens. |
| `client/web.ts` | The `keydown` listener, the combo recorder and the `localStorage` binding. Plugins have no keybinding API. |
| `client/sidebar-item.tsx` | Sidebar row with a live waiting count. |
| `client/settings.tsx` | Settings screen to record or reset the shortcut. |

MIT licensed.
