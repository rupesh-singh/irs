# 📨 System Design: Message Queue — Interview-Format HLD

> **Compiled & expanded from personal handwritten notes** (with extra detail in the style of Hello Interview deep-dives).
> Framed as a full mock interview: *Why → Functional → Non-Functional → Core Concepts → High-Level Design → Deep Dives*.
> This is a **Kafka-style distributed message queue / streaming platform** — use it to design "build a message queue" *and* to explain MQ internals when it appears in any HLD.

---

## 📑 Table of Contents
1. [Why a Message Queue?](#1-why-a-message-queue)
2. [Messaging Models](#2-messaging-models)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Core Concepts & Vocabulary](#5-core-concepts--vocabulary)
6. [High-Level Design](#6-high-level-design)
7. [Deep Dive 1 — Data Storage (WAL + Segments)](#7-deep-dive-1--data-storage-wal--segments)
8. [Deep Dive 2 — Message Data Structure](#8-deep-dive-2--message-data-structure)
9. [Deep Dive 3 — Producer Flow & Batching](#9-deep-dive-3--producer-flow--batching)
10. [Deep Dive 4 — Consumer Flow (Push vs Pull)](#10-deep-dive-4--consumer-flow-push-vs-pull)
11. [Deep Dive 5 — Consumer Groups & Rebalancing](#11-deep-dive-5--consumer-groups--rebalancing)
12. [Deep Dive 6 — Ordering](#12-deep-dive-6--ordering)
13. [Deep Dive 7 — Replication & ISR](#13-deep-dive-7--replication--isr)
14. [Deep Dive 8 — Acknowledgements (acks)](#14-deep-dive-8--acknowledgements-acks)
15. [Deep Dive 9 — Delivery Guarantees](#15-deep-dive-9--delivery-guarantees)
16. [Quick Revision Triggers](#16-quick-revision-triggers)

---

## 1. Why a Message Queue?

> A message queue sits **between producers and consumers** so they don't talk to each other directly.

| Benefit | Why it matters |
|---------|----------------|
| **Decoupling** | Removes **tight coupling** between components — producers/consumers evolve independently. |
| **Improved scalability** | Add consumers to drain faster; scale sides independently. |
| **Improved availability** | **Absorbs burst traffic** — the queue buffers spikes so downstream isn't crushed. |
| **Better performance** | **Asynchronous** communication — producer fires and moves on. |

### Message Queue vs Streaming Platform

| | Traditional Message Queue | Streaming Platform |
|--|---------------------------|--------------------|
| Examples | **ActiveMQ, RocketMQ**, RabbitMQ | **Kafka, Pulsar** |
| Model | Often delete-after-consume | **Data retention** + **repeated consumption** (replayable log) |
| Consumers | One consumer per message | Many independent consumer groups re-read the same log |

> 🔑 The design below is **log-based (Kafka/Pulsar style)** — it keeps **data retention** and allows **repeated consumption** (replay by offset).

---

## 2. Messaging Models

**1. Point-to-Point**
- A message is **consumed by one and only one consumer**.
- Classic work-queue (one task → one worker).

**2. Publish-Subscribe (pub/sub)**
- Producer **publishes to a topic**; **consumers subscribe** to the topic.
- Each subscribing group gets its **own copy** of every message.

> 🧠 In a log-based MQ you get *both*: pub/sub across **consumer groups**, point-to-point **within** a group (one partition → one consumer in the group).

---

## 3. Functional Requirements

1. **Producers send messages** to the queue (to a topic).
2. **Consumers consume messages** from the queue.
3. Messages can be consumed **repeatedly** (replay) or **at-least-once**.
4. **Historical data can be truncated** (retention policy / TTL).
5. Respect a **max message size**.
6. **Ordered delivery** (within a partition).
7. **Configurable delivery guarantee** — at-most-once / at-least-once / exactly-once.

---

## 4. Non-Functional Requirements

| Attribute | Target |
|-----------|--------|
| **Throughput / latency** | **High throughput at low latency** (tunable/configurable per use case) |
| **Scalability** | Horizontal — add brokers & partitions |
| **Durability** | **Persistent & durable** — survive broker crashes (replication + WAL) |
| **Availability** | Keep serving through node failures (leader/follower failover) |
| **Ordering** | Guaranteed **per partition** |

> ⚠️ **Trade-off:** throughput vs durability vs ordering are **dials** — `acks`, replication factor, and partition count let you tune where you sit.

---

## 5. Core Concepts & Vocabulary

| Term | Meaning |
|------|---------|
| **Topic** | A named, **contiguous** stream that organizes messages by category. |
| **Partition** | A **subset of a topic's messages** — the unit of parallelism & ordering. An append-only log. |
| **Broker** | A **server that holds partitions** in the cluster. |
| **Offset** | A monotonically increasing position of a message **within a partition**. |
| **Producer** | Writes messages to a topic (routed to a partition). |
| **Consumer** | Reads messages from partitions, tracks its offset. |
| **Consumer group** | A set of **consumers working together** — partitions are split among them. |
| **Leader / Follower** | Per-partition replicas; leader serves traffic, followers replicate. |
| **ISR** | **In-Sync Replicas** — followers caught up with the leader. |

---

## 6. High-Level Design

```
                          ┌───────────────────────────┐
   ┌──────────┐  produce  │           BROKERS         │  consume  ┌──────────┐
   │ Producer │ ────────▶ │  (hold partitions, lead/  │ ────────▶ │ Consumer │
   └──────────┘           │   follow replicas)        │           │  groups  │
                          └─────┬───────────┬─────────┘           └──────────┘
                                │           │
              ┌─────────────────┘           └─────────────────┐
              ▼                  ▼                             ▼
     ┌──────────────┐   ┌────────────────┐         ┌────────────────────┐
     │ Data storage │   │ Metadata store │         │ Coordination service│
     │ (WAL + segs) │   │ (config/rules) │         │  (group coord,      │
     └──────────────┘   └────────────────┘         │   partition assign) │
                        ┌────────────────┐         └────────────────────┘
                        │ State storage  │
                        │ (offsets,      │
                        │  partition↔    │
                        │  consumer map) │
                        └────────────────┘
```

**Components:**
- **Brokers** — hold partitions, serve produce/consume.
- **Data storage** — the partition logs (WAL + segments, §7).
- **Metadata storage** — topic config, rules, partition layout.
- **State storage** — consumer **offsets** + **partition↔consumer mapping**.
- **Coordination service** — assigns partitions, drives **rebalancing** (a broker acts as the **coordinator**).

> 🔑 **Mental model:** brokers are the muscle (hold logs); coordination + metadata + state stores are the brain (who owns what, who read how far).

---

## 7. Deep Dive 1 — Data Storage (WAL + Segments)

> **How do we persist messages durably *and* fast?**

**Option 1 — Use a database?** ❌
- The workload is **read AND write heavy** with high throughput → a general-purpose DB is a **poor fit** (random I/O, indexing overhead).

**Chosen — Write-Ahead Log (WAL):** ✅
- A **plain append-only log file**, each message addressed by an **offset**.
- **Sequential reads & writes** → matches the access pattern → extremely fast (disk loves sequential I/O).
- As the log grows, **divide it into segments**:

```
 offsets:  0  1  2  3  4  5 | 6  7  8  9  10
          └─── Segment 1 ───┘└── Segment 2 ──┘
```
- **Segments** make retention easy: to truncate old data, just **delete whole old segment files**.

> 🧠 **Why a log beats a DB here:** append-only + sequential I/O + offset addressing = huge throughput. Retention = drop old segments. This is the core insight behind Kafka.

---

## 8. Deep Dive 2 — Message Data Structure

> Each message is a **key–value** record plus metadata:

| Field | Purpose |
|-------|---------|
| **key** | Routing key → decides the partition (same key → same partition → ordering). |
| **value** | The payload. |
| **topic** | Which topic it belongs to. |
| **partition** | Which partition it landed in. |
| **offset** | Position within the partition. |
| **timestamp** | When produced. |
| **size** | Message size. |
| **CRC** | **Cyclic Redundancy Check** — verifies **data integrity** (detect corruption on disk/wire). |

> 🔑 The **key** is doing double duty: routing *and* ordering guarantee.

---

## 9. Deep Dive 3 — Producer Flow & Batching

### Batching (the throughput multiplier)
Batch messages at three points:
1. **At the producer** — group many messages before sending (fewer network round-trips).
2. **At the broker / MQ** — batch **while writing to disk** (fewer fsyncs, sequential writes).
3. **At the consumer** — fetch in batches.

### Producer write flow
```
Producer → [Batch] → Routing (by message key) → Broker (LEADER of partition)
                                                   │
                                  followers PULL data from leader
                                                   │
                                   Quorum reached (enough ISR in sync)
                                                   │
                                          Ack sent to producer
                                                   │
                                    message persisted in the log
```
1. Producer **batches** messages.
2. **Routing** by message **key** decides the target partition.
3. Sent to the **leader** of that partition (with **retransmission** on failure).
4. **Followers pull** the data and sync.
5. Once **quorum** is reached, the leader **Acks the producer**.
6. Message is **persisted in the log**.

> 💡 Batching + sequential disk writes are *why* a log-based MQ hits millions of msgs/sec.

---

## 10. Deep Dive 4 — Consumer Flow (Push vs Pull)

### Push vs Pull → **Pull wins**
- **Pull** lets the **consumer control its own consumption rate** (natural backpressure — slow consumers just pull slower).
- Downside of naive pull: wasted requests when there's no data → fixed by **long polling** (the broker holds the request open until data arrives, **reducing wasted resources** when idle).

### Consumer read flow
```
1. New consumer JOINS a consumer group
2. Find the corresponding broker/coordinator by HASHING the group name
3. Coordinator ASSIGNS partitions to this consumer (partition plan)
4. Consumer FETCHES messages starting from its committed consumer OFFSET
5. Process message, then COMMIT the offset back to the broker (state storage)
```

> 🔑 **Offset commit timing decides your delivery guarantee** (commit before vs after processing → see §15).

---

## 11. Deep Dive 5 — Consumer Groups & Rebalancing

### Consumer rebalancing
- Triggered when **any consumer joins or leaves** the group.
- Driven by the **coordinator node** (one of the brokers):
  - Coordinator **selects a leader** and **creates a partition plan** — *which consumer consumes which partition*.

### State storage tracks:
- **Partition ↔ consumer mapping** (who owns what).
- **Last committed offset** per consumer (where each left off).

### Metadata storage tracks:
- **Config / rules** (topic settings, retention, etc.).

> 🧠 **Key rule:** within a group, **a partition is owned by exactly one consumer**. So group parallelism is capped at the **partition count**.

---

## 12. Deep Dive 6 — Ordering

> "Can you guarantee ordered delivery?"

- **Ordering is guaranteed at the PARTITION level, not the topic level.**
- A **single partition is consumed by only one consumer** within a group → that consumer sees messages **in offset order**.
- Across partitions there's **no global order**.

> 🔑 **To preserve order for related events**, give them the **same message key** → they hash to the **same partition** → ordered. (Trade-off: ordering limits parallelism to one consumer per partition.)

---

## 13. Deep Dive 7 — Replication & ISR

### Replication
- Each **partition is replicated** (default **3** copies).
- **Leader + followers live on different brokers** → survive a broker failure.

### ISR (In-Sync Replicas)
- Messages are **written to the leader**; **followers pull and sync** with the leader.
- The set of followers that are **caught up** = the **ISR**.
- **Why ISR?** → **we don't want to lose messages.** If the leader dies, a follower **from the ISR** is promoted (guaranteed to have the committed data).

### Why not read from ISR followers (for read scaling)?
- Replicas exist **only for durability**, not read scaling.
- Reading from followers risks **order not being maintained** (followers may lag) → reads go to the **leader**.

> 🔑 Replication = durability + failover, **not** read throughput.

---

## 14. Deep Dive 8 — Acknowledgements (acks)

> The producer's `acks` setting trades **durability ↔ latency**:

| Setting | Behavior | Trade-off |
|---------|----------|-----------|
| **acks=all** | Leader waits until **all ISR** are in sync, then Acks | **Strongest durability, slowest** |
| **acks=1** | **Leader persists & Acks** (doesn't wait for followers) | Balanced; lose data if leader dies before replication |
| **acks=0** | Producer **keeps sending without waiting** for any Ack | **Fastest, least durable** (fire-and-forget) |

> 🔑 **One-liner:** `acks=0` fast/lossy · `acks=1` balanced · `acks=all` safe/slow.

---

## 15. Deep Dive 9 — Delivery Guarantees

> Combine **producer `acks`** + **consumer offset-commit timing** to get the guarantee you want:

### 1. At-most-once (may lose, never duplicate)
- Producer **acks=0**.
- Consumer **commits the offset BEFORE processing** → if it crashes mid-process, the message is skipped.

### 2. At-least-once (never lose, may duplicate)
- Producer **acks=1 or acks=all** (per setting).
- Consumer **commits only AFTER processing** → a crash before commit means the message is **redelivered** (possible duplicate).

### 3. Exactly-once (never lose, never duplicate)
- **Same as at-least-once, but with an idempotency key** → consumer dedupes retries, so reprocessing has no effect.
- (Kafka also offers transactional/idempotent producers to achieve this end-to-end.)

| Guarantee | Producer | Consumer commit | Risk |
|-----------|----------|-----------------|------|
| **At-most-once** | acks=0 | **before** processing | may lose |
| **At-least-once** | acks=1 / all | **after** processing | may duplicate |
| **Exactly-once** | acks=all | after + **idempotency key** | none |

> 🎯 **The interview gold:** delivery semantics aren't one switch — they're the **combination** of producer acks and *when the consumer commits its offset*.

---

## 16. Quick Revision Triggers

> Skim these one-liners right before the interview:

- **Why MQ?** Decoupling · scalability · availability (burst buffering) · async performance.
- **MQ vs streaming:** ActiveMQ/RocketMQ (consume-once) vs **Kafka/Pulsar** (retention + replay).
- **Models:** point-to-point (one consumer) · pub/sub (topic → many groups).
- **Core nouns:** Topic → Partitions → (offsets); Brokers hold partitions; Consumer groups split partitions.
- **Storage:** **WAL** (append-only, sequential I/O) split into **segments**; delete old segments to truncate. *DB is a bad fit.*
- **Message fields:** key, value, topic, partition, offset, timestamp, size, **CRC** (integrity).
- **Batching** at producer / broker(disk) / consumer = throughput.
- **Pull > push** (consumer controls rate) + **long polling** when idle.
- **Ordering = per partition**, not per topic; same **key → same partition**.
- **Replication** (default 3), leader+followers on different brokers; **ISR** prevents message loss; read from **leader** only.
- **acks:** 0 (fast/lossy) · 1 (balanced) · all (safe/slow).
- **Delivery:** at-most (acks=0, commit before) · at-least (acks≥1, commit after) · exactly (at-least + **idempotency key**).
- **Rebalancing:** coordinator (a broker) reassigns partitions when consumers join/leave.

---

_Pair this with [HLD_Core_Concepts.md](HLD_Core_Concepts.md) (CAP, consistency) and [HLD_Patterns.md](HLD_Patterns.md) (pub/sub, scaling writes, Sagas)._ 🚀
