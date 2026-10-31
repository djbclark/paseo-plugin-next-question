import { Platform } from "react-native";
import {
  DEFAULT_COMBO,
  comboFromEvent,
  matchesCombo,
  parseCombo,
  type Combo,
  type ShortcutKeyEvent,
} from "../shared/shortcut";

// Plugins have no keybinding API, so the shortcut is a window keydown listener, and the
// binding lives in localStorage: a keybinding belongs to the device, not to the daemon. This
// plugin typechecks without the DOM library; declare only what this module uses.
interface ShortcutDomEvent extends ShortcutKeyEvent {
  preventDefault(): void;
  stopPropagation(): void;
}
type KeydownListener = (event: ShortcutDomEvent) => void;
declare const window: {
  addEventListener(type: "keydown", listener: KeydownListener, capture: boolean): void;
  removeEventListener(type: "keydown", listener: KeydownListener, capture: boolean): void;
  [claim: symbol]: unknown;
};
declare const navigator: { platform?: string; userAgent?: string };
declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const STORAGE_KEY = "paseo-plugin-next-question.combo";

/** False on iOS and Android: there is no hardware keyboard to listen to. */
export const shortcutsSupported = Platform.OS === "web";
export const isMac =
  shortcutsSupported && /mac|iphone|ipad/i.test(navigator.platform ?? navigator.userAgent ?? "");

/** The saved combo, or the default when none is saved or storage is unavailable. */
export function readCombo(): Combo {
  if (!shortcutsSupported) return DEFAULT_COMBO;
  try {
    return parseCombo(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_COMBO;
  } catch {
    return DEFAULT_COMBO;
  }
}

/** Saves `combo`, or restores the default when null. Throws if the browser refuses storage. */
export function writeCombo(combo: Combo | null): void {
  if (combo === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(combo));
}

// While a combo is being recorded the shortcut must not fire, or pressing the current binding
// would jump instead of rebinding it.
let recording = false;

export interface ComboRecording {
  /** The next bindable combo pressed, or null if cancelled or Escape was pressed. */
  result: Promise<Combo | null>;
  cancel(): void;
}

export function recordCombo(): ComboRecording {
  if (!shortcutsSupported) return { result: Promise.resolve(null), cancel() {} };
  const { promise: result, resolve } = Promise.withResolvers<Combo | null>();
  let finished = false;
  const finish = (combo: Combo | null) => {
    if (finished) return;
    finished = true;
    window.removeEventListener("keydown", listener, true);
    recording = false;
    resolve(combo);
  };
  const listener: KeydownListener = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.code === "Escape") {
      finish(null);
      return;
    }
    // A bare modifier or an unmodified key is not bindable: keep waiting for a real combo.
    const combo = comboFromEvent(event, isMac);
    if (combo) finish(combo);
  };
  recording = true;
  window.addEventListener("keydown", listener, true);
  return { result, cancel: () => finish(null) };
}

// What the settings screen's "Check the shortcut" panel shows. `listening` means this copy of
// the plugin installed its listener; `blocked` means another listener already claimed the
// window, which is the signature of a stale or duplicate copy.
export type ShortcutStatus = "unsupported" | "off" | "listening" | "blocked";
let status: ShortcutStatus = shortcutsSupported ? "off" : "unsupported";

export function getShortcutStatus(): ShortcutStatus {
  return status;
}

/** A key press the plugin's listener received while Cmd, Ctrl or Alt was held. */
export interface KeySeen {
  code: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  matched: boolean;
}
let lastSeen: KeySeen | null = null;
// While the settings screen is open the shortcut only reports there, so a working shortcut
// does not navigate away from the panel that is showing the result.
let testMode = false;
const probes = new Set<() => void>();

export function getLastKeySeen(): KeySeen | null {
  return lastSeen;
}

export function setTestMode(on: boolean): void {
  testMode = on;
}

export function subscribeProbe(callback: () => void): () => void {
  probes.add(callback);
  return () => {
    probes.delete(callback);
  };
}

// A plugin installed on several daemons runs its client entry once per connection, in one
// window. Only the first listener to claim the window handles the key; the rest would open
// the screen again.
const CLAIM = Symbol.for("paseo-plugin-next-question.shortcut");

/** Returns a remover. A no-op off the web. */
export function installShortcut(onTrigger: () => void): () => void {
  if (!shortcutsSupported) return () => {};
  if (window[CLAIM]) {
    status = "blocked";
    return () => {};
  }
  const listener: KeydownListener = (event) => {
    // Every bindable combo holds mod or alt, so plain typing is never read or recorded.
    if (recording || !(event.metaKey || event.ctrlKey || event.altKey)) return;
    const matched = matchesCombo(event, readCombo(), isMac);
    lastSeen = {
      code: event.code,
      meta: event.metaKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      matched,
    };
    for (const probe of probes) probe();
    if (!matched) return;
    event.preventDefault();
    event.stopPropagation();
    if (!testMode) onTrigger();
  };
  window[CLAIM] = listener;
  status = "listening";
  // Capture phase, so focused inputs and the composer cannot swallow the key first.
  window.addEventListener("keydown", listener, true);
  return () => {
    window.removeEventListener("keydown", listener, true);
    if (window[CLAIM] === listener) window[CLAIM] = undefined;
    status = "off";
  };
}
