# Concurrency Problems — Revision Guide
> Based on *The Little Book of Semaphores* (LBOS)  
> All implementations use `java.util.concurrent.Semaphore`

---

## Core Patterns (Building Blocks)

### 1. Mutex
```
mutex = Semaphore(1)
mutex.acquire()   // enter critical section
// ... critical section ...
mutex.release()   // exit critical section
```
**When**: Protect shared mutable state (counters, flags).

---

### 2. Multiplex
```
multiplex = Semaphore(N)   // allow N threads simultaneously
multiplex.acquire()
// ... at most N threads here ...
multiplex.release()
```
**When**: Limit concurrency (e.g., 5 seats, N database connections).

---

### 3. Barrier
```
barrier = Semaphore(0)
// Thread A does work, then:
barrier.release()        // signal: I'm done
// Thread B:
barrier.acquire()        // wait until A signals
```
**When**: Thread B must wait for Thread A to reach a point. Release N permits to wake N threads simultaneously.

---

### 4. Lightswitch
```
mutex.acquire()
count++
if count == 1:
    semaphore.acquire()     // first in → lock the resource
mutex.release()
// ... use resource (concurrent with same-type threads) ...
mutex.acquire()
count--
if count == 0:
    semaphore.release()     // last out → unlock the resource
mutex.release()
```
**When**: First thread of a group locks a resource; last one unlocks it. Group members run concurrently. Others (different group) are blocked.

**Key rule**: Each lightswitch needs its **own mutex**. Two lightswitches sharing the same mutex + semaphore → **deadlock**.

---

### 5. Turnstile (No-Starvation)
```
turnstile = Semaphore(1)

// Add to the START of each lightswitch:
turnstile.acquire()
turnstile.release()

// The "priority" thread holds turnstile while waiting:
turnstile.acquire()        // block new lightswitch entries
resource.acquire()         // wait for existing group to drain
// ... exclusive access ...
turnstile.release()
resource.release()
```
**When**: Prevent starvation. A waiting thread grabs the turnstile → new arrivals queue behind it → existing group drains → waiting thread proceeds.

**Subtlety for two lightswitches** (Unisex Bathroom): Don't release turnstile immediately. Hold it until `empty.acquire()` succeeds, THEN release. Otherwise new same-group threads slip past.

---

### 6. Captain / Trigger Pattern
```
mutex.acquire()
count++
if count == N:                    // I'm the Nth → captain!
    queue.release(N - 1)          // wake others (captain doesn't acquire)
    count -= N                    // decrement, don't reset to 0!
    mutex.release()
else:
    mutex.release()
    queue.acquire()               // wait until captain triggers
```
**When**: Batch N threads together. The Nth arrival (captain) triggers the group. Captain releases N-1 permits (not N — captain skips the queue acquire).

**Critical**: Use `-= N` not `= 0`. If 5 arrive but batch is 4, the 5th must be remembered.

---

### 7. Pass the Baton + "I'll Do It For You"
```
// EXIT (the signaling thread):
mutex.acquire()
eating--
if eating == 0 && waiting > 0:
    n = min(waiting, SEATS)
    waiting -= n                  // "I'll do it for you" — update on their behalf
    eating += n
    block.release(n)              // "pass the baton" — wake them
mutex.release()

// WOKEN THREAD:
block.acquire()
// state already correct — no mutex needed, no re-check!
// proceed directly to eating
```
**"I'll do it for you"**: The signaling thread updates shared state ON BEHALF of the threads it wakes. Woken threads don't need to re-acquire mutex or re-check conditions.

**"Pass the baton"**: Signal specific threads while holding mutex. State update is atomic with the signal — no race window.

**When**: The "who should proceed" decision is complex, and you want woken threads to skip all entry logic.

---

## Problem → Pattern Mapping

| # | Problem | Patterns Used | Key Insight |
|---|---------|--------------|-------------|
| 1 | Producer-Consumer | Semaphore(capacity) for spaces, Semaphore(0) for items, Mutex | `items` starts at 0 (nothing to consume), `spaces` starts at capacity |
| 2 | Reader-Writer | Lightswitch (readers on `roomEmpty`), Mutex | Readers piggyback — first locks writers out, last lets them in |
| 3 | Reader-Writer No-Starve | Lightswitch + Turnstile | Writer grabs turnstile → new readers queue behind it |
| 4 | FIFO Mutex | Personal semaphore per thread + shared queue | Each thread gets its own `Semaphore(0)` — strict FIFO ordering |
| 5 | Dining Philosophers | Footman = Multiplex(N-1) + Fork semaphores | Limit to N-1 diners prevents circular wait → no deadlock |
| 6 | Cigarette Smokers | Pusher threads + boolean flags + agent/smoker semaphores | Pushers translate "ingredient available" → "smoker X can go" |
| 7 | Barber Shop | Captain pattern + rendezvous semaphores | Customer-barber rendezvous: both must sync at haircut start and end |
| 8 | Building H2O | Semaphore(2) for H, Semaphore(1) for O, Barrier | Permits = slots. 3rd thread refills permits + releases barrier |
| 9 | River Crossing | Captain + two queues (hackers/serfs) | Captain checks `>=2 && >=2` for mixed, `==4` for same-type. Release N-1 |
| 10 | Roller Coaster | Car thread loop + boardQueue + allBoarded + rideOver + allExited | 4 sync points: load → ride → unload → repeat. Car controls the cycle |
| 11 | Search-Insert-Delete | Two lightswitches (separate mutexes!) + insertLock | Searchers & inserters lightswitch on separate semaphores. Deleter acquires both |
| 12 | Unisex Bathroom | Two lightswitches on same `empty` semaphore | Both genders concurrent within group, mutually exclusive across groups |
| 13 | Sushi Bar | Pass the baton + "I'll do it for you" + Barrier (allDone) | All 5 leave together (barrier), last eater seats waiters on their behalf |

