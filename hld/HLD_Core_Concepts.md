# 🏛️ HLD Core Concepts — Revision Cheatsheet

> **Compiled & expanded from personal handwritten notes** (with extra detail in the style of Hello Interview's system design deep-dives).
> The reusable toolkit you assemble *every* system design from. Skim top-to-bottom before an interview.

---

## 📑 Table of Contents
1. [Scalability](#1-scalability)
2. [CAP Theorem & Consistency Models](#2-cap-theorem--consistency-models)
3. [Locking & Concurrency](#3-locking--concurrency)
4. [Data Modeling](#4-data-modeling)
5. [Database Indexing](#5-database-indexing)
6. [Caching](#6-caching)
7. [Sharding & Partitioning](#7-sharding--partitioning)
8. [Consistent Hashing](#8-consistent-hashing)
9. [Communication Protocols](#9-communication-protocols)
10. [Networking Essentials](#10-networking-essentials)
11. [Handling Failures (Resilience)](#11-handling-failures-resilience)
12. [Security](#12-security)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [The Interview Checklist](#14-the-interview-checklist)

---

## 1. Scalability

> You start with a **single-server application**. It works — then you start growing, and that growth creates challenges.

### Two ways to scale

| | Vertical Scaling (scale **up**) | Horizontal Scaling (scale **out**) |
|--|--------------------------------|-----------------------------------|
| What | Add more storage, RAM, CPU to one machine | Add more machines |
| Limit | Hardware ceiling, single point of failure | Near-unlimited, but adds complexity |
| Complexity | Simple | Needs coordination |

### Horizontal scaling creates two core challenges

**1. Work distribution** — how do requests get spread across machines?
- **Load balancer** distributes traffic.
- **Consistent hashing** to map work → node with minimal reshuffling when nodes join/leave (see §8).

**2. Data distribution** — how does data stay correct across machines?
- **Data consistency / synchronization** across replicas.
- **Distributed locks** to coordinate access.
- **CAP theorem** governs the fundamental trade-off (see §2).

> 🔑 **Mental model:** scaling out turns *every* hard problem (consistency, locking, ordering) into a *distributed* version of itself.

---

## 2. CAP Theorem & Consistency Models

> **Premise:** a distributed system is **partition tolerant** (network failures *will* happen). So when a network partition occurs, you must choose: **Consistency** *or* **Availability**?

### The choice

**When you choose Consistency (CP):**
- Design needs **distributed transactions**.
- Often a **single-node structure** (single source of truth) for the critical data.
- Reads either return the latest write or an error — never stale data.

**When you choose Availability (AP):**
- **Multiple replicas** keep serving even if some are unreachable.
- **Change Data Capture (CDC)** to propagate updates asynchronously.
- Reads always succeed, but may return stale data.

> 🧠 A modern system can have **multiple consistency models** — different features pick different models (e.g., payments = strong, news feed = eventual).

### Levels of consistency (strongest → weakest)

| Level | Guarantee | Example |
|-------|-----------|---------|
| **Strong consistency** | Every read sees the latest write | Bank balance, inventory |
| **Causal consistency** | Causally-related ops seen in order | Comment after a post |
| **Read-your-own-writes** | You always see your own updates | Edit your profile, see it instantly |
| **Eventual consistency** | Replicas converge *eventually* | Likes count, DNS, news feed |

> 🔑 **Interview line:** "Pick the *weakest* consistency that still meets the product requirement — it buys you availability and performance."

---

## 3. Locking & Concurrency

> When multiple actors touch the same data, you need locks — but locks cost throughput. Three dials to reason about:

1. **Granularity of lock** — row vs table vs page. Finer = more concurrency, more overhead. Coarser = simpler, more contention.
2. **Duration of lock** — hold it as *briefly* as possible. Long locks = bottleneck + deadlock risk.
3. **Can we bypass it?** → **Optimistic concurrency control.**

### Pessimistic vs Optimistic

| | Pessimistic | Optimistic |
|--|-------------|------------|
| Idea | Lock *before* touching data | Don't lock; detect conflict at commit |
| Mechanism | Row/table locks | Version number / `compare-and-set` |
| Best when | High contention | Low contention (conflicts rare) |
| Cost | Blocking, deadlocks | Retry on conflict |

> 💡 **Optimistic concurrency:** read a version → do work → on write, check the version hasn't changed. If it did, retry. Great for "conflicts are rare" workloads.

---

## 4. Data Modeling

### Database model options

- **SQL (relational)** — strong consistency, ACID transactions, joins, fixed schema.
- **NoSQL** — flexible, scales horizontally:
  - **Document DB** (MongoDB) — JSON-like, nested data.
  - **Key-Value store** (Redis, DynamoDB) — fast lookups by key.
  - **Wide-column** (Cassandra) — time-series, huge write volume.
  - **Graph DB** (Neo4j) — relationship-heavy data (social, fraud).

### Designing the schema — decide based on:
1. **Data volume** — how much data?
2. **Access pattern** — read-heavy vs write-heavy, query shapes.
3. **Consistency requirement** — strong vs eventual.

### Translation rules
- **Entities → tables**
- **Keys → indexes**
- **Normalization vs Denormalization:**
  - *Normalize* (SQL default) → no duplication, integrity, but more joins.
  - *Denormalize* (NoSQL common) → duplicate data to avoid joins, faster reads, harder writes.
- **Scaling & sharding** — once one machine isn't enough (see §7).

> 🔑 **Rule of thumb:** model around your **access patterns** in NoSQL, around your **entities/relationships** in SQL.

---

## 5. Database Indexing

> An index **increases capacity to query fast** — at the **cost** of extra storage and slower writes.

### Index types

- **B-Tree indexes** — *the default* in most relational DBs. Balanced, great for range queries and reads.
- **LSM Tree** (Log-Structured Merge tree) — write-optimized (Cassandra, RocksDB):
  - **WAL** (Write-Ahead Log) for durability.
  - **SSTable** (Sorted String Table) on disk.
  - **Bloom filter** for optimization — quickly tells if a key is *definitely not* present (avoids disk reads).
- **Hash index** — O(1) exact-match lookups, no range queries.
- **Geo-spatial index** — for location/proximity queries:
  - **Geohash** — encodes lat/long into a string prefix.
  - **Quadtree** — recursively subdivides 2D space.
  - **R-tree** — bounding boxes for spatial objects.

### Specialized indexes
- **Full-text search index** — inverted index for text (search "contains word X").
- **Geospatial index** — "find restaurants within 5 km."
- → **Elasticsearch** packages both (full-text + geo) as a search engine.

> 🧠 **B-tree vs LSM in one line:** B-tree = read-optimized (in-place updates); LSM = write-optimized (append + compact).

---

## 6. Caching

> Keep hot data close to the reader to cut latency and DB load.

### Where caches live
- **External cache** (Redis, Memcached) — shared, network hop.
- **CDN** (Content Delivery Network) — static assets at the edge.
- **In-process cache** — in the app's memory, fastest, but per-instance.
- **Client-side cache** — browser/app local.

### Caching strategies

| Strategy | How it works | Trade-off |
|----------|--------------|-----------|
| **Cache-aside** (lazy) | App checks cache; on miss, reads DB & populates cache | Most common; first read is slow |
| **Read-through** | Cache itself fetches from DB on miss | Cleaner app code |
| **Write-through** | Write to cache **and** DB together | Consistent, but write latency |
| **Write-behind** (write-back) | Write to cache, async flush to DB | Fast writes, risk of data loss on crash |

> 💡 **Cache-aside flow:** `check cache → if not found, hit DB → populate cache → return`.

### Caching problems & fixes

- **Cache stampede / thundering herd** — cache entry expires, every request hits the DB at once and overloads it.
  - **Fix:** allow **only one request** to rebuild the cache on a miss (locking / single-flight); others wait or serve stale.
- **Hot keys** — one key gets disproportionate traffic.
  - **Fix:** ① **replicate the cache** entry, ② **fallback logic**, ③ **rate limiting**.
- **Cache consistency** — cache and DB drift apart. Use TTLs, write-through, or explicit invalidation.

### Eviction policies
| Policy | Evicts |
|--------|--------|
| **LRU** (Least Recently Used) | Oldest-accessed — most common default |
| **LFU** (Least Frequently Used) | Least-accessed over time |
| **FIFO** | First inserted |
| **TTL** | Time-based expiry |

> 🔑 **Default choice:** **LRU + TTL** covers most cases.

---

## 7. Sharding & Partitioning

> **Partitioning:** split data within a single DB instance (table/range/hash). **Sharding:** split data *across multiple machines or DBs*.

### How to shard — choose your **shard key**
1. **High cardinality** (many distinct values) → spreads evenly.
2. **Even distribution** → avoids hotspots.
3. **Aligns with query pattern** → most queries hit a single shard.

### Sharding strategies
- **Hash-based sharding** (consistent hashing) — even spread, but range queries scatter.
- **Directory-based sharding** — a lookup table maps key → shard. Flexible; the directory can be a bottleneck.
- **Range-based** — easy ranges, but risks hot ranges.

### Challenges
1. **Hot spots & load imbalance**
   - **Fix:** isolate hot keys into **dedicated shards**, or use a **compound shard key**.
2. **Cross-shard operations** — a single query touching multiple shards:
   - Single query invokes multiple shards → **DB-heavy / network-heavy**.
   - **Fix:** ① **cache** results of such cross-shard queries, ② **denormalize** to keep related data together, ③ **pre-compute** the data.
3. **Maintaining consistency across shards**
   - **Fix:** ① design to **avoid** cross-shard transactions, ② use **Sagas** for multi-shard operations (distributed, eventually-consistent), ③ **Two-Phase Commit (2PC)** — distributed lock — but it's **slow and not preferred**.

> ⚠️ **Decide when to shard:** only when ① **storage exceeds** one machine, or ② **throughput / load** is too high. Sharding adds real complexity — delay it.

---

## 8. Consistent Hashing

> A hashing scheme that maps both **nodes and keys onto a ring**, so **adding or removing a node only reshuffles a small fraction** of keys (not everything).

- **Why:** plain `hash(key) % N` remaps almost *all* keys when `N` changes. Consistent hashing remaps only `~1/N`.
- **With ease of adding & removing nodes** — minimal data movement.
- **Virtual nodes** — each physical node owns many points on the ring → smooths out uneven distribution.

> 🔑 Used by: load balancers, distributed caches (Redis Cluster), Cassandra, DynamoDB.

---

## 9. Communication Protocols

### Server-to-server
- **REST** — simple, stateless, HTTP. The default.
- **gRPC** — binary (Protobuf), fast, strongly-typed, great for internal microservices.

### Client-to-server (real-time spectrum)

| Protocol | Direction | Use when |
|----------|-----------|----------|
| **REST** | Request/response | Standard CRUD |
| **Long polling** | Client repeatedly asks | Simple "near-real-time," no special infra |
| **WebSockets** | Full-duplex, persistent | Chat, multiplayer, live collaboration |
| **Server-Sent Events (SSE)** | Server → client stream | Live feeds, notifications, stock tickers |

> 🧠 **Pick by need:** one-shot → REST; server pushes occasionally → SSE; two-way continuous → WebSockets; can't change infra → long polling.

---

## 10. Networking Essentials

### OSI layers (top → bottom)
| Layer | Role | Examples |
|-------|------|----------|
| **Application** | App protocols | REST, gRPC, WebSocket |
| **Presentation** | Encoding/encryption | TLS, JSON, Protobuf |
| **Session** | Connection mgmt | Sessions, sockets |
| **Transport** | Reliable delivery | **TCP**, UDP |
| **Network** | Routing | **IP** |
| **Data link** | Frames | MAC, switches |
| **Physical** | Bits on wire | Cables, radio |

### Key infrastructure pieces
- **Load balancer** — distributes traffic; can be **sticky** (session-affinity) so a user keeps hitting the same server.
- **App server / App tier** — stateless compute.
- **Client side vs Server side** — where logic/rendering happens.

### Regionalization
- Serve users from the **same region** (route requests region-locally) → lower latency.
- **Temporal layer / sticky sessions** — keep related requests together.

> 🔑 **TCP vs UDP:** TCP = reliable, ordered (most things); UDP = fast, lossy (video, gaming, DNS).

---

## 11. Handling Failures (Resilience)

> Distributed systems fail partially and constantly. Build for it.

- **Retry with backoff** — retry failed calls with **exponential backoff + jitter** (don't retry instantly or you create a storm).
- **Idempotency** — make operations safe to repeat (idempotency keys) so retries don't double-charge / double-write.
- **Circuit breakers** — stop calling a failing dependency after N failures; "open" the circuit, fail fast, periodically test recovery.

> 🧠 **The trio that always comes up:** *retry-with-backoff + idempotency + circuit breaker.* Mention all three when discussing reliability.

---

## 12. Security

### Authentication vs Authorization
- **Authentication (authn)** — *who are you?* (login).
- **Authorization (authz)** — *what are you allowed to do?* (permissions).

### OAuth 2.0 (delegated authorization)
> **The problem:** a third-party app (e.g., a tweet scheduler) wants to act on your behalf. You **don't** want to give it your password/credentials directly.

> **OAuth = delegation.** Instead of sharing credentials, the app gets a scoped **access token** from the **Auth Server**.

**Flow (Authorization Code):**
```
1. App requests authorization from Auth Server (e.g., Google),
   using its client_id & client_secret.
2. Auth Server authenticates the user, asks the user to grant access.
3. Auth Server gives the app an Auth Code → app exchanges it for a token.
4. App uses the access token to call APIs on the user's behalf.
```
- The **access token** is what the app uses for accessing resources.
- The Auth Server issues the token depending on the **grant type**.

### OpenID Connect (OIDC) — identity on top of OAuth
> **OIDC = OAuth 2.0 + identity.**

- **Why OIDC?** OAuth defines how to **authorize / delegate access to data** — it's about *access*. But many apps just want to **authenticate the user** (let the user log in with Google, etc.).
- **OIDC handles:**
  1. Let the user **log in** (e.g., "Sign in with Google").
  2. **Know who** the user is.
  3. **Trust** that identity (via an **ID token**, a signed JWT).
  4. Handle **SSO** (Single Sign-On) — log in once, access everything, with **user claims**.

> 🔑 **One-liner:** *OAuth = "can this app access my data?"; OIDC = "who is this user / let them log in."*

### Encryption & data protection
- **Encryption in transit** — TLS/HTTPS.
- **Encryption at rest** — encrypt stored data.
- **Data protection** — PII handling, hashing passwords (bcrypt/argon2), secrets management, least-privilege access.

---

## 13. Monitoring & Observability

> You can't fix what you can't see. Three layers:

1. **Infrastructure monitoring** — memory, CPU usage, disk, network.
2. **Application / service monitoring** — **latency, errors** (the golden signals), throughput, saturation.
3. **User-level monitoring** — active users, sessions, connections, business metrics.

> 🧠 **Three pillars of observability:** **metrics** (numbers over time), **logs** (discrete events), **traces** (request path across services).

---

## 14. The Interview Checklist

A quick pass to apply these concepts in any HLD round:

```
1. Requirements    → functional + non-functional (scale, latency, consistency)
2. Estimations     → QPS, storage, bandwidth (back-of-envelope)
3. API design      → endpoints / contracts
4. Data model      → SQL vs NoSQL, schema, shard key (§4, §7)
5. High-level arch  → client → LB → app tier → cache → DB
6. Deep dives:
   ├─ Scaling      → horizontal, stateless app tier (§1)
   ├─ Caching      → strategy + eviction + stampede/hot-key (§6)
   ├─ Consistency  → CAP choice + consistency level (§2)
   ├─ Sharding     → key choice + cross-shard plan (§7)
   ├─ Real-time?   → WebSocket / SSE / long poll (§9)
   ├─ Reliability  → retry+backoff, idempotency, circuit breaker (§11)
   └─ Security     → authn/authz, OAuth/OIDC, encryption (§12)
7. Monitoring      → metrics, logs, traces (§13)
8. Bottlenecks     → identify & justify trade-offs
```

> 🎯 **Golden rule:** state the **trade-off** for every choice. There's no "best" — only "best *for these requirements*."

---

_Revise this top-to-bottom before any HLD round — it's the toolkit you'll keep reaching for._ 🚀
