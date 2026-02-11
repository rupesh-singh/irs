# LLD: Pub-Sub Messaging System

## 📋 Problem Statement
Design a Publish-Subscribe (Pub-Sub) Messaging System that allows publishers to send messages to topics and subscribers to receive messages from topics they've subscribed to.

---

## 🎯 Clarifying Questions to Ask

1. **Push vs Pull model?** - Push to subscribers or subscribers poll?
2. **Message ordering?** - FIFO guaranteed per topic/partition?
3. **Delivery semantics?** - At-least-once, at-most-once, exactly-once?
4. **Message persistence?** - In-memory or durable storage?
5. **Scalability needs?** - Number of topics, subscribers, messages/sec?
6. **Message retention?** - TTL for messages?

---

## ✅ Requirements

### Functional
- Create/delete topics
- Publish messages to topics
- Subscribe/unsubscribe to topics
- Receive messages (push or pull)
- Support multiple subscribers per topic
- Message filtering based on attributes

### Non-Functional
- High throughput (100K+ messages/sec)
- Low latency (< 10ms P99)
- Message durability (survive restarts)
- Horizontal scalability
- At-least-once delivery guarantee

---

## 🏗️ Core Classes & Interfaces

```java
// ==================== ENTITIES ====================
class Topic {
    String id;
    String name;
    TopicConfig config;
    List<Partition> partitions;
    LocalDateTime createdAt;
}

class TopicConfig {
    int numPartitions = 1;
    int replicationFactor = 1;
    Duration retentionPeriod = Duration.ofDays(7);
    int maxMessageSize = 1_000_000;  // 1 MB
}

class Partition {
    int partitionId;
    String topicId;
    List<Message> messages;
    long currentOffset;
}

class Message {
    String id;
    String topicId;
    int partitionId;
    long offset;
    String key;              // For partitioning
    byte[] payload;
    Map<String, String> headers;
    LocalDateTime publishedAt;
}

class Subscription {
    String id;
    String subscriberId;
    String topicId;
    SubscriptionType type;   // PUSH or PULL
    String callbackUrl;      // For PUSH
    FilterExpression filter;
    Map<Integer, Long> partitionOffsets;  // Current read position
    AckMode ackMode;
}

enum SubscriptionType {
    PUSH, PULL
}

enum AckMode {
    AUTO, MANUAL
}

class FilterExpression {
    Map<String, String> attributeFilters;  // e.g., {"priority": "high"}
    
    boolean matches(Message message) {
        for (var entry : attributeFilters.entrySet()) {
            String value = message.headers.get(entry.getKey());
            if (!entry.getValue().equals(value)) {
                return false;
            }
        }
        return true;
    }
}

// ==================== INTERFACES ====================
interface MessageBroker {
    String createTopic(String name, TopicConfig config);
    void deleteTopic(String topicId);
    void publish(String topicId, Message message);
    String subscribe(String topicId, SubscriptionConfig config);
    void unsubscribe(String subscriptionId);
    List<Message> poll(String subscriptionId, int maxMessages);
    void acknowledge(String subscriptionId, List<String> messageIds);
}

// ==================== PUBLISHER ====================
class Publisher {
    private final MessageBroker broker;
    private final Partitioner partitioner;
    
    public void publish(String topicId, String key, byte[] payload, Map<String, String> headers) {
        Message message = Message.builder()
            .id(UUID.randomUUID().toString())
            .topicId(topicId)
            .key(key)
            .payload(payload)
            .headers(headers)
            .publishedAt(LocalDateTime.now())
            .build();
        
        broker.publish(topicId, message);
    }
    
    // Batch publishing for efficiency
    public void publishBatch(String topicId, List<MessageRequest> messages) {
        List<Message> batch = messages.stream()
            .map(this::toMessage)
            .collect(Collectors.toList());
        
        broker.publishBatch(topicId, batch);
    }
}

// ==================== PARTITIONER ====================
interface Partitioner {
    int getPartition(String key, int numPartitions);
}

class HashPartitioner implements Partitioner {
    @Override
    public int getPartition(String key, int numPartitions) {
        if (key == null) {
            return ThreadLocalRandom.current().nextInt(numPartitions);
        }
        return Math.abs(key.hashCode() % numPartitions);
    }
}

class RoundRobinPartitioner implements Partitioner {
    private final AtomicInteger counter = new AtomicInteger(0);
    
    @Override
    public int getPartition(String key, int numPartitions) {
        return counter.getAndIncrement() % numPartitions;
    }
}

// ==================== CORE BROKER ====================
class InMemoryMessageBroker implements MessageBroker {
    private final Map<String, Topic> topics = new ConcurrentHashMap<>();
    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();
    private final Map<String, BlockingQueue<Message>> topicQueues = new ConcurrentHashMap<>();
    private final Partitioner partitioner = new HashPartitioner();
    
    @Override
    public String createTopic(String name, TopicConfig config) {
        String topicId = UUID.randomUUID().toString();
        Topic topic = new Topic(topicId, name, config);
        
        // Create partitions
        for (int i = 0; i < config.numPartitions; i++) {
            topic.partitions.add(new Partition(i, topicId));
        }
        
        topics.put(topicId, topic);
        topicQueues.put(topicId, new LinkedBlockingQueue<>());
        
        return topicId;
    }
    
    @Override
    public void publish(String topicId, Message message) {
        Topic topic = topics.get(topicId);
        if (topic == null) {
            throw new TopicNotFoundException(topicId);
        }
        
        // Validate message size
        if (message.payload.length > topic.config.maxMessageSize) {
            throw new MessageTooLargeException();
        }
        
        // Determine partition
        int partitionId = partitioner.getPartition(message.key, topic.partitions.size());
        Partition partition = topic.partitions.get(partitionId);
        
        synchronized (partition) {
            message.partitionId = partitionId;
            message.offset = partition.currentOffset++;
            partition.messages.add(message);
        }
        
        // Notify push subscribers
        notifyPushSubscribers(topicId, message);
    }
    
    @Override
    public List<Message> poll(String subscriptionId, int maxMessages) {
        Subscription sub = subscriptions.get(subscriptionId);
        if (sub.type != SubscriptionType.PULL) {
            throw new InvalidOperationException("Cannot poll a PUSH subscription");
        }
        
        Topic topic = topics.get(sub.topicId);
        List<Message> result = new ArrayList<>();
        
        for (Partition partition : topic.partitions) {
            long currentOffset = sub.partitionOffsets.getOrDefault(partition.partitionId, 0L);
            
            for (Message msg : partition.messages) {
                if (msg.offset >= currentOffset && result.size() < maxMessages) {
                    if (sub.filter == null || sub.filter.matches(msg)) {
                        result.add(msg);
                    }
                }
            }
        }
        
        return result;
    }
    
    @Override
    public void acknowledge(String subscriptionId, List<String> messageIds) {
        Subscription sub = subscriptions.get(subscriptionId);
        
        // Update offsets based on acknowledged messages
        for (String messageId : messageIds) {
            Message msg = findMessage(messageId);
            long currentOffset = sub.partitionOffsets.getOrDefault(msg.partitionId, 0L);
            sub.partitionOffsets.put(msg.partitionId, Math.max(currentOffset, msg.offset + 1));
        }
    }
    
    private void notifyPushSubscribers(String topicId, Message message) {
        List<Subscription> pushSubs = subscriptions.values().stream()
            .filter(s -> s.topicId.equals(topicId))
            .filter(s -> s.type == SubscriptionType.PUSH)
            .filter(s -> s.filter == null || s.filter.matches(message))
            .collect(Collectors.toList());
        
        for (Subscription sub : pushSubs) {
            pushExecutor.submit(() -> {
                deliverWithRetry(sub, message);
            });
        }
    }
    
    private void deliverWithRetry(Subscription sub, Message message) {
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++) {
            try {
                httpClient.post(sub.callbackUrl, message);
                return;
            } catch (Exception e) {
                Thread.sleep((long) Math.pow(2, i) * 1000);  // Exponential backoff
            }
        }
        // Move to dead letter queue after max retries
        deadLetterQueue.add(message);
    }
}

// ==================== SUBSCRIBER ====================
class Subscriber {
    private final MessageBroker broker;
    private final String subscriptionId;
    private final MessageHandler handler;
    private volatile boolean running = true;
    
    public void startPolling() {
        while (running) {
            try {
                List<Message> messages = broker.poll(subscriptionId, 100);
                
                List<String> successfulIds = new ArrayList<>();
                for (Message message : messages) {
                    try {
                        handler.handle(message);
                        successfulIds.add(message.id);
                    } catch (Exception e) {
                        // Log and continue, don't ack failed messages
                        logger.error("Failed to process message: " + message.id, e);
                    }
                }
                
                if (!successfulIds.isEmpty()) {
                    broker.acknowledge(subscriptionId, successfulIds);
                }
                
                if (messages.isEmpty()) {
                    Thread.sleep(100);  // Back off if no messages
                }
            } catch (Exception e) {
                logger.error("Polling error", e);
                Thread.sleep(1000);
            }
        }
    }
    
    public void stop() {
        running = false;
    }
}

interface MessageHandler {
    void handle(Message message);
}

// ==================== CONSUMER GROUP ====================
class ConsumerGroup {
    String groupId;
    String topicId;
    List<Consumer> consumers;
    Map<Integer, String> partitionAssignment;  // partition -> consumerId
    
    // Rebalance when consumers join/leave
    void rebalance() {
        Topic topic = topicRepository.findById(topicId);
        int numPartitions = topic.partitions.size();
        int numConsumers = consumers.size();
        
        partitionAssignment.clear();
        
        // Round-robin assignment
        for (int i = 0; i < numPartitions; i++) {
            String consumerId = consumers.get(i % numConsumers).id;
            partitionAssignment.put(i, consumerId);
        }
        
        // Notify consumers of their assignments
        for (Consumer consumer : consumers) {
            List<Integer> assignedPartitions = getAssignedPartitions(consumer.id);
            consumer.onPartitionsAssigned(assignedPartitions);
        }
    }
}
```

