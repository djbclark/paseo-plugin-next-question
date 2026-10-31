# paseo-plugin-questions-please

A [Paseo](https://paseo.sh) plugin that jumps to the next agent waiting for your input.
See [OVERVIEW.md](OVERVIEW.md) for what it does and its limits.

## Installation

```sh
paseo plugin add djbclark/questions-please
```

Requires Paseo 0.14 or newer and plugins enabled on the daemon. The keyboard shortcut works in a
browser and in the macOS desktop app (confirmed by the author, 2026-10-30, with the current
default). The first default, Cmd+Shift+U, did not work in the desktop app; the Shortcut settings
screen has a "Check the shortcut" panel for diagnosing a key that does nothing. The sidebar row and
Command Center item work everywhere a host is selected.

To update an existing installation after the registry approves a release:

```sh
paseo plugin update questions-please
```

The sidebar shows an amber waiting count and hollow circle, with your current shortcut to their
left on desktop and web. These hide when no agents are waiting.

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
paseo plugin install "$PWD"        # then: paseo plugin reload questions-please
paseo plugin logs questions-please
```

## Layout

| Path                      | Role                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `shared/queue.ts`         | Which agents are in the queue and the cycle order. Add a bucket here to cycle through more than `needs_input`. |
| `shared/shortcut.ts`      | The key combination: what can be bound, matching, parsing a stored value, display text.                        |
| `client/jump.tsx`         | The one screen every entry point opens. Navigation is only handed to screens.                                  |
| `client/web.ts`           | The `keydown` listener, the combo recorder and the `localStorage` binding. Plugins have no keybinding API.     |
| `client/sidebar-item.tsx` | Sidebar row with a live waiting count.                                                                         |
| `client/settings.tsx`     | Settings screen to record or reset the shortcut.                                                               |

MIT licensed.
