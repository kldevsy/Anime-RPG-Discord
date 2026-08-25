import { describe, it, expect, beforeEach } from "vitest";
import { BattleQueue } from "../BattleQueue";
import { getOrCreateUser } from "../PhaseOneService";

describe("BattleQueue", () => {
  let queue: BattleQueue;

  beforeEach(() => {
    queue = new BattleQueue(2);
  });

  it("enqueues jobs and processes them asynchronously", async () => {
    const discordId = "discord-user-queue-1";
    await getOrCreateUser(discordId, "QueueUser");

    const job = queue.enqueue(discordId);
    expect(job.id).toBeDefined();
    expect(job.discordId).toBe(discordId);
    expect(["queued", "processing", "completed"]).includes(job.status);

    // Wait for async execution
    await new Promise((r) => setTimeout(r, 200));

    const retrieved = queue.getJob(job.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe("completed");
    expect(retrieved?.result).toBeDefined();
  });

  it("manages concurrency pool limits", () => {
    const job1 = queue.enqueue("user-1");
    const job2 = queue.enqueue("user-2");
    const job3 = queue.enqueue("user-3");

    expect(queue.getQueueLength()).toBeLessThanOrEqual(3);
    expect(queue.getActiveWorkerCount()).toBeLessThanOrEqual(2);
  });
});
