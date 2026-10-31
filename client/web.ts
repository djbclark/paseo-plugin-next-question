import { Platform } from "react-native";
import { matchesNextQuestionShortcut, type ShortcutKeyEvent } from "../shared/shortcut";

// Plugins have no keybinding API, so the shortcut is a window keydown listener. This plugin
// typechecks without the DOM library; declare only what this module uses.
interface ShortcutDomEvent extends ShortcutKeyEvent {
  preventDefault(): void;
  stopPropagation(): void;
}
declare const window: {
  addEventListener(type: "keydown", listener: (event: ShortcutDomEvent) => void, capture: boolean): void;
  removeEventListener(
    type: "keydown",
    listener: (event: ShortcutDomEvent) => void,
    capture: boolean,
  ): void;
  [claim: symbol]: unknown;
};
declare const navigator: { platform?: string; userAgent?: string };

// A plugin installed on several daemons runs its client entry once per connection, in one
// window. Only the first listener to claim the window handles the key; the rest would open
// the screen again.
const CLAIM = Symbol.for("paseo-plugin-next-question.shortcut");

/** Returns a remover. A no-op off the web, where there is no hardware keyboard to listen to. */
export function installShortcut(onTrigger: () => void): () => void {
  if (Platform.OS !== "web" || window[CLAIM]) return () => {};
  const isMac = /mac|iphone|ipad/i.test(navigator.platform ?? navigator.userAgent ?? "");
  const listener = (event: ShortcutDomEvent) => {
    if (!matchesNextQuestionShortcut(event, isMac)) return;
    event.preventDefault();
    event.stopPropagation();
    onTrigger();
  };
  window[CLAIM] = listener;
  // Capture phase, so focused inputs and the composer cannot swallow the key first.
  window.addEventListener("keydown", listener, true);
  return () => {
    window.removeEventListener("keydown", listener, true);
    if (window[CLAIM] === listener) window[CLAIM] = undefined;
  };
}
