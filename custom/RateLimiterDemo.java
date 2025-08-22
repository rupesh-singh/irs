import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.TimeUnit;

// Strategy Interface
interface RateLimiterStrategy {
    /**
     * Checks if a request is allowed under the current strategy.
     * This method should be thread-safe if the same strategy instance
     * is shared across multiple threads for the same user/key.
     * @return true if the request is allowed, false otherwise.
     */
    boolean allow();
}

// Concrete Strategy 1: Token Bucket
class TokenBucketStrategy implements RateLimiterStrategy {
    private final long capacity; // Maximum number of tokens in the bucket
    private final double refillRate; // Tokens added per second
    private double currentTokens;
    private long lastRefillTimestamp; // Last refill time in nanoseconds

    /**
     * Constructor for TokenBucketStrategy.
     * @param capacity The maximum number of tokens the bucket can hold.
     * @param tokensPerSecond The rate at which tokens are refilled per second.
     */
    public TokenBucketStrategy(long capacity, double tokensPerSecond) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive.");
        }
        if (tokensPerSecond <= 0) {
            throw new IllegalArgumentException("Refill rate must be positive.");
        }
        this.capacity = capacity;
        this.refillRate = tokensPerSecond;
        this.currentTokens = capacity; // Start with a full bucket
        this.lastRefillTimestamp = System.nanoTime();
    }

    private void refill() {
        long now = System.nanoTime();
        long elapsedNanos = now - lastRefillTimestamp;
        if (elapsedNanos > 0) {
            double tokensToAdd = (elapsedNanos / 1_000_000_000.0) * refillRate;
            currentTokens = Math.min(capacity, currentTokens + tokensToAdd);
            lastRefillTimestamp = now;
        }
    }

    @Override
    public synchronized boolean allow() {
        refill(); // Refill tokens before checking
        if (currentTokens >= 1.0) {
            currentTokens -= 1.0;
            return true;
        }
        return false;
    }

    public synchronized double getCurrentTokens() {
        refill();
        return currentTokens;
    }
}

// Concrete Strategy 2: Sliding Window Log
class SlidingWindowLogStrategy implements RateLimiterStrategy {
    private final long windowSizeMillis; // Window duration in milliseconds
    private final int maxRequests;       // Max requests allowed in the window
    private final Queue<Long> requestTimestamps; // Stores timestamps of requests

    /**
     * Constructor for SlidingWindowLogStrategy.
     * @param windowSizeSeconds The duration of the time window in seconds.
     * @param maxRequests The maximum number of requests allowed within that window.
     */
    public SlidingWindowLogStrategy(int windowSizeSeconds, int maxRequests) {
        if (windowSizeSeconds <= 0) {
            throw new IllegalArgumentException("Window size must be positive.");
        }
        if (maxRequests <= 0) {
            throw new IllegalArgumentException("Max requests must be positive.");
        }
        this.windowSizeMillis = TimeUnit.SECONDS.toMillis(windowSizeSeconds);
        this.maxRequests = maxRequests;
        this.requestTimestamps = new LinkedList<>();
    }

    @Override
    public synchronized boolean allow() {
        long currentTimeMillis = System.currentTimeMillis();

        // Remove timestamps older than the current window
        // The condition is: timestamp <= currentTimeMillis - windowSizeMillis
        // which is equivalent to: timestamp + windowSizeMillis <= currentTimeMillis
        while (!requestTimestamps.isEmpty() && requestTimestamps.peek() <= currentTimeMillis - windowSizeMillis) {
            requestTimestamps.poll();
        }

        if (requestTimestamps.size() < maxRequests) {
            requestTimestamps.add(currentTimeMillis);
            return true;
        }
        return false;
    }

    public synchronized int getCurrentRequestCount() {
        // Clean up old requests before returning count, to be accurate
        long currentTimeMillis = System.currentTimeMillis();
        while (!requestTimestamps.isEmpty() && requestTimestamps.peek() <= currentTimeMillis - windowSizeMillis) {
            requestTimestamps.poll();
        }
        return requestTimestamps.size();
    }
}

// Context Class
class UserRateLimiter {
    private final String userId;
    private final RateLimiterStrategy strategy;

