# Uber L5A (Senior Software Engineer) — Merchant Onboarding Team, Hyderabad

## Interview Preparation Guide (2-Week Sprint)

---

## Table of Contents

1. [Interview Process Overview](#1-interview-process-overview)
2. [Team Context: Merchant Onboarding](#2-team-context-merchant-onboarding)
3. [Round-by-Round Breakdown](#3-round-by-round-breakdown)
4. [DSA Questions (Screening Round Focus)](#4-dsa-questions-screening-round-focus)
5. [System Design Questions](#5-system-design-questions)
6. [Low Level Design (LLD) Questions](#6-low-level-design-lld-questions)
7. [Behavioral / Culture Fit Questions](#7-behavioral--culture-fit-questions)
8. [Domain-Specific Questions (Merchant Onboarding)](#8-domain-specific-questions-merchant-onboarding)
9. [2-Week Structured Revision Plan](#9-2-week-structured-revision-plan)

---

## 1. Interview Process Overview

**Uber L5A = Senior Software Engineer (IC track)**

Typical timeline: **2–4 weeks** end-to-end (avg 22 days per Glassdoor).

| Stage | Format | Duration | Focus |
|-------|--------|----------|-------|
| **Recruiter Screen** | Phone/Video call | 30 min | Resume, motivation, role fit |
| **Technical Phone Screen (DSA)** | CoderPad / HackerRank | 45–60 min | 1–2 DSA problems (Med–Hard) |
| **Onsite / Virtual Loop** | 4–5 rounds | 45–60 min each | DSA + System Design + Behavioral |
| → Coding Round 1 | CoderPad | 60 min | 1–2 DSA problems |
| → Coding Round 2 | CoderPad | 60 min | 1–2 DSA problems |
| → System Design | Whiteboard/Virtual | 60 min | Large-scale distributed system |
| → Behavioral (Bar Raiser) | Conversational | 45–60 min | Leadership, conflict, impact |
| **Hiring Committee** | Internal | — | Leveling decision |

> **Key Insight (Apr 2026 Glassdoor):** "2 coding phases + 1 system design + 1 behavior. The interviewers were nice and supportive... You must be sharp at your coding skills."

> **Key Insight (Mar 2026):** "Graph problem, topological sort and other DSA questions were core to the process. Brush up on Leetcode hard and try to solve it in 45 mins."

---

## 2. Team Context: Merchant Onboarding

The **Merchant Onboarding** team falls under **Uber Eats / Uber for Merchants** vertical. This team builds systems that:

- **Onboard new restaurant/merchant partners** onto the Uber Eats platform
- Handle **KYC/identity verification**, document processing, and compliance checks
- Build **self-serve onboarding flows** (menu setup, store configuration, pricing)
- Manage **merchant lifecycle** — from signup to activation to ongoing account health
- Work on **menu ingestion pipelines**, catalog management, and menu syndication
- Handle **multi-region compliance** (different rules per country/city)
- Build **fraud detection** during onboarding (fake merchants, duplicate accounts)
- Integrate with **payment/banking systems** for payouts

### Tech Stack (Uber Standard)
- **Languages:** Go (primary), Java, Python
- **Infrastructure:** Microservices on Kubernetes, gRPC, Kafka, Cadence/Temporal (workflow orchestration)
- **Storage:** MySQL (Schemaless/Docstore), Cassandra, Redis, Elasticsearch
- **Data:** Hive, Spark, Presto, Kafka Streams
- **CI/CD:** Internal tooling (similar to Spinnaker), Bazel builds
- **Observability:** Jaeger (distributed tracing — Uber-built), M3 (metrics), ELK

---

## 3. Round-by-Round Breakdown

### 3.1 Screening Round (DSA) — YOUR FIRST HURDLE

**What to expect:**
- **1–2 problems** in 45–60 minutes
- Difficulty: **LeetCode Medium to Hard** (often Medium with a twist)
- You write code on CoderPad (no autocomplete, must compile/run)
- Interviewer evaluates: correctness, time/space complexity analysis, code quality, edge cases
- **Communication is key** — think aloud, explain approach before coding

**Common patterns observed in recent Uber screens (2024–2026):**

| Pattern | Frequency | Notes |
|---------|-----------|-------|
| Graph (BFS/DFS/Topological Sort) | ★★★★★ | **MOST asked** at Uber |
| Sliding Window / Two Pointers | ★★★★☆ | Very common in screening |
| Dynamic Programming | ★★★★☆ | Med–Hard level |
| Trees / Binary Trees | ★★★☆☆ | Width, path-based problems |
| Intervals / Merge / Scheduling | ★★★☆☆ | Meeting rooms style |
| Hash Maps / Prefix Sums | ★★★☆☆ | Often as sub-pattern |
| Stack / Monotonic Stack | ★★☆☆☆ | NGE-style problems |
| Binary Search | ★★☆☆☆ | On answer / rotated arrays |
| Trie / String | ★★☆☆☆ | Word search variants |

### 3.2 Onsite Coding Rounds

Same as above but harder, and expectation is higher for L5A:
- Optimal solution expected, not just brute force
- Clean, production-quality code
- Handle all edge cases
- Discuss follow-ups and extensions

### 3.3 System Design Round

- You drive the conversation (L5A expectation)
- Start with requirements gathering, API design, high-level architecture
- Deep dive into specific components
- Discuss trade-offs, scaling bottlenecks, failure modes
- Mention relevant Uber technologies where applicable

### 3.4 Behavioral Round

- Uses **STAR format** (Situation, Task, Action, Result)
- Uber values: customer obsession, ownership, bold bets, and acting like owners
- Expect deep follow-up questions — have 4–5 detailed stories ready

---

## 4. DSA Questions (Screening Round Focus)

### 4.1 Recently Confirmed Questions (From Interview Reports 2024–2026)

These are questions confirmed from Glassdoor, LeetCode Discuss, and Blind for Uber SSE interviews:

#### Graphs (TOP PRIORITY — Uber's Favorite)

| # | Problem | LC # | Difficulty | Recently Asked |
|---|---------|------|------------|----------------|
| 1 | **Pacific Atlantic Water Flow** | 417 | Medium | ✅ 2025–2026 confirmed |
| 2 | **Course Schedule (Topological Sort)** | 207 | Medium | ✅ 2026 confirmed |
| 3 | **Course Schedule II** | 210 | Medium | ✅ 2026 |
| 4 | **Maximum Path Weight + Topological Sort** | Custom | Hard | ✅ Apr 2026 Glassdoor |
| 5 | **Number of Islands** | 200 | Medium | ✅ Frequent |
| 6 | **Clone Graph** | 133 | Medium | ✅ Frequent |
| 7 | **Word Ladder** | 127 | Hard | ✅ Frequent |
| 8 | **Alien Dictionary** | 269 | Hard | ✅ 2024–2025 |
| 9 | **Cheapest Flights Within K Stops** | 787 | Medium | ✅ Uber classic |
| 10 | **Network Delay Time (Dijkstra)** | 743 | Medium | ✅ 2024–2025 |
| 11 | **Graph Valid Tree** | 261 | Medium | Frequent |
| 12 | **Shortest Path in Binary Matrix** | 1091 | Medium | Frequent |
| 13 | **Rotting Oranges** | 994 | Medium | Frequent |
| 14 | **Evaluate Division** | 399 | Medium | Frequent |

#### Sliding Window / Two Pointers

| # | Problem | LC # | Difficulty | Notes |
|---|---------|------|------------|-------|
| 15 | **Longest Substring Without Repeating Characters** | 3 | Medium | ✅ Very frequent |
| 16 | **Longest Repeating Character Replacement** | 424 | Medium | ✅ 2025 confirmed |
| 17 | **Minimum Window Substring** | 76 | Hard | Frequent |
| 18 | **Subarrays with Sum Less Than K** | Custom | Medium | ✅ InterviewBit Uber |
| 19 | **Sliding Window Maximum** | 239 | Hard | Frequent |
| 20 | **Minimum Size Subarray Sum** | 209 | Medium | Frequent |

#### Dynamic Programming

| # | Problem | LC # | Difficulty | Notes |
|---|---------|------|------------|-------|
| 21 | **Decode Ways** | 91 | Medium | ✅ Confirmed Uber Q |
| 22 | **Unique Paths** | 62 | Medium | ✅ Confirmed Uber Q |
| 23 | **Word Break** | 139 | Medium | Frequent |
| 24 | **Coin Change** | 322 | Medium | Frequent |
| 25 | **Longest Increasing Subsequence** | 300 | Medium | Frequent |
| 26 | **House Robber** | 198 | Medium | Frequent |
| 27 | **Maximum Subarray (Kadane's)** | 53 | Medium | ✅ Confirmed Uber Q |
| 28 | **Burst Balloons** | 312 | Hard | ✅ Uber campus coding round |
| 29 | **Edit Distance** | 72 | Medium | Frequent |
| 30 | **Best Time to Buy and Sell Stock** | 121 | Easy | Frequent |

#### Trees

| # | Problem | LC # | Difficulty | Notes |
|---|---------|------|------------|-------|
| 31 | **Maximum Width of Binary Tree** | 662 | Medium | ✅ Confirmed 2024–2025 |
| 32 | **Binary Tree Right Side View** | 199 | Medium | ✅ Confirmed Uber Q |
| 33 | **Binary Tree Level Order Traversal** | 102 | Medium | Frequent |
| 34 | **Validate BST** | 98 | Medium | Frequent |
| 35 | **Serialize and Deserialize Binary Tree** | 297 | Hard | Frequent |
| 36 | **Lowest Common Ancestor of BST** | 235 | Medium | Frequent |
| 37 | **Construct BT from Preorder and Inorder** | 105 | Medium | Frequent |

#### Arrays / Hashing / Intervals

| # | Problem | LC # | Difficulty | Notes |
|---|---------|------|------------|-------|
| 38 | **Two Sum** | 1 | Easy | Frequent warmup |
| 39 | **Group Anagrams** | 49 | Medium | Frequent |
| 40 | **Subarray Sum Equals K** | 560 | Medium | Frequent |
| 41 | **Meeting Rooms II** | 253 | Medium | ✅ Classic Uber |
| 42 | **Merge Intervals** | 56 | Medium | Frequent |
| 43 | **Next Greater Element** | 496/503 | Med | ✅ Confirmed Uber Q |
| 44 | **Top K Frequent Elements** | 347 | Medium | Frequent |
| 45 | **Insert Delete GetRandom O(1)** | 380 | Medium | Frequent |

#### Stack / Binary Search / Others

| # | Problem | LC # | Difficulty | Notes |
|---|---------|------|------------|-------|
| 46 | **Search in Rotated Sorted Array** | 33 | Medium | Frequent |
| 47 | **Find Min in Rotated Sorted Array** | 153 | Medium | Frequent |
| 48 | **Capacity to Ship Packages** | 1011 | Medium | Frequent |
| 49 | **Valid Parentheses** | 20 | Easy | Warmup |
| 50 | **LRU Cache** | 146 | Medium | Frequent |
| 51 | **Generate Parentheses** | 22 | Medium | Frequent |
| 52 | **Combination Sum** | 39 | Medium | Frequent |
| 53 | **Permutations** | 46 | Medium | Frequent |
| 54 | **15 Puzzle / Sliding Puzzle** | 773 | Hard | ✅ Confirmed 2024 (BFS) |

### 4.2 Most Likely Screening Question Prediction

Based on pattern analysis of 2024–2026 Uber interviews, **your screening round will most likely be:**

> 🎯 **HIGH PROBABILITY (Solve all of these):**
> 1. A **Graph BFS/DFS problem** — Pacific Atlantic Water Flow (LC 417), Number of Islands (LC 200), or Course Schedule variants (LC 207/210)
> 2. A **Sliding Window** problem — Longest Substring Without Repeating (LC 3) or Longest Repeating Character Replacement (LC 424)
> 3. A **Topological Sort** variant — Alien Dictionary (LC 269) or Course Schedule II (LC 210)

> 🔶 **MEDIUM PROBABILITY:**
> 4. A **Tree traversal** with twist — Maximum Width (LC 662) or Right Side View (LC 199)
> 5. A **DP Medium** — Decode Ways (LC 91), Word Break (LC 139)
> 6. An **Interval/Greedy** — Meeting Rooms II (LC 253) or Merge Intervals (LC 56)

> 🔷 **LOWER BUT POSSIBLE:**
> 7. A **Hard Graph** — Cheapest Flights K Stops (LC 787), Network Delay (LC 743)
> 8. **Binary Search on Answer** — Capacity to Ship Packages (LC 1011)

---

## 5. System Design Questions

### 5.1 Uber-Specific System Design Questions (Frequently Asked)

| # | Topic | Relevance to Merchant Onboarding |
|---|-------|----------------------------------|
| 1 | **Design Uber Eats** | ⭐ HIGHLY RELEVANT — covers merchant, ordering, delivery |
| 2 | **Design a Merchant Onboarding System** | ⭐ DIRECTLY RELEVANT |
| 3 | **Design a Notification System** | Relevant (merchant comms, alerts) |
| 4 | **Design a Ride-Sharing Service** | Classic Uber question |
| 5 | **Design a Rate Limiter** | Infrastructure knowledge |
| 6 | **Design a URL Shortener** | Standard SD warmup |
| 7 | **Design a Document Verification System** | Relevant to KYC onboarding |
| 8 | **Design a Workflow Orchestration Engine** | Relevant (like Cadence/Temporal) |
| 9 | **Design a Search/Discovery System** | Restaurant search |
| 10 | **Design a Payment System** | Merchant payouts |

### 5.2 Deep Dive: Design Merchant Onboarding System

Since you're interviewing for this exact team, prepare this thoroughly:

**Functional Requirements:**
- Merchant registration (multi-step form, document upload)
- KYC verification (ID, business license, tax docs)
- Menu creation and management
- Store configuration (hours, delivery radius, pricing)
- Bank account verification for payouts
- Multi-region compliance rules

**Non-Functional Requirements:**
- Handle 10K+ onboarding requests/day globally
- Document processing SLA < 24 hours
- 99.9% availability
- Idempotent operations (retry-safe)
- Data privacy (GDPR, local regulations)

**Key Components to Discuss:**
- **Workflow Engine** (Cadence/Temporal) for multi-step onboarding state machine
- **Document Service** (S3 + async processing workers)
- **Verification Service** (3rd party KYC integrations, retry logic)
- **Merchant Profile Service** (CRUD, versioning)
- **Menu Ingestion Pipeline** (Kafka → processors → search index)
- **Notification Service** (email, SMS, push for status updates)
- **Compliance Engine** (rule engine for per-region requirements)
- **Fraud Detection** (ML model for fake merchant detection)
- **Event Sourcing** for audit trail

### 5.3 Deep Dive: Design Uber Eats

**Key components:**
- Restaurant discovery & search (Elasticsearch, geospatial indexing)
- Menu management service
- Order placement & management (state machine)
- Real-time delivery tracking (WebSocket)
- ETA estimation service
- Pricing & promotions engine
- Merchant dashboard
- Rating & review system

---

## 6. Low Level Design (LLD) Questions

Uber L5A interviews may include an LLD / OOD (Object-Oriented Design) round, often blended into one of the coding rounds or as a standalone machine-coding round. You'll be asked to design classes, interfaces, and relationships for a real-world system in ~45 min.

### 6.1 How to Approach LLD at Uber

1. **Clarify requirements** — Ask what features are in-scope (don't over-build)
2. **Identify core entities** — Nouns become classes (User, Order, Merchant, Driver)
3. **Define relationships** — Has-a, Is-a, uses (composition vs inheritance)
4. **Design interfaces first** — Think in contracts/APIs before implementation
5. **Apply design patterns** — Strategy, Observer, State, Factory where natural
6. **Handle concurrency** — Thread safety for shared state (especially at Uber scale)
7. **Write clean code** — SOLID principles, enums for states, proper encapsulation

### 6.2 Most Likely LLD Questions for Uber (Ranked by Relevance)

#### Tier 1: Directly Relevant to Merchant Onboarding / Uber Domain

| # | Problem | Why Relevant | Difficulty |
|---|---------|--------------|------------|
| 1 | **Design Ride-Sharing Service (Uber)** | Core Uber domain — riders, drivers, trips, matching, pricing | Hard |
| 2 | **Design Food Delivery Service (Uber Eats)** | Directly relevant — merchants, orders, delivery, menus | Hard |
| 3 | **Design Restaurant Management System** | Merchant-side ops — menu, orders, table/capacity management | Medium |
| 4 | **Design an Order Management System** | Order lifecycle, state machine, status tracking | Medium |
| 5 | **Design a Notification System** | Multi-channel (SMS/email/push), templates, preferences | Medium |
| 6 | **Design a Payment System / Digital Wallet** | Merchant payouts, transactions, ledger, refunds | Medium |

#### Tier 2: Classic LLD Frequently Asked at Uber

| # | Problem | Key Patterns Tested | Difficulty |
|---|---------|---------------------|------------|
| 7 | **Design a Parking Lot** | Inheritance, Strategy pattern, Enum states | Easy |
| 8 | **Design an LRU Cache** | HashMap + Doubly Linked List, O(1) ops | Medium |
| 9 | **Design an Elevator System** | State pattern, scheduling algorithms, concurrency | Medium |
| 10 | **Design a Pub-Sub / Message Queue** | Observer pattern, threading, producer-consumer | Medium |
| 11 | **Design a Rate Limiter** | Sliding window, token bucket, thread safety | Medium |
| 12 | **Design a Logging Framework** | Singleton, Chain of Responsibility, log levels | Easy |
| 13 | **Design a Task Scheduler / Job Queue** | Priority queue, threading, retry/backoff | Medium |
| 14 | **Design Splitwise (Expense Sharing)** | Graph (debt simplification), strategy for splitting | Hard |
| 15 | **Design a Vending Machine** | State pattern, inventory management | Easy |
| 16 | **Design Tic-Tac-Toe** | 2D grid, turn management, win detection | Easy |

#### Tier 3: Other Commonly Asked LLD Problems

| # | Problem | Key Concepts |
|---|---------|-------------- |
| 17 | **Design a Hotel Booking System** | Availability, reservation state machine, concurrency |
| 18 | **Design an Online Shopping System (Amazon)** | Cart, catalog, checkout, inventory |
| 19 | **Design Movie Ticket Booking (BookMyShow)** | Seat selection, locking, concurrency |
| 20 | **Design a Chess Game** | Piece hierarchy, move validation, polymorphism |
| 21 | **Design Car Rental System** | Vehicle hierarchy, reservation, pricing strategy |
| 22 | **Design a Library Management System** | CRUD, search, borrowing lifecycle |

### 6.3 Design Patterns to Know (Most Tested at Uber)

| Pattern | When to Use | Uber Example |
|---------|-------------|--------------|
| **Strategy** | Interchangeable algorithms at runtime | Pricing strategies (surge, flat, distance-based) |
| **Observer** | Event-driven notifications | Order status → notify merchant, driver, customer |
| **State** | Object behavior changes with state | Trip states (REQUESTED → MATCHED → IN_PROGRESS → COMPLETED) |
| **Factory / Abstract Factory** | Object creation without specifying class | Create different payment processors, notification channels |
| **Singleton** | Single instance globally | Configuration manager, connection pool |
| **Builder** | Complex object construction | Building a Merchant profile with optional fields |
| **Command** | Encapsulate request as object | Undo/redo operations, queued actions |
| **Chain of Responsibility** | Pass request through handlers | Validation pipeline (KYC check → fraud check → compliance check) |
| **Decorator** | Add behavior dynamically | Adding toppings to menu items, fee surcharges |
| **Template Method** | Define algorithm skeleton, defer steps | Onboarding flow with per-region customization |

### 6.4 LLD Deep Dive: Design Food Delivery Service (Uber Eats)

Since this is most relevant to your team, be able to code this:

```java
// ── Core Enums ──
enum OrderStatus { PLACED, CONFIRMED, PREPARING, READY, PICKED_UP, DELIVERED, CANCELLED }
enum MerchantStatus { PENDING, ACTIVE, SUSPENDED, DEACTIVATED }
enum VehicleType { BIKE, CAR, SCOOTER }

// ── Core Entities ──
class User {
    private String id;
    private String name;
    private String email;
    private String phone;
    private List<Address> addresses;
}

class Merchant {
    private String id;
    private String name;
    private MerchantStatus status;
    private Address address;
    private Menu menu;
    private OperatingHours hours;
    private BankAccount bankAccount;

    public boolean isAcceptingOrders() {
        return status == MerchantStatus.ACTIVE && hours.isOpen();
    }
}

class MenuItem {
    private String id;
    private String name;
    private String description;
    private double price;
    private boolean available;
    private Category category;
    private List<Customization> customizations;
}

class Menu {
    private String merchantId;
    private List<MenuItem> items;

    public List<MenuItem> getAvailableItems() {
        return items.stream().filter(MenuItem::isAvailable).toList();
    }
}

class Order {
    private String id;
    private User customer;
    private Merchant merchant;
    private List<OrderItem> items;
    private OrderStatus status;
    private DeliveryAgent agent;
    private double totalAmount;
    private LocalDateTime createdAt;

    public void updateStatus(OrderStatus newStatus) {
        // validate state transition
        if (!isValidTransition(this.status, newStatus))
            throw new IllegalStateException("Invalid transition");
        this.status = newStatus;
        notifyObservers();  // notify customer, merchant, agent
    }
}

class DeliveryAgent {
    private String id;
    private String name;
    private Location currentLocation;
    private VehicleType vehicleType;
    private boolean available;
}

// ── Services ──
interface PricingStrategy {
    double calculate(Order order, double distance);
}

class StandardPricing implements PricingStrategy {
    public double calculate(Order order, double distance) {
        return order.getSubtotal() + (distance * 5.0); // base delivery fee
    }
}

class SurgePricing implements PricingStrategy {
    private double multiplier;
    public double calculate(Order order, double distance) {
        return order.getSubtotal() + (distance * 5.0 * multiplier);
    }
}

class OrderService {
    private PricingStrategy pricingStrategy;
    private List<OrderObserver> observers;

    public Order placeOrder(User customer, Merchant merchant, List<OrderItem> items) {
        if (!merchant.isAcceptingOrders()) throw new RuntimeException("Merchant not available");
        Order order = new Order(customer, merchant, items);
        order.setTotalAmount(pricingStrategy.calculate(order, getDistance(customer, merchant)));
        order.updateStatus(OrderStatus.PLACED);
        return order;
    }

    public void assignAgent(Order order, DeliveryAgent agent) {
        order.setAgent(agent);
        agent.setAvailable(false);
    }
}

class MerchantOnboardingService {
    private List<OnboardingStep> steps; // Chain of Responsibility

    public void onboard(Merchant merchant) {
        for (OnboardingStep step : steps) {
            step.execute(merchant); // KYC → doc verify → bank verify → menu setup
        }
        merchant.setStatus(MerchantStatus.ACTIVE);
    }
}

// ── Observer Pattern for Order Updates ──
interface OrderObserver {
    void onStatusChange(Order order, OrderStatus newStatus);
}

class CustomerNotifier implements OrderObserver {
    public void onStatusChange(Order order, OrderStatus newStatus) {
        // push notification to customer
    }
}

class MerchantNotifier implements OrderObserver {
    public void onStatusChange(Order order, OrderStatus newStatus) {
        // update merchant dashboard
    }
}
```

### 6.5 SOLID Principles Quick Reference

| Principle | What It Means | Interview Signal |
|-----------|---------------|------------------|
| **S** — Single Responsibility | One class = one reason to change | Don't put order logic in Merchant class |
| **O** — Open/Closed | Open for extension, closed for modification | Use Strategy pattern for pricing, not if-else |
| **L** — Liskov Substitution | Subtypes must be substitutable | DeliveryBike/DeliveryCar should work wherever DeliveryVehicle is used |
| **I** — Interface Segregation | Clients shouldn't depend on unused methods | Separate Searchable, Orderable interfaces |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | OrderService depends on PricingStrategy interface, not SurgePricing |

---

## 7. Behavioral / Culture Fit Questions

### 6.1 Uber Core Values to Demonstrate

| Value | What They Look For |
|-------|--------------------|
| **Customer Obsession** | Decisions driven by user/merchant impact |
| **Make Big Bets** | Taking calculated risks for large impact |
| **Act Like an Owner** | Taking end-to-end ownership, not waiting to be told |
| **Celebrate Differences** | Collaboration across diverse teams |
| **Do the Right Thing** | Ethics, quality over speed when it matters |

### 6.2 Common Behavioral Questions

**Leadership & Impact:**
1. Tell me about a project where you drove significant technical impact.
2. Describe a time you had to make a critical technical decision with incomplete information.
3. Tell me about a time you influenced a team to adopt a better approach.
4. Give me an example of when you went above and beyond your role.

**Conflict & Collaboration:**
5. Tell me about a disagreement with a teammate/manager. How did you resolve it?
6. Describe a situation where you had to push back on requirements.
7. How do you handle working with someone whose technical opinion differs from yours?

**Ownership & Problem-Solving:**
8. Tell me about a production issue you owned end-to-end.
9. Describe a time when you identified and fixed a systemic problem.
10. Tell me about a project that failed. What did you learn?

**Growth & Self-Awareness:**
11. What's the most challenging feedback you've received? How did you act on it?
12. How do you stay current with technology trends?
13. What would your previous manager say about your strengths and areas for improvement?

**Uber-Specific:**
14. Why Uber? Why this team (Merchant Onboarding)?
15. How would you improve Uber Eats from a merchant perspective?
16. What's your approach to balancing speed vs. quality in a fast-moving org?

### 6.3 STAR Stories to Prepare (Have 5 Ready)

Prepare stories covering these themes:
1. **Technical Leadership** — Led design of a complex system
2. **Difficult Bug / Production Issue** — Debugged under pressure
3. **Cross-Team Collaboration** — Worked with multiple teams to deliver
4. **Disagreement / Conflict** — Professional resolution
5. **Impact at Scale** — Quantifiable improvement (latency, reliability, business metric)

---

## 8. Domain-Specific Questions (Merchant Onboarding)

Be prepared to discuss:

1. How would you design an onboarding workflow that handles partial completions and resumes?
2. How do you handle idempotency in a multi-step onboarding process?
3. How would you design a document verification pipeline that handles millions of docs?
4. How do you ensure compliance with different regional regulations in a global system?
5. How would you detect fraudulent merchant signups at scale?
6. How would you design a menu ingestion system that handles multiple formats (PDF, Excel, POS integrations)?
7. How would you handle backward-incompatible schema changes in a merchant profile service?
8. How would you implement a self-serve merchant dashboard with real-time status updates?
9. Discuss trade-offs between synchronous vs. asynchronous verification in onboarding.
10. How would you ensure data consistency across microservices during onboarding?

---

## 9. 2-Week Structured Revision Plan

### Week 1: DSA Intensive + System Design Foundations

#### Day 1 (Wed): Graphs — BFS/DFS Fundamentals
- [ ] Theory: BFS, DFS, adjacency list/matrix, visited tracking
- [ ] LC 200 — Number of Islands ⭐
- [ ] LC 994 — Rotting Oranges
- [ ] LC 133 — Clone Graph
- [ ] LC 417 — Pacific Atlantic Water Flow ⭐⭐
- **Goal:** Nail BFS/DFS template, be able to code from memory

#### Day 2 (Thu): Graphs — Topological Sort & Advanced
- [ ] Theory: Topological Sort (Kahn's BFS + DFS), cycle detection
- [ ] LC 207 — Course Schedule ⭐⭐
- [ ] LC 210 — Course Schedule II ⭐⭐
- [ ] LC 269 — Alien Dictionary ⭐⭐
- [ ] LC 261 — Graph Valid Tree
- **Goal:** Topological sort template locked in, both BFS and DFS versions

#### Day 3 (Fri): Graphs — Weighted + Shortest Path
- [ ] Theory: Dijkstra, Bellman-Ford, priority queue usage
- [ ] LC 743 — Network Delay Time ⭐
- [ ] LC 787 — Cheapest Flights Within K Stops ⭐
- [ ] LC 1091 — Shortest Path in Binary Matrix
- [ ] LC 399 — Evaluate Division
- **Goal:** Comfortable with Dijkstra pattern and BFS with constraints

#### Day 4 (Sat): Sliding Window & Two Pointers
- [ ] Theory: Fixed window, variable window, shrinking window template
- [ ] LC 3 — Longest Substring Without Repeating Characters ⭐⭐
- [ ] LC 424 — Longest Repeating Character Replacement ⭐⭐
- [ ] LC 76 — Minimum Window Substring ⭐
- [ ] LC 239 — Sliding Window Maximum
- [ ] LC 209 — Minimum Size Subarray Sum
- **Goal:** Sliding window template muscle memory

#### Day 5 (Sun): Dynamic Programming — Part 1
- [ ] Theory: Top-down vs bottom-up, state definition, transitions
- [ ] LC 91 — Decode Ways ⭐⭐
- [ ] LC 62 — Unique Paths ⭐
- [ ] LC 139 — Word Break ⭐
- [ ] LC 322 — Coin Change
- [ ] LC 300 — Longest Increasing Subsequence
- **Goal:** Comfortable identifying DP problems and defining states

#### Day 6 (Mon): Dynamic Programming — Part 2 + Trees
- [ ] LC 53 — Maximum Subarray (Kadane's) ⭐
- [ ] LC 198 — House Robber
- [ ] LC 121 — Best Time to Buy and Sell Stock
- [ ] LC 72 — Edit Distance
- [ ] LC 662 — Maximum Width of Binary Tree ⭐⭐
- [ ] LC 199 — Binary Tree Right Side View ⭐
- **Goal:** DP and tree traversal patterns solid

#### Day 7 (Tue): Trees + Arrays/Hashing + System Design Start
- [ ] LC 102 — Binary Tree Level Order Traversal
- [ ] LC 98 — Validate BST
- [ ] LC 297 — Serialize and Deserialize Binary Tree
- [ ] LC 560 — Subarray Sum Equals K
- [ ] LC 56 — Merge Intervals
- [ ] LC 253 — Meeting Rooms II ⭐
- [ ] **System Design:** Read about Uber's architecture (Uber Engineering Blog)
- **Goal:** Solidify remaining DSA patterns, start SD thinking

---

### Week 2: System Design Deep Dive + Behavioral + Mock Interviews

#### Day 8 (Wed): System Design — Uber Eats + Merchant Onboarding
- [ ] Design Uber Eats end-to-end (practice 45 min)
- [ ] Design Merchant Onboarding System (practice 45 min)
- [ ] Study: Uber's tech stack — Cadence, Kafka, Schemaless, M3
- [ ] Read: Uber Engineering Blog posts on merchant/eats systems
- **Goal:** Be able to drive a 45-min SD conversation confidently

#### Day 9 (Thu): System Design — Common Patterns
- [ ] Design a Notification System
- [ ] Design a Rate Limiter
- [ ] Design a Workflow Orchestration Engine
- [ ] Study: Event sourcing, CQRS, saga pattern
- **Goal:** Know distributed system patterns cold

#### Day 10 (Fri): DSA Revision — Weak Areas + Hard Problems
- [ ] Re-solve any problems you struggled with in Week 1
- [ ] LC 312 — Burst Balloons (Hard DP)
- [ ] LC 127 — Word Ladder (Hard BFS)
- [ ] LC 773 — Sliding Puzzle (Hard BFS)
- [ ] LC 146 — LRU Cache
- [ ] Timed practice: solve 2 mediums in 40 minutes
- **Goal:** Build speed and confidence on harder problems

#### Day 11 (Sat): Behavioral Preparation
- [ ] Write out 5 STAR stories (full drafts)
- [ ] Practice answering "Why Uber?" and "Why Merchant Onboarding?"
- [ ] Research Uber Eats merchant features, recent launches
- [ ] Prepare 3–5 thoughtful questions to ask your interviewers
- [ ] Practice: Record yourself answering 3 behavioral questions
- **Goal:** Behavioral answers polished and natural

#### Day 12 (Sun): Full Mock Interview Day
- [ ] **Mock 1:** 45-min DSA (pick 2 random problems, time yourself)
- [ ] **Mock 2:** 45-min System Design (Design Merchant Onboarding)
- [ ] **Mock 3:** 30-min Behavioral (use interviewing.io or a friend)
- [ ] Review and note weaknesses
- **Goal:** Simulate interview pressure

#### Day 13 (Mon): Final DSA Brush-Up + Domain Knowledge
- [ ] Speed-run: solve 6–8 medium problems (5 min plan + 15 min code each)
- [ ] Review graph + sliding window + DP templates one more time
- [ ] Read about Uber Eats merchant experience and pain points
- [ ] Review Uber's recent quarterly earnings / product announcements
- **Goal:** Peak performance readiness

#### Day 14 (Tue): Rest + Light Review
- [ ] Light review of templates and patterns (no new problems)
- [ ] Re-read your STAR stories
- [ ] Re-read your System Design notes
- [ ] Get good sleep, stay hydrated
- [ ] Quick mental rehearsal of your intro and "tell me about yourself"
- **Goal:** Go in relaxed and confident

---

## Quick Reference: DSA Templates to Memorize

### BFS Template (Graph)
```java
public void bfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    visited.add(start);
    queue.offer(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
}
```

### Topological Sort (Kahn's Algorithm)
```java
public List<Integer> topologicalSort(int numNodes, int[][] edges) {
    int[] indegree = new int[numNodes];
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numNodes; i++) adj.add(new ArrayList<>());
    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        indegree[edge[1]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numNodes; i++) {
        if (indegree[i] == 0) queue.offer(i);
    }

    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : adj.get(node)) {
            if (--indegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }
    return order.size() == numNodes ? order : new ArrayList<>(); // empty = cycle
}
```

### Sliding Window Template
```java
public int slidingWindow(String s) {
    Map<Character, Integer> window = new HashMap<>();
    int left = 0, result = 0;
    for (int right = 0; right < s.length(); right++) {
        // expand window: add s[right]
        char rc = s.charAt(right);
        window.merge(rc, 1, Integer::sum);

        // shrink window while invalid
        while (/* WINDOW_IS_INVALID */) {
            char lc = s.charAt(left);
            window.merge(lc, -1, Integer::sum);
            if (window.get(lc) == 0) window.remove(lc);
            left++;
        }

        // update result
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

### Dijkstra Template
```java
public int[] dijkstra(List<int[]>[] graph, int start, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    // min-heap: {distance, node}
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    heap.offer(new int[]{0, start});
    while (!heap.isEmpty()) {
        int[] curr = heap.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;
        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                heap.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

## Key Resources

| Resource | What For |
|----------|----------|
| [Uber Engineering Blog](https://www.uber.com/blog/engineering/) | Understand Uber's systems |
| [LeetCode Uber Tag](https://leetcode.com/company/uber/) | Company-specific problems (need Premium) |
| NeetCode 150 | Structured problem list |
| [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) | System design fundamentals |
| Designing Data-Intensive Applications (book) | Deep system design concepts |
| Uber Cadence / Temporal docs | Workflow orchestration (relevant to onboarding) |
| Glassdoor Uber SSE Interviews | Recent interview experiences |

---

## Final Tips

1. **For the screening round:** Start with brute force, state the time complexity, then optimize. Interviewers want to see your thought process.
2. **Graphs are Uber's bread and butter** — do NOT skip this topic. Practice until you can write BFS/DFS/Topo sort from memory.
3. **Communicate constantly** — silence kills. Talk through your approach, trade-offs, and edge cases.
4. **For System Design at L5A level:** You should be able to drive the entire conversation, propose APIs, discuss scaling, and handle deep-dive questions on any component.
5. **For Behavioral:** Quantify impact in your stories (reduced latency by 40%, handled 10M requests, saved $X).
6. **Know Uber Eats:** Use the app, understand the merchant side, think about pain points.
7. **Ask smart questions:** "What's the biggest technical challenge the Merchant Onboarding team is facing right now?" shows genuine interest.

---

*Good luck, Rupesh! You've got this. 🚀*
