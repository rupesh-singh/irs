# Circuit Breaker - LLD Interview Guide

## Problem Statement

Design a **Circuit Breaker** pattern that protects a system from cascading failures when calling unreliable external services. The circuit breaker should automatically detect failures, stop sending requests to a failing service, and periodically check if the service has recovered.

---

## Requirements

### Functional Requirements
1. Execute supplier/callable through the circuit breaker
2. Track consecutive failures and trip the circuit when threshold is reached
3. Reject calls immediately when circuit is OPEN (fail-fast)
4. After a timeout, allow a trial call (HALF_OPEN state)
5. Close the circuit after sufficient consecutive successes in HALF_OPEN state
6. Re-open the circuit on any failure in HALF_OPEN state

### Non-Functional Requirements
- Thread-safe (concurrent access)
- Configurable thresholds (failure count, success count, timeout)
- Low overhead on the happy path

---

## State Machine

```
         failure >= threshold
  CLOSED ─────────────────────► OPEN
    ▲                             │
    │                             │ timeout elapsed
    │ success >= threshold        ▼
    └──────────────────────── HALF_OPEN
                                  │
                                  │ any failure
                                  └──────────► OPEN
```

---

## Class Diagram

```
┌───────────────────────────┐
│   CircuitBreakerConfig    │
├───────────────────────────┤
│ - openStateTimeoutMillis  │
│ - failureThreshold        │
│ - successThreshold        │
└───────────────────────────┘

┌───────────────────────────────┐
│   CircuitBreakerState (enum)  │
├───────────────────────────────┤
│ OPEN, CLOSED, HALF_OPEN       │
└───────────────────────────────┘

┌─────────────────────────────────────┐
│       CircuitBreaker<T>             │
├─────────────────────────────────────┤
│ - config: CircuitBreakerConfig      │
│ - state: CircuitBreakerState        │
│ - failureCount: AtomicInteger       │
│ - successCount: AtomicInteger       │
│ - lastFailureTime: AtomicLong       │
├─────────────────────────────────────┤
│ + execute(Supplier<T>): T           │
│ - recordFailure(): void             │
│ - recordSuccess(): void             │
│ - transitiontoOpen(): void          │
│ - transitiontoClose(): void         │
│ - transitiontoHalfOpen(): void      │
│ - canTransitionToHalfOpen(): bool   │
└─────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `volatile` state field | Ensures visibility across threads without full synchronization |
| `AtomicInteger` / `AtomicLong` | Lock-free thread-safe counters |
| Generic `Supplier<T>` | Flexible — wrap any remote call |
| Single failure trips HALF_OPEN → OPEN | Conservative approach to protect downstream |
| Reset counters on state transition | Clean slate for each state evaluation |

---

## Concurrency Model

- **State** is `volatile` → immediate visibility across threads
- **Counters** use `AtomicInteger` → lock-free CAS operations
- **Last failure time** uses `AtomicLong` → atomic read/write for timeout checks
- No explicit locks → minimal contention under high throughput

---

## Implementation

```java
package circuitbreakerdemo;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

enum CircuitBreakerState {
    OPEN,CLOSED,HALF_OPEN
}

class CircuitBreakerConfig {
    private final long openStateTimeoutMillis;
    private final int failureThreshold;
    private final int successThreshold;

    public CircuitBreakerConfig(int openStateTimeoutMillis, int failureThreshold, int successThreshold){
        this.openStateTimeoutMillis = openStateTimeoutMillis;
        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
    }

    public long getOpenStateTimeoutMillis() {
        return openStateTimeoutMillis;
    }

    public int getFailureThreshold() {
        return failureThreshold;
    }

    public int getSuccessThreshold() {
        return successThreshold;
    }
}

class CircuitBreaker<T> {
    private CircuitBreakerConfig config;

    private volatile CircuitBreakerState state = CircuitBreakerState.CLOSED;
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicLong lastFailureTime = new AtomicLong(0);

    public CircuitBreaker(CircuitBreakerConfig config){
        this.config = config;
    }

    public <T> T execute(Supplier<T> supplier){
        if(state == CircuitBreakerState.OPEN){
            if(!canTransitionToHalfOpen()){
                throw new RuntimeException("Circuit Open");
            }
        }

        try {
            T result = supplier.get();
            recordSuccess();
            return result;
        }
        catch (Exception e){
            recordFailure();
            throw e;
        }
    }