---

## Common Bugs & Pitfalls

### 1. Queue acquire INSIDE mutex → Deadlock
```
❌  mutex.acquire()
    queue.acquire()     // blocks forever while holding mutex!
```
```
✅  mutex.release()     // release first
    queue.acquire()     // THEN block
```

### 2. Two lightswitches sharing same mutex → Deadlock
```
❌  Searcher: mutex.acquire() → searchers++ → deleteSem.acquire() BLOCKS
    Inserter: mutex.acquire() → BLOCKS (searcher holds it)
    Searcher wants mutex to release deleteSem → circular wait!
```
```
✅  Each lightswitch gets its own mutex:
    searchMutex for searchers count
    insertMutex for inserters count
```

### 3. Captain releases N permits instead of N-1
```
❌  hackers.release(4)  // 4th permit leaks — no consumer for it
```
```
✅  hackers.release(3)  // captain is already past the queue acquire
```

### 4. Counter reset to 0 instead of decrement
```
❌  hackersCount = 0    // loses leftover threads: 5 arrive, 4 depart, 5th forgotten
```
```
✅  hackersCount -= 4   // 5 - 4 = 1 correctly remembered
```

### 5. Missing cleanup on early return
```
❌  if (already exists) {
        insertLock.release();
        return -1;          // inserters count never decremented!
    }
```
```
✅  if (already exists) {
        inserters--;
        if (inserters == 0) noInserter.release();
        insertLock.release();
        return -1;
    }
```

### 6. Circular wait with cross-locking
```
❌  Women: womenQueue.acquire() → menQueue.acquire() BLOCKS
    Men:   menQueue.acquire()   → womenQueue.acquire() BLOCKS
```
```
✅  Both lightswitch on ONE shared semaphore (empty). No cross-locking.
```

### 7. Random thread distribution → stuck threads
```
❌  Random().nextBoolean() → might get 7H + 3S → last H+S can't form group of 4
```
```
✅  Guarantee groupable numbers: 8H + 8S, or 4H + 4S
```

---

## Pattern Decision Tree

```
Need mutual exclusion?
  → Mutex (Semaphore(1))

Need to limit concurrency to N?
  → Multiplex (Semaphore(N))

Need "wait for another thread"?
  → Barrier (Semaphore(0), release to signal)

Need "group shares a resource, others excluded"?
  → Lightswitch (first in locks, last out unlocks)

  Worried about starvation?
    → Add Turnstile

Need "batch N threads together"?
  → Captain pattern (Nth arrival triggers, releases N-1)

  Need all N to finish before next batch?
    → Add Barrier (allDone)

Need "signaler updates state for woken threads"?
  → Pass the baton + "I'll do it for you"

Need strict FIFO ordering?
  → Personal semaphore per thread + queue

Need state-dependent behavior with many conditions?
  → State machine (enum under mutex)
```

---

## Quick Reference: Semaphore Cheat Sheet

| Semaphore(N) | Meaning |
|-------------|---------|
| `Semaphore(0)` | Starts blocked — used as signal/barrier/queue |
| `Semaphore(1)` | Binary — mutex, turnstile, or toggle |
| `Semaphore(N)` | Multiplex — N concurrent accessors |
| `Semaphore(N, true)` | Fair mode — FIFO wakeup (JVM level, not strict) |

| Operation | Effect |
|-----------|--------|
| `acquire()` | Decrement. If 0, block. |
| `release()` | Increment. Wake one blocked thread. |
| `release(N)` | Increment by N. Wake up to N threads. |

---

## File Index

| File | Problem |
|------|---------|
| `ProducerConsumerDemo.java` | Producer-Consumer with BlockingQueue + ThreadPool |
| `ProducerConsumerSemaphore.java` | Producer-Consumer with Semaphores |
| `ReaderWriterSemaphoreDemo.java` | Reader-Writer (reader preference) |
| `ReaderWriterNoStarveDemo.java` | Reader-Writer (no starvation, turnstile) |
| `FifoMutexDemo.java` | Strict FIFO Mutex with personal semaphores |
| `DiningPhilosophersDemo.java` | Dining Philosophers (footman solution) |
| `CigaretteSmokerDemo.java` | Cigarette Smokers (pusher pattern) |
| `BarberShopSemaphoreDemo.java` | Barber Shop |
| `BuildingH2ODemo.java` | Building H2O (permits-as-slots) |
| `Boat.java` | River Crossing (Hackers & Serfs) |
| `RollerCoasterProblem.java` | Roller Coaster (1 car, load/ride/unload) |
| `SearchInsertDeleteProblem.java` | Search-Insert-Delete (two lightswitches) |
| `UnisexBathroomProblem.java` | Unisex Bathroom (two lightswitches, one resource) |
| `SushiBarProblem.java` | Sushi Bar (pass the baton + barrier) |
