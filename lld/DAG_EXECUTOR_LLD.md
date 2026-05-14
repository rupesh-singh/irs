# DAG Task Executor - LLD Interview Guide

## Problem Statement

Design a **DAG-based Task Executor** that runs tasks respecting dependency order. Tasks with no dependencies execute in parallel; a task only starts when all its predecessors have completed. Support concurrent execution with a thread pool.

---

## Requirements

### Functional Requirements
1. Define tasks with dependencies (directed acyclic graph)
2. Execute tasks in topological order
3. Run independent tasks in parallel
4. Share execution results between tasks via a context
5. Support timeout for overall execution

### Non-Functional Requirements
- Thread-safe execution context
- Parallel execution of independent nodes
- No busy-waiting (use proper synchronization)
- Handle arbitrary DAG structures

---

## DAG Execution Flow

```
    A
   / \
  B   C
   \ /
    D

Execution order:
  - A runs first (no dependencies)
  - B and C run in parallel (both depend only on A)
  - D runs after both B and C complete
```

---

## Class Diagram

```
┌─────────────────────────────────────┐
│       ExecutionContext               │
├─────────────────────────────────────┤
│ - results: ConcurrentHashMap        │
├─────────────────────────────────────┤
│ + put(taskId, result): void         │
│ + get(taskId): Object               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Task (interface)              │
├─────────────────────────────────────┤
│ + getId(): String                   │
│ + execute(ExecutionContext): Object  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          DAGNode                    │
├─────────────────────────────────────┤
│ - task: Task                        │
│ - dependents: List<DAGNode>         │
│ - inDegree: int                     │
├─────────────────────────────────────┤
│ + addDependent(DAGNode): void       │
│ + incrementInDegree(): void         │
│ + decrementInDegree(): int          │
│ + getInDegree(): int                │
│ + getDependents(): List<DAGNode>    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         DAGExecutor                 │
├─────────────────────────────────────┤
│ - executor: ExecutorService         │
├─────────────────────────────────────┤
│ + execute(nodes, timeout): void     │
│ - schedule(node, ctx, latch): void  │
└─────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| In-degree tracking | Classic topological sort approach — nodes with in-degree 0 are ready |
| `ConcurrentHashMap` for results | Thread-safe result sharing between parallel tasks |
| `CountDownLatch` for completion | Simple mechanism to wait for all tasks to finish |
| `ExecutorService` thread pool | Bounded parallelism, efficient thread reuse |
| `synchronized` on in-degree ops | Prevent race when multiple parents complete simultaneously |
| Cascading schedule on decrement | When in-degree reaches 0, submit task immediately — push-based execution |

---

## Algorithm: Kahn's BFS (Parallel)

1. Find all nodes with `inDegree == 0` → add to ready queue
2. Submit ready nodes to thread pool
3. When a task completes:
   - Store result in `ExecutionContext`
   - Decrement in-degree of all dependents
   - If any dependent's in-degree reaches 0 → submit it
4. Wait until `CountDownLatch` reaches 0 (all tasks done)

---

## Implementation

```java
package DAGdemo;

import java.util.*;
import java.util.concurrent.*;

class ExecutionContext {
    private final ConcurrentHashMap<String, Object> results = new ConcurrentHashMap<>();

    public void put(String taskId, Object result) {
        results.put(taskId, result);
    }

    public Object get(String taskId) {
        return results.get(taskId);
    }
}

interface Task {
    String getId();
    Object execute(ExecutionContext context) throws Exception;
}

class DAGNode {
    private final Task task;
    private final List<DAGNode> dependents = new ArrayList<>();
    private int inDegree = 0;

    public DAGNode(Task task) {
        this.task = task;
    }

    public Task getTask() { return task; }
    public List<DAGNode> getDependents() { return dependents; }

    public void addDependent(DAGNode node) {
        dependents.add(node);
        node.incrementInDegree();
    }

    public synchronized void incrementInDegree() { inDegree++; }
    public synchronized int decrementInDegree() { return --inDegree; }
    public synchronized int getInDegree() { return inDegree; }
}

