# LLD: Notification System

## 📋 Problem Statement
Design a Notification System that can send notifications through multiple channels (Email, SMS, Push, In-App) with support for templates, scheduling, and user preferences.

---

## 🎯 Clarifying Questions to Ask

1. **Which channels to support?** - Email, SMS, Push, In-App, Slack?
2. **Real-time or batched?** - Immediate delivery or scheduled?
3. **Template support?** - Dynamic content with placeholders?
4. **User preferences?** - Opt-in/opt-out, quiet hours?
5. **Delivery guarantees?** - At-least-once, exactly-once?
6. **Scale requirements?** - Notifications per second?

---

## ✅ Requirements

### Functional
- Send notifications via multiple channels
- Support notification templates with dynamic data
- Handle user preferences and opt-outs
- Schedule notifications for future delivery
- Track delivery status and failures
- Retry failed notifications

### Non-Functional
- High throughput (100K+ notifications/min)
- Low latency for real-time notifications
- Fault-tolerant with retry mechanism
- Scalable horizontally

---

## 🏗️ Core Classes & Interfaces

```java
// ==================== ENUMS ====================
enum NotificationChannel {
    EMAIL, SMS, PUSH, IN_APP, SLACK
}

enum NotificationStatus {
    PENDING, QUEUED, SENT, DELIVERED, FAILED, CANCELLED
}

enum NotificationPriority {
    LOW, MEDIUM, HIGH, CRITICAL
}

// ==================== ENTITIES ====================
class Notification {
    String id;
    String userId;
    NotificationChannel channel;
    String templateId;
    Map<String, Object> templateData;
    NotificationPriority priority;
    NotificationStatus status;
    LocalDateTime scheduledAt;
    LocalDateTime sentAt;
    int retryCount;
    String failureReason;
}

class NotificationTemplate {
    String id;
    String name;
    NotificationChannel channel;
    String subject;        // for email
    String bodyTemplate;   // with placeholders like {{userName}}
    boolean active;
}

class UserPreference {
    String userId;
    Set<NotificationChannel> enabledChannels;
    Map<String, Boolean> categoryPreferences;  // e.g., "marketing" -> false
    String quietHoursStart;  // "22:00"
    String quietHoursEnd;    // "08:00"
    String timezone;
}

// ==================== INTERFACES ====================
interface NotificationSender {
    NotificationResult send(Notification notification);
    NotificationChannel getChannel();
}

class NotificationResult {
    boolean success;
    String externalId;      // Provider's message ID
    String errorMessage;
    boolean retryable;
}

// ==================== CHANNEL IMPLEMENTATIONS ====================
class EmailNotificationSender implements NotificationSender {
    private final EmailClient emailClient;      // SendGrid, SES, etc.
    private final TemplateEngine templateEngine;
    
    @Override
    public NotificationResult send(Notification notification) {
        try {
            NotificationTemplate template = templateService.get(notification.templateId);
            String body = templateEngine.render(template.bodyTemplate, notification.templateData);
            String subject = templateEngine.render(template.subject, notification.templateData);
            
            String email = userService.getEmail(notification.userId);
            String messageId = emailClient.send(email, subject, body);
            
            return new NotificationResult(true, messageId, null, false);
        } catch (Exception e) {
            return new NotificationResult(false, null, e.getMessage(), isRetryable(e));
        }
    }
    
    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.EMAIL;
    }
}

class SMSNotificationSender implements NotificationSender {
    private final SMSClient smsClient;  // Twilio, SNS
    
    @Override
    public NotificationResult send(Notification notification) {
        String phone = userService.getPhone(notification.userId);
        String body = templateEngine.render(template.bodyTemplate, notification.templateData);
        
        // SMS-specific: truncate if too long
        if (body.length() > 160) {
            body = body.substring(0, 157) + "...";
        }
        
        return smsClient.send(phone, body);
    }
    
    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.SMS;
    }
}

class PushNotificationSender implements NotificationSender {
    private final FCMClient fcmClient;      // Firebase
    private final APNSClient apnsClient;    // Apple
    
    @Override
    public NotificationResult send(Notification notification) {
        List<DeviceToken> tokens = deviceService.getTokens(notification.userId);
        
        for (DeviceToken token : tokens) {
            if (token.platform == Platform.ANDROID) {
                fcmClient.send(token.value, notification);
            } else {
                apnsClient.send(token.value, notification);
            }
        }
        
        return new NotificationResult(true, null, null, false);
    }
    
    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.PUSH;
    }
}

// ==================== CORE SERVICE ====================
class NotificationService {
    private final Map<NotificationChannel, NotificationSender> senders;
    private final NotificationRepository repository;
    private final UserPreferenceService preferenceService;
    private final MessageQueue messageQueue;
    private final RateLimiter rateLimiter;
    
    public String sendNotification(NotificationRequest request) {
        // 1. Validate request
        validateRequest(request);
        
        // 2. Check user preferences
        UserPreference prefs = preferenceService.get(request.userId);
        if (!isNotificationAllowed(request, prefs)) {
            throw new NotificationBlockedException("User has opted out");
        }
        
        // 3. Create notification entity
        Notification notification = createNotification(request);
        repository.save(notification);
        
        // 4. Queue for processing (or process immediately if high priority)
        if (notification.priority == NotificationPriority.CRITICAL) {
            processNotification(notification);
        } else {
            messageQueue.enqueue(notification);
        }
        
        return notification.id;
    }
    
    public void processNotification(Notification notification) {
        // Rate limiting
        if (!rateLimiter.allowRequest(notification.userId)) {
            reschedule(notification, Duration.ofMinutes(5));
            return;
        }
        
        // Check quiet hours
        if (isInQuietHours(notification.userId)) {
            reschedule(notification, getQuietHoursEnd(notification.userId));
            return;
        }
        
        NotificationSender sender = senders.get(notification.channel);
        NotificationResult result = sender.send(notification);
        
        if (result.success) {
            notification.status = NotificationStatus.SENT;
            notification.sentAt = LocalDateTime.now();
        } else if (result.retryable && notification.retryCount < MAX_RETRIES) {
            notification.retryCount++;
            notification.status = NotificationStatus.PENDING;
            messageQueue.enqueueWithDelay(notification, getBackoffDelay(notification.retryCount));
        } else {
            notification.status = NotificationStatus.FAILED;
            notification.failureReason = result.errorMessage;
        }
        
        repository.save(notification);
    }
    
    private Duration getBackoffDelay(int retryCount) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        return Duration.ofSeconds((long) Math.pow(2, retryCount));
    }
}

// ==================== SCHEDULER ====================
class NotificationScheduler {
    private final ScheduledExecutorService executor;
    private final NotificationRepository repository;
    private final MessageQueue queue;
    
    @Scheduled(fixedRate = 60000)  // Every minute
    public void processScheduledNotifications() {
        List<Notification> scheduled = repository.findScheduledBefore(LocalDateTime.now());
        
        for (Notification notification : scheduled) {
            notification.status = NotificationStatus.QUEUED;
            queue.enqueue(notification);
        }
    }
}

// ==================== TEMPLATE ENGINE ====================
class TemplateEngine {
    public String render(String template, Map<String, Object> data) {
        String result = template;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", 
                                    String.valueOf(entry.getValue()));
        }
        return result;
    }
}
```

