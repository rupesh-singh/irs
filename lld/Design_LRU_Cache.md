# LLD: LRU Cache

## 📋 Problem Statement
Design a Least Recently Used (LRU) Cache that supports `get` and `put` operations in O(1) time complexity.

---

## 🎯 Clarifying Questions to Ask

1. **Capacity constraint?** - Fixed size or dynamic?
2. **Thread-safety required?** - Single or multi-threaded access?
3. **Eviction policy?** - Pure LRU or with TTL?
4. **What to store?** - Key-value types, size limits?
5. **Distributed or local?** - Need Redis or in-memory?

---

## ✅ Requirements

### Functional
- `get(key)`: Return value if exists, else -1. Mark as recently used.
- `put(key, value)`: Insert/update. Evict LRU if at capacity.
- O(1) time for both operations

### Non-Functional
- Thread-safe for concurrent access
- Memory efficient
- Support for TTL (optional enhancement)

---

## 🏗️ Core Implementation

```java
class LRUCache<K, V> {
    
    private final int capacity;
    private final Map<K, Node<K, V>> cache;
    private final DoublyLinkedList<K, V> dll;
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        this.dll = new DoublyLinkedList<>();
    }
    
    public V get(K key) {
        Node<K, V> node = cache.get(key);
        if (node == null) {
            return null;
        }
        // Move to front (most recently used)
        dll.moveToFront(node);
        return node.value;
    }
    
    public void put(K key, V value) {
        Node<K, V> existing = cache.get(key);
        
        if (existing != null) {
            existing.value = value;
            dll.moveToFront(existing);
            return;
        }
        
        // Evict if at capacity
        if (cache.size() >= capacity) {
            Node<K, V> lru = dll.removeLast();
            cache.remove(lru.key);
        }
        
        // Add new node
        Node<K, V> newNode = new Node<>(key, value);
        dll.addFirst(newNode);
        cache.put(key, newNode);
    }
    
    public void remove(K key) {
        Node<K, V> node = cache.remove(key);
        if (node != null) {
            dll.remove(node);
        }
    }
}

class Node<K, V> {
    K key;
    V value;
    Node<K, V> prev;
    Node<K, V> next;
    
    Node(K key, V value) {
        this.key = key;
        this.value = value;
    }
}

class DoublyLinkedList<K, V> {
    private final Node<K, V> head; // dummy head
    private final Node<K, V> tail; // dummy tail
    
    DoublyLinkedList() {
        head = new Node<>(null, null);
        tail = new Node<>(null, null);
        head.next = tail;
        tail.prev = head;
    }
    
    void addFirst(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
    
    void remove(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    void moveToFront(Node<K, V> node) {
        remove(node);
        addFirst(node);
    }
    
    Node<K, V> removeLast() {
        if (tail.prev == head) {
            return null;
        }
        Node<K, V> last = tail.prev;
        remove(last);
        return last;
    }
}
```

---

## 🔒 Thread-Safe Implementation

```java
class ConcurrentLRUCache<K, V> {
    
    private final int capacity;
    private final Map<K, Node<K, V>> cache;
    private final DoublyLinkedList<K, V> dll;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Lock readLock = lock.readLock();
    private final Lock writeLock = lock.writeLock();
    
    public V get(K key) {
        writeLock.lock(); // Need write lock because we modify order
        try {
            Node<K, V> node = cache.get(key);
            if (node == null) return null;
            dll.moveToFront(node);
            return node.value;
        } finally {
            writeLock.unlock();
        }
    }
    
    public void put(K key, V value) {
        writeLock.lock();
        try {
            // Same logic as non-thread-safe version
            Node<K, V> existing = cache.get(key);
            if (existing != null) {
                existing.value = value;
                dll.moveToFront(existing);
                return;
            }
            
            if (cache.size() >= capacity) {
                Node<K, V> lru = dll.removeLast();
                cache.remove(lru.key);
            }
            
            Node<K, V> newNode = new Node<>(key, value);
            dll.addFirst(newNode);
            cache.put(key, newNode);
        } finally {
            writeLock.unlock();
        }
    }
}

// Alternative: Using ConcurrentLinkedHashMap (Guava-style)
class SimpleConcurrentLRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    
    public SimpleConcurrentLRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
    
    // Wrap all methods with synchronized for thread-safety
}
```

---

## ⏰ LRU Cache with TTL

```java
class LRUCacheWithTTL<K, V> {
    
    private final int capacity;
    private final long defaultTTLMs;
    private final Map<K, TimedNode<K, V>> cache;
    private final DoublyLinkedList<K, V> dll;
    private final ScheduledExecutorService cleaner;
    
    class TimedNode<K, V> extends Node<K, V> {
        long expiryTime;
        
        TimedNode(K key, V value, long ttlMs) {
            super(key, value);
            this.expiryTime = System.currentTimeMillis() + ttlMs;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }
    
    public V get(K key) {
        TimedNode<K, V> node = cache.get(key);
        if (node == null) return null;
        
        if (node.isExpired()) {
            remove(key);
            return null;
        }
        
        dll.moveToFront(node);
        return node.value;
    }
    
    public void put(K key, V value, long ttlMs) {
        // Similar to basic put, but with TTL tracking
        TimedNode<K, V> node = new TimedNode<>(key, value, ttlMs);
        // ... rest of put logic
    }
    
    // Background cleanup of expired entries
    private void startCleanupTask() {
        cleaner.scheduleAtFixedRate(() -> {
            cache.entrySet().removeIf(e -> e.getValue().isExpired());
        }, 1, 1, TimeUnit.MINUTES);
    }
}
```

