# 🔍 System Design: Elasticsearch — Interview-Format HLD

> **Compiled & expanded from personal handwritten notes** (with extra detail in the style of Hello Interview deep-dives).
> Framed as a full mock interview: *Functional → Non-Functional → Core Concepts → API → High-Level Design → Deep Dives*.
> Use this both to **design a search engine** *and* to **explain how Elasticsearch works** when it appears as a component in any HLD.

---

## 📑 Table of Contents
1. [What Is Elasticsearch?](#1-what-is-elasticsearch)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Core Concepts & Vocabulary](#4-core-concepts--vocabulary)
5. [API Sketch](#5-api-sketch)
6. [High-Level Design](#6-high-level-design)
7. [Request Flows (Sequence)](#7-request-flows)
8. [Deep Dive 1 — Inverted Index](#8-deep-dive-1--inverted-index)
9. [Deep Dive 2 — Immutable Segments (Lucene)](#9-deep-dive-2--immutable-segments-lucene)
10. [Deep Dive 3 — Sharding & Replication](#10-deep-dive-3--sharding--replication)
11. [Deep Dive 4 — Two-Phase Query (Query → Fetch)](#11-deep-dive-4--two-phase-query)
12. [Deep Dive 5 — Relevance Scoring (TF-IDF / BM25)](#12-deep-dive-5--relevance-scoring)
13. [Deep Dive 6 — Doc Values (Sort & Aggregate)](#13-deep-dive-6--doc-values)
14. [When (and When NOT) to Use Elasticsearch](#14-when-and-when-not-to-use-elasticsearch)
15. [Quick Revision Triggers](#15-quick-revision-triggers)

---

## 1. What Is Elasticsearch?

> **Elasticsearch is a distributed search engine — NOT a database.**

- Built on **Apache Lucene**; stores **documents** and makes them **searchable in near-real-time**.
- Optimized for **full-text search, filtering, and aggregations** over large volumes of data.
- Best for **read-heavy** workloads; **not** the system of record for write-heavy, strongly-consistent data.

> 🔑 **One-liner:** "A search engine, not a database — it trades strict consistency/durability for fast, rich search."

---

## 2. Functional Requirements

**Core (in scope):**
1. **Index documents** — ingest JSON documents, each with a unique ID.
2. **Full-text search** — query by keywords and return the most **relevant** documents (ranked).
3. **Filtering** — exact-match / range filters (e.g., `price < 100`, `category = shoes`).
4. **Sorting** — order results by a field (price, date, relevance).
5. **Aggregations** — counts, averages, facets/histograms over fields.
6. **Near-real-time** availability — a newly indexed doc becomes searchable shortly after write.

**Out of scope (call this out):**
- ACID transactions, joins across documents, being the primary source of truth.

---

## 3. Non-Functional Requirements

| Attribute | Target / Decision |
|-----------|-------------------|
| **Workload shape** | **Read-heavy**, search-dominated — *not* write-heavy |
| **Latency** | Low-latency search (tens of ms) even over billions of docs |
| **Scalability** | Horizontal — scale by adding nodes/shards |
| **Availability** | High — replicas keep search up if a node fails |
| **Consistency** | **Eventual / near-real-time** (not strongly consistent) |
| **Durability** | "Good enough" (translog + replicas) — **weaker than a DB** |
| **Throughput** | High query throughput via shard parallelism & caching |

> ⚠️ **Trade-off to state explicitly:** Elasticsearch favors **availability & search performance** over **strong consistency & durability** (CAP → leans AP). Use a real DB as the source of truth and ES as a search index alongside it.

---

## 4. Core Concepts & Vocabulary

| Term | Meaning |
|------|---------|
| **Document** | The unit of data — a **JSON** object with a **unique ID**. |
| **Index** | A logical collection of similar documents (like a "table"). Defines **which fields** exist. |
| **Mapping** | The **schema** for an index — field names, types, and how they're analyzed (this is what makes fields searchable). |
| **Shard** | A horizontal slice of an index; **a full Lucene index** itself. Enables scale & parallelism. |
| **Replica** | A copy of a shard for **HA + read throughput**. |
| **Segment** | An **immutable** Lucene file holding indexed data inside a shard. |
| **Inverted index** | Maps **term → list of document IDs** (the heart of full-text search). |
| **Doc values** | **Column-oriented** on-disk structure for **sorting & aggregations**. |

> 🧠 **Hierarchy:** `Index → Shards → Segments → (Inverted index + Doc values)`.

---

## 5. API Sketch

```http
# Index a document
PUT  /products/_doc/{id}
{ "name": "Running Shoes", "price": 79.99, "brand": "Acme" }

# Search (full-text + filter + sort + aggregate)
POST /products/_search
{
  "query": {
    "bool": {
      "must":   [{ "match": { "name": "running shoes" } }],
      "filter": [{ "range": { "price": { "lte": 100 } } }]
    }
  },
  "sort": [{ "price": "asc" }],
  "aggs": { "by_brand": { "terms": { "field": "brand" } } }
}
```

- **`match`** → full-text (analyzed, relevance-scored).
- **`filter`** → exact/range (cacheable, **no scoring**).
- **`aggs`** → analytics powered by **doc values**.

---

## 6. High-Level Design

### Node roles (a distributed cluster of specialized nodes)

| Node | Responsibility |
|------|----------------|
| **Master node** | **Admin/control plane** — cluster state, **add/remove nodes**, shard allocation. Not in the data path. |
| **Coordinating node** | The **router/controller** — receives client requests, **fans out** to data nodes, **merges** results. (Every node can coordinate.) |
| **Data node** | **Stores the actual data** (shards/segments); executes index & search ops. |
| **Ingest node** | **Data ingestion & index creation** — runs ingest pipelines (transform/enrich docs) before indexing. |

```
                         ┌─────────────────┐
        client  ───────▶ │ Coordinating    │  (router + merger)
                         │   node          │
                         └───────┬─────────┘
                fan-out / scatter │  ▲ gather / merge
              ┌───────────────────┼───┴───────────────────┐
              ▼                   ▼                        ▼
        ┌──────────┐        ┌──────────┐             ┌──────────┐
        │ Data node│        │ Data node│             │ Data node│
        │ shard P0 │        │ shard P1 │             │ shard P2 │
        │ +replicas│        │ +replicas│             │ +replicas│
        └──────────┘        └──────────┘             └──────────┘

   Master node ── manages cluster state / shard allocation (out of data path)
   Ingest node ── transforms & enriches docs before they hit data nodes
```

> 🔑 **Mental model:** **coordinating node = scatter-gather**; **data nodes = parallel workers**; **master = the brain that doesn't touch data**.

---

## 7. Request Flows

### Indexing (write) flow
```
1. Client sends doc → Coordinating/Ingest node
2. Ingest pipeline processes the doc (optional transforms)
3. Routed to the PRIMARY shard (by hash of doc id)
4. Primary writes locally, then replicates to REPLICA shards
5. Replicas ACK → primary ACK → coordinating node
6. "doc indexed" → searchable after the next refresh (near-real-time)
```

### Search (read) flow — **two phases** (see §11)
```
1. Client → Coordinating node
2. QUERY phase: planner fans out to one copy of EACH shard;
   each shard uses its inverted index to return top doc IDs + scores
3. Coordinating node MERGES partial results → global top-K
4. FETCH phase: fetch the full source for just those top-K docs
5. Merge & return to client
```

> 🧠 The coordinating node is a **Query Planner** that does **scatter (query) → gather/merge → fetch**.

---

## 8. Deep Dive 1 — Inverted Index

> **The core data structure that makes search fast.**

- A normal index maps **doc → content**. An **inverted index** flips it: **term → list of document IDs** containing that term.

```
Documents:
  doc1: "running shoes"
  doc2: "running shorts"

Inverted index:
  "running" → [doc1, doc2]
  "shoes"   → [doc1]
  "shorts"  → [doc2]
```

- Searching for `"running"` is a **direct lookup** → the posting list `[doc1, doc2]`, instead of scanning every document.
- Each term also stores frequency/position info used for **relevance scoring** (§12).

> 🔑 Turns "find docs containing word X" from an **O(N) scan** into an **~O(1) lookup** of the term's posting list.

---

## 9. Deep Dive 2 — Immutable Segments (Lucene)

> Inside each shard, data lives in **segments** — **immutable** containers of indexed data.

### How writes work with immutability
- New/updated docs are written to **new segments**; existing segments are **never modified in place**.
- An **update** = mark the old doc **deleted** (tombstone) + write a **new** version → so **data may have stale entries** until cleanup.
- Periodically, a **merge** process combines small segments into bigger ones and **purges deleted docs** ("update happens once in a while, during merging — especially when segments get huge").

### Why immutability is a great design — the benefits
1. **Improved write performance** — append-only, sequential writes (no in-place updates).
2. **Efficient caching** — immutable files can be cached aggressively / memory-mapped.
3. **Simplified concurrency** — readers never block writers (no locks on changing data).
4. **Faster recovery** — immutable files are easy to replicate/restore.
5. **Faster searching** — optimized, read-only structures.

> ⚠️ **Cost of immutability:** updates/deletes aren't instant (tombstones + merge), and merges consume I/O. This is part of why ES is **near-real-time**, not strongly consistent.

---

## 10. Deep Dive 3 — Sharding & Replication

- An index is split into **primary shards** → enables **horizontal scale** and **parallel search**.
- A document is routed to a shard by `hash(doc_id) % num_primary_shards`.
- Each primary has **replica shards**:
  - **High availability** — if a node dies, a replica is promoted.
  - **Read throughput** — searches can hit replicas too.
- The **master node** decides **shard allocation** and rebalances on node add/remove.

> 🔑 **Shards = scale + parallelism; replicas = availability + read scaling.** Number of primary shards is fixed at index creation (resharding = reindex).

---

## 11. Deep Dive 4 — Two-Phase Query

> Search runs in **two phases** so we don't ship full documents from every shard.

**Phase 1 — Query phase** (the "**query**" phase to get relevant docs using the index):
- Coordinating node sends the query to **one copy of each shard**.
- Each shard uses its **inverted index** to find matches and returns just **doc IDs + relevance scores** (cheap).
- Coordinating node **merges** these and computes the **global top-K**.

**Phase 2 — Fetch phase** (to get all the actual docs):
- Coordinating node asks the relevant shards for the **full `_source`** of only the **top-K** docs.
- Merges and returns the final results.

> 🧠 **Why two phases?** Scoring across millions of docs is cheap (IDs + scores), but materializing full documents is expensive — so we only fetch the **K we actually return**.

---

## 12. Deep Dive 5 — Relevance Scoring

> How does ES decide which document is "most relevant"? → **TF-IDF** (and its successor **BM25**, the modern default).

### TF-IDF = Term Frequency × Inverse Document Frequency
- **Measures the importance of a word in a document** (relative to the whole corpus).
- **Score = TF × IDF** (product of the two):

$$\text{score}(t, d) = \underbrace{\text{tf}(t, d)}_{\text{how often } t \text{ in } d} \times \underbrace{\log\frac{N}{\text{df}(t)}}_{\text{how rare } t \text{ is overall}}$$

- **TF (Term Frequency)** ↑ — the more a term appears **in this document**, the more relevant.
- **IDF (Inverse Document Frequency)** ↑ — the **rarer** a term is **across all documents**, the more it discriminates (common words like "the" get low weight).

> 💡 **Intuition:** a word that appears **often in this doc** but **rarely elsewhere** is a strong signal of relevance. Modern ES uses **BM25**, a refined TF-IDF that dampens term-frequency saturation and accounts for document length.

---

## 13. Deep Dive 6 — Doc Values

> **Inverted index** is great for *search* (term → docs), but bad for *"give me this one field's value for sorting/aggregating."* → **Doc values** solve that.

- **Doc values** store a **single field's values column-wise** (e.g., just `price`) — a **column-based structure**.
- Used for **sorting** (`sort by price`) and **aggregations** (`avg price`, `terms by brand`) — *"when you need only one field like price."*
- Column layout = scan one field's values densely and fast, without touching the rest of the document.

> 🔑 **Two complementary structures:** **inverted index** answers *"which docs match?"*; **doc values** answer *"what's this field's value, fast, for many docs?"* (sort/aggregate).

---

## 14. When (and When NOT) to Use Elasticsearch

### ✅ Use it for
- **Read-heavy** search workloads (full-text search, autocomplete, log/observability search, faceted filtering, analytics dashboards).

### ❌ Don't use it as
- A **primary database / source of truth**.
- **Write-heavy**, transactional, or strongly-consistent workloads.

### Why (the limitations to state)
- **Not a database** — **issues with consistency & durability** (near-real-time, eventual; weaker durability than a DB).
- **Best for read-heavy, not write-heavy** — immutable segments + merges make heavy updates costly.

> 🎯 **The standard pattern:** keep the source of truth in a real DB (Postgres/Cassandra), then **stream changes (CDC) into Elasticsearch** to serve search/analytics. ES is a **secondary, derived index**, not the system of record.

---

## 15. Quick Revision Triggers

> Skim these one-liners right before the interview:

- **What is it?** Distributed **search engine**, built on Lucene — *not* a database.
- **Nodes:** Master (admin/cluster state) · Coordinating (router/merger) · Data (stores shards) · Ingest (pipelines).
- **Hierarchy:** Index → Shards → Segments → (Inverted index + Doc values).
- **Inverted index** → `term → [doc IDs]` → search ≈ O(1) lookup.
- **Segments are immutable** → fast writes, caching, concurrency, recovery, search; updates via tombstone + **merge**.
- **Search = 2 phases:** Query (IDs + scores, scatter→merge) → Fetch (full docs for top-K).
- **Relevance = TF-IDF / BM25** → TF × IDF (frequent here, rare overall = relevant).
- **Doc values** = column store for **sort & aggregate** (one field like price).
- **Shards** = scale/parallelism; **Replicas** = HA + read throughput.
- **Use for read-heavy search**, *not* as a write-heavy strongly-consistent DB; pair with a real DB via **CDC**.

---

_Pair this with [HLD_Core_Concepts.md](HLD_Core_Concepts.md) (indexing, CAP, caching) and [HLD_Patterns.md](HLD_Patterns.md) (scaling reads, CDC) for the full picture._ 🚀
