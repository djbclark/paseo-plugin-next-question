import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesNextQuestionShortcut, type ShortcutKeyEvent } from "./shortcut.ts";

function press(over: Partial<ShortcutKeyEvent>): ShortcutKeyEvent {
  return {
    code: "KeyU",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: true,
    repeat: false,
    isComposing: false,
    ...over,
  };
}

describe("matchesNextQuestionShortcut", () => {
  it("is Cmd+Shift+U on a Mac and Ctrl+Shift+U elsewhere", () => {
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true }), true), true);
    assert.equal(matchesNextQuestionShortcut(press({ ctrlKey: true }), false), true);
  });

  it("ignores the other platform's modifier", () => {
    assert.equal(matchesNextQuestionShortcut(press({ ctrlKey: true }), true), false);
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true }), false), false);
  });

  it("needs shift, and rejects extra modifiers", () => {
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true, shiftKey: false }), true), false);
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true, altKey: true }), true), false);
    assert.equal(
      matchesNextQuestionShortcut(press({ metaKey: true, ctrlKey: true }), true),
      false,
    );
  });

  it("matches the physical key, not the character Option or a layout would produce", () => {
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true, code: "KeyI" }), true), false);
  });

  it("does not fire on key repeat or during IME composition", () => {
    assert.equal(matchesNextQuestionShortcut(press({ metaKey: true, repeat: true }), true), false);
    assert.equal(
      matchesNextQuestionShortcut(press({ metaKey: true, isComposing: true }), true),
      false,
    );
  });
});
