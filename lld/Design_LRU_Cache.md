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
interface ICacheStrategy {
    int get(int key);
    boolean set(int key, int value);
}

class Node {
    int key;
    int value;
    int frequency;
    Node next;
    Node prev;

    public Node(int key, int value){
        this.key = key;
        this.value = value;
        this.frequency = 0;
    }
}

class DLL {
    Node head;
    Node tail;

    public DLL(){
        head = new Node(-1,-1);
        tail = new Node(-1,-1);
        head.next = tail;
        tail.prev = head;
    }

    public void addToFront(Node n){
        Node temp = head.next;
        head.next = n;
        n.next = temp;
        temp.prev = n;
        n.prev = head;
    }

    public void remove(Node n){
        n.prev.next = n.next;
        n.next.prev = n.prev;
    }

    public Node removeLast(){
        Node temp = tail.prev;
        temp.prev.next = tail;
        tail.prev = temp.prev;
        return temp;
    }

    public boolean isEmpty(){
        return head.next == tail && tail.prev == head;
    }
}


class LRUCache implements ICacheStrategy{
    ConcurrentHashMap<Integer,Node> map ;
    DLL linkedList;
    int size;
    public LRUCache(int size){
        this.map = new ConcurrentHashMap<>();
        linkedList = new DLL();
        this.size = size;
    }


    @Override
    public synchronized int get(int key) {
        if(!map.containsKey(key)){
            return -1;
        }
        Node value = map.get(key);
        linkedList.remove(value);
        linkedList.addToFront(value);
        return value.value;
    }

    @Override
    public synchronized boolean set(int key, int value) {
        if(map.containsKey(key)){
            Node temp = map.get(key);
            temp.value = value;
            linkedList.remove(temp);
            linkedList.addToFront(temp);
        }
        else {
            Node temp = new Node(key,value);
            if(map.size() >= size){
                Node removed = linkedList.removeLast();
                map.remove(removed.key);
                linkedList.addToFront(temp);
            }
            else {
                linkedList.addToFront(temp);
            }
            map.put(key,temp);
        }
        return true;
    }
}


class LFUCache implements ICacheStrategy{

    HashMap<Integer,Node> cache;
    HashMap<Integer,DLL> freqmap;
    int size;
    int minFreq;
    public LFUCache(int size){
        cache = new HashMap<>();
        freqmap = new HashMap<>();
        this.size = size;
        this.minFreq = 0;
    }

    @Override
    public int get(int key) {
        Node val = cache.get(key);
        if(val == null){
            return -1;
        }
        updateFreq(val);
        return val.value;
    }

    @Override
    public boolean set(int key, int value) {
        Node temp = cache.get(key);
        if(temp != null){
            temp.value = value;
            updateFreq(temp);
            return true;
        }

        if(cache.size() >= size){
            Node n = freqmap.get(minFreq).removeLast();
            cache.remove(n.key);
        }


        // Case 3: Insert new node
        Node newNode = new Node(key, value);

        // New node always starts with frequency = 1
        newNode.frequency = 1;
        minFreq = 1;

        freqmap.putIfAbsent(1, new DLL());
        freqmap.get(1).addToFront(newNode);

        cache.put(key, newNode);
        return true;
    }

    public void updateFreq(Node node){
        int prevFreq = node.frequency;

        // Remove from old frequency list (if not new node)
        if (prevFreq > 0) {
            DLL oldList = freqmap.get(prevFreq);
            oldList.remove(node);

            if (oldList.isEmpty() && minFreq == prevFreq) {
                minFreq++;
            }
        }

        // Increase frequency
        node.frequency++;

        // Add to new frequency list
        freqmap.putIfAbsent(node.frequency, new DLL());
        freqmap.get(node.frequency).addToFront(node);
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
