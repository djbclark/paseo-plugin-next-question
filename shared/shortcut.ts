/** The slice of a DOM KeyboardEvent the matcher reads, so this module needs no DOM types. */
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
 * Cmd+Shift+U on macOS, Ctrl+Shift+U elsewhere. Matches the physical key (`code`), so Option
 * or a non-US layout cannot change which key it is. The other platform's primary modifier must
 * be up, so Ctrl+Cmd+Shift+U on a Mac is not ours.
 */
export function matchesNextQuestionShortcut(event: ShortcutKeyEvent, isMac: boolean): boolean {
  if (event.code !== "KeyU" || !event.shiftKey || event.altKey) return false;
  if (event.repeat || event.isComposing) return false;
  return isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}
