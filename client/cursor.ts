import type { QueueKey } from "../shared/queue";

// Where the cycle stands, per host. Paseo does not tell a plugin which agent tab is focused,
// so "next" means next after the agent this plugin last opened. In memory only: a reload
// starts the cycle again from the longest-waiting agent.
const cursors = new Map<string, QueueKey>();

export function getCursor(hostId: string): QueueKey | null {
  return cursors.get(hostId) ?? null;
}

export function setCursor(hostId: string, key: QueueKey): void {
  cursors.set(hostId, key);
}
