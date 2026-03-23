# 🧠 Concurrency / Multithreading Cheat Sheet

This document summarizes key multithreading problems, patterns, pitfalls, and reusable templates.

---

# 🔥 1. Core Concepts

## 1.1 Semaphore (Counting)

* Controls **how many threads can proceed**
* `acquire()` → blocks if no permits
* `release(n)` → adds permits

### Example

```java
Semaphore sem = new Semaphore(2);
sem.acquire();
sem.release();
```

---

## 1.2 CyclicBarrier

* Waits for **N threads**
* Releases all together
* Resets automatically

```java
CyclicBarrier barrier = new CyclicBarrier(3);
barrier.await();
```

---

## 1.3 ReentrantLock

* Explicit locking
* Can be fair/unfair

```java
ReentrantLock lock = new ReentrantLock(true);
lock.lock();
try {
   // critical section
} finally {
   lock.unlock();
}
```

---

## 🚨 Golden Rules

* ❌ Never block (`acquire`, `await`) inside `synchronized`
* ✅ Separate **coordination** and **execution**
* ✅ Always release locks in `finally`

---

# 🚗 2. Democrats vs Republicans (Uber Problem)

## Goal

Group of 4:

* 4D OR 4R OR 2D + 2R

## Key Pattern

* Counters + Semaphores + Barrier
* Leader thread triggers release

## Code

```java
class RideSharing {

    int d = 0, r = 0;
    Semaphore dQ = new Semaphore(0);
    Semaphore rQ = new Semaphore(0);
    CyclicBarrier barrier = new CyclicBarrier(4);
    Object lock = new Object();

    public void seatDemocrat(Runnable seat) throws Exception {
        boolean leader = false;
        synchronized(lock) {
            d++;
            if(d == 4) {
                dQ.release(4);
                d -= 4;
                leader = true;
            } else if(d >= 2 && r >= 2) {
                dQ.release(2);
                rQ.release(2);
                d -= 2; r -= 2;
                leader = true;
            }
        }

        dQ.acquire();
        seat.run();
        barrier.await();

        if(leader) drive();
    }

    void drive() {}
}
```

---

# 🍽️ 3. Dining Philosophers

## Problem

* 5 philosophers, 5 forks
* Need 2 forks

## ❌ Problem: Deadlock

All pick left → stuck

---

## ✅ Solution: Resource Ordering

### Idea

Always pick smaller fork first

```java
class DiningPhilosophers {

    ReentrantLock[] forks = new ReentrantLock[5];

    public DiningPhilosophers() {
        for(int i=0;i<5;i++) forks[i] = new ReentrantLock();
    }

    public void wantsToEat(int p,
        Runnable pickLeft,
        Runnable pickRight,
        Runnable eat,
        Runnable putLeft,
        Runnable putRight) {

        int left = p;
        int right = (p+1)%5;

        int first = Math.min(left, right);
        int second = Math.max(left, right);

        forks[first].lock();
        forks[second].lock();

        try {
            pickLeft.run();
            pickRight.run();
            eat.run();
            putLeft.run();
            putRight.run();
        } finally {
            forks[second].unlock();
            forks[first].unlock();
        }
    }
}
```

---

## ⚠️ Issues

* Starvation possible
* Fairness not guaranteed

---

## ✅ Better Solution: Semaphore Limit

```java
Semaphore table = new Semaphore(4);
```

Prevents deadlock by limiting concurrency

---

# 💧 4. H2O Problem

## Goal

Form molecule:

* 2 Hydrogen
* 1 Oxygen

---

## ❌ Common Mistakes

* Blocking inside synchronized
* Using barrier incorrectly
* Mixing threads across groups

---

## ❌ Incorrect Pattern

* Semaphore + Barrier (can mix groups)

---

## ✅ Correct Pattern (Most Important)

### Idea

* Limit entry
* Last thread completes group

---

## ✅ Code

```java
class H2O {

    Semaphore h = new Semaphore(2);
    Semaphore o = new Semaphore(1);
    Semaphore barrier = new Semaphore(0);

    int count = 0;
    Object lock = new Object();

    public void hydrogen(Runnable releaseHydrogen) throws Exception {
        h.acquire();
        releaseHydrogen.run();
        release();
    }

    public void oxygen(Runnable releaseOxygen) throws Exception {
        o.acquire();
        releaseOxygen.run();
        release();
    }

    private void release() throws Exception {
        synchronized(lock) {
            count++;
            if(count == 3) {
                h.release(2);
                o.release(1);
                barrier.release(3);
                count = 0;
            }
        }
        barrier.acquire();
    }
}
```

---

# 🧠 5. Patterns to Remember

## 🔥 1. Group Formation

Used in:

* H2O
* Uber

Template:

```text
count threads
if valid group:
   release permits
threads acquire
barrier sync
```

---

## 🔥 2. Resource Allocation

Used in:

* Dining Philosophers

Template:

```text
order resources
lock in order
release in reverse
```

---

## 🔥 3. Limiting Concurrency

Used in:

* Dining Philosophers

```java
Semaphore limit = new Semaphore(n-1);
```

---

## 🔥 4. Leader Thread Pattern

Used in:

* Uber

```text
one thread triggers release
others just wait
```

---

# 🚨 6. Common Pitfalls

* ❌ Deadlock (circular wait)
* ❌ Starvation (unfair locks)
* ❌ Race conditions (shared counters)
* ❌ Blocking inside locks
* ❌ Incorrect grouping

---

# 🎯 7. Interview Summary

## If problem is:

### 👉 Grouping threads

Use:

* Semaphore + counter + barrier

### 👉 Resource sharing

Use:

* Lock ordering

### 👉 Too much contention

Use:

* Semaphore limit

---

# 🚀 Final Mental Model

```text
Coordination → lock
Permission → semaphore
Grouping → barrier
Execution → outside lock
```

---

# 💡 Pro Tip

Most problems reduce to:

> "Control how many threads proceed and when"

---
