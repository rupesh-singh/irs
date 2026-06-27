# 🗄️ System Design: Distributed Cache — Interview-Format HLD

> **Compiled & expanded from personal handwritten notes** (with extra detail in the style of Hello Interview deep-dives).
> Framed as a full mock interview: *What → Functional → Non-Functional → Estimation → Core Design → Deep Dives*.
> A **distributed cache** (think Redis/Memcached at scale) — use it to design "build a distributed cache" *and* to reason about caching layers in any HLD.

---

## 📑 Table of Contents
1. [What Is a Distributed Cache?](#1-what-is-a-distributed-cache)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Capacity Estimation (Numbers)](#4-capacity-estimation-numbers)
5. [Core Data Structure (Single Node)](#5-core-data-structure-single-node)
6. [API Sketch](#6-api-sketch)
7. [High-Level Design](#7-high-level-design)
8. [Deep Dive 1 — High Availability & Fault Tolerance (Replication)](#8-deep-dive-1--high-availability--fault-tolerance-replication)
9. [Deep Dive 2 — Scalability (Sharding & Consistent Hashing)](#9-deep-dive-2--scalability-sharding--consistent-hashing)
10. [Deep Dive 3 — Hot Keys](#10-deep-dive-3--hot-keys)
11. [Deep Dive 4 — Eviction Policies](#11-deep-dive-4--eviction-policies)
12. [Deep Dive 5 — Durability (WAL + Replication)](#12-deep-dive-5--durability-wal--replication)
13. [Deep Dive 6 — Cache Invalidation & Consistency](#13-deep-dive-6--cache-invalidation--consistency)
14. [Quick Revision Triggers](#14-quick-revision-triggers)

---

## 1. What Is a Distributed Cache?

> An **in-memory key–value store spread across many nodes**, sitting between the app and the database to serve hot data with **sub-millisecond / low-ms latency**.

- Reduces DB load and latency for **read-heavy** workloads.
- Data is **partitioned** across nodes (to scale storage) and **replicated** (for availability).
- Trades **strong consistency** for **speed + availability** (leans **AP**).

---

## 2. Functional Requirements

1. **`set(key, value)`** — store/overwrite a value.
2. **`get(key)`** — retrieve a value (or miss).
3. **`TTL` + eviction (`LRU`)** — entries expire by time-to-live and/or are evicted under memory pressure.

> Optional/out of scope to state: `delete`, atomic counters, range scans. Keep the core to set/get/expire.

---

## 3. Non-Functional Requirements

| Attribute | Target / Decision |
|-----------|-------------------|
| **Latency** | **Low — ~10–20 ms** end-to-end (in-memory, single hop) |
| **Consistency vs Availability** | **Availability > Consistency** (AP) — a slightly stale/missing cache entry is fine |
| **Fault tolerance** | Survive node failures without data-serving outage |
| **Scalability** | Horizontal — add nodes to grow storage & throughput |

> ⚠️ **Key trade-off to state:** a cache prefers **availability**; a miss just falls through to the DB. So we optimize for **uptime + latency**, not strict correctness.

---

## 4. Capacity Estimation (Numbers)

| Metric | Estimate |
|--------|----------|
| **Read throughput** | **100K OPS** (read-heavy) |
| **Write throughput** | **10K OPS** |
| **Storage** | **~1 TB** total dataset |

- **Read:write ≈ 10:1** → confirms a **read-optimized**, replicate-for-reads design.
- 1 TB won't fit on one node's RAM → **must shard** across nodes (e.g., 256 GB/node → ~4–8 nodes + replicas).

> 🧠 **Use the numbers to justify decisions:** 10:1 read ratio → replicas/read-scaling; 1 TB → sharding; 100K OPS → in-memory + consistent hashing.

---

## 5. Core Data Structure (Single Node)

> On a single node, how do we get **O(1) get/set/delete** *and* **LRU eviction**?

**HashMap + Doubly Linked List** (the classic LRU cache):
- **HashMap** → `key → node` for **O(1) read / write / delete**.
- **Doubly linked list** → maintains **recency order** for the **LRU eviction policy** (move-to-front on access, evict from tail).

```
HashMap:                 Doubly Linked List (MRU ⇄ LRU):
 key ─────► node ◄──────►  [A] ⇄ [B] ⇄ [C] ⇄ [D]
                            ↑MRU            ↑LRU (evict here)
```

```java
class LRUCache {
    Map<Integer, Node> map = new HashMap<>();   // O(1) lookup
    Node head, tail;                            // recency order
    // get  -> map.get + move node to head (MRU)
    // put  -> insert at head; if over capacity, remove tail (LRU)
}
```

> 🔑 **HashMap = O(1) access; Doubly linked list = O(1) eviction ordering.** Together = O(1) LRU.

---

## 6. API Sketch

```
set(key, value, ttl?)   → store with optional TTL
get(key)                → value | MISS
delete(key)             → remove
```
- TTL expiry handled lazily (on access) and/or by a background sweeper.

---

## 7. High-Level Design

```
                ┌──────────────────────────────────────────┐
   ┌────────┐   │           CACHE CLUSTER                   │
   │ Client │──▶│  (routing via consistent hashing)         │
   │  / App │   └───┬───────────────┬───────────────┬───────┘
   └────────┘       ▼               ▼               ▼
                ┌────────┐      ┌────────┐      ┌────────┐
                │ Node A │      │ Node B │      │ Node C │   ← shards
                │ keys.. │      │ keys.. │      │ keys.. │
                │ +replica│     │ +replica│     │ +replica│  ← replication
                └────────┘      └────────┘      └────────┘
                     │ miss
                     ▼
                ┌──────────┐
                │ Database │  (source of truth; cache-aside)
                └──────────┘
```

- Client (or a smart proxy) routes a key to its node via **consistent hashing**.
- Each shard holds part of the keyspace; **replicas** provide HA.
- On a **miss**, fall through to the DB (**cache-aside**) and populate.

> 🔑 **Mental model:** consistent hashing decides *where* a key lives; replication decides *how many copies*; eviction decides *what to drop* under pressure.

---

## 8. Deep Dive 1 — High Availability & Fault Tolerance (Replication)

> "What happens when a node dies?" → **Data replication.** Three models:

### 1. Synchronous replication → strong consistency
- Write returns only **after replicas acknowledge**.
- **Pro:** no data loss, replicas always current.
- **Con:** **higher write latency** (wait for replicas).

### 2. Asynchronous replication
- Write returns **immediately**; replicas catch up **in the background**.
- **Pro:** **low latency** (fits the cache's AP goal).
- **Con:** brief window where a replica is stale / can lose the last writes on failure.

### 3. Peer-to-peer replication (gossip protocol)
- No single leader; **nodes gossip state** to each other (à la Dynamo/Cassandra).
- **Pro:** no single point of failure, very resilient.
- **Con:** **each node must maintain connections with multiple nodes** → more overhead & complexity.

> 🔑 For a cache (AP, low-latency), **async replication** is the usual default; gossip for fully decentralized clusters; sync only when you truly need strong consistency.

---

## 9. Deep Dive 2 — Scalability (Sharding & Consistent Hashing)

> "1 TB won't fit on one node, and 100K OPS is a lot." → scale out.

1. **Vertical scaling** — bigger box (more RAM). Quick win, but hits a ceiling.
2. **Sharding based on key** — partition the keyspace across nodes (`node = hash(key) % N`).
3. **Consistent hashing** — the right way to shard:
   - Maps nodes **and** keys onto a ring → **adding/removing a node only remaps ~1/N keys** (not the whole keyspace).
   - **Virtual nodes** smooth out uneven distribution.

> ⚠️ Plain `hash(key) % N` **remaps almost everything** when `N` changes → massive cache miss storm. **Consistent hashing** is what makes elastic scaling practical.

---

## 10. Deep Dive 3 — Hot Keys

> A single key gets disproportionate traffic (celebrity user, viral post) → one node melts.

### Read hot key
- **Make copies of the same key on multiple servers** (replicate the hot entry).
- Spread reads using **deterministic hashing or key suffixing**:
  ```
  user:123#0, user:123#1, ... user:123#(requestId % N)
  ```
  Clients pick a random/replica suffix → reads fan out across nodes.
- **Con:** now you must **update all copies** on a write (write amplification + consistency cost).

### Write hot key
- **Batch writes** — coalesce many updates to the same key into fewer writes.
- **Monitoring/threshold-based batching** — flush on an **interval** or when a threshold is hit (e.g., counter updates aggregated, then written periodically).

> 🔑 **Read hot key → replicate + suffix-fan-out; Write hot key → batch + aggregate.** Both trade some consistency for load relief.

---

## 11. Deep Dive 4 — Eviction Policies

> Memory is finite — when full, what do we drop?

| Policy | Evicts | Use when |
|--------|--------|----------|
| **LRU** (Least Recently Used) | Oldest-accessed | **Default** — recency predicts reuse |
| **LFU** (Least Frequently Used) | Least-accessed over time | Stable popularity skew |
| **FIFO** | First inserted | Simple, order-based |
| **TTL** | Time-expired entries | Data has a natural freshness window |

- **TTL** also bounds staleness and auto-cleans (lazy on access + background sweeper).

> 🔑 **Common default: LRU + TTL** — LRU under memory pressure, TTL for freshness. (Implemented via the HashMap + DLL in §5.)

---

## 12. Deep Dive 5 — Durability (WAL + Replication)

> A cache is in-memory — a crash loses everything. If we need to **survive restarts**:

1. **Replication** — keep copies on other nodes (also covers HA, §8).
2. **WAL (Write-Ahead Log)** — append each write to an on-disk log **before** applying it; on restart, **replay the WAL** to rebuild state (Redis AOF works like this).

> 🧠 Pure caches often skip durability (just rewarm from the DB). Add **WAL + replication** only when **rewarming is too expensive** or the cache holds semi-authoritative data.

---

## 13. Deep Dive 6 — Cache Invalidation & Consistency

> *"There are only two hard things in CS: cache invalidation and naming things."* Keep cache and DB from drifting:

- **TTL** — simplest; entries expire and refresh (bounded staleness).
- **Write-through** — write to cache + DB together (consistent, slower writes).
- **Write-around / cache-aside invalidation** — on DB write, **delete/invalidate** the cache key so the next read repopulates.
- **Write-behind** — write to cache, async flush to DB (fast, risk of loss).

> 🔑 Most systems use **cache-aside + TTL + explicit invalidation on writes**. Accept eventual consistency (matches the AP goal).

---

## 14. Quick Revision Triggers

> Skim these one-liners right before the interview:

- **What:** distributed in-memory K-V store; read-heavy; **AP** (availability > consistency).
- **Functional:** set · get · TTL/LRU eviction.
- **Numbers:** 100K read OPS · 10K write OPS · 1 TB → **10:1 read ratio + must shard**.
- **Single node:** **HashMap (O(1)) + Doubly Linked List (LRU)**.
- **Routing:** **consistent hashing** (plain `%N` causes a miss storm on resize).
- **HA / replication:** sync (strong, slow) · **async (fast, default)** · peer-to-peer gossip (resilient, connection-heavy).
- **Scale:** vertical → shard by key → consistent hashing (+ virtual nodes).
- **Hot key (read):** replicate key + **suffix fan-out** (`key#requestId%N`); con = update all copies.
- **Hot key (write):** **batch** writes on interval/threshold.
- **Eviction:** **LRU + TTL** default (also LFU, FIFO).
- **Durability:** **replication + WAL** (replay on restart) — or just rewarm from DB.
- **Consistency:** cache-aside + TTL + invalidate-on-write (eventual).

---

_Pair this with [HLD_Core_Concepts.md](HLD_Core_Concepts.md) (caching, consistent hashing, CAP) and [HLD_Patterns.md](HLD_Patterns.md) (scaling reads, hot keys)._ 🚀
