---
id: design-hit-counter
title: Design Hit Counter
topic: Queue
difficulty: Medium
tags: [queue, sliding-window, design]
---

Build a simple hit counter with two operations:

- hit(timestamp): record a hit at integer time "timestamp" (seconds).
- getHits(timestamp): return the number of hits in the last 5 minutes (300 seconds) up to and including "timestamp".

Details and constraints:
- Timestamps across all calls are strictly increasing.
- Many hits can occur at the same timestamp.
- Only hits with time in the window (timestamp-300, timestamp] should be counted.

Approach hint:
- Keep a queue of (timestamp, count) pairs, merging hits at the same timestamp.
- Evict entries older than 300 seconds on each call.
- Maintain a running total for O(1) queries.
