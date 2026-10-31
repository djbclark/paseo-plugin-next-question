# paseo-plugin-next-question

A [Paseo](https://paseo.sh) plugin that jumps to the next agent waiting for your input.
See [OVERVIEW.md](OVERVIEW.md) for what it does and its limits.

## Installation

```sh
paseo plugin install github:djbclark/paseo-plugin-next-question
```

Requires Paseo 0.14 or newer and plugins enabled on the daemon. The keyboard shortcut is tested in a
browser; the desktop app runs the same web client but has not been tested. The sidebar row and
Command Center item work everywhere a host is selected.

## Limitations

- "Next" means next after the agent this plugin last opened. Paseo does not tell plugins which tab has focus, and a plugin reload restarts the cycle.
- Agent tabs only. Terminals, finished agents and failed agents are not included.
- The shortcut binding is saved per browser or app, not per daemon. Escape while recording also leaves the settings page, because Paseo handles Escape first.
- Installed on several daemons, only one handles the shortcut in a given window.
- Plugin Command Center items need a selected host, so the item is missing on the Open Project screen.

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
