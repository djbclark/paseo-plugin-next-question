import { z } from "zod";

/** The slice of a DOM KeyboardEvent the helpers read, so this module needs no DOM types. */
export interface ShortcutKeyEvent {
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
  isComposing: boolean;
}

/**
 * A key combination that means the same on every platform: `mod` is Cmd on macOS and Ctrl
 * elsewhere. `code` is the physical key, so Option or a non-US layout cannot change which key
 * it is. A combo needs `mod` or `alt`, so binding it never swallows ordinary typing.
 */
export const ComboSchema = z
  .object({ code: z.string().min(1), mod: z.boolean(), shift: z.boolean(), alt: z.boolean() })
  .refine((combo) => combo.mod || combo.alt);
export type Combo = z.infer<typeof ComboSchema>;

/** Cmd+Shift+U on macOS, Ctrl+Shift+U elsewhere. */
export const DEFAULT_COMBO: Combo = { code: "KeyU", mod: true, shift: true, alt: false };

const MODIFIER_KEY = /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/;

/**
 * The combo a key press makes, or null when it is not bindable: a bare modifier, Escape, no
 * `mod` or `alt` held, or the other platform's primary modifier (Ctrl on a Mac, the Windows
 * key elsewhere), which a platform-neutral combo cannot express.
 */
export function comboFromEvent(event: ShortcutKeyEvent, isMac: boolean): Combo | null {
  if (!event.code || event.code === "Escape" || MODIFIER_KEY.test(event.code)) return null;
  if (isMac ? event.ctrlKey : event.metaKey) return null;
  const mod = isMac ? event.metaKey : event.ctrlKey;
  if (!mod && !event.altKey) return null;
  return { code: event.code, mod, shift: event.shiftKey, alt: event.altKey };
}

export function matchesCombo(event: ShortcutKeyEvent, combo: Combo, isMac: boolean): boolean {
  if (event.repeat || event.isComposing) return false;
  const pressed = comboFromEvent(event, isMac);
  return (
    pressed !== null &&
    pressed.code === combo.code &&
    pressed.mod === combo.mod &&
    pressed.shift === combo.shift &&
    pressed.alt === combo.alt
  );
}

/** A stored combo, or null for anything missing, malformed or not bindable. */
export function parseCombo(raw: string | null): Combo | null {
  if (raw === null) return null;
  try {
    const parsed = ComboSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const KEY_LABELS: Record<string, string> = {
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Backslash: "\\",
  Comma: ",",
  Period: ".",
  Slash: "/",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

function keyLabel(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return KEY_LABELS[code] ?? code;
}

/** "⌥⇧⌘U" on macOS, "Ctrl+Alt+Shift+U" elsewhere. */
export function formatCombo(combo: Combo, isMac: boolean): string {
  const key = keyLabel(combo.code);
  if (isMac) {
    return `${combo.alt ? "⌥" : ""}${combo.shift ? "⇧" : ""}${combo.mod ? "⌘" : ""}${key}`;
  }
  const parts = [combo.mod && "Ctrl", combo.alt && "Alt", combo.shift && "Shift", key];
  return parts.filter(Boolean).join("+");
}
