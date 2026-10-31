import type { PluginClientContext } from "@getpaseo/plugin/client";
import type { QueueAgent } from "../shared/queue";

type PaseoApi = PluginClientContext["paseo"];

const PAGE_LIMIT = 200;

/** Every non-archived agent on the selected host, across all workspaces. */
export async function readAllAgents(paseo: PaseoApi, signal: AbortSignal): Promise<QueueAgent[]> {
  const agents: QueueAgent[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    if (signal.aborted) throw new Error("The agent list request was canceled.");
    const page = await paseo.agents.list({
      filter: { includeArchived: false },
      page: cursor ? { limit: PAGE_LIMIT, cursor } : { limit: PAGE_LIMIT },
      signal,
      timeout: 15_000,
    });
    for (const { agent } of page.entries) agents.push(agent);
    if (!page.pageInfo.hasMore) return agents;
    const next = page.pageInfo.nextCursor;
    if (!next || seenCursors.has(next)) throw new Error("The agent list could not finish paging.");
    seenCursors.add(next);
    cursor = next;
  }
}
