# LLD: Task Scheduler / Job Scheduler

## 📋 Problem Statement
Design a Task Scheduler that can schedule, execute, and manage jobs with support for one-time execution, recurring schedules (cron), dependencies, and retry mechanisms.

---

## 🎯 Clarifying Questions to Ask

1. **Types of scheduling?** - One-time, recurring (cron), interval-based?
2. **Distributed or single node?** - Multiple workers across servers?
3. **Task dependencies?** - DAG-style task ordering?
4. **Persistence?** - Survive restarts?
5. **Retry policy?** - On failure handling?
6. **Priority support?** - Task prioritization?

---

## ✅ Requirements

### Functional
- Schedule one-time tasks for future execution
- Schedule recurring tasks with cron expressions
- Execute tasks with retry on failure
- Support task dependencies (run A after B completes)
- Cancel/pause/resume tasks
- Track task execution history

### Non-Functional
- High availability (no missed executions)
- Scalable to millions of tasks
- Exactly-once execution guarantee
- Low latency for due tasks

---

## 🏗️ Core Classes & Interfaces

```java
// ==================== ENUMS ====================
enum TaskStatus {
    SCHEDULED, RUNNING, COMPLETED, FAILED, CANCELLED, PAUSED
}

enum TaskType {
    ONE_TIME, RECURRING, DEPENDENT
}

enum RetryStrategy {
    NONE, FIXED_DELAY, EXPONENTIAL_BACKOFF
}

// ==================== ENTITIES ====================
class Task {
    String id;
    String name;
    TaskType type;
    TaskStatus status;
    String handlerClass;          // Class to execute
    Map<String, Object> payload;  // Task parameters
    
    // Scheduling
    LocalDateTime scheduledAt;
    String cronExpression;        // For recurring tasks
    
    // Execution tracking
    LocalDateTime lastRunAt;
    LocalDateTime nextRunAt;
    int executionCount;
    
    // Retry config
    RetryStrategy retryStrategy;
    int maxRetries;
    int retryCount;
    Duration retryDelay;
    
    // Dependencies
    List<String> dependsOn;       // Task IDs this depends on
    
    // Metadata
    int priority;
    LocalDateTime createdAt;
    String createdBy;
}

class TaskExecution {
    String id;
    String taskId;
    LocalDateTime startTime;
    LocalDateTime endTime;
    TaskStatus status;
    String result;
    String errorMessage;
    String workerNodeId;
}

// ==================== INTERFACES ====================
interface TaskHandler {
    TaskResult execute(TaskContext context);
    String getHandlerName();
}

class TaskContext {
    String taskId;
    Map<String, Object> payload;
    int attemptNumber;
}

class TaskResult {
    boolean success;
    String output;
    String errorMessage;
    boolean shouldRetry;
}

// ==================== HANDLER EXAMPLES ====================
class EmailReportTaskHandler implements TaskHandler {
    @Override
    public TaskResult execute(TaskContext context) {
        try {
            String reportType = (String) context.payload.get("reportType");
            String recipient = (String) context.payload.get("recipient");
            
            Report report = reportService.generate(reportType);
            emailService.send(recipient, report);
            
            return new TaskResult(true, "Report sent successfully", null, false);
        } catch (Exception e) {
            return new TaskResult(false, null, e.getMessage(), true);
        }
    }
    
    @Override
    public String getHandlerName() {
        return "EMAIL_REPORT";
    }
}

// ==================== CORE SCHEDULER ====================
class TaskScheduler {
    private final TaskRepository repository;
    private final TaskExecutor executor;
    private final Map<String, TaskHandler> handlers;
    private final DistributedLock distributedLock;
    private final PriorityBlockingQueue<Task> taskQueue;
    
    // Schedule a one-time task
    public String scheduleTask(TaskRequest request) {
        Task task = Task.builder()
            .id(UUID.randomUUID().toString())
            .name(request.name)
            .type(TaskType.ONE_TIME)
            .handlerClass(request.handlerClass)
            .payload(request.payload)
            .scheduledAt(request.scheduledAt)
            .nextRunAt(request.scheduledAt)
            .status(TaskStatus.SCHEDULED)
            .priority(request.priority)
            .retryStrategy(request.retryStrategy)
            .maxRetries(request.maxRetries)
            .build();
        
        repository.save(task);
        
        if (task.scheduledAt.isBefore(LocalDateTime.now().plusMinutes(5))) {
            taskQueue.offer(task);  // Add to in-memory queue for near-term execution
        }
        
        return task.id;
    }
    
    // Schedule a recurring task with cron
    public String scheduleRecurringTask(RecurringTaskRequest request) {
        Task task = Task.builder()
            .id(UUID.randomUUID().toString())
            .name(request.name)
            .type(TaskType.RECURRING)
            .handlerClass(request.handlerClass)
            .cronExpression(request.cronExpression)
            .nextRunAt(calculateNextRun(request.cronExpression))
            .status(TaskStatus.SCHEDULED)
            .build();
        
        repository.save(task);
        return task.id;
    }
    
    // Cancel a task
    public void cancelTask(String taskId) {
        Task task = repository.findById(taskId);
        if (task.status == TaskStatus.RUNNING) {
            throw new IllegalStateException("Cannot cancel running task");
        }
        task.status = TaskStatus.CANCELLED;
        repository.save(task);
    }
}

// ==================== TASK EXECUTOR ====================
class TaskExecutor {
    private final ExecutorService executorPool;
    private final TaskRepository repository;
    private final Map<String, TaskHandler> handlers;
    
    public void execute(Task task) {
        TaskExecution execution = new TaskExecution();
        execution.taskId = task.id;
        execution.startTime = LocalDateTime.now();
        execution.status = TaskStatus.RUNNING;
        
        task.status = TaskStatus.RUNNING;
        repository.save(task);
        
        executorPool.submit(() -> {
            try {
                TaskHandler handler = handlers.get(task.handlerClass);
                TaskContext context = new TaskContext(task.id, task.payload, task.retryCount + 1);
                
                TaskResult result = handler.execute(context);
                
                if (result.success) {
                    handleSuccess(task, execution, result);
                } else {
                    handleFailure(task, execution, result);
                }
            } catch (Exception e) {
                handleException(task, execution, e);
            }
        });
    }
    
    private void handleSuccess(Task task, TaskExecution execution, TaskResult result) {
        execution.status = TaskStatus.COMPLETED;
        execution.endTime = LocalDateTime.now();
        execution.result = result.output;
        
        task.status = TaskStatus.COMPLETED;
        task.lastRunAt = LocalDateTime.now();
        task.executionCount++;
        
        // For recurring tasks, schedule next run
        if (task.type == TaskType.RECURRING) {
            task.status = TaskStatus.SCHEDULED;
            task.nextRunAt = calculateNextRun(task.cronExpression);
        }
        
        repository.save(task);
        executionRepository.save(execution);
    }
    
    private void handleFailure(Task task, TaskExecution execution, TaskResult result) {
        if (result.shouldRetry && task.retryCount < task.maxRetries) {
            task.retryCount++;
            task.status = TaskStatus.SCHEDULED;
            task.nextRunAt = calculateRetryTime(task);
            repository.save(task);
        } else {
            task.status = TaskStatus.FAILED;
            execution.status = TaskStatus.FAILED;
            execution.errorMessage = result.errorMessage;
            repository.save(task);
            executionRepository.save(execution);
            
            // Alert on failure
            alertService.sendTaskFailureAlert(task);
        }
    }
    
    private LocalDateTime calculateRetryTime(Task task) {
        return switch (task.retryStrategy) {
            case FIXED_DELAY -> LocalDateTime.now().plus(task.retryDelay);
            case EXPONENTIAL_BACKOFF -> LocalDateTime.now().plusSeconds(
                (long) Math.pow(2, task.retryCount) * task.retryDelay.getSeconds()
            );
            default -> LocalDateTime.now();
        };
    }
}

// ==================== SCHEDULER DAEMON ====================
class SchedulerDaemon {
    private final TaskRepository repository;
    private final TaskExecutor executor;
    private final DistributedLock lock;
    private final String nodeId;
    
    @Scheduled(fixedRate = 1000)  // Every second
    public void pollAndExecute() {
        // In distributed setup, only one node should poll
        if (!lock.tryLock("scheduler-poll", Duration.ofSeconds(30))) {
            return;
        }
        
        try {
            List<Task> dueTasks = repository.findDueTasks(LocalDateTime.now(), 100);
            
            for (Task task : dueTasks) {
                // Check dependencies
                if (!areDependenciesMet(task)) {
                    continue;
                }
                
                // Acquire task lock to prevent double execution
                if (lock.tryLock("task-" + task.id, Duration.ofMinutes(30))) {
                    executor.execute(task);
                }
            }
        } finally {
            lock.unlock("scheduler-poll");
        }
    }
    
    private boolean areDependenciesMet(Task task) {
        if (task.dependsOn == null || task.dependsOn.isEmpty()) {
            return true;
        }
        
        for (String depTaskId : task.dependsOn) {
            Task depTask = repository.findById(depTaskId);
            if (depTask.status != TaskStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }
}

// ==================== CRON PARSER ====================
class CronParser {
    // Cron format: minute hour day-of-month month day-of-week
    // Example: "0 9 * * 1" = Every Monday at 9:00 AM
    
    public LocalDateTime getNextExecutionTime(String cronExpression) {
        CronExpression cron = CronExpression.parse(cronExpression);
        return cron.next(LocalDateTime.now());
    }
    
    public boolean isValid(String cronExpression) {
        try {
            CronExpression.parse(cronExpression);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

---

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Task Scheduler                                 │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ Schedule API │    │   Cancel/    │    │   Query/     │               │
│  │              │    │   Pause API  │    │   History    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Task Repository                                 │
│                    (MySQL/PostgreSQL + Redis)                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Scheduler      │    │  Scheduler      │    │  Scheduler      │
│  Daemon (Node1) │    │  Daemon (Node2) │    │  Daemon (Node3) │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌─────────────────┐      ┌─────────────────┐
         │  Distributed    │      │  Task Executor  │
         │  Lock (Redis)   │      │  Pool           │
         └─────────────────┘      └─────────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────┐
          ▼                                ▼                            ▼
┌──────────────────┐            ┌──────────────────┐         ┌──────────────────┐
│ EmailReportTask  │            │ DataSyncTask     │         │ CleanupTask      │
│ Handler          │            │ Handler          │         │ Handler          │
└──────────────────┘            └──────────────────┘         └──────────────────┘
```

