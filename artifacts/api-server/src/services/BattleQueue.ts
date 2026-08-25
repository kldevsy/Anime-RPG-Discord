import { runPlayerBattle } from "./BattleService";

export type BattleJobStatus = "queued" | "processing" | "completed" | "failed";

export interface BattleJob {
  id: string;
  discordId: string;
  stageId?: string;
  status: BattleJobStatus;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class BattleQueue {
  private queue: BattleJob[] = [];
  private jobsMap = new Map<string, BattleJob>();
  private activeWorkers = 0;
  private maxConcurrency = 5;

  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Enqueues a battle request to be computed asynchronously by worker pool.
   */
  public enqueue(discordId: string, stageId?: string): BattleJob {
    const job: BattleJob = {
      id: crypto.randomUUID(),
      discordId,
      stageId,
      status: "queued",
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.jobsMap.set(job.id, job);
    this.processQueue();
    return job;
  }

  /**
   * Retrieves status and result of a queued or completed battle job.
   */
  public getJob(jobId: string): BattleJob | undefined {
    return this.jobsMap.get(jobId);
  }

  /**
   * Processes queued battle jobs using active workers up to maxConcurrency.
   */
  private async processQueue(): Promise<void> {
    while (this.activeWorkers < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeWorkers += 1;
      job.status = "processing";
      job.startedAt = new Date();

      this.runWorker(job).finally(() => {
        this.activeWorkers -= 1;
        this.processQueue();
      });
    }
  }

  private async runWorker(job: BattleJob): Promise<void> {
    try {
      const result = await runPlayerBattle(job.discordId, job.stageId);
      job.status = "completed";
      job.result = result;
      job.completedAt = new Date();
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : "Battle execution failed";
      job.completedAt = new Date();
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveWorkerCount(): number {
    return this.activeWorkers;
  }

  public clear(): void {
    this.queue = [];
    this.jobsMap.clear();
    this.activeWorkers = 0;
  }
}

export const defaultBattleQueue = new BattleQueue();
