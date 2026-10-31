import { usePaseo, type PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { waitingQueue } from "../shared/queue";
import { readAllAgents } from "./directory";
import { JUMP_SCREEN_ID } from "./jump";

const COUNT_KEY = ["next-question", "count"] as const;
const REFRESH_DEBOUNCE_MS = 400;
const BACKSTOP_MS = 30_000;

/** How many agents are waiting. Daemon updates trigger a re-read; a slow poll backs them up. */
function useWaitingCount(): number | null {
  const paseo = usePaseo();
  const queryClient = useQueryClient();
  const count = useQuery({
    queryKey: COUNT_KEY,
    queryFn: async ({ signal }) => waitingQueue(await readAllAgents(paseo, signal)).length,
    refetchInterval: BACKSTOP_MS,
    staleTime: REFRESH_DEBOUNCE_MS,
  });

  useEffect(() => {
    const lifetime = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let release: (() => Promise<void>) | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => void queryClient.invalidateQueries({ queryKey: COUNT_KEY }),
        REFRESH_DEBOUNCE_MS,
      );
    };
    void paseo.agents
      .list({ subscribe: {}, signal: lifetime.signal })
      .then(async ({ subscription }) => {
        if (lifetime.signal.aborted) {
          await subscription.release();
          return;
        }
        release = () => subscription.release();
        subscription.subscribe({
          snapshot: refresh,
          update: (message) => {
            if (message.type === "agent_update") refresh();
          },
        });
      })
      .catch((error: unknown) => {
        if (!lifetime.signal.aborted) console.error("next-question: agent observation failed", error);
      });
    return () => {
      lifetime.abort();
      clearTimeout(timer);
      void release?.().catch(() => {});
    };
  }, [paseo, queryClient]);

  return count.data ?? null;
}

export function NextQuestionItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  const count = useWaitingCount();
  return (
    <SidebarRow
      icon="CircleAlert"
      label={count ? `Next question (${count})` : "Next question"}
      active={currentScreen?.screenId === JUMP_SCREEN_ID}
      onPress={() => openScreen({ screenId: JUMP_SCREEN_ID, params: { n: String(Date.now()) } })}
    />
  );
}