---

## 🎨 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       LRUCache<K, V>                        │
├─────────────────────────────────────────────────────────────┤
│ - capacity: int                                             │
│ - cache: Map<K, Node<K,V>>                                 │
│ - dll: DoublyLinkedList<K,V>                               │
├─────────────────────────────────────────────────────────────┤
│ + get(key: K): V                                           │
│ + put(key: K, value: V): void                              │
│ + remove(key: K): void                                     │
│ + size(): int                                              │
└─────────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│      Node<K, V>         │    │   DoublyLinkedList<K, V>    │
├─────────────────────────┤    ├─────────────────────────────┤
│ - key: K                │    │ - head: Node<K,V>           │
│ - value: V              │◄───│ - tail: Node<K,V>           │
│ - prev: Node            │    ├─────────────────────────────┤
│ - next: Node            │    │ + addFirst(node)            │
└─────────────────────────┘    │ + remove(node)              │
                               │ + moveToFront(node)         │
                               │ + removeLast(): Node        │
                               └─────────────────────────────┘
```

---

## 📊 Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| `get()` | O(1) | O(1) |
| `put()` | O(1) | O(1) |
| `remove()` | O(1) | O(1) |
| **Overall Space** | - | O(capacity) |

---

## ❓ Follow-up Questions & Answers

### Q1: Why use HashMap + DoublyLinkedList instead of just LinkedHashMap?
**Answer:**
- **Interview expectation**: Shows understanding of data structures
- **Custom control**: LinkedHashMap doesn't expose internal nodes
- **Flexibility**: Can add features like TTL, priority, size-based eviction
- **Production**: LinkedHashMap is fine, but custom gives more control

### Q2: How would you implement an LFU (Least Frequently Used) Cache?
**Answer:**
```java
class LFUCache<K, V> {
    Map<K, Node<K, V>> cache;
    Map<Integer, DoublyLinkedList<K, V>> frequencyMap;
    int minFrequency;
    
    V get(K key) {
        Node<K, V> node = cache.get(key);
        if (node == null) return null;
        
        // Update frequency
        updateFrequency(node);
        return node.value;
    }
    
    void updateFrequency(Node<K, V> node) {
        int oldFreq = node.frequency;
        frequencyMap.get(oldFreq).remove(node);
        
        if (frequencyMap.get(oldFreq).isEmpty() && minFrequency == oldFreq) {
            minFrequency++;
        }
        
        node.frequency++;
        frequencyMap.computeIfAbsent(node.frequency, k -> new DoublyLinkedList<>())
                    .addFirst(node);
    }
}
```

### Q3: How would you design a distributed LRU cache?
**Answer:**
- Use **Redis** with `ZSET` for ordering by access time
- Implement **consistent hashing** for sharding
- Use **write-through** or **write-behind** strategies
- Consider **cache-aside** pattern for DB integration
- Handle **cache invalidation** across nodes

### Q4: How do you handle cache stampede (thundering herd)?
**Answer:**
```java
class StampedeProtectedCache<K, V> {
    private final Cache<K, V> cache;
    private final Map<K, Lock> keyLocks = new ConcurrentHashMap<>();
    
    V get(K key, Supplier<V> loader) {
        V value = cache.get(key);
        if (value != null) return value;
        
        Lock lock = keyLocks.computeIfAbsent(key, k -> new ReentrantLock());
        lock.lock();
        try {
            // Double-check after acquiring lock
            value = cache.get(key);
            if (value != null) return value;
            
            value = loader.get();
            cache.put(key, value);
            return value;
        } finally {
            lock.unlock();
            keyLocks.remove(key);
        }
    }
}
```

### Q5: How would you implement size-based eviction (not count-based)?
**Answer:**
```java
class SizeBasedLRUCache<K, V> {
    private final long maxSizeBytes;
    private long currentSize;
    
    void put(K key, V value) {
        long valueSize = estimateSize(value);
        
        while (currentSize + valueSize > maxSizeBytes && !cache.isEmpty()) {
            Node<K, V> lru = dll.removeLast();
            currentSize -= estimateSize(lru.value);
            cache.remove(lru.key);
        }
        
        // Add new entry
        currentSize += valueSize;
        // ... rest of put logic
    }
    
    private long estimateSize(V value) {
        // Use instrumentation or estimation
        return ObjectSizeCalculator.getObjectSize(value);
    }
}
```

### Q6: How do you test an LRU cache thoroughly?
**Answer:**
- **Capacity tests**: Verify eviction at capacity
- **Access order tests**: Verify get() updates order
- **Concurrent tests**: Thread safety validation
- **Edge cases**: Empty cache, single element, duplicate keys
- **Performance tests**: O(1) verification under load

---

## 💡 Key Interview Tips

1. **Draw the data structure** - HashMap + DLL diagram
2. **Explain why O(1)** - HashMap for lookup, DLL for order
3. **Handle edge cases** - Capacity 0, null values
4. **Discuss thread-safety** - Even if not asked
5. **Mention real-world usage** - CPU cache, DB query cache, CDN

---

## 🔗 Related Concepts
- LFU Cache
- Write-through vs Write-behind caching
- Cache invalidation strategies
- Redis EXPIRE and eviction policies
