import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextAfter, queueKey, waitingQueue, type QueueAgent } from "./queue.ts";

function agent(id: string, over: Partial<QueueAgent> = {}): QueueAgent {
  return {
    id,
    workspaceId: "ws",
    attentionReason: "permission",
    attentionTimestamp: "2026-10-30T10:00:00Z",
    pendingPermissions: [{}],
    ...over,
  };
}

const ids = (list: readonly QueueAgent[]) => list.map((a) => a.id);

describe("waitingQueue", () => {
  it("keeps only agents with a pending permission, ordered longest waiting first", () => {
    const queue = waitingQueue([
      agent("late", { attentionTimestamp: "2026-10-30T12:00:00Z" }),
      agent("idle", { pendingPermissions: [], attentionReason: null }),
      agent("finished", { pendingPermissions: [], attentionReason: "finished" }),
      agent("early", { attentionTimestamp: "2026-10-30T09:00:00Z" }),
    ]);
    assert.deepEqual(ids(queue), ["early", "late"]);
  });

  it("counts permission attention without a pending list, as the daemon's own bucket does", () => {
    assert.deepEqual(ids(waitingQueue([agent("a", { pendingPermissions: undefined })])), ["a"]);
  });

  it("excludes archived agents and agents without a workspace", () => {
    const queue = waitingQueue([
      agent("archived", { archivedAt: "2026-10-30T00:00:00Z" }),
      agent("orphan", { workspaceId: null }),
      agent("ok"),
    ]);
    assert.deepEqual(ids(queue), ["ok"]);
  });

  it("sorts an agent with no timestamp after dated ones and breaks ties by id", () => {
    const queue = waitingQueue([
      agent("undated", { attentionTimestamp: null }),
      agent("b"),
      agent("a"),
    ]);
    assert.deepEqual(ids(queue), ["a", "b", "undated"]);
  });
});

describe("nextAfter", () => {
  const queue = waitingQueue([
    agent("a", { attentionTimestamp: "2026-10-30T09:00:00Z" }),
    agent("b", { attentionTimestamp: "2026-10-30T10:00:00Z" }),
    agent("c", { attentionTimestamp: "2026-10-30T11:00:00Z" }),
  ]);

  it("starts at the longest-waiting agent with no cursor", () => {
    assert.equal(nextAfter(queue, null)?.id, "a");
  });

  it("visits every waiting agent in order and wraps, while all stay waiting", () => {
    const visited: string[] = [];
    let cursor = null as ReturnType<typeof queueKey> | null;
    for (let i = 0; i < 4; i++) {
      const next = nextAfter(queue, cursor);
      assert.ok(next);
      visited.push(next.id);
      cursor = queueKey(next);
    }
    assert.deepEqual(visited, ["a", "b", "c", "a"]);
  });

  it("still advances when the agent last opened was answered and left the queue", () => {
    const afterB = queueKey(queue[1]!);
    const withoutB = queue.filter((a) => a.id !== "b");
    assert.equal(nextAfter(withoutB, afterB)?.id, "c");
  });

  it("returns the only waiting agent again rather than nothing", () => {
    const only = [queue[0]!];
    assert.equal(nextAfter(only, queueKey(only[0]!))?.id, "a");
  });

  it("returns null when nothing is waiting", () => {
    assert.equal(nextAfter([], queueKey(queue[0]!)), null);
  });
});
