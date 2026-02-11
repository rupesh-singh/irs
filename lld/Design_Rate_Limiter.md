# LLD: Rate Limiter

## 📋 Problem Statement
Design a Rate Limiter that controls the rate of requests a client can make to an API within a given time window.

---

## 🎯 Clarifying Questions to Ask

1. **What type of rate limiting?** - Per user, per API, per IP, or global?
2. **What's the limit?** - e.g., 100 requests per minute per user
3. **Distributed or single server?** - Need Redis/central store?
4. **Hard vs Soft limit?** - Reject immediately or queue?
5. **Algorithm preference?** - Token bucket, sliding window, fixed window?

---

## ✅ Requirements

### Functional
- Limit requests per user/client within time window
- Return 429 (Too Many Requests) when limit exceeded
- Support different limits for different API tiers
- Thread-safe operations

### Non-Functional
- Low latency (< 1ms overhead)
- High availability
- Distributed support for multi-server deployment

---

## 🏗️ Core Classes & Interfaces

```java
// Strategy Pattern for different algorithms
interface RateLimiter {
    boolean allowRequest(String clientId);
    RateLimitInfo getRateLimitInfo(String clientId);
}

class RateLimitInfo {
    int remainingRequests;
    long resetTimeMillis;
    boolean isAllowed;
}

// Token Bucket Implementation
class TokenBucketRateLimiter implements RateLimiter {
    private final int maxTokens;
    private final int refillRate; // tokens per second
    private final Map<String, Bucket> buckets;
    
    boolean allowRequest(String clientId) {
        Bucket bucket = buckets.computeIfAbsent(clientId, k -> new Bucket(maxTokens));
        return bucket.tryConsume();
    }
}

class Bucket {
    private int tokens;
    private long lastRefillTimestamp;
    private final int maxTokens;
    private final int refillRate;
    
    synchronized boolean tryConsume() {
        refill();
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        int tokensToAdd = (int) ((now - lastRefillTimestamp) / 1000 * refillRate);
        tokens = Math.min(maxTokens, tokens + tokensToAdd);
        lastRefillTimestamp = now;
    }
}

// Sliding Window Counter Implementation
class SlidingWindowRateLimiter implements RateLimiter {
    private final int windowSizeMs;
    private final int maxRequests;
    private final Map<String, Deque<Long>> requestLogs;
    
    synchronized boolean allowRequest(String clientId) {
        long now = System.currentTimeMillis();
        Deque<Long> log = requestLogs.computeIfAbsent(clientId, k -> new LinkedList<>());
        
        // Remove expired timestamps
        while (!log.isEmpty() && log.peekFirst() < now - windowSizeMs) {
            log.pollFirst();
        }
        
        if (log.size() < maxRequests) {
            log.addLast(now);
            return true;
        }
        return false;
    }
}

// Factory for creating rate limiters
class RateLimiterFactory {
    RateLimiter create(RateLimitConfig config) {
        return switch (config.getAlgorithm()) {
            case TOKEN_BUCKET -> new TokenBucketRateLimiter(config);
            case SLIDING_WINDOW -> new SlidingWindowRateLimiter(config);
            case FIXED_WINDOW -> new FixedWindowRateLimiter(config);
            default -> throw new IllegalArgumentException();
        };
    }
}

// Middleware/Filter for HTTP requests
class RateLimitFilter implements Filter {
    private final RateLimiter rateLimiter;
    private final ClientIdentifier clientIdentifier;
    
    void doFilter(Request req, Response res, FilterChain chain) {
        String clientId = clientIdentifier.identify(req);
        
        if (rateLimiter.allowRequest(clientId)) {
            chain.doFilter(req, res);
        } else {
            RateLimitInfo info = rateLimiter.getRateLimitInfo(clientId);
            res.setStatus(429);
            res.setHeader("Retry-After", info.resetTimeMillis);
            res.setHeader("X-RateLimit-Remaining", info.remainingRequests);
        }
    }
}
```

---

## 🔄 Algorithm Comparison