---

## 🎨 Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              PUB-SUB SYSTEM                               │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Publisher 1 │     │ Publisher 2 │     │ Publisher 3 │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │      Message Broker     │
              │                         │
              │  ┌───────────────────┐  │
              │  │   Topic Manager   │  │
              │  └───────────────────┘  │
              │  ┌───────────────────┐  │
              │  │  Partition Manager│  │
              │  └───────────────────┘  │
              │  ┌───────────────────┐  │
              │  │ Subscription Mgr  │  │
              │  └───────────────────┘  │
              └───────────┬─────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Topic A   │   │   Topic B   │   │   Topic C   │
│ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │
│ │ Part 0  │ │   │ │ Part 0  │ │   │ │ Part 0  │ │
│ │ Part 1  │ │   │ │ Part 1  │ │   │ │ Part 1  │ │
│ │ Part 2  │ │   │ │ Part 2  │ │   └─────────────┘
│ └─────────┘ │   └─────────────┘
└──────┬──────┘
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼ (PUSH)                                   ▼ (PULL)
┌─────────────────┐                    ┌─────────────────────────┐
│  Webhook        │                    │   Consumer Group        │
│  Subscribers    │                    │  ┌───────┐ ┌───────┐   │
│                 │                    │  │ C1    │ │ C2    │   │
│  HTTP POST      │                    │  │ P0,P1 │ │ P2    │   │
│  to callback    │                    │  └───────┘ └───────┘   │
└─────────────────┘                    └─────────────────────────┘
```

---

## 🗄️ Database Schema

```sql
-- Topics table
CREATE TABLE topics (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    num_partitions INT DEFAULT 1,
    replication_factor INT DEFAULT 1,
    retention_ms BIGINT DEFAULT 604800000,  -- 7 days
    max_message_size INT DEFAULT 1048576,   -- 1 MB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (consider time-series DB for production)
CREATE TABLE messages (
    id VARCHAR(36),
    topic_id VARCHAR(36) NOT NULL,
    partition_id INT NOT NULL,
    offset_num BIGINT NOT NULL,
    message_key VARCHAR(255),
    payload BLOB NOT NULL,
    headers JSON,
    published_at TIMESTAMP NOT NULL,
    PRIMARY KEY (topic_id, partition_id, offset_num),
    INDEX idx_published_at (published_at)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    subscriber_id VARCHAR(100) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    subscription_type VARCHAR(10) NOT NULL,  -- PUSH or PULL
    callback_url VARCHAR(500),
    filter_expression JSON,
    ack_mode VARCHAR(10) DEFAULT 'AUTO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, topic_id)
);

-- Consumer offsets table
CREATE TABLE consumer_offsets (
    subscription_id VARCHAR(36),
    partition_id INT,
    current_offset BIGINT NOT NULL,
    committed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (subscription_id, partition_id)
);

-- Dead letter queue
CREATE TABLE dead_letter_queue (
    id VARCHAR(36) PRIMARY KEY,
    original_message_id VARCHAR(36),
    topic_id VARCHAR(36),
    subscription_id VARCHAR(36),
    payload BLOB,
    error_message TEXT,
    retry_count INT,
    failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ❓ Follow-up Questions & Answers

### Q1: How do you ensure message ordering?
**Answer:**
- **Per-partition ordering**: Messages with same key go to same partition
- **Single partition**: Guarantees total order (but limits throughput)
- **Sequence numbers**: Clients can reorder if needed
```java
// Same key = same partition = ordered delivery
publisher.publish(topicId, "user-123", payload);  // All user-123 messages ordered
```

### Q2: How do you handle slow consumers?
**Answer:**
- **Backpressure**: Rate limit message delivery
- **Buffering**: Queue messages per subscriber with limits
- **Dead letter queue**: Move failed messages after retries
- **Consumer lag monitoring**: Alert when lag exceeds threshold
```java
class SlowConsumerHandler {
    private final Map<String, RateLimiter> consumerLimiters;
    
    void deliver(Subscription sub, Message msg) {
        RateLimiter limiter = consumerLimiters.get(sub.id);
        if (limiter.tryAcquire()) {
            deliver(sub.callbackUrl, msg);
        } else {
            buffer.add(sub.id, msg);  // Buffer for later
        }
    }
}
```

### Q3: How do you implement exactly-once delivery?
**Answer:**
- **Idempotent consumers**: Design handlers to be idempotent
- **Deduplication at broker**: Track message IDs
- **Transactional outbox**: Atomic DB + publish
```java
class ExactlyOnceConsumer {
    Set<String> processedIds;  // Persist this
    
    void handle(Message msg) {
        if (processedIds.contains(msg.id)) {
            return;  // Already processed
        }
        
        // Process in transaction
        transaction(() -> {
            doProcess(msg);
            processedIds.add(msg.id);
            commitOffset(msg.offset);
        });
    }
}
```

### Q4: How do you scale the broker horizontally?
**Answer:**
- **Partition distribution**: Different brokers own different partitions
- **Consistent hashing**: Route publishers to correct broker
- **Leader election**: One leader per partition for writes
- **Replication**: Followers replicate from leader

### Q5: How do you handle broker failures?
**Answer:**
- **Replication**: Multiple copies of each partition
- **Leader election**: Zookeeper/etcd elects new leader
- **Consumer rebalance**: Reassign partitions to live brokers
```java
// Replication during publish
void publishWithReplication(Message msg) {
    Partition leader = getLeader(msg.partitionId);
    leader.append(msg);
    
    // Sync to followers
    for (Partition follower : getFollowers(msg.partitionId)) {
        follower.replicate(msg);
    }
    
    // Wait for acks based on config
    if (ackConfig == ALL) {
        waitForAllFollowerAcks();
    }
}
```

### Q6: How is this different from a message queue?
**Answer:**
| Aspect | Message Queue | Pub-Sub |
|--------|--------------|---------|
| Consumers | Single consumer per message | Multiple subscribers |
| Delivery | Point-to-point | Broadcast |
| Pattern | Work distribution | Event notification |
| Message fate | Deleted after consume | Retained for all subscribers |
| Use case | Task processing | Event streaming |

---

## 💡 Key Interview Tips

1. **Clarify push vs pull** - Different implementations
2. **Discuss partitioning** - Key for scalability
3. **Draw message flow** - Publisher → Broker → Subscriber
4. **Mention delivery guarantees** - At-least-once is common
5. **Salesforce context** - Platform Events, Change Data Capture

---

## 🔗 Related Concepts
- Apache Kafka architecture
- Event sourcing pattern
- CQRS (Command Query Responsibility Segregation)
- Salesforce Platform Events