---

## 🗄️ Database Schema

```sql
-- Tasks table
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    handler_class VARCHAR(255) NOT NULL,
    payload JSON,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    
    -- Scheduling
    scheduled_at TIMESTAMP,
    cron_expression VARCHAR(100),
    next_run_at TIMESTAMP,
    last_run_at TIMESTAMP,
    
    -- Retry config
    retry_strategy VARCHAR(20) DEFAULT 'NONE',
    max_retries INT DEFAULT 3,
    retry_count INT DEFAULT 0,
    retry_delay_seconds INT DEFAULT 60,
    
    -- Dependencies
    depends_on JSON,  -- Array of task IDs
    
    -- Metadata
    priority INT DEFAULT 5,
    execution_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    INDEX idx_status_next_run (status, next_run_at),
    INDEX idx_type (type)
);

-- Task Executions table
CREATE TABLE task_executions (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20),
    result TEXT,
    error_message TEXT,
    worker_node_id VARCHAR(100),
    
    INDEX idx_task_id (task_id),
    INDEX idx_start_time (start_time)
);

-- Task Locks table (for distributed locking)
CREATE TABLE task_locks (
    lock_key VARCHAR(255) PRIMARY KEY,
    node_id VARCHAR(100) NOT NULL,
    acquired_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

---

## ❓ Follow-up Questions & Answers

### Q1: How do you ensure exactly-once execution in a distributed environment?
**Answer:**
- Use **distributed locking** (Redis SETNX with TTL)
- Implement **idempotent task handlers**
- Use **optimistic locking** with version numbers in DB
- **Lease-based approach**: Node acquires lease, heartbeats to extend
```java
// Redis-based distributed lock
boolean acquired = redis.set("lock:task:" + taskId, nodeId, "NX", "EX", 300);
if (acquired) {
    try {
        executeTask(task);
    } finally {
        redis.del("lock:task:" + taskId);
    }
}
```

### Q2: How do you handle long-running tasks that exceed the lock timeout?
**Answer:**
- **Heartbeat mechanism**: Extend lock periodically
- **Task segmentation**: Break into smaller chunks
- **Async status tracking**: Update progress in DB
```java
class LongRunningTaskExecutor {
    ScheduledFuture<?> heartbeatFuture;
    