class DAGExecutor {
    private final ExecutorService executor;

    public DAGExecutor(int threads) {
        this.executor = Executors.newFixedThreadPool(threads);
    }

    public void execute(Set<DAGNode> nodes, long timeoutMillis) throws InterruptedException {
        ExecutionContext context = new ExecutionContext();
        CountDownLatch latch = new CountDownLatch(nodes.size());
        ConcurrentLinkedQueue<DAGNode> readyQueue = new ConcurrentLinkedQueue<>();

        // Initialize ready nodes (in-degree == 0)
        for (DAGNode node : nodes) {
            if (node.getInDegree() == 0) {
                readyQueue.add(node);
            }
        }

        for (DAGNode node : readyQueue) {
            schedule(node, context, latch);
        }

        latch.await(timeoutMillis, TimeUnit.MILLISECONDS);
        executor.shutdown();
    }

    private void schedule(DAGNode node, ExecutionContext context, CountDownLatch latch) {
        executor.submit(() -> {
            try {
                Object result = node.getTask().execute(context);
                context.put(node.getTask().getId(), result);
            } catch (Exception e) {
                e.printStackTrace();
            }

            // Cascade: unlock dependents
            for (DAGNode dependent : node.getDependents()) {
                if (dependent.decrementInDegree() == 0) {
                    schedule(dependent, context, latch);
                }
            }

            latch.countDown();
        });
    }
}
```

### Demo / Driver

```java
class SampleTask implements Task {
    private final String id;

    public SampleTask(String id) { this.id = id; }

    @Override
    public String getId() { return id; }

    @Override
    public Object execute(ExecutionContext context) {
        System.out.println("Executing " + id);
        return id + "_result";
    }
}

public class DAGLLDDemo {
    public static void main(String[] args) throws Exception {
        DAGNode A = new DAGNode(new SampleTask("A"));
        DAGNode B = new DAGNode(new SampleTask("B"));
        DAGNode C = new DAGNode(new SampleTask("C"));
        DAGNode D = new DAGNode(new SampleTask("D"));

        //    A
        //   / \
        //  B   C
        //   \ /
        //    D
        A.addDependent(B);
        A.addDependent(C);
        B.addDependent(D);
        C.addDependent(D);

        Set<DAGNode> nodes = Set.of(A, B, C, D);

        DAGExecutor executor = new DAGExecutor(4);
        executor.execute(nodes, 5000);
    }
}
```

---

## Interview Discussion Points

### Q: How do you detect cycles?
**A:** Before execution, run a topological sort (DFS/BFS). If you can't visit all nodes, a cycle exists. In this implementation, cyclic nodes would never reach in-degree 0, so they'd never execute (latch would timeout).

### Q: What if a task fails?
**A:** Current implementation logs the error and continues. Extensions:
- **Fail-fast** — cancel all tasks on first failure
- **Retry** — retry failed tasks N times
- **Skip dependents** — mark downstream tasks as skipped

### Q: Why `synchronized` on in-degree instead of `AtomicInteger`?
**A:** Either works. `synchronized` makes it explicit. `AtomicInteger.decrementAndGet()` would also be correct and slightly more performant.

### Q: How would you extend this?
- **Cycle detection** at graph construction time
- **Priority-based scheduling** within the same topological level
- **Task cancellation** and propagation
- **Retry policies** per task
- **Visualization** — DOT/Mermaid output of the DAG
- **Dynamic DAG** — add/remove nodes at runtime

### Q: Real-world examples?
- **Apache Airflow** — workflow orchestration (DAG-based)
- **Gradle/Maven** — build dependency graphs
- **Spark** — RDD lineage DAG
- **CI/CD pipelines** — job dependency graphs

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Build graph | O(V + E) | O(V + E) |
| Execute all tasks | O(V + E) with parallelism | O(V) for context |
| schedule() per node | O(dependents) | O(1) |

Where V = number of tasks, E = number of dependency edges.
