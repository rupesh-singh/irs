# 🧵 Concurrency for LLD — Interview Cheatsheet

> **Compiled & expanded from personal handwritten notes.**
> In **Low-Level Design** interviews, the interviewer rarely says "make it thread-safe" — they **drop a trigger phrase** ("this class is used by multiple threads", "two users update the same order", "what if the user retries?"). This cheatsheet maps each **trigger → solution → Java code** so you can react instantly.

---

## 📑 Table of Contents
1. [Thread Safety in Shared Mutable State](#1-thread-safety-in-shared-mutable-state)
2. [Avoiding Race Conditions](#2-avoiding-race-conditions)
3. [High Throughput with Queues](#3-high-throughput-with-queues)
4. [Deadlock Prevention](#4-deadlock-prevention)
5. [Singleton + Thread Safe](#5-singleton--thread-safe)
6. [Executors for Parallel Work](#6-executors-for-parallel-work)
7. [Read–Write Operations](#7-readwrite-operations)
8. [Concurrency in Distributed LLD](#8-concurrency-in-distributed-lld)
9. [Idempotency](#9-idempotency)
10. [Thread-Safe Factories](#10-thread-safe-factories)
11. [Trigger → Solution Quick Map](#11-trigger--solution-quick-map)

---

## 1. Thread Safety in Shared Mutable State

> 🎯 **Triggers:** "this **class will be used by multiple threads**" · "users might **send messages concurrently**".

**Solutions (in order of preference):**

### 1. Make the object immutable
No shared mutable state = no race. Safest option when possible.
```java
public final class Money {
    private final long cents;          // final fields
    public Money(long cents) { this.cents = cents; }
    public Money add(Money o) {         // returns NEW object
        return new Money(this.cents + o.cents);
    }
}
```

### 2. Use synchronization blocks
Guard the critical section with a lock/monitor.
```java
private final Object lock = new Object();
private int count;
public void increment() {
    synchronized (lock) {   // only one thread at a time
        count++;
    }
}
```

### 3. Use thread-safe data structures
| Structure | Use for |
|-----------|---------|
| **`ConcurrentHashMap`** | Concurrent key-value access without locking the whole map |
| **`CopyOnWriteArrayList`** | Read-heavy lists, rare writes (listeners, subscribers) |
| **`BlockingQueue`** | Producer-consumer hand-off (bounded buffering) |
| **`AtomicInteger` / `AtomicLong`** | Lock-free counters / IDs |

```java
ConcurrentHashMap<String, User> users = new ConcurrentHashMap<>();
BlockingQueue<Task> queue = new LinkedBlockingQueue<>();
AtomicInteger seq = new AtomicInteger();
int id = seq.incrementAndGet();   // atomic, no lock
```

> 🔑 **Order of preference:** *immutable* → *concurrent DS* → *atomics* → *explicit locks/synchronized* (locks are the heaviest hammer).

---

## 2. Avoiding Race Conditions

> 🎯 **Trigger:** "**two users might update the same order**" (lost update problem).

**Solutions:**

### 1. Lock or atomic operation
```java
private final ReentrantLock lock = new ReentrantLock();
public void updateOrder(Order o) {
    lock.lock();
    try { /* read-modify-write safely */ }
    finally { lock.unlock(); }
}
```

### 2. CAS (Compare-And-Swap) operation
Lock-free: only update if the value hasn't changed since you read it.
```java
AtomicReference<OrderState> state = new AtomicReference<>(OPEN);
// only moves OPEN -> SHIPPED if still OPEN, else returns false
boolean ok = state.compareAndSet(OPEN, SHIPPED);
```

> 💡 **CAS = optimistic concurrency** at the object level: read → compute → swap-if-unchanged → retry on failure. Great when conflicts are **rare**.

---

## 3. High Throughput with Queues

> 🎯 **Trigger:** need to **absorb bursts / decouple fast producers from slow consumers**.

**Solution: Producer → Queue → Consumer pattern.**
```java
BlockingQueue<Job> queue = new LinkedBlockingQueue<>(1000);

// Producer: hand off work and move on
queue.put(job);                 // blocks if full (backpressure)

// Consumer worker(s): drain at their own pace
while (true) {
    Job job = queue.take();     // blocks if empty
    process(job);
}
```
- The **bounded queue** gives **backpressure** (producers slow down when full) and smooths spikes.

> 📌 **Examples:** **Job Scheduler**, **Notification Dispatcher** — accept requests fast, process asynchronously via worker pool.

---

## 4. Deadlock Prevention

> 🎯 **Trigger:** "**two handlers accessing shared data**" (each holding a lock the other needs).

**Solutions:**

### 1. Acquire locks in the same global order
The classic fix for the dining-philosophers deadlock.
```java
// Always lock the lower id first → no circular wait
Account first  = a.id < b.id ? a : b;
Account second = a.id < b.id ? b : a;
synchronized (first)  {
    synchronized (second) { transfer(a, b); }
}
```

### 2. Lock with timeout
Don't wait forever — back off and retry.
```java
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try { /* work */ } finally { lock.unlock(); }
} else {
    // couldn't get it → abort / retry, avoids deadlock
}
```

### 3. Reduce locks / use atomics
Fewer locks = fewer chances to deadlock. Replace lock+counter with `AtomicInteger`.

> 🧠 **Four Coffman conditions for deadlock:** mutual exclusion, hold-and-wait, no-preemption, circular-wait. Break **any one** (ordering breaks circular-wait; timeouts break hold-and-wait).

---

## 5. Singleton + Thread Safe

> 🎯 **Trigger:** "make this **service a singleton** and **thread-safe**" (config, cache, registry).

**Solution: Enum singleton — thread-safe by the JVM** (handles lazy init + serialization + reflection safety for free).
```java
public enum ConfigService {
    INSTANCE;
    public String get(String key) { /* ... */ }
}
// usage: ConfigService.INSTANCE.get("timeout");
```

**Alternative: double-checked locking** (if you can't use enum):
```java
private static volatile ConfigService instance;
public static ConfigService getInstance() {
    if (instance == null) {                 // 1st check (no lock)
        synchronized (ConfigService.class) {
            if (instance == null)           // 2nd check (locked)
                instance = new ConfigService();
        }
    }
    return instance;
}
```

> 🔑 **`volatile` is mandatory** in double-checked locking to prevent returning a half-constructed object. **Enum is simpler — prefer it.**

---

## 6. Executors for Parallel Work

> 🎯 **Trigger:** "**run these tasks in parallel**" / fan out independent work.

**Solution: use an `ExecutorService`** (never manage raw threads in LLD).
```java
ExecutorService pool = Executors.newFixedThreadPool(8);

List<Future<Result>> futures = new ArrayList<>();
for (Task t : tasks) {
    futures.add(pool.submit(() -> process(t)));   // returns Future
}
for (Future<Result> f : futures) {
    Result r = f.get();    // gather results
}
pool.shutdown();
```

> 💡 Use a **bounded** pool (don't let threads explode). For aggregating results prefer `invokeAll` or `CompletableFuture`. Always `shutdown()`.

---

## 7. Read–Write Operations

> 🎯 **Trigger:** "**many readers, few writers**" (cache, config, in-memory store).

**Solution: `ReentrantReadWriteLock`** — many readers concurrently, writer exclusive.
```java
private final ReadWriteLock rw = new ReentrantReadWriteLock();

public V read(K key) {
    rw.readLock().lock();           // shared — many readers in parallel
    try { return map.get(key); }
    finally { rw.readLock().unlock(); }
}
public void write(K key, V val) {
    rw.writeLock().lock();          // exclusive — blocks all readers/writers
    try { map.put(key, val); }
    finally { rw.writeLock().unlock(); }
}
```

> 🔑 Big win when reads **vastly** outnumber writes. For extreme read-heavy cases consider `StampedLock` (optimistic reads) or `CopyOnWriteArrayList`.

---

## 8. Concurrency in Distributed LLD

> 🎯 **Trigger:** the shared state lives **across processes/servers**, not just threads in one JVM. In-JVM locks no longer work.

**Solutions:**

1. **DB row-level lock** — `SELECT ... FOR UPDATE` to lock a row during a transaction (pessimistic).
2. **Redis distributed lock** — `SET key val NX PX <ttl>` (Redlock) for cross-node mutual exclusion.
3. **Message queue** — serialize conflicting operations through a single partition/consumer (no shared lock needed — ordering does the job).

```sql
-- DB row lock (pessimistic)
BEGIN;
SELECT * FROM orders WHERE id = 42 FOR UPDATE;  -- locks the row
UPDATE orders SET status = 'SHIPPED' WHERE id = 42;
COMMIT;
```
```java
// Redis distributed lock (acquire with TTL so it auto-releases on crash)
boolean locked = redis.set("lock:order:42", token, "NX", "PX", 5000);
```

> ⚠️ **Always set a TTL** on distributed locks so a crashed holder doesn't deadlock the system. Prefer **message-queue serialization** when you can — it avoids locks entirely.

---

## 9. Idempotency

> 🎯 **Triggers:** "what if the **user retries**?" · "what if **two threads call it twice**?" (double-charge, duplicate order).

**Solution: dedupe by request ID** — store processed request IDs and short-circuit repeats.
```java
private final ConcurrentHashMap<String, Result> seen = new ConcurrentHashMap<>();

public Result handle(String requestId, Request req) {
    // computeIfAbsent runs the work ONLY once per requestId, atomically
    return seen.computeIfAbsent(requestId, id -> process(req));
}
```
- Client sends a unique **idempotency key**; server processes **once**, returns the **same result** on retries.
- In distributed systems, back this with a **DB unique constraint** or **Redis `SETNX`** instead of an in-memory map.

> 🔑 **Idempotency = "processing the same request N times == processing it once."** Essential for payments, order creation, any at-least-once delivery.

---

## 10. Thread-Safe Factories

> 🎯 **Trigger:** a **factory** that creates objects by type and is shared across threads.

**Solution: Registry pattern** — register creators in a `ConcurrentHashMap` once, look them up concurrently.
```java
public class ShapeFactory {
    private static final Map<String, Supplier<Shape>> registry =
        new ConcurrentHashMap<>();

    public static void register(String type, Supplier<Shape> creator) {
        registry.put(type, creator);
    }
    public static Shape create(String type) {
        Supplier<Shape> s = registry.get(type);
        if (s == null) throw new IllegalArgumentException(type);
        return s.get();
    }
}
// register("circle", Circle::new);  →  ShapeFactory.create("circle");
```

> 💡 The **registry map is read-mostly** → `ConcurrentHashMap` gives safe concurrent lookups without a giant `switch` and without locking.

---

## 11. Trigger → Solution Quick Map

> Skim this right before the interview — match the interviewer's phrase to the tool:

| Interviewer says… | Reach for… | § |
|-------------------|------------|---|
| "used by **multiple threads**" / "concurrent messages" | immutable → concurrent DS → atomics → `synchronized` | §1 |
| "**two users update the same** order" | lock / **CAS** (optimistic) | §2 |
| "**high throughput** / handle bursts" | **producer–queue–consumer** (`BlockingQueue`) | §3 |
| "two handlers, **shared data**" (hang risk) | lock **ordering**, `tryLock` **timeout**, fewer locks | §4 |
| "**singleton** service, thread-safe" | **enum singleton** / double-checked `volatile` | §5 |
| "do this work **in parallel**" | `ExecutorService` (bounded pool) | §6 |
| "**many reads, few writes**" | `ReentrantReadWriteLock` | §7 |
| "concurrent across **servers/processes**" | DB row lock / **Redis lock (TTL)** / queue | §8 |
| "what if the user **retries**?" | **idempotency key** + dedupe map/DB | §9 |
| "thread-safe **factory**" | **registry** + `ConcurrentHashMap` | §10 |

> 🎯 **Interview habit:** name the **trigger** you detected, state the **solution**, then mention the **trade-off** (lock contention vs lock-free retries, simplicity vs throughput). That's what separates a senior answer.

---

_Pair this with the deeper multithreading problems in the multithreading section, and [Concurrency_Problems.md](Concurrency_Problems.md) / [Semaphore.md](Semaphore.md)._ 🚀