    public UserRateLimiter(String userId, RateLimiterStrategy strategy) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty.");
        }
        if (strategy == null) {
            throw new IllegalArgumentException("Strategy cannot be null.");
        }
        this.userId = userId;
        this.strategy = strategy;
    }

    public boolean isAllowed() {
        // In a real system, you might log the user ID and the decision here
        boolean allowed = strategy.allow();
        // System.out.printf("Request for user '%s': %s%n", userId, allowed ? "Allowed" : "Denied");
        return allowed;
    }

    public String getUserId() {
        return userId;
    }

    public RateLimiterStrategy getStrategy() {
        return strategy;
    }
}

// Demo Program
public class RateLimiterDemo {
    public static void main(String[] args) throws InterruptedException {
        // --- Token Bucket Demo ---
        System.out.println("--- Token Bucket Strategy Demo (User A: 5 tokens, 1 token/sec refill) ---");
        // Capacity: 5 tokens, Refill rate: 1 token per second
        TokenBucketStrategy tokenBucket = new TokenBucketStrategy(5, 1.0);
        UserRateLimiter userATokenBucket = new UserRateLimiter("UserA-TokenBucket", tokenBucket);

        // Try 7 requests in quick succession
        for (int i = 1; i <= 7; i++) {
            System.out.printf("User A Request #%d: %s (Tokens: %.2f)%n",
                    i, userATokenBucket.isAllowed() ? "Allowed" : "Denied", tokenBucket.getCurrentTokens());
            Thread.sleep(200); // Small delay between requests
        }

        System.out.println("\nWaiting for 3 seconds to refill tokens...");
        Thread.sleep(3000);

        System.out.printf("User A Tokens after 3s wait: %.2f%n", tokenBucket.getCurrentTokens());

        // Try 3 more requests
        for (int i = 1; i <= 3; i++) {
            System.out.printf("User A Request (after wait) #%d: %s (Tokens: %.2f)%n",
                    i, userATokenBucket.isAllowed() ? "Allowed" : "Denied", tokenBucket.getCurrentTokens());
            Thread.sleep(200);
        }

        // --- Sliding Window Log Demo ---
        System.out.println("\n--- Sliding Window Log Strategy Demo (User B: 3 requests / 5 seconds) ---");
        // Max 3 requests per 5 seconds window
        SlidingWindowLogStrategy slidingWindow = new SlidingWindowLogStrategy(5, 3);
        UserRateLimiter userBSlidingWindow = new UserRateLimiter("UserB-SlidingWindow", slidingWindow);

        // Try 4 requests in quick succession
        for (int i = 1; i <= 4; i++) {
            System.out.printf("User B Request #%d: %s (Current count in window: %d)%n",
                    i, userBSlidingWindow.isAllowed() ? "Allowed" : "Denied", slidingWindow.getCurrentRequestCount());
            Thread.sleep(1000); // 1 second delay between requests
        }

        System.out.println("\nWaiting for 3 seconds (total 4s elapsed in window for first reqs)...");
        // Total time elapsed since first request for User B:
        // Req1 (0s), Req2 (1s), Req3 (2s), Req4 (3s) -> Denied
        // After this sleep, total time elapsed is 3s (for Req4) + 3s (sleep) = 6s.
        // So the first request (at 0s) should be out of the 5s window.
        Thread.sleep(3000);

        System.out.printf("User B trying another request after wait: %s (Current count in window: %d)%n",
                userBSlidingWindow.isAllowed() ? "Allowed" : "Denied", slidingWindow.getCurrentRequestCount());

        System.out.println("\nWaiting for another 2 seconds (total 8s elapsed)...");
        // Now, Req2 (at 1s original time) should also be out of the window.
        // Window started effectively sliding.
        Thread.sleep(2000);

        System.out.printf("User B trying another request after more wait: %s (Current count in window: %d)%n",
                userBSlidingWindow.isAllowed() ? "Allowed" : "Denied", slidingWindow.getCurrentRequestCount());
        System.out.printf("User B trying another request: %s (Current count in window: %d)%n",
                userBSlidingWindow.isAllowed() ? "Allowed" : "Denied", slidingWindow.getCurrentRequestCount());
    }
}
