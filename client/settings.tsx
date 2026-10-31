import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@getpaseo/plugin/client/ui";
import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { DEFAULT_COMBO, formatCombo, type Combo } from "../shared/shortcut";
import {
  getLastKeySeen,
  getShortcutStatus,
  isMac,
  readCombo,
  recordCombo,
  setTestMode,
  shortcutsSupported,
  subscribeProbe,
  writeCombo,
  type ComboRecording,
  type KeySeen,
  type ShortcutStatus,
} from "./web";

const STATUS_TEXT: Record<ShortcutStatus, string> = {
  unsupported: "Not available on this device",
  off: "Not installed in this window",
  listening: "Listening in this window",
  blocked: "Blocked: another copy of this plugin already listens in this window",
};

function describeKey(seen: KeySeen): string {
  const held = [seen.meta && "Cmd", seen.ctrl && "Ctrl", seen.alt && "Alt", seen.shift && "Shift"]
    .filter(Boolean)
    .join("+");
  return `${held}+${seen.code}, ${seen.matched ? "matches your shortcut: it would jump" : "does not match your shortcut"}`;
}

export function ShortcutSettings({ theme }: PluginSurfaceProps) {
  const [combo, setCombo] = useState<Combo>(readCombo);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, refresh] = useState(0);
  const active = useRef<ComboRecording | null>(null);

  useEffect(() => () => active.current?.cancel(), []);

  // While this screen is open the shortcut reports here instead of jumping, and every key
  // the plugin's listener receives with Cmd, Ctrl or Alt held is shown below.
  useEffect(() => {
    setTestMode(true);
    const unsubscribe = subscribeProbe(() => refresh((n) => n + 1));
    return () => {
      unsubscribe();
      setTestMode(false);
    };
  }, []);

  if (!shortcutsSupported) {
    return (
      <SettingsSection title="Shortcut">
        <SettingsCard>
          <SettingsRow
            label="Keyboard shortcut"
            hint="The shortcut needs a hardware keyboard, in the Paseo desktop app or a browser. The sidebar row and the Command Center item work here."
          />
        </SettingsCard>
      </SettingsSection>
    );
  }

  const save = (next: Combo | null) => {
    try {
      writeCombo(next);
      setCombo(next ?? DEFAULT_COMBO);
      setError(null);
    } catch {
      setError("This browser refused to save the shortcut.");
    }
  };

  const record = async () => {
    const session = recordCombo();
    active.current = session;
    setRecording(true);
    const next = await session.result;
    active.current = null;
    setRecording(false);
    if (next) save(next);
  };

  const isDefault =
    combo.code === DEFAULT_COMBO.code &&
    combo.mod === DEFAULT_COMBO.mod &&
    combo.shift === DEFAULT_COMBO.shift &&
    combo.alt === DEFAULT_COMBO.alt;
  const seen = getLastKeySeen();

  return (
    <>
      <SettingsSection title="Shortcut">
        <SettingsCard>
          <SettingsRow
            label="Next waiting question"
            hint="Saved in this browser or app only, not shared with other devices."
            error={error ?? undefined}
          >
            <Text style={{ color: theme.colors.foreground }}>{formatCombo(combo, isMac)}</Text>
          </SettingsRow>
          <SettingsAction
            label="Change shortcut"
            hint="Hold Cmd (macOS) or Ctrl, or Alt, and press a key. Click the button again to cancel. It takes over any Paseo shortcut on the same keys."
            actionLabel={recording ? "Press the new keys, or cancel" : "Record"}
            onPress={recording ? () => active.current?.cancel() : () => void record()}
          />
          <SettingsAction
            label="Restore default"
            actionLabel={`Use ${formatCombo(DEFAULT_COMBO, isMac)}`}
            disabled={isDefault || recording}
            onPress={() => save(null)}
          />
        </SettingsCard>
      </SettingsSection>
      <SettingsSection title="Check the shortcut">
        <SettingsCard>
          <SettingsRow
            label="Listener"
            hint="Blocked means a stale or duplicate copy of the plugin holds the key; reload the window."
          >
            <Text style={{ color: theme.colors.foreground }}>{STATUS_TEXT[getShortcutStatus()]}</Text>
          </SettingsRow>
          <SettingsRow
            label="This device is treated as"
            hint="Cmd is the main key on macOS and Ctrl elsewhere."
          >
            <Text style={{ color: theme.colors.foreground }}>
              {isMac ? "macOS" : "not macOS"}
            </Text>
          </SettingsRow>
          <SettingsRow
            label="Last key the plugin saw"
            hint="Press your shortcut with this screen open: it reports here instead of jumping. Only keys held with Cmd, Ctrl or Alt are shown, never plain typing. If nothing appears, something in the app takes the key before the plugin does."
          >
            <Text style={{ color: theme.colors.foreground }}>
              {seen ? describeKey(seen) : "Nothing yet"}
            </Text>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </>
  );
}
