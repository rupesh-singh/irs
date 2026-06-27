# 🧩 HLD Patterns — Revision Cheatsheet

> **Compiled & expanded from personal handwritten notes** (with extra detail in the style of Hello Interview's "core patterns").
> These are the **reusable building blocks** — when an interviewer adds a requirement ("make it real-time", "handle the spike", "no double-spend"), you reach for one of these patterns.

---

## 📑 Table of Contents
1. [Real-Time Updates](#1-real-time-updates)
2. [Dealing with Contention](#2-dealing-with-contention)
3. [Multi-Step Processes (Orchestration / Sagas / Workflows)](#3-multi-step-processes)
4. [Scaling Reads](#4-scaling-reads)
5. [Scaling Writes](#5-scaling-writes)
6. [Handling Large Blobs](#6-handling-large-blobs)
7. [Redis as a Swiss-Army Knife](#7-redis-as-a-swiss-army-knife)
8. [Pattern Picker (Quick Reference)](#8-pattern-picker)

---

## 1. Real-Time Updates

> **Two separate questions** hide inside "make it real-time":
> ```
> [ Update ] ──▶ [ Server ] ──▶ [ Client ]
>      (B) how does the         (A) how does the
>       server LEARN of           server PUSH to
>       the update?               the client?
> ```

### (A) How the server pushes data to the client

| Approach | How | Trade-off / When |
|----------|-----|------------------|
| **1. Long polling** | Client makes a request; server **holds it open** until data is ready, then client re-asks | Simple, works everywhere — but **latency** & wasted connections |
| **2. SSE** (Server-Sent Events) | Server streams events over one long-lived HTTP connection | One-way only (**no bi-direction**); great for feeds/notifications |
| **3. WebSocket** | Full-duplex persistent TCP connection | **Default for everything** — chat, live dashboards — **except** video call / gaming |
| **4. WebRTC** | **Peer-to-peer** media/data channel | Video call, gaming, screen-share (low latency, P2P) |

> 🔑 **Decision ladder:** one-way push → **SSE**; two-way → **WebSocket**; peer-to-peer media → **WebRTC**; can't change infra → **long polling**.

### (B) How the server learns of the update (the back-end side)

1. **Server polls the database** — *unconventional*; simple but wasteful and laggy.
2. **Pub/Sub model** (database + a broker like **Redis / Kafka**) — the standard:
   - Client connects to **any** server and **subscribes to a topic**.
   - Any change is **published to the topic**, and the subscribed server **pushes it to the client**.
   - Decouples producers from consumers; any server instance can serve any client.
3. **Consistent hashing** — route a given client/topic to a specific server. **Needs a coordination service like ZooKeeper** to track which node owns what (and to rebalance on node changes).

> 🧠 **The hard part of real-time at scale:** with millions of persistent connections spread across many servers, you need pub/sub (so any server can notify any client) + a way to know **which server holds which connection** (consistent hashing + coordination).

---

## 2. Dealing with Contention

> **Problem:** multiple users want the **same resource** at the same time (last concert ticket, account balance, inventory count). Avoid lost updates / double-spend.

### Single-node solutions

**1. Atomicity (use a transaction)** — wrap the read-modify-write in a DB transaction so it's all-or-nothing.

**2. Pessimistic locking** — *use when contention is frequent*:
```
take lock  →  write  →  release lock
```
- E.g., `SELECT ... FOR UPDATE`. Blocks others; safe but limits throughput & risks deadlocks.

**3. Optimistic concurrency control** — *use when conflicts are rare*:
```
read row (+ its version)
... do work ...
on write: check the version is unchanged
   ├─ same version → update (and bump version)
   └─ changed      → FAIL → retry
```
- No locks held; you detect the conflict at commit time via a **version number** (or compare-and-set).

### Isolation levels (weakest → strongest)

| Level | Guarantee | Note |
|-------|-----------|------|
| **Read Uncommitted** | Can read dirty (uncommitted) data | *Rarely used* |
| **Read Committed** | Only reads committed data | **Default** in most DBs |
| **Repeatable Read** | Same row reads identical within a transaction | Prevents non-repeatable reads |
| **Serializable** | Transactions behave as if run one-by-one | **Strongest** isolation, lowest concurrency |

### Multiple-node solutions (distributed contention)

1. **Two-Phase Commit (2PC)** — coordinator drives all nodes:
   ```
   Phase 1: Prepare  (everyone votes "ready"?)
   Phase 2: Commit / Abort  (all-or-nothing)
   ```
   - Strong consistency but **slow & blocking** — avoid unless necessary.
2. **Distributed locks** — e.g., a **Redis lock** (Redlock). One holder mutates at a time across nodes.
3. **Sagas** — break a distributed transaction into **small local operations**, each with a **compensating action** to undo it if a later step fails (see §3).

> 🔑 **Pick:** single DB → transactions + optimistic/pessimistic locks. Across services/shards → prefer **Sagas**; reach for distributed locks for short critical sections; 2PC only when you truly need atomic commit.

---

## 3. Multi-Step Processes

> **Problem:** an operation spans **multiple services / steps** (like an **Uber** ride: match → price → charge **payment service** → notify), and some steps may **need human intervention** or can fail midway. How do you keep it consistent and recoverable?

### Solution 1 — Single-server orchestration
- One orchestrator service drives each step in order, tracks state, retries failures.
- Simple to reason about, but the orchestrator is a **single point of failure / bottleneck**.

### Solution 2 — Event Sourcing (a "sort of pub/sub model")
- **Every action generates an event.**
- Events are appended to an **Event Store** (the **source of truth**).
- Services **subscribe to topics** and react to events.
- **No single orchestrator** — choreography via events.
- **Events can be replayed** to rebuild state or recover after failure.

> 🧠 Event sourcing = store the **log of changes**, not just the current state. Current state = fold(events).

### Solution 3 — Workflows (Durable Execution)
- A **durable execution engine** runs the process as code, surviving crashes/restarts.
- Modeled as a **DAG (Directed Acyclic Graph)** of steps — *used at PayPal*.
- **Temporal** is the most popular; **AWS Step Functions** is also a workflow engine.
- Built-in retries, timers, and waits (perfect for steps needing **human intervention**).

**How are workflows implemented? — two concerns:**
1. **Workflow versioning** — change the workflow logic without breaking in-flight executions.
2. **Workflow migration** — move running executions onto the new version safely.

### Sagas (the consistency model behind all three)
- Split the big transaction into steps; if step *N* fails, run **compensating transactions** for steps *N-1 … 1* to undo their effects.
- Example: `reserve seat → charge card → (charge fails) → release seat`.

> 🔑 **Rule:** distributed multi-step + need recovery → **Sagas** for the consistency model, implemented via **events** (choreography) or a **workflow engine** (orchestration).

---

## 4. Scaling Reads

> Read-heavy system getting slow? Apply in this order:

### 1. Optimize the database (cheapest first)
- **Indexing** — speeds reads, but **talk about the memory/write trade-off** (indexes cost storage and slow writes).
- **Hardware upgrades** — more RAM/SSD (vertical).
- **Denormalization** — pre-join / duplicate data to avoid expensive joins at read time.

### 2. Scale the database (**first find the bottleneck!**)
- **Read replicas** — fan reads out across copies (writes still go to primary). Watch **replication lag** (eventual consistency).
- **Sharding** — split data across machines when one can't hold it / serve it.

### 3. External caching
- **Redis** (application layer) — cache hot query results.
- **CDN** — cache static/edge content close to users.

### Things to address (interviewer will probe):
1. **Hot replicas?** — uneven load; one replica gets hammered. → replicate hot data, add caching.
2. **Cache invalidation?** — how do you keep cache fresh (TTL, write-through, explicit invalidation)?

> 🔑 **Order of attack:** index/denormalize → replicas → cache/CDN → shard. Always **measure the bottleneck first**.

---

## 5. Scaling Writes

> Write-heavy system? The primary becomes the bottleneck. Options:

### 1. Vertical scaling + write-friendly databases
- **Scale hardware** first (and *talk numbers* — estimate write QPS, payload size).
- Pick a **write-optimized database**:
  - **Cassandra** (write-heavy) — **append-only commit log**, **easy writes**, **harder reads**.
  - **Time-series DB** — **sequential writes** (InfluxDB, Timescale).
  - **Log-structured (LSM) databases** — append + compact (RocksDB).
  - **Column stores** — analytics / bulk writes.

### 2. Sharding & partitioning
- **Horizontal sharding** — split rows across machines; **select a good partition key** (high cardinality, even distribution, matches queries).
- **Vertical sharding** — split a wide table into **multiple tables** (by column groups).

### 3. Handle bursts with Queues & Load-Shedding
- Put a **message queue** (Kafka/SQS) in front to **absorb short-lived bursts** and smooth the write rate.
- **Load-shedding** — drop/deprioritize low-value work when overloaded to protect the system.

### 4. Batching & hierarchical aggregation
- **Batch** many small writes into fewer larger ones.
- **Hierarchical aggregation** — pre-aggregate counts at multiple levels (e.g., per-minute → per-hour) instead of writing every event (great for counters/analytics).

> 🔑 **Order of attack:** bigger box + right DB → queue to absorb bursts → batch/aggregate → shard by a good key.

---

## 6. Handling Large Blobs

> **Problem:** uploading big files (videos, images, backups). Don't stream gigabytes **through** your app servers. (e.g., **Azure Blob Storage** / S3.)

### Patterns
1. **Simple direct upload via pre-signed URLs** — the app issues a short-lived signed URL (**SAS** token in Azure); the **client uploads directly to blob storage**, bypassing your servers.
2. **Resumable uploads** — chunk the file; on failure, resume from the last good chunk (no restart from zero).
3. **State synchronization** — once the blob lands:
   - **Update metadata** (size, owner, status) **in the main database**.
   - Fire an **event notification** (e.g., "upload complete" → trigger transcoding/thumbnailing).

### Use cases
- **YouTube** (video upload + transcode)
- **Dropbox** (file sync)
- **Photo / video sharing** apps

> 🔑 **Golden rule:** files go **client → blob store directly** (pre-signed URL); your DB only stores **metadata + pointers**, never the bytes.

---

## 7. Redis as a Swiss-Army Knife

> **Redis** is **in-memory** & **single-threaded** (so individual commands are atomic — no race within a command). One tool, many patterns:

| Use Redis as… | How / Why |
|---------------|-----------|
| **Cache** | Fast key-value store in front of the DB (cache-aside, TTLs) |
| **Distributed lock** | `SET key val NX PX <ttl>` / Redlock for cross-node mutual exclusion (§2) |
| **Event sourcing** | **Redis Streams** — append-only log of events, consumer groups |
| **Pub/Sub (Queue)** | Publish to a channel / Streams as a lightweight message queue (§1B, §3) |
| **Rate limiting** | Atomic counters / sliding-window with `INCR` + `EXPIRE` |

> 🧠 **Why it works for all of these:** single-threaded execution makes operations atomic, and in-memory speed makes it ideal for hot, short-lived, high-throughput data.

---

## 8. Pattern Picker

| Requirement the interviewer adds | Reach for… |
|----------------------------------|------------|
| "Make it **real-time**" | WebSocket/SSE + **pub/sub** backend (§1) |
| "Two users, **same resource**" | Transactions + optimistic/pessimistic locks (§2) |
| "Across services, **no double-spend**" | **Sagas** / distributed locks (§2, §3) |
| "**Multi-step**, recoverable flow" | **Workflow engine** (Temporal) / event sourcing (§3) |
| "Reads are **slow**" | index → replicas → cache/CDN (§4) |
| "Writes can't **keep up**" | write-optimized DB → queue → batch → shard (§5) |
| "Users upload **huge files**" | pre-signed URL direct-to-blob + metadata in DB (§6) |
| "Need a **lock / counter / queue** fast" | **Redis** (§7) |

> 🎯 **Interview habit:** name the pattern, then **state the trade-off** (latency vs consistency vs complexity). Patterns are tools — justify *why this one* for *these requirements*.

---

_Revise these patterns alongside [HLD_Core_Concepts.md](HLD_Core_Concepts.md) — concepts are the vocabulary, patterns are the sentences._ 🚀
