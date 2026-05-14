# Job Scheduler - LLD Interview Guide

## Problem Statement

Design a **Job Scheduler** that executes tasks at specified times. Support both one-shot delayed jobs and periodic (fixed-rate) recurring jobs. The scheduler should handle concurrent job execution via a thread pool and support graceful shutdown and cancellation.

---

## Requirements

### Functional Requirements
1. Schedule a one-shot job to run after a delay
2. Schedule a periodic job at a fixed rate (initial delay + repeating interval)
3. Execute jobs at their scheduled time using a worker thread pool
4. Cancel individual jobs
5. Graceful shutdown (finish current jobs, stop accepting new ones)

### Non-Functional Requirements
- Thread-safe (producer threads can schedule while scheduler runs)
- Efficient — don't busy-wait or poll aggressively
- Jobs execute in order of scheduled time (earliest first)
- Periodic jobs automatically re-schedule after each execution

---

## Architecture

```
┌──────────────────┐         ┌──────────────────────────┐
│ ScheduleJobProducer │────►│   PriorityBlockingQueue    │
└──────────────────┘         │   (sorted by runAt time)  │
                             └─────────────┬────────────┘
                                           │ take()
                                           ▼
                             ┌──────────────────────────┐
                             │   Scheduler Thread        │
                             │   (sleeps until runAt)    │
                             └─────────────┬────────────┘
                                           │ submit()
                                           ▼
                             ┌──────────────────────────┐
                             │   Worker Thread Pool      │
                             │   (ExecutorService)       │
                             └──────────────────────────┘
```

---

## Class Diagram

```
┌─────────────────────────────────────────┐
│           ScheduledJob                  │
├─────────────────────────────────────────┤
│ - task: Runnable                        │
│ - periodMs: long (0 = one-shot)         │
│ - runAt: long (epoch millis)            │
│ - cancelled: AtomicBoolean              │
├─────────────────────────────────────────┤
│ + getRunAt(): long                      │
│ + updateNextRun(): void                 │
│ + isPeriodic(): boolean                 │
│ + cancel(): void                        │
│ + isCancelled(): boolean                │
│ + compareTo(ScheduledJob): int          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           JobScheduler                  │
├─────────────────────────────────────────┤
│ - queue: PriorityBlockingQueue          │
│ - workerPool: ExecutorService           │
│ - schedulerThread: Thread               │
│ - shutdown: volatile boolean            │
├─────────────────────────────────────────┤
│ + scheduleJob(Runnable, delayMs)        │
│ + scheduleAtFixedRate(task, delay, period)│
│ + shutdown(): void                      │
│ - schedulerLoop(): void                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       ScheduleJobProducer               │
├─────────────────────────────────────────┤
│ - scheduler: JobScheduler               │
├─────────────────────────────────────────┤
│ + scheduleJob(job, delay): void         │
└─────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `PriorityBlockingQueue` | Auto-sorts by `runAt` time; thread-safe; blocking `take()` avoids busy-wait |
| `Comparable<ScheduledJob>` | Natural ordering by execution time for the priority queue |
| Dedicated scheduler thread | Single consumer simplifies timing logic; sleeps until next job |
| Worker thread pool | Decouple scheduling from execution; jobs run concurrently |
| `AtomicBoolean` for cancel | Lock-free cancellation from any thread |
| `volatile shutdown` | Visibility guarantee for the scheduler loop exit |
| `Thread.sleep(wait)` | Sleep until the next job's execution time |

---

## Scheduler Loop Logic

```
while (!shutdown || !queue.isEmpty()):
    job = queue.take()                    // blocks until a job is available
    wait = job.runAt - now
    if wait > 0: sleep(wait)             // wait until execution time
    if job.isCancelled(): continue       // skip cancelled jobs
    workerPool.submit(job.task)          // execute in worker thread
    if job.isPeriodic():
        job.updateNextRun()              // advance runAt by periodMs
        queue.offer(job)                 // re-enqueue for next execution
```

---

## Implementation

### ScheduledJob.java

```java
package JobSchedulerDemo;

import java.util.concurrent.atomic.AtomicBoolean;

public class ScheduledJob implements Comparable<ScheduledJob> {
    private final Runnable task;
    private final long periodMs;  // 0 means one-shot
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private long runAt;           // next execution timestamp

    public ScheduledJob(Runnable task, long delayMs, long periodMs) {
        this.task = task;
        this.periodMs = periodMs;
        this.runAt = System.currentTimeMillis() + delayMs;
    }

    public long getRunAt() { return runAt; }

    public void updateNextRun() { this.runAt += periodMs; }

    public boolean isPeriodic() { return periodMs > 0; }

    public void cancel() { cancelled.set(true); }

    public boolean isCancelled() { return cancelled.get(); }

    public Runnable getTask() { return task; }