    private void recordFailure() {
        if(state == CircuitBreakerState.HALF_OPEN){
            transitiontoOpen();
            return;
        }
        int failure = failureCount.incrementAndGet();
        if(failure >= config.getFailureThreshold()){
            transitiontoOpen();
        }
    }

    private void transitiontoOpen() {
        state = CircuitBreakerState.OPEN;
        lastFailureTime.set(System.currentTimeMillis());
        failureCount.set(0);
        successCount.set(0);
    }

    private void recordSuccess() {
        if(state == CircuitBreakerState.HALF_OPEN){
            int success = successCount.incrementAndGet();
            if(success >= config.getSuccessThreshold()){
                transitiontoClose();
            }
            return;
        }
        // in closed state, set failure to zero
        failureCount.set(0);
    }

    private void transitiontoClose() {
        state = CircuitBreakerState.CLOSED;
        successCount.set(0);
        failureCount.set(0);
    }

    private boolean canTransitionToHalfOpen() {
        long currTimestamp = System.currentTimeMillis();
        long lastFailureTimestamp = lastFailureTime.get();
        if(currTimestamp - lastFailureTimestamp >= config.getOpenStateTimeoutMillis()){
            transitiontoHalfOpen();
            return true;
        }
        return false;
    }

    private void transitiontoHalfOpen() {
        state = CircuitBreakerState.HALF_OPEN;
        successCount.set(0);
    }
}
```

### Demo / Driver

```java
public class CircuitBreakerDemo {

    public static void main(String[] args){
        CircuitBreakerConfig config = new CircuitBreakerConfig(200, 2, 3);
        CircuitBreaker<String> cb = new CircuitBreaker<>(config);

        // 1. CLOSED -> OPEN: two failures should trip the breaker
        System.out.println("=== Test: CLOSED -> OPEN ===");
        for (int i = 0; i < 2; i++) {
            try {
                cb.execute(() -> { throw new RuntimeException("fail"); });
            } catch (RuntimeException e) {
                System.out.println("Caught: " + e.getMessage());
            }
        }

        // 2. OPEN: calls should be rejected immediately
        System.out.println("\n=== Test: OPEN rejects calls ===");
        try {
            cb.execute(() -> "should not run");
        } catch (RuntimeException e) {
            System.out.println("Rejected as expected: " + e.getMessage());
        }

        // 3. OPEN -> HALF_OPEN: wait for timeout, then a call is allowed
        try { Thread.sleep(200); } catch (InterruptedException ignored) {}

        // 4. HALF_OPEN -> OPEN: a single failure sends it back
        try {
            cb.execute(() -> { throw new RuntimeException("half-open fail"); });
        } catch (RuntimeException e) {
            System.out.println("Caught: " + e.getMessage());
        }

        // 5. HALF_OPEN -> CLOSED: wait, then succeed 3 times
        try { Thread.sleep(250); } catch (InterruptedException ignored) {}
        for (int i = 1; i <= 3; i++) {
            String res = cb.execute(() -> "ok");
            System.out.println("Success " + i + ": " + res);
        }

        System.out.println("\nAll tests passed!");
    }
}
```

---

## Interview Discussion Points

### Q: Why not use synchronized blocks?
**A:** `volatile` + `AtomicInteger` gives us lock-free thread safety for this use case. Synchronized would add unnecessary contention under high throughput.

### Q: What happens if two threads race in HALF_OPEN?
**A:** Both could execute — one failure will immediately trip to OPEN. This is acceptable because at worst we send one extra request. For stricter control, you could add a semaphore allowing only one trial request.

### Q: How would you extend this?
- **Sliding window** (time-based or count-based) instead of simple counter
- **Metrics/callbacks** for monitoring state transitions
- **Fallback** — return a cached/default value when circuit is OPEN
- **Per-exception filtering** — only count certain exceptions as failures

### Q: Real-world libraries?
- **Resilience4j** (Java) — production-grade circuit breaker
- **Hystrix** (Netflix, deprecated) — popularized the pattern
- **Polly** (.NET)

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| execute() | O(1) | O(1) |
| State transition | O(1) | O(1) |
| Overall space | — | O(1) per circuit breaker instance |