---

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NotificationService                              │
│  + sendNotification(request)                                            │
│  + processNotification(notification)                                    │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│ PreferenceCheck │  │  Rate Limiter   │  │     Message Queue           │
│ (opt-outs,      │  │  (per user/     │  │  (Kafka/SQS/RabbitMQ)      │
│  quiet hours)   │  │   per channel)  │  │                             │
└─────────────────┘  └─────────────────┘  └─────────────────────────────┘
                                                      │
                                                      ▼
                              ┌─────────────────────────────────────────┐
                              │         Notification Workers            │
                              │   (consume from queue, send via         │
                              │    appropriate channel sender)          │
                              └─────────────────────────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          ▼                              ▼                              ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  EmailSender    │           │   SMSSender     │           │   PushSender    │
│  (SendGrid/SES) │           │  (Twilio/SNS)   │           │  (FCM/APNS)     │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## 🗄️ Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    template_id VARCHAR(36),
    template_data JSON,
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PENDING',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_scheduled (status, scheduled_at),
    INDEX idx_user_id (user_id)
);

-- Templates table
CREATE TABLE notification_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    UNIQUE(name, channel)
);

-- User Preferences table
CREATE TABLE user_preferences (
    user_id VARCHAR(36) PRIMARY KEY,
    enabled_channels JSON,
    category_preferences JSON,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC'
);
```

---

## ❓ Follow-up Questions & Answers

### Q1: How would you ensure exactly-once delivery?
**Answer:**
- Use **idempotency keys** for each notification
- Store delivery status in DB before sending
- Use **outbox pattern**: Write to DB in transaction, then async send
- For critical notifications, use **2PC** or **saga pattern**
```java
// Idempotency check
if (repository.existsByIdempotencyKey(request.idempotencyKey)) {
    return repository.findByIdempotencyKey(request.idempotencyKey).getId();
}
```

### Q2: How do you handle high-priority notifications during system overload?
**Answer:**
- Use **priority queues** with separate workers
- **Dedicated pool** for critical notifications
- **Circuit breaker** for non-critical channels
- **Backpressure** handling with rate limiting
```java
// Priority-based routing
if (notification.priority == CRITICAL) {
    criticalQueue.enqueue(notification);  // Faster processing
} else {
    standardQueue.enqueue(notification);
}
```

### Q3: How would you implement notification batching for efficiency?
**Answer:**
```java
class BatchNotificationProcessor {
    private final Map<NotificationChannel, List<Notification>> batches;
    private final int BATCH_SIZE = 100;
    private final Duration MAX_WAIT = Duration.ofSeconds(5);
    