    void execute(Task task) {
        // Start heartbeat to extend lock
        heartbeatFuture = scheduler.scheduleAtFixedRate(
            () -> distributedLock.extend("task-" + task.id, Duration.ofMinutes(5)),
            1, 1, TimeUnit.MINUTES
        );
        
        try {
            handler.execute(task);
        } finally {
            heartbeatFuture.cancel(false);
        }
    }
}
```

### Q3: How would you implement task dependencies (DAG)?
**Answer:**
```java
class DAGTaskScheduler {
    private final Map<String, Set<String>> dependencyGraph;
    private final Map<String, AtomicInteger> inDegree;
    
    void onTaskComplete(String taskId) {
        // Find dependent tasks
        Set<String> dependents = reverseDependencyGraph.get(taskId);
        
        for (String dependentId : dependents) {
            int remaining = inDegree.get(dependentId).decrementAndGet();
            if (remaining == 0) {
                // All dependencies met, schedule for execution
                Task task = repository.findById(dependentId);
                executor.execute(task);
            }
        }
    }
    
    // Validate no cycles in DAG
    boolean validateNoCycles(Task task) {
        return !hasCycle(task.id, new HashSet<>(), new HashSet<>());
    }
}
```

### Q4: How do you handle scheduler node failures?
**Answer:**
- **Lock expiration**: Locks auto-expire if node dies
- **Orphan task detection**: Periodic scan for stuck tasks
- **Health checks**: Load balancer removes unhealthy nodes
```java
@Scheduled(fixedRate = 60000)
void recoverOrphanTasks() {
    // Find tasks marked as RUNNING but lock expired
    List<Task> orphans = repository.findByStatusAndLastUpdateBefore(
        TaskStatus.RUNNING, 
        LocalDateTime.now().minusMinutes(30)
    );
    
    for (Task task : orphans) {
        task.status = TaskStatus.SCHEDULED;
        task.nextRunAt = LocalDateTime.now();
        repository.save(task);
    }
}
```

### Q5: How would you implement priority-based scheduling?
**Answer:**
```java
class PriorityTaskScheduler {
    // Multiple queues by priority
    private final PriorityBlockingQueue<Task> taskQueue;
    
