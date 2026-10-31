import { usePaseo, type PluginScreenProps } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { nextAfter, queueKey, waitingQueue } from "../shared/queue";
import { getCursor, setCursor } from "./cursor";
import { readAllAgents } from "./directory";

export const JUMP_SCREEN_ID = "jump";

/**
 * Every entry point (shortcut, Command Center, sidebar row) opens this screen. Navigation is
 * handed only to screens, so the screen reads the queue, opens the target agent, and the route
 * change replaces it. `params.n` is a fresh value per invocation so the screen remounts and
 * re-reads even when it was already showing "nothing waiting".
 */
export function JumpScreen({ params, navigation, host, theme, layout }: PluginScreenProps) {
  const paseo = usePaseo();
  const queue = useQuery({
    queryKey: ["next-question", host.id, params.n ?? ""],
    queryFn: async ({ signal }) => waitingQueue(await readAllAgents(paseo, signal)),
    enabled: Boolean(navigation),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const opened = useRef(false);
  const target = queue.data ? nextAfter(queue.data, getCursor(host.id)) : null;

  useEffect(() => {
    if (!navigation || !target || opened.current) return;
    opened.current = true;
    setCursor(host.id, queueKey(target));
    navigation.openAgent({ agentId: target.id, serverId: host.id });
  }, [navigation, target, host.id]);

  let message: string | null = null;
  if (!navigation) message = "Update Paseo to jump between agents from a plugin.";
  else if (queue.error) message = queue.error.message;
  else if (queue.data && !target) message = "No agent is waiting for your input.";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        padding: layout.compact ? 16 : 24,
        backgroundColor: theme.colors.surface0,
      }}
    >
      {!message && <ActivityIndicator color={theme.colors.foregroundMuted} />}
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: theme.colors.foreground, textAlign: "center" }}
      >
        {message ?? "Opening the next waiting agent…"}
      </Text>
      {queue.error && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void queue.refetch()}
          style={{ borderRadius: 8, padding: 12, backgroundColor: theme.colors.accent }}
        >
          <Text style={{ color: theme.colors.accentForeground }}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}