| Algorithm | Pros | Cons | Best For |
|-----------|------|------|----------|
| **Token Bucket** | Allows bursts, smooth | Memory per client | API rate limiting |
| **Sliding Window** | Accurate, no boundary issues | More memory/compute | Precision required |
| **Fixed Window** | Simple, low memory | Boundary burst problem | Simple use cases |
| **Leaky Bucket** | Smooth output rate | No burst support | Network traffic |

---

## 📊 Distributed Rate Limiting (Redis)

```java
class DistributedRateLimiter implements RateLimiter {
    private final RedisClient redis;
    private final int maxRequests;
    private final int windowSeconds;
    
    boolean allowRequest(String clientId) {
        String key = "rate_limit:" + clientId;
        long current = redis.incr(key);
        
        if (current == 1) {
            redis.expire(key, windowSeconds);
        }
        
        return current <= maxRequests;
    }
}

// Lua script for atomic sliding window (production-grade)
/*
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, window / 1000)
    return 1
end
return 0
*/
```

---

## 🎨 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      RateLimitFilter                        │
│  - rateLimiter: RateLimiter                                 │
│  - clientIdentifier: ClientIdentifier                       │
│  + doFilter(req, res, chain)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  <<interface>> RateLimiter                  │
│  + allowRequest(clientId): boolean                         │
│  + getRateLimitInfo(clientId): RateLimitInfo               │
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ TokenBucket     │  │ SlidingWindow   │  │ FixedWindow     │
│ RateLimiter     │  │ RateLimiter     │  │ RateLimiter     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## ❓ Follow-up Questions & Answers

### Q1: How would you handle rate limiting in a microservices architecture?
**Answer:**
- Use a **centralized rate limiter service** or **API Gateway** (Kong, AWS API Gateway)
- Store state in **Redis cluster** for shared state across services
- Implement **local caching** with periodic sync to reduce Redis calls
- Use **consistent hashing** to distribute rate limit checks

### Q2: How do you prevent race conditions in distributed rate limiting?
**Answer:**
- Use **Redis Lua scripts** for atomic operations
- Implement **optimistic locking** with CAS (Compare-And-Swap)
- Use **Redis MULTI/EXEC** transactions
- Consider **eventual consistency** with local counters + periodic sync

### Q3: How would you implement different rate limits for different user tiers?
**Answer:**
```java
class TieredRateLimiter implements RateLimiter {
    private final Map<UserTier, RateLimitConfig> tierConfigs;
    private final UserService userService;
    
    boolean allowRequest(String userId) {
        UserTier tier = userService.getUserTier(userId);
        RateLimitConfig config = tierConfigs.get(tier);
        return getRateLimiter(config).allowRequest(userId);
    }
}
```

### Q4: How do you handle rate limit during failover/Redis downtime?
**Answer:**
- **Fail-open**: Allow requests but log for monitoring
- **Fail-closed**: Reject all requests (more secure)
- **Local fallback**: Use in-memory rate limiter temporarily
- **Circuit breaker**: Trip after Redis failures, use degraded mode

### Q5: How would you implement rate limiting at Salesforce scale?
**Answer:**
- **Multi-level limiting**: Per org, per user, per API endpoint
- **Adaptive limits**: Adjust based on system load
- **Quota management**: Daily/monthly limits with reset
- **Governor limits**: Salesforce-style limits (API calls, CPU time)

### Q6: How do you test a rate limiter?
**Answer:**
- **Unit tests**: Mock time, test boundary conditions
- **Load tests**: Verify limits hold under concurrent load
- **Chaos testing**: Redis failures, network partitions
- **Integration tests**: End-to-end with real Redis

---

## 💡 Key Interview Tips

1. **Start with requirements** - Always clarify single vs distributed
2. **Discuss tradeoffs** - No perfect algorithm, context matters
3. **Consider edge cases** - Clock skew, Redis failures, burst handling
4. **Mention monitoring** - Metrics, alerts, dashboards
5. **Scale considerations** - Memory usage, Redis connections

---

## 🔗 Related Concepts
- API Gateway design
- Circuit Breaker pattern
- Throttling vs Rate Limiting
- Backpressure mechanisms