    // Custom comparator
    Comparator<Task> priorityComparator = Comparator
        .comparingInt(Task::getPriority).reversed()  // Higher priority first
        .thenComparing(Task::getNextRunAt);          // Earlier time wins tie
    
    // Dedicated thread pools per priority
    private final Map<Integer, ExecutorService> priorityPools;
    
    void submitTask(Task task) {
        ExecutorService pool = priorityPools.get(task.priority);
        pool.submit(() -> executor.execute(task));
    }
}
```

### Q6: How do you monitor scheduler health?
**Answer:**
- **Metrics**: Queue depth, execution latency, failure rate
- **Alerts**: Tasks overdue, high failure rate, node failures
- **Dashboard**: Real-time view of scheduled/running/failed tasks
- **Dead letter queue**: Failed tasks after max retries

---

## 💡 Key Interview Tips

1. **Clarify distributed vs single-node** - Changes design significantly
2. **Discuss failure handling** - Retry, dead letter queue
3. **Draw the polling loop** - Show scheduler daemon logic
4. **Mention exactly-once** - Distributed locking is key
5. **Salesforce context** - Mention Apex scheduled jobs, batch Apex

---

## 🔗 Related Concepts
- Cron job management
- Distributed locking
- Message queues (alternative approach)
- Workflow orchestration (Temporal, Airflow)
