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
  isMac,
  readCombo,
  recordCombo,
  shortcutsSupported,
  writeCombo,
  type ComboRecording,
} from "./web";

export function ShortcutSettings({ theme }: PluginSurfaceProps) {
  const [combo, setCombo] = useState<Combo>(readCombo);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<ComboRecording | null>(null);

  useEffect(() => () => active.current?.cancel(), []);

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

  return (
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
  );
}
