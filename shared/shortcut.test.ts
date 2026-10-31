import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_COMBO,
  comboFromEvent,
  formatCombo,
  matchesCombo,
  parseCombo,
  type ShortcutKeyEvent,
} from "./shortcut.ts";

function press(over: Partial<ShortcutKeyEvent>): ShortcutKeyEvent {
  return {
    code: "KeyU",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    ...over,
  };
}

describe("matchesCombo with the default binding", () => {
  it("is Cmd+Shift+U on a Mac and Ctrl+Shift+U elsewhere", () => {
    assert.equal(matchesCombo(press({ metaKey: true, shiftKey: true }), DEFAULT_COMBO, true), true);
    assert.equal(matchesCombo(press({ ctrlKey: true, shiftKey: true }), DEFAULT_COMBO, false), true);
  });

  it("rejects the other platform's modifier, missing shift and extra modifiers", () => {
    const cmdShift = press({ metaKey: true, shiftKey: true });
    assert.equal(matchesCombo(cmdShift, DEFAULT_COMBO, false), false);
    assert.equal(matchesCombo(press({ metaKey: true }), DEFAULT_COMBO, true), false);
    assert.equal(matchesCombo({ ...cmdShift, altKey: true }, DEFAULT_COMBO, true), false);
    assert.equal(matchesCombo({ ...cmdShift, ctrlKey: true }, DEFAULT_COMBO, true), false);
  });

  it("matches the physical key, not the character a layout or Option would produce", () => {
    assert.equal(
      matchesCombo(press({ metaKey: true, shiftKey: true, code: "KeyI" }), DEFAULT_COMBO, true),
      false,
    );
  });

  it("does not fire on key repeat or during IME composition", () => {
    const held = press({ metaKey: true, shiftKey: true });
    assert.equal(matchesCombo({ ...held, repeat: true }, DEFAULT_COMBO, true), false);
    assert.equal(matchesCombo({ ...held, isComposing: true }, DEFAULT_COMBO, true), false);
  });
});

describe("matchesCombo with a recorded binding", () => {
  const altJ = { code: "KeyJ", mod: false, shift: false, alt: true };

  it("matches an Alt-only combo on both platforms", () => {
    assert.equal(matchesCombo(press({ code: "KeyJ", altKey: true }), altJ, true), true);
    assert.equal(matchesCombo(press({ code: "KeyJ", altKey: true }), altJ, false), true);
  });

  it("no longer matches the default once rebound", () => {
    assert.equal(matchesCombo(press({ metaKey: true, shiftKey: true }), altJ, true), false);
  });
});

describe("comboFromEvent", () => {
  it("reads mod as Cmd on a Mac and Ctrl elsewhere", () => {
    const mac = comboFromEvent(press({ code: "KeyK", metaKey: true, shiftKey: true }), true);
    const other = comboFromEvent(press({ code: "KeyK", ctrlKey: true, shiftKey: true }), false);
    assert.deepEqual(mac, { code: "KeyK", mod: true, shift: true, alt: false });
    assert.deepEqual(other, mac);
  });

  it("refuses combos that would swallow typing or cannot be expressed", () => {
    assert.equal(comboFromEvent(press({ code: "KeyK" }), true), null, "no mod or alt");
    assert.equal(comboFromEvent(press({ code: "KeyK", shiftKey: true }), true), null, "shift only");
    assert.equal(comboFromEvent(press({ code: "KeyK", ctrlKey: true }), true), null, "Ctrl on a Mac");
    assert.equal(comboFromEvent(press({ code: "KeyK", metaKey: true }), false), null, "Win key");
  });

  it("ignores a bare modifier press and Escape, so the recorder keeps waiting or cancels", () => {
    assert.equal(comboFromEvent(press({ code: "ShiftLeft", metaKey: true, shiftKey: true }), true), null);
    assert.equal(comboFromEvent(press({ code: "MetaRight", metaKey: true }), true), null);
    assert.equal(comboFromEvent(press({ code: "Escape", metaKey: true }), true), null);
  });
});

describe("parseCombo", () => {
  it("round-trips a stored combo", () => {
    const stored = JSON.stringify({ code: "KeyJ", mod: true, shift: false, alt: true });
    assert.deepEqual(parseCombo(stored), { code: "KeyJ", mod: true, shift: false, alt: true });
  });

  it("returns null for missing, malformed or unbindable values so the default applies", () => {
    assert.equal(parseCombo(null), null);
    assert.equal(parseCombo("not json"), null);
    assert.equal(parseCombo(JSON.stringify({ code: "KeyJ" })), null);
    assert.equal(
      parseCombo(JSON.stringify({ code: "KeyJ", mod: false, shift: true, alt: false })),
      null,
      "a combo with neither mod nor alt would swallow typing",
    );
  });
});

describe("formatCombo", () => {
  it("uses macOS symbols in their standard order, and names elsewhere", () => {
    const combo = { code: "BracketRight", mod: true, shift: true, alt: true };
    assert.equal(formatCombo(combo, true), "⌥⇧⌘]");
    assert.equal(formatCombo(combo, false), "Ctrl+Alt+Shift+]");
    assert.equal(formatCombo(DEFAULT_COMBO, true), "⇧⌘U");
    assert.equal(formatCombo(DEFAULT_COMBO, false), "Ctrl+Shift+U");
  });
});