    void addToBatch(Notification notification) {
        List<Notification> batch = batches.get(notification.channel);
        batch.add(notification);
        
        if (batch.size() >= BATCH_SIZE) {
            flush(notification.channel);
        }
    }
    
    void flush(NotificationChannel channel) {
        List<Notification> batch = batches.get(channel);
        senders.get(channel).sendBatch(batch);
        batch.clear();
    }
    
    @Scheduled(fixedRate = 5000)
    void flushAll() {
        batches.keySet().forEach(this::flush);
    }
}
```

### Q4: How do you handle user preference changes mid-notification?
**Answer:**
- **Check preferences at send time**, not at queue time
- Use **eventually consistent** model
- For opt-outs: Check blacklist before final send
- Provide **instant unsubscribe** link in notifications

### Q5: How would you implement A/B testing for notifications?
**Answer:**
```java
class ABTestingNotificationService {
    private final ExperimentService experimentService;
    
    Notification prepareNotification(NotificationRequest request) {
        String variant = experimentService.getVariant(
            request.userId, 
            "notification_" + request.templateId
        );
        
        String templateId = request.templateId + "_" + variant;  // template_v1 or template_v2
        
        // Track metrics
        analyticsService.trackExperimentExposure(request.userId, variant);
        
        return notification;
    }
}
```

### Q6: How do you monitor notification system health?
**Answer:**
- **Metrics to track**:
  - Delivery rate per channel
  - Failure rate and reasons
  - Latency (queue time, send time)
  - Retry rates
- **Alerting on**:
  - Delivery rate drops below threshold
  - Queue depth exceeds limit
  - Provider errors spike
- **Dashboards**: Real-time delivery funnel

---

## 💡 Key Interview Tips

1. **Start with channels** - Clarify which ones to support
2. **Discuss async processing** - Queue-based architecture
3. **Handle failures gracefully** - Retry with backoff
4. **Consider user experience** - Preferences, quiet hours
5. **Mention Salesforce context** - Platform Events, Apex triggers

---

## 🔗 Related Patterns
- Observer pattern for subscribers
- Strategy pattern for channel handlers
- Template Method for notification processing
- Factory pattern for sender creation