    @Override
    public int compareTo(ScheduledJob other) {
        return Long.compare(this.runAt, other.runAt);
    }
}
```

### JobScheduler.java

```java
package JobSchedulerDemo;

import java.util.concurrent.*;

public class JobScheduler {
    private final PriorityBlockingQueue<ScheduledJob> queue = new PriorityBlockingQueue<>();
    private final ExecutorService workerPool;
    private final Thread schedulerThread;
    private volatile boolean shutdown = false;

    public JobScheduler(int workerThreads) {
        this.workerPool = Executors.newFixedThreadPool(workerThreads);
        this.schedulerThread = new Thread(() -> this.schedulerLoop(), "scheduler-thread");
        this.schedulerThread.start();
    }

    public ScheduledJob scheduleJob(Runnable task, int delayMs) {
        ScheduledJob job = new ScheduledJob(task, delayMs, 0);
        queue.offer(job);
        return job;
    }

    public ScheduledJob scheduleAtFixedRate(Runnable task, long initialDelayMs, long periodMs) {
        if (periodMs <= 0) throw new IllegalArgumentException("periodMs must be > 0");
        ScheduledJob job = new ScheduledJob(task, initialDelayMs, periodMs);
        queue.offer(job);
        return job;
    }

    private void schedulerLoop() {
        try {
            while (!shutdown || !queue.isEmpty()) {
                ScheduledJob job = queue.take();
                long now = System.currentTimeMillis();
                long wait = job.getRunAt() - now;

                if (wait > 0) {
                    Thread.sleep(wait);
                }

                if (job.isCancelled()) continue;

                workerPool.submit(() -> {
                    job.getTask().run();
                });

                if (!job.isCancelled() && job.isPeriodic()) {
                    job.updateNextRun();
                    queue.offer(job);
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            workerPool.shutdown();
        }
    }

    public void shutdown() {
        shutdown = true;
        schedulerThread.interrupt();
    }
}
```

### ScheduleJobProducer.java

```java
package JobSchedulerDemo;

public class ScheduleJobProducer {
    JobScheduler scheduler;

    public ScheduleJobProducer(JobScheduler scheduler) {
        this.scheduler = scheduler;
    }

    public void scheduleJob(int job, int delay) {
        scheduler.scheduleJob(() -> {
            System.out.println("Scheduling 1 shot job " + job + " with delay of " + delay);
        }, delay);
    }
}
```

### Demo / Driver

```java
public class JobSchedulerDemo {
    public static void main(String[] args) throws InterruptedException {
        JobScheduler jobScheduler = new JobScheduler(5);
        ScheduleJobProducer producer = new ScheduleJobProducer(jobScheduler);

        // One-shot jobs
        producer.scheduleJob(1, 5000);
        producer.scheduleJob(2, 1000);
        producer.scheduleJob(3, 3000);

        // Periodic jobs
        jobScheduler.scheduleAtFixedRate(() -> System.out.println("Scheduled job A"), 6000, 3000);
        jobScheduler.scheduleAtFixedRate(() -> System.out.println("Scheduled job B"), 4000, 2000);

        Thread.sleep(10000);
        jobScheduler.shutdown();
    }
}
```

---

## Interview Discussion Points

### Q: What's the problem with `Thread.sleep(wait)` in the scheduler?
**A:** If a new job arrives with an earlier `runAt` than the currently sleeping job, it won't be picked up until the sleep finishes. Fix: use `Condition.await(timeout)` or `LockSupport.parkNanos()` and signal on new job insertion.

### Q: How does `PriorityBlockingQueue` help?
**A:** It maintains jobs sorted by `runAt` (via `Comparable`). The scheduler always picks the earliest job. It's also thread-safe for concurrent producers adding jobs.

### Q: How would you handle missed executions for periodic jobs?
**A:** Options:
- **Fixed-rate**: Schedule based on ideal time (may "catch up" with rapid executions)
- **Fixed-delay**: Schedule next run relative to completion time (guaranteed gap)
- **Skip**: If behind, skip missed executions and schedule next future one

### Q: How would you extend this?
- **Cron expressions** — parse cron syntax for complex schedules
- **Job persistence** — survive restarts (store in DB/Redis)
- **Distributed scheduling** — leader election + shared job queue
- **Job dependencies** — combine with DAG executor
- **Retry with backoff** — on job failure
- **Job grouping** — cancel/pause a group of related jobs

### Q: How does `ScheduledThreadPoolExecutor` (JDK) differ?
**A:** JDK's implementation uses a `DelayedWorkQueue` (custom heap), signals the scheduler on new submissions, and handles fixed-rate vs fixed-delay properly. This implementation is a simplified version for understanding the core concepts.

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| scheduleJob() | O(log n) — heap insert | O(1) |
| take() from queue | O(log n) — heap extract | O(1) |
| cancel() | O(1) — atomic flag | O(1) |
| Overall space | — | O(n) where n = scheduled jobs |
