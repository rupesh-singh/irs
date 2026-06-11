# Airbnb — Software Engineer Interview Preparation Guide

## Table of Contents

1. [Interview Process Overview](#1-interview-process-overview)
2. [Company Context & Engineering Culture](#2-company-context--engineering-culture)
3. [Round-by-Round Breakdown](#3-round-by-round-breakdown)
4. [DSA Questions (Recently Asked 2025–2026)](#4-dsa-questions-recently-asked-20252026)
5. [System Design Questions](#5-system-design-questions)
6. [Low Level Design (LLD) Questions](#6-low-level-design-lld-questions)
7. [Behavioral / Core Values Questions](#7-behavioral--core-values-questions)
8. [Preparation Strategy](#8-preparation-strategy)

---

## 1. Interview Process Overview

**Airbnb = Senior Software Engineer (IC track)**

Typical timeline: **3–5 weeks** end-to-end.

| Stage | Format | Duration | Focus |
|-------|--------|----------|-------|
| **Recruiter Screen** | Phone/Video | 30 min | Background, motivation, role fit |
| **Technical Phone Screen** | CoderPad | 45–60 min | 1–2 DSA problems (Med–Hard) |
| **Onsite / Virtual Loop** | 4–5 rounds | 45–60 min each | DSA + System Design + Behavioral |
| → Coding Round 1 | CoderPad | 60 min | 1–2 DSA problems |
| → Coding Round 2 | CoderPad | 60 min | 1–2 DSA problems |
| → System Design | Whiteboard/Virtual | 60 min | Large-scale distributed system |
| → Cross-Functional / Past Experience | Conversational | 45–60 min | Technical depth on past work |
| → Core Values Interview | Conversational | 45–60 min | Belong Anywhere, Champion the Mission |
| **Hiring Committee** | Internal | — | Leveling decision |

> **Key Insight:** Airbnb places **heavy emphasis on culture fit and core values**. The values interview is not just behavioral — it can make or break your candidacy even with strong technical rounds.

> **Key Insight:** Airbnb coding interviews often involve **practical system building** (e.g., "Design Excel formulas", "Build a payment system") — not just pure algorithmic puzzles.

---

## 2. Company Context & Engineering Culture

### What Airbnb Builds
- **Search & Discovery** — property search with complex ranking (price, location, quality, reviews)
- **Booking & Payments** — reservation management, dynamic pricing, multi-currency payments
- **Trust & Safety** — fraud detection, identity verification, risk scoring
- **Host Tools** — listing management, calendar, pricing suggestions, analytics
- **Messaging** — real-time host↔guest communication
- **Experiences** — activities marketplace beyond stays
- **Infrastructure** — service mesh, data platform, ML infrastructure

### Tech Stack
- **Languages:** Java (primary backend), Kotlin, TypeScript/React (frontend), Python (ML/data)
- **Infrastructure:** Kubernetes, gRPC, Thrift, Kafka, Airflow
- **Storage:** MySQL, DynamoDB, Redis, Elasticsearch, Hive
- **Data:** Spark, Presto, custom data pipelines (Minerva)
- **Service Architecture:** SOA / Microservices, service mesh
- **ML/AI:** Real-time ML scoring for search ranking, pricing, fraud
- **Unique:** Airbnb is known for **strong frontend engineering** and design culture

### Core Values (Critical for Interview)
1. **Champion the Mission** — "Belong Anywhere" drives all decisions
2. **Be a Host** — Care for others, empathy, hospitality mindset
3. **Embrace the Adventure** — Growth mindset, comfortable with ambiguity
4. **Be a Cereal Entrepreneur** — Resourceful, scrappy, creative problem-solving
5. **Simplify** — Reduce complexity, clear communication

---

## 3. Round-by-Round Breakdown

### 3.1 Coding Rounds

**What makes Airbnb coding unique:**
- Problems are often **practical/applied** rather than pure algorithmic puzzles
- Emphasis on building small systems (spreadsheet formulas, payment processors)
- **Clean code quality** is strongly evaluated — Airbnb has high code standards
- You're expected to **handle edge cases** thoroughly
- Interviewers care about **communication and thought process**

**Key patterns from recent interviews (2025–2026):**

| Pattern | Frequency | Notes |
|---------|-----------|-------|
| Graph (BFS/DFS/Union-Find) | ★★★★★ | Connected components, traversal |
| DP + Binary Search | ★★★★☆ | Interval scheduling, optimization |
| Design-style coding (build a system) | ★★★★☆ | Spreadsheet, payment processor |
| BFS/Queue-based exploration | ★★★★☆ | State-space search, unlocking |
| Tree / Hierarchy (LCA variants) | ★★★☆☆ | Region trees, organizational |
| Backtracking / DFS with pruning | ★★★☆☆ | Shopping offers, combinations |
| Union-Find / Connected Components | ★★★☆☆ | Account merge, grouping |

### 3.2 System Design Round

Airbnb system design focuses heavily on:
- **Booking systems** — availability, double-booking prevention, waitlists
- **Real-time communication** — chat, notifications, presence
- **Scheduling** — job execution, cron, distributed coordination
- **Trust & Safety** — fraud detection, anomaly detection
- **Search & Discovery** — ranking, filtering, geospatial

### 3.3 Core Values Interview

Not optional — **this round has veto power**. Prepare 5–6 stories demonstrating:
- Times you went above and beyond for users/teammates
- How you handled ambiguity and took initiative
- Creative problem-solving with limited resources
- Simplifying complex problems for others
- Cross-team collaboration and empathy

---

## 4. DSA Questions (Recently Asked 2025–2026)

### 4.1 Confirmed Questions from Hello Interview & Other Sources

#### System-Building / Applied Problems (Airbnb Signature Style)

| # | Problem | LC # | Difficulty | Level | Last Asked |
|---|---------|------|------------|-------|------------|
| 1 | **Design Excel Sum Formula** | 631 | Hard | Mid–Senior | Mid May 2026 |
| 2 | **Build a Payment Management System** | Custom | Hard | Mid–Senior | Mid May 2026 |
| 3 | **Maximum Candies from Boxes** | 1298 | Hard | Mid–Senior | Mid May 2026 |

> **LC 631 — Design Excel Sum Formula:** Design a spreadsheet supporting `set`, `get`, and `sum` operations where sum formulas can reference cells and ranges. Core challenge: maintaining a **dependency graph** and efficiently propagating updates when cells change. Think topological sort on a DAG of cell dependencies.

> **LC 1298 — Maximum Candies from Boxes:** BFS/queue-based exploration — repeatedly open boxes (already open or have key), collect candies/keys/contained boxes. Dynamically unlocking new nodes until exhausted. Classic state-space BFS.

> **Payment Management System:** Process transactions prioritized by type (credit > credit card > PayPal). For each type, process refunds only for latest timestamp. Requires careful data structure design — priority queue + timestamp sorting + refund linking.

#### Graph / Union-Find Problems

| # | Problem | LC # | Difficulty | Level | Last Asked |
|---|---------|------|------------|-------|------------|
| 4 | **Accounts Merge** | 721 | Medium | Mid–Senior | Early Apr 2026 |
| 5 | **Detonate the Maximum Bombs** | 2101 | Medium | Senior | Early Apr 2026 |
| 6 | **Smallest Common Region** | 1257 | Medium | Senior | Late Apr 2026 |

> **LC 721 — Accounts Merge:** Union-Find classic. Group accounts sharing any email. Build graph where emails are nodes connected if in same account, then find connected components. Return person name + sorted unique emails per component.

> **LC 2101 — Detonate Maximum Bombs:** Build directed graph (edge i→j if bomb j's center within bomb i's radius). Find max reachability from any start node. With n ≤ 100, O(n²) BFS/DFS from each node is fine.

> **LC 1257 — Smallest Common Region:** LCA on a tree defined by parent→children relationships (but with strings instead of nodes). Build parent map, then walk up from both regions to find first common ancestor.

#### DP / Optimization Problems

| # | Problem | LC # | Difficulty | Level | Last Asked |
|---|---------|------|------------|-------|------------|
| 7 | **Maximum Profit in Job Scheduling** | 1235 | Hard | Senior | Mid May 2026 |
| 8 | **Shopping Offers** | 638 | Medium | Senior | Late Apr 2026 |

> **LC 1235 — Maximum Profit in Job Scheduling:** Weighted interval scheduling — sort jobs by end time, DP where `dp[i]` = max profit considering first i jobs. Binary search to find last non-conflicting job. O(n log n).

> **LC 638 — Shopping Offers:** Small-dimensional DFS/backtracking with memoization. State = current needs vector (max 6 items, each ≤ 6 qty). Try each bundle offer or buy individually. Prune states exceeding needs.

### 4.2 Additional High-Probability Questions (Based on Airbnb's Domain)

Based on Airbnb's engineering blog, past interview reports, and domain relevance:

#### Booking/Calendar Problems

| # | Problem | LC # | Difficulty | Why Relevant |
|---|---------|------|------------|--------------|
| 9 | **My Calendar I/II/III** | 729/731/732 | Med–Hard | Booking overlap detection |
| 10 | **Meeting Rooms II** | 253 | Medium | Resource scheduling |
| 11 | **Merge Intervals** | 56 | Medium | Date range handling |
| 12 | **Insert Interval** | 57 | Medium | Calendar modifications |
| 13 | **Non-overlapping Intervals** | 435 | Medium | Booking optimization |

#### Search / Discovery / Ranking

| # | Problem | LC # | Difficulty | Why Relevant |
|---|---------|------|------------|--------------|
| 14 | **Search Suggestions System** | 1268 | Medium | Typeahead/autocomplete |
| 15 | **K Closest Points to Origin** | 973 | Medium | Geospatial proximity |
| 16 | **Top K Frequent Elements** | 347 | Medium | Ranking/popularity |
| 17 | **Design Search Autocomplete System** | 642 | Hard | Search UX |

#### Graph / Connectivity

| # | Problem | LC # | Difficulty | Why Relevant |
|---|---------|------|------------|--------------|
| 18 | **Number of Connected Components** | 323 | Medium | Grouping listings |
| 19 | **Redundant Connection** | 684 | Medium | Union-Find |
| 20 | **Word Ladder** | 127 | Hard | Shortest path transformation |
| 21 | **Clone Graph** | 133 | Medium | Deep copy of structures |

#### String / Parsing / Practical

| # | Problem | LC # | Difficulty | Why Relevant |
|---|---------|------|------------|--------------|
| 22 | **Basic Calculator II** | 227 | Medium | Expression evaluation |
| 23 | **Decode String** | 394 | Medium | Template/parsing |
| 24 | **Simplify Path** | 71 | Medium | URL processing |
| 25 | **Text Justification** | 68 | Hard | Display formatting |

### 4.3 Screening Question Prediction

> 🎯 **HIGH PROBABILITY (Must-solve):**
> 1. A **system-building problem** — Excel formulas (LC 631), payment system, or similar "design + code" hybrid
> 2. A **Graph/Union-Find** problem — Accounts Merge (LC 721), Detonate Bombs (LC 2101)
> 3. A **BFS state exploration** — Maximum Candies from Boxes (LC 1298) or similar

> 🔶 **MEDIUM PROBABILITY:**
> 4. **Weighted Interval Scheduling** — Job Scheduling (LC 1235) or booking conflicts
> 5. A **Tree/LCA** problem — Smallest Common Region (LC 1257)
> 6. A **Backtracking/Memoization** — Shopping Offers (LC 638)

> 🔷 **LOWER BUT POSSIBLE:**
> 7. **Calendar overlap** problems (LC 729/731/732)
> 8. **String parsing** / expression evaluation

---

## 5. System Design Questions

### 5.1 Recently Asked System Design (2025–2026 Confirmed)

| # | Topic | Level | Reports | Last Asked |
|---|-------|-------|---------|------------|
| 1 | **Design a Chat/Messaging System** | Mid–Staff, Manager | 12 reports | Late May 2026 |
| 2 | **Design a Booking Waitlist System** | Senior–Staff, Sr Manager | 5 reports | Late May 2026 |
| 3 | **Design a Job Scheduler** | Mid–Principal | 7 reports | Mid May 2026 |
| 4 | **Design a Reservation System for Airbnb** | Mid–Staff, Manager | 9 reports | Early May 2026 |
| 5 | **Design a Notification System** | Mid–Principal | 14 reports | Early May 2026 |
| 6 | **Design Vaccine Eligibility & Booking Flow** | Senior–Staff, Manager | 4 reports | Late Apr 2026 |
| 7 | **Design a Fraud Detection System** | Staff–Principal | 2 reports | Early Apr 2026 |

### 5.2 Deep Dive: Design a Chat/Messaging System

**Most frequently reported (12 reports, May 2026)**

**Functional Requirements:**
- 1:1 and group conversations
- Real-time message delivery (< 200ms latency)
- Message delivery status: sent → delivered → read
- User presence (online/offline/last seen)
- Conversation history with pagination
- Media attachments (images, files)
- Push notifications for offline users

**Non-Functional Requirements:**
- Scale to millions of concurrent connections
- Message ordering guarantees (per conversation)
- At-least-once delivery with client-side dedup
- 99.99% availability
- Multi-device sync
- End-to-end encryption (optional, good to mention)

**High-Level Architecture:**
```
Client (WebSocket) → API Gateway → Chat Service → Message Store (Cassandra)
                                  ↘ Presence Service (Redis)
                                  ↘ Notification Service (FCM/APNs)
                                  ↘ Group Service → Fan-out writes

Message Flow:
  Sender → WebSocket Gateway → Routing Service → Recipient Gateway → Recipient
                             ↘ Persist to Message Store
                             ↘ If offline → Push Notification Queue
```

**Key Components:**
- **WebSocket Gateway:** Maintains persistent connections, routes messages to correct server
- **Chat Service:** Message validation, ordering (per-conversation sequence IDs), fanout for groups
- **Presence Service:** Redis with TTL-based heartbeats, pub/sub for status changes
- **Message Store:** Cassandra (partition by conversation_id, cluster by timestamp) or similar
- **Notification Service:** Queue-based, handles offline delivery via FCM/APNs
- **Group Service:** Manages membership, handles fan-out (write to each member's inbox)
- **Media Service:** S3 + CDN for attachments, presigned upload URLs
- **Sync Service:** For multi-device — last-read pointer per device

**Key Design Decisions:**
- **Push vs Pull:** Push via WebSocket for online users, pull (with push notification trigger) for offline
- **Fan-out on write vs read:** For small groups (< 100), fan-out on write. For large groups, fan-out on read
- **Message ordering:** Sequence IDs per conversation, not global timestamps
- **Delivery receipts:** Piggyback on WebSocket ACKs, batch status updates

**Scaling Considerations:**
- Shard WebSocket connections by user_id hash
- Consistent hashing for connection routing
- Message store sharded by conversation_id
- Rate limiting per user (anti-spam)
- Connection draining during deployments

---

### 5.3 Deep Dive: Design a Booking Waitlist System

**Airbnb-specific (5 reports, May 2026)**

**Functional Requirements:**
- Users join waitlists for unavailable dates on specific properties
- Hosts see waitlist demand per listing/date range
- Automatic notification when booking becomes available (cancellation)
- Priority ordering (first-come-first-served or by host preference)
- Expiry: waitlist entries expire after a configurable window
- One-click booking from waitlist notification

**Non-Functional Requirements:**
- Handle millions of waitlist entries globally
- Near real-time notification on cancellation (< 30s)
- Prevent double-booking during waitlist → booking conversion
- Fair ordering — no race conditions between waitlisted users
- Analytics: demand signals for pricing/availability optimization

**High-Level Architecture:**
```
Waitlist Service → Waitlist Store (DynamoDB/Redis)
                ↘ Event Bus (Kafka)

Cancellation Event → Event Consumer → Waitlist Matcher → Notification Service
                                     ↘ Reservation Lock (Redis distributed lock)
                                     ↘ Booking Service (with TTL hold)
```

**Key Design Decisions:**
- **Queue per listing+date range:** Each (listing_id, date_range) has a priority queue
- **Cancellation trigger:** Booking Service emits CancellationEvent → Kafka → Waitlist Consumer
- **Fairness:** Offer to first-in-queue with a time-limited hold (e.g., 15 min), then cascade to next
- **Distributed locking:** Redis lock on (listing_id, dates) during offer window to prevent double-booking
- **Demand signals:** Waitlist depth → dynamic pricing input, host dashboard analytics

---

### 5.4 Deep Dive: Design a Job Scheduler

**Frequently asked (7 reports, May 2026)**

**Functional Requirements:**
- 10,000+ jobs per second throughput
- Scheduled (cron-based) and ad-hoc job execution
- Retry with configurable backoff on failure
- Execution history retention (1 year)
- Job priorities and dependencies (DAG)
- At-least-once execution guarantee
- Job cancellation and pause/resume

**Non-Functional Requirements:**
- Exactly-once semantics (idempotent execution)
- Sub-second scheduling accuracy for time-critical jobs
- Horizontal scaling (no single point of failure)
- Multi-tenant isolation
- Observability (metrics, alerting on failures)

**High-Level Architecture:**
```
Job API → Job Store (MySQL/Postgres) → Scheduler Nodes (leader election)
                                      → Worker Pool (auto-scaling)
                                      → Result Store (S3/DB)
                                      → Dead Letter Queue

Scheduler:
  Tick Loop → Query due jobs → Enqueue to Worker Queue (Redis/SQS)
  Cron Parser → Pre-compute next run times → Priority Queue (sorted by next_fire_time)

Worker:
  Dequeue → Execute → Report result → ACK/retry
```

**Key Components:**
- **Job Store:** Persists job definitions, cron expressions, metadata (partitioned by tenant)
- **Scheduler Service:** Multiple instances with leader election (Zookeeper/etcd), only leader schedules
- **Time Wheel / Sorted Set:** Efficient scheduling via Redis ZSET (score = next_fire_time)
- **Worker Pool:** Auto-scaling containers, pull-based consumption from queue
- **Execution Ledger:** Append-only log of all executions for history/audit
- **DLQ + Alerting:** Failed jobs after max retries → dead letter → alert

**Key Design Decisions:**
- **Sharded schedulers:** Partition jobs by hash for horizontal scaling
- **Clock drift:** Use logical clocks + NTP sync, allow ±1s tolerance
- **Idempotency:** Each execution gets unique ID, workers check before running
- **Backpressure:** Rate limit per tenant, queue depth monitoring → scale workers

---

### 5.5 Deep Dive: Design a Reservation System for Airbnb

**Directly domain-relevant (9 reports, May 2026)**

**Functional Requirements:**
- Search properties by location, dates, guests, amenities, price range
- View property details, photos, reviews, availability calendar
- Make instant bookings or send booking requests (host approval)
- Manage reservations (modify dates, cancel with policy enforcement)
- Payment integration (hold → capture on confirmation)
- Host calendar management (block dates, sync with external calendars)

**Non-Functional Requirements:**
- Handle 100K+ concurrent searches
- Prevent double-booking (strong consistency on booking path)
- Search latency < 200ms (p99)
- Booking confirmation < 2s end-to-end
- Support seasonal traffic spikes (10x during holidays)

**High-Level Architecture:**
```
Search Flow:
  Client → API Gateway → Search Service (Elasticsearch) → Ranking Service (ML) → Results

Booking Flow:
  Client → Booking Service → Availability Check (strong consistency)
                           → Payment Service (hold funds)
                           → Reservation Store (write)
                           → Notification Service (confirm host + guest)
                           → Calendar Sync Service

Availability Store:
  listing_id + date → status (available/booked/blocked)
  Optimistic locking or distributed lock on (listing_id, date_range)
```

**Key Design Decisions:**
- **Availability:** Use date-level granularity. Store as (listing_id, date) → status. Check contiguous availability for range queries
- **Double-booking prevention:** Optimistic concurrency (version column) or SELECT FOR UPDATE on date rows
- **Payment flow:** Two-phase — hold on booking request, capture on host confirmation (or auto after 24h)
- **Search vs Book consistency:** Search uses eventually-consistent cache (Elasticsearch). Booking path reads from source of truth (MySQL/Postgres)
- **Cancellation policy:** Configurable per listing (flexible/moderate/strict), affects refund calculation

---

### 5.6 Deep Dive: Design a Notification System

**Most reported (14 reports, May 2026)**

**Functional Requirements:**
- Individual and bulk notifications (up to millions of recipients)
- Multiple channels: push, email, SMS, in-app
- Two tiers: critical (1:1 chat, booking confirmations) and promotional (recommendations)
- Delivery tracking and read receipts
- User notification preferences (opt-out, quiet hours)
- Notification expiration (TTL-based)

**Non-Functional Requirements:**
- 1M notifications/second peak throughput
- Critical notifications: < 1s delivery latency
- Promotional: best-effort, within minutes
- 80/20 split (80% promotional, 20% critical)
- Deduplication (no repeat sends)
- Rate limiting per user

**Architecture:**
```
Producers → Priority Router → Critical Queue (low-latency) → Delivery Workers → Channels
                            → Bulk Queue (high-throughput)  → Batch Workers → Channels

Channels: FCM (Android), APNs (iOS), SES (Email), Twilio (SMS), WebSocket (In-app)

Dedup: Redis set of (user_id, notification_hash, TTL)
Preferences: User preference store, checked before delivery
Rate Limiter: Token bucket per user per channel
```

**Key Design Decisions:**
- **Two-lane architecture:** Separate queues for critical vs promotional (different SLAs)
- **Fan-out for bulk:** Promotional targeting thousands → expand to individual entries at queue level
- **Template engine:** Notifications stored as templates + data, rendered at delivery time
- **Failure handling:** Retry with exponential backoff, fall back to alternate channel
- **Analytics:** Track sent/delivered/opened/clicked per notification type

---

### 5.7 Other Possible System Design Topics

| # | Topic | Relevance |
|---|-------|-----------|
| 8 | **Design a Search/Ranking System** | Core Airbnb — property discovery |
| 9 | **Design a Review/Rating System** | Trust & quality signals |
| 10 | **Design a Dynamic Pricing System** | Smart pricing for hosts |
| 11 | **Design an Identity Verification System** | Trust & safety |
| 12 | **Design a Content Delivery Network** | Photo/media serving at scale |
| 13 | **Design Vaccine Eligibility & Booking** | Inventory + rules engine |
| 14 | **Design a Fraud Detection System** | Real-time ML scoring pipeline |

---

## 6. Low Level Design (LLD) Questions

### 6.1 LLD Questions Relevant to Airbnb Domain

| # | Problem | Key Patterns | Difficulty |
|---|---------|-------------|------------|
| 1 | **Design a Reservation/Booking System** | State machine, concurrency, strategy (cancellation policies) | Hard |
| 2 | **Design a Chat/Messaging System** | Observer, message queue, delivery guarantees | Medium |
| 3 | **Design a Notification System** | Observer, strategy (channels), template method | Medium |
| 4 | **Design a Payment Processing System** | State machine, strategy (payment methods), idempotency | Hard |
| 5 | **Design a Rate Limiter** | Token bucket, sliding window, decorator | Medium |
| 6 | **Design a Job/Task Scheduler** | Priority queue, state machine, command pattern | Medium |
| 7 | **Design a Search Filter System** | Composite, strategy, builder (query construction) | Medium |
| 8 | **Design a Review & Rating System** | Observer, aggregation, moderation pipeline | Easy |
| 9 | **Design a Calendar/Availability System** | Interval tree, range queries, sync conflicts | Medium |
| 10 | **Design a Waitlist/Queue System** | Priority queue, observer, state machine | Medium |

### 6.2 LLD Deep Dive: Reservation System

```java
// ── Core Enums ──
enum BookingStatus { PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, EXPIRED }
enum CancellationPolicy { FLEXIBLE, MODERATE, STRICT, SUPER_STRICT }
enum PaymentStatus { PENDING, AUTHORIZED, CAPTURED, REFUNDED, FAILED }

// ── Core Entities ──
class Listing {
    private String id;
    private String hostId;
    private String title;
    private Address location;
    private int maxGuests;
    private double pricePerNight;
    private CancellationPolicy cancellationPolicy;
    private List<Amenity> amenities;
    private AvailabilityCalendar calendar;

    public boolean isAvailable(LocalDate checkIn, LocalDate checkOut) {
        return calendar.isAvailable(checkIn, checkOut);
    }
}

class AvailabilityCalendar {
    private String listingId;
    private Map<LocalDate, DayStatus> days; // date → AVAILABLE/BOOKED/BLOCKED

    public boolean isAvailable(LocalDate from, LocalDate to) {
        for (LocalDate d = from; d.isBefore(to); d = d.plusDays(1)) {
            if (days.getOrDefault(d, DayStatus.AVAILABLE) != DayStatus.AVAILABLE)
                return false;
        }
        return true;
    }

    public synchronized void blockDates(LocalDate from, LocalDate to) {
        for (LocalDate d = from; d.isBefore(to); d = d.plusDays(1)) {
            days.put(d, DayStatus.BOOKED);
        }
    }
}

class Reservation {
    private String id;
    private String guestId;
    private String listingId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private int guests;
    private BookingStatus status;
    private PaymentInfo payment;
    private LocalDateTime createdAt;

    public int getNights() {
        return (int) ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    public double getTotalPrice(double pricePerNight) {
        return getNights() * pricePerNight;
    }
}

// ── Cancellation Strategy Pattern ──
interface CancellationStrategy {
    double calculateRefund(Reservation reservation, LocalDate cancelDate);
}

class FlexibleCancellation implements CancellationStrategy {
    public double calculateRefund(Reservation res, LocalDate cancelDate) {
        // Full refund if cancelled 24h+ before check-in
        if (cancelDate.isBefore(res.getCheckIn().minusDays(1))) return 1.0;
        return 0.0; // no refund
    }
}

class StrictCancellation implements CancellationStrategy {
    public double calculateRefund(Reservation res, LocalDate cancelDate) {
        // 50% refund if cancelled 7+ days before, 0% otherwise
        if (cancelDate.isBefore(res.getCheckIn().minusDays(7))) return 0.5;
        return 0.0;
    }
}

// ── Services ──
class BookingService {
    private AvailabilityService availabilityService;
    private PaymentService paymentService;
    private NotificationService notificationService;
    private Map<CancellationPolicy, CancellationStrategy> strategies;

    public synchronized Reservation createBooking(String guestId, String listingId,
                                                   LocalDate checkIn, LocalDate checkOut, int guests) {
        Listing listing = listingService.get(listingId);

        // 1. Check availability (with lock)
        if (!availabilityService.tryReserve(listingId, checkIn, checkOut)) {
            throw new UnavailableException("Dates no longer available");
        }

        // 2. Calculate price
        double total = listing.getPricePerNight() * ChronoUnit.DAYS.between(checkIn, checkOut);

        // 3. Authorize payment
        PaymentInfo payment = paymentService.authorize(guestId, total);
        if (payment.getStatus() == PaymentStatus.FAILED) {
            availabilityService.release(listingId, checkIn, checkOut);
            throw new PaymentException("Payment authorization failed");
        }

        // 4. Create reservation
        Reservation reservation = new Reservation(guestId, listingId, checkIn, checkOut, guests);
        reservation.setStatus(BookingStatus.CONFIRMED);
        reservation.setPayment(payment);
        reservationStore.save(reservation);

        // 5. Notify
        notificationService.notifyHost(listingId, "New booking confirmed");
        notificationService.notifyGuest(guestId, "Booking confirmed!");

        return reservation;
    }

    public void cancelBooking(String reservationId, String requesterId) {
        Reservation res = reservationStore.get(reservationId);
        Listing listing = listingService.get(res.getListingId());

        // Calculate refund using strategy
        CancellationStrategy strategy = strategies.get(listing.getCancellationPolicy());
        double refundPercent = strategy.calculateRefund(res, LocalDate.now());

        // Process refund
        if (refundPercent > 0) {
            paymentService.refund(res.getPayment(), refundPercent);
        }

        // Release dates
        availabilityService.release(res.getListingId(), res.getCheckIn(), res.getCheckOut());
        res.setStatus(BookingStatus.CANCELLED);
        reservationStore.save(res);

        // Notify waitlist
        waitlistService.notifyNextInLine(res.getListingId(), res.getCheckIn(), res.getCheckOut());
    }
}
```

### 6.3 Design Patterns Most Relevant for Airbnb

| Pattern | When to Use | Airbnb Example |
|---------|-------------|----------------|
| **Strategy** | Interchangeable algorithms | Cancellation policies, pricing strategies, search ranking |
| **Observer** | Event-driven notifications | Booking events → notify host, guest, waitlist |
| **State** | Object behavior changes with state | Booking lifecycle (pending → confirmed → checked-in → completed) |
| **Builder** | Complex object construction | Search query builder (filters, sort, pagination) |
| **Factory** | Object creation | Create notification for different channels |
| **Template Method** | Algorithm skeleton with steps | Booking flow (validate → pay → confirm → notify) |
| **Composite** | Tree structures | Location hierarchy (country → city → neighborhood) |
| **Decorator** | Add behavior dynamically | Price modifiers (cleaning fee, service fee, seasonal) |
| **Chain of Responsibility** | Pipeline processing | Fraud checks → eligibility → availability → payment |

---

## 7. Behavioral / Core Values Questions

### 7.1 Airbnb Values-Based Questions

Airbnb's values interview is **unique and critical**. Prepare stories for each:

#### "Champion the Mission"
- Tell me about a time you made a decision that prioritized the user/customer experience over short-term metrics
- Describe a project where you had to deeply understand your users to build the right thing
- How do you ensure the products you build create a sense of belonging?

#### "Be a Host"
- Tell me about a time you helped a teammate who was struggling
- Describe how you onboarded a new team member
- Give an example of going above and beyond for someone at work

#### "Embrace the Adventure"
- Tell me about a time you took on a project outside your comfort zone
- Describe a situation with significant ambiguity — how did you navigate it?
- What's a risk you took that paid off (or didn't)?

#### "Be a Cereal Entrepreneur"
- Tell me about a time you solved a problem with limited resources
- Describe a creative or unconventional approach you took to solve a technical challenge
- How did you deliver impact when the "right" solution wasn't feasible?

#### "Simplify"
- Tell me about a time you took a complex system and made it simpler
- How do you communicate technical decisions to non-technical stakeholders?
- Describe a time you pushed back on unnecessary complexity

### 7.2 Technical Leadership Questions

- Walk me through a system you designed end-to-end. What trade-offs did you make?
- Tell me about a time you had to convince your team to change technical direction
- Describe a production incident you resolved. What did you change to prevent recurrence?
- How do you balance technical debt with feature delivery?
- Tell me about a cross-team project. How did you align different stakeholders?

### 7.3 STAR Framework Template

```
Situation: [Set the scene — team, project, constraints]
Task:      [Your specific responsibility]
Action:    [What YOU did — be specific, use "I" not "we"]
Result:    [Quantifiable outcome — metrics, impact, what changed]
```

---

## 8. Preparation Strategy

### 8.1 Priority Order (If Limited Time)

| Priority | Area | Why |
|----------|------|-----|
| 🔴 P0 | LC 631, 1298, 721, 1235, 2101 | **Confirmed recently asked** |
| 🔴 P0 | System Design: Chat, Reservation, Notification | **12-14 reports each** |
| 🟠 P1 | Core Values stories (5-6 polished) | **Veto power round** |
| 🟠 P1 | Booking Waitlist + Job Scheduler design | Recently asked |
| 🟡 P2 | Calendar/interval problems (LC 729, 253, 56) | Domain-relevant |
| 🟡 P2 | Union-Find mastery (LC 721, 684, 323) | Pattern repeats |
| 🟢 P3 | LC 638, 1257, Payment system coding | Lower frequency |
| 🟢 P3 | Fraud Detection design | Staff+ level only |

### 8.2 Two-Week Study Plan

#### Week 1: Foundation + Confirmed Questions

| Day | Focus | Tasks |
|-----|-------|-------|
| Mon | DSA: System-building | LC 631 (Excel Formula), Payment Management System |
| Tue | DSA: Graph/Union-Find | LC 721 (Accounts Merge), LC 2101 (Detonate Bombs) |
| Wed | DSA: BFS + DP | LC 1298 (Candies Boxes), LC 1235 (Job Scheduling) |
| Thu | System Design | Chat/Messaging System (practice end-to-end) |
| Fri | System Design | Reservation System for Airbnb |
| Sat | DSA: Backtracking + LCA | LC 638 (Shopping Offers), LC 1257 (Common Region) |
| Sun | Behavioral | Write 6 STAR stories mapped to Airbnb values |

#### Week 2: Depth + Mock Practice

| Day | Focus | Tasks |
|-----|-------|-------|
| Mon | System Design | Notification System + Job Scheduler |
| Tue | DSA: Calendar/Intervals | LC 729/731 (My Calendar), LC 253 (Meeting Rooms II) |
| Wed | System Design | Booking Waitlist System + Fraud Detection overview |
| Thu | LLD | Reservation System code + Cancellation Strategy pattern |
| Fri | Mock Interview | Full coding mock (45 min, 2 problems) |
| Sat | Mock Interview | Full system design mock (60 min) |
| Sun | Review + Values | Review weak areas, rehearse STAR stories aloud |

### 8.3 Key Differences from Uber Prep

| Aspect | Uber | Airbnb |
|--------|------|--------|
| **Coding style** | Pure algorithmic (graph, DP, sliding window) | Practical system-building + algorithms |
| **Top patterns** | Graph + Topological Sort | Union-Find + BFS exploration + DP |
| **System Design** | Ride-sharing, real-time location | Booking, messaging, notifications |
| **Behavioral** | Standard STAR | Deep values-based (can be a veto) |
| **Code quality** | Good is enough | High bar — clean, readable, well-structured |
| **Unique** | Speed matters | Thoughtfulness and communication matter more |

---

## Quick Reference: All Confirmed Questions

| LC # | Problem | Pattern | Difficulty |
|------|---------|---------|------------|
| 631 | Design Excel Sum Formula | Dependency Graph + Topological Sort | Hard |
| 1298 | Maximum Candies from Boxes | BFS / Queue exploration | Hard |
| 1235 | Maximum Profit in Job Scheduling | DP + Binary Search | Hard |
| 721 | Accounts Merge | Union-Find | Medium |
| 2101 | Detonate Maximum Bombs | Directed Graph + BFS/DFS | Medium |
| 1257 | Smallest Common Region | LCA on Tree | Medium |
| 638 | Shopping Offers | Backtracking + Memoization | Medium |

---

*Last updated: May 2026. Sources: Hello Interview, LeetCode Discuss, Glassdoor, Blind.*
