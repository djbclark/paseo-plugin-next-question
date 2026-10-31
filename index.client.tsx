import type { PluginClientContext } from "@getpaseo/plugin/client";
import { JUMP_SCREEN_ID, JumpScreen } from "./client/jump";
import { NextQuestionItem } from "./client/sidebar-item";
import { ShortcutSettings } from "./client/settings";
import { installShortcut } from "./client/web";

export default function contribute(client: PluginClientContext) {
  const removers = [
    client.addScreen({ id: JUMP_SCREEN_ID, title: "Next question", Component: JumpScreen }),
    client.addSettingsScreen({
      id: "shortcut",
      title: "Shortcut",
      icon: "Keyboard",
      Component: ShortcutSettings,
    }),
    client.addSidebarHeaderItem({
      id: "next-question",
      title: "Next question",
      Component: NextQuestionItem,
    }),
    client.addCommandCenterItem({
      id: "next-question",
      title: "Next waiting question",
      icon: "CircleAlert",
      keywords: ["waiting", "question", "input", "permission", "picklist", "approve", "next"],
      context: "global",
      onSelect: ({ openScreen }) =>
        openScreen({ screenId: JUMP_SCREEN_ID, params: { n: String(Date.now()) } }),
    }),
    installShortcut(() =>
      client.openScreen({ screenId: JUMP_SCREEN_ID, params: { n: String(Date.now()) } }),
    ),
  ];

  return () => {
    for (const remove of removers) void remove();
  };
}
