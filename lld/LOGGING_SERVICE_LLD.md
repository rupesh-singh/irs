# Logging Service - LLD Interview Guide

## Problem Statement

Design a **Logging Service** (similar to Log4j/SLF4J) that supports multiple log levels, multiple output destinations (console, file, network), log filtering, asynchronous logging, structured log messages, and is thread-safe for concurrent use across an application.

---

## Requirements

### Functional Requirements
1. Support multiple log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`
2. Log messages with metadata: timestamp, level, source, thread name, message
3. Multiple output handlers (Console, File, Network) — simultaneously
4. Filter logs by level (minimum level threshold)
5. Query/retrieve logs by level
6. Support log formatting (customizable output format)
7. Singleton logger per namespace (avoid duplicate loggers)

### Non-Functional Requirements
- Thread-safe (multiple threads logging concurrently)
- Asynchronous logging (non-blocking for callers)
- High throughput with minimal latency impact on application
- Extensible handler/sink architecture (Open/Closed Principle)
- Configurable at runtime (change log level, add/remove handlers)

---

## Architecture

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Thread 1     │    │  Thread 2     │    │  Thread N     │
│  logger.info()│    │  logger.error()│   │  logger.debug()│
└──────┬────────┘    └──────┬────────┘    └──────┬────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                  LoggingService (Singleton)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         BlockingQueue<LogMessage>                  │  │
│  └───────────────────────────┬───────────────────────┘  │
│                              │ async consumer thread     │
│                              ▼                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Handler Chain (List<ILogHandler>)         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │  │
│  │  │ Console  │  │  File    │  │  Network/DB   │   │  │
│  │  │ Handler  │  │  Handler │  │  Handler      │   │  │
│  │  └──────────┘  └──────────┘  └───────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Class Diagram

```
┌──────────────────────────────────┐
│       LogLevel (enum)            │
├──────────────────────────────────┤
│ DEBUG(0), INFO(1), WARN(2),      │
│ ERROR(3), FATAL(4)               │
├──────────────────────────────────┤
│ + getSeverity(): int             │
│ + isAtLeast(LogLevel): boolean   │
└──────────────────────────────────┘

┌──────────────────────────────────────┐
│         LogMessage                   │
├──────────────────────────────────────┤
│ - level: LogLevel                    │
│ - message: String                    │
│ - timestamp: long                    │
│ - source: String                     │
│ - threadName: String                 │
├──────────────────────────────────────┤
│ + getLevel(): LogLevel               │
│ + getMessage(): String               │
│ + getTimestamp(): long               │
│ + getSource(): String                │
│ + getThreadName(): String            │
│ + format(): String                   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│   ILogHandler (interface)            │
├──────────────────────────────────────┤
│ + handle(LogMessage): void           │
│ + getMinLevel(): LogLevel            │
│ + setMinLevel(LogLevel): void        │
│ + close(): void                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       ConsoleLogHandler              │
├──────────────────────────────────────┤
│ - minLevel: LogLevel                 │
│ - formatter: LogFormatter            │
├──────────────────────────────────────┤
│ + handle(LogMessage): void           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       FileLogHandler                 │
├──────────────────────────────────────┤
│ - minLevel: LogLevel                 │
│ - filePath: String                   │
│ - writer: BufferedWriter             │
│ - maxFileSize: long                  │
├──────────────────────────────────────┤
│ + handle(LogMessage): void           │
│ + rotate(): void                     │
│ + close(): void                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       LogFormatter (interface)       │
├──────────────────────────────────────┤
│ + format(LogMessage): String         │
└──────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│         LoggingService (Singleton)           │
├──────────────────────────────────────────────┤
│ - instance: LoggingService (static)          │
│ - handlers: List<ILogHandler>                │
│ - globalMinLevel: LogLevel                   │
│ - logQueue: BlockingQueue<LogMessage>        │
│ - consumerThread: Thread                     │
│ - shutdown: volatile boolean                 │
├──────────────────────────────────────────────┤
│ + getInstance(): LoggingService              │
│ + addHandler(ILogHandler): void              │
│ + removeHandler(ILogHandler): void           │
│ + setGlobalLevel(LogLevel): void             │
│ + debug(source, message): void               │
│ + info(source, message): void                │
│ + warn(source, message): void                │
│ + error(source, message): void               │
│ + fatal(source, message): void               │
│ + shutdown(): void                           │
│ - publish(LogMessage): void                  │
│ - consumerLoop(): void                       │
└──────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Singleton pattern | One logger per application — consistent config, no duplicates |
| `BlockingQueue` for async | Decouples producers (app threads) from consumers (I/O handlers) |
| Handler chain (Strategy pattern) | Open/Closed — add new sinks without modifying logger |
| Level filtering at 2 layers | Global level (early reject) + per-handler level (fine-grained) |
| `volatile` shutdown flag | Safe visibility for consumer thread termination |
| Thread name in LogMessage | Critical for debugging concurrent applications |
| `CopyOnWriteArrayList` for handlers | Safe iteration during logging while allowing runtime handler changes |

---

## Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| **Singleton** | `LoggingService` | Single point of access, shared configuration |
| **Strategy** | `ILogHandler` implementations | Interchangeable output destinations |
| **Observer/Chain** | Handler list dispatch | Multiple handlers process same message |
| **Producer-Consumer** | Queue + consumer thread | Async non-blocking logging |
| **Template Method** | `LogFormatter` | Customizable formatting logic |
| **Builder** (optional) | `LogMessage` construction | Clean construction of complex objects |

---

## Implementation

### LogLevel.java

```java
package LoggingServiceDemo;

public enum LogLevel {
    DEBUG(0), INFO(1), WARN(2), ERROR(3), FATAL(4);

    private final int severity;

    LogLevel(int severity) {
        this.severity = severity;
    }

    public int getSeverity() {
        return severity;
    }

    public boolean isAtLeast(LogLevel other) {
        return this.severity >= other.severity;
    }
}
```

### LogMessage.java

```java
package LoggingServiceDemo;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class LogMessage {
    private final LogLevel level;
    private final String message;
    private final long timestamp;
    private final String source;
    private final String threadName;

    public LogMessage(LogLevel level, String message, String source) {
        this.level = level;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
        this.source = source;
        this.threadName = Thread.currentThread().getName();
    }

    public LogLevel getLevel() { return level; }
    public String getMessage() { return message; }
    public long getTimestamp() { return timestamp; }
    public String getSource() { return source; }
    public String getThreadName() { return threadName; }

    @Override
    public String toString() {
        String time = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")
                .withZone(ZoneId.systemDefault())
                .format(Instant.ofEpochMilli(timestamp));
        return String.format("[%s] [%s] [%s] [%s] %s",
                time, level, threadName, source, message);
    }
}
```

### ILogHandler.java

```java
package LoggingServiceDemo;

public interface ILogHandler {
    void handle(LogMessage log);
    LogLevel getMinLevel();
    void setMinLevel(LogLevel level);
    void close();
}
```

### ConsoleLogHandler.java

```java
package LoggingServiceDemo;

public class ConsoleLogHandler implements ILogHandler {
    private volatile LogLevel minLevel;

    public ConsoleLogHandler(LogLevel minLevel) {
        this.minLevel = minLevel;
    }

    @Override
    public void handle(LogMessage log) {
        if (!log.getLevel().isAtLeast(minLevel)) return;

        if (log.getLevel().getSeverity() >= LogLevel.ERROR.getSeverity()) {
            System.err.println(log.toString());
        } else {
            System.out.println(log.toString());
        }
    }

    @Override
    public LogLevel getMinLevel() { return minLevel; }

    @Override
    public void setMinLevel(LogLevel level) { this.minLevel = level; }

    @Override
    public void close() { /* no-op for console */ }
}
```

### FileLogHandler.java

```java
package LoggingServiceDemo;

import java.io.*;
import java.nio.file.*;

public class FileLogHandler implements ILogHandler {
    private volatile LogLevel minLevel;
    private final String filePath;
    private BufferedWriter writer;
    private final long maxFileSizeBytes;
    private long currentSize;
    private final Object writeLock = new Object();

    public FileLogHandler(String filePath, LogLevel minLevel, long maxFileSizeMB) {
        this.filePath = filePath;
        this.minLevel = minLevel;
        this.maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
        this.currentSize = 0;
        openWriter(false);
    }

    private void openWriter(boolean append) {
        try {
            this.writer = new BufferedWriter(new FileWriter(filePath, append));
            if (append) {
                this.currentSize = Files.size(Path.of(filePath));
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to open log file: " + filePath, e);
        }
    }

    @Override
    public void handle(LogMessage log) {
        if (!log.getLevel().isAtLeast(minLevel)) return;

        String formatted = log.toString() + System.lineSeparator();
        synchronized (writeLock) {
            try {
                if (currentSize + formatted.length() > maxFileSizeBytes) {
                    rotate();
                }
                writer.write(formatted);
                writer.flush();
                currentSize += formatted.length();
            } catch (IOException e) {
                System.err.println("Failed to write log: " + e.getMessage());
            }
        }
    }

    private void rotate() throws IOException {
        writer.close();
        String rotatedPath = filePath + "." + System.currentTimeMillis();
        Files.move(Path.of(filePath), Path.of(rotatedPath));
        openWriter(false);
        currentSize = 0;
    }

    @Override
    public LogLevel getMinLevel() { return minLevel; }

    @Override
    public void setMinLevel(LogLevel level) { this.minLevel = level; }

    @Override
    public void close() {
        synchronized (writeLock) {
            try { writer.close(); } catch (IOException ignored) {}
        }
    }
}
```

### LoggingService.java (Singleton + Async)

```java
package LoggingServiceDemo;

import java.util.List;
import java.util.concurrent.*;

public class LoggingService {
    private static volatile LoggingService instance;

    private final List<ILogHandler> handlers = new CopyOnWriteArrayList<>();
    private volatile LogLevel globalMinLevel = LogLevel.DEBUG;
    private final BlockingQueue<LogMessage> logQueue;
    private final Thread consumerThread;
    private volatile boolean shutdown = false;

    private LoggingService(int queueCapacity) {
        this.logQueue = new ArrayBlockingQueue<>(queueCapacity);
        this.consumerThread = new Thread(this::consumerLoop, "log-consumer");
        this.consumerThread.setDaemon(true);
        this.consumerThread.start();
    }

    // Double-checked locking singleton
    public static LoggingService getInstance() {
        if (instance == null) {
            synchronized (LoggingService.class) {
                if (instance == null) {
                    instance = new LoggingService(10000);
                }
            }
        }
        return instance;
    }

    public void addHandler(ILogHandler handler) {
        handlers.add(handler);
    }

    public void removeHandler(ILogHandler handler) {
        handlers.remove(handler);
        handler.close();
    }

    public void setGlobalLevel(LogLevel level) {
        this.globalMinLevel = level;
    }

    // --- Convenience logging methods ---
    public void debug(String source, String message) {
        publish(new LogMessage(LogLevel.DEBUG, message, source));
    }

    public void info(String source, String message) {
        publish(new LogMessage(LogLevel.INFO, message, source));
    }

    public void warn(String source, String message) {
        publish(new LogMessage(LogLevel.WARN, message, source));
    }

    public void error(String source, String message) {
        publish(new LogMessage(LogLevel.ERROR, message, source));
    }

    public void fatal(String source, String message) {
        publish(new LogMessage(LogLevel.FATAL, message, source));
    }

    // --- Core publish (non-blocking enqueue) ---
    private void publish(LogMessage logMessage) {
        // Early rejection: skip if below global min level
        if (!logMessage.getLevel().isAtLeast(globalMinLevel)) return;

        // Non-blocking offer — drop message if queue full (back-pressure)
        if (!logQueue.offer(logMessage)) {
            System.err.println("Log queue full — dropping: " + logMessage.getMessage());
        }
    }

    // --- Async consumer loop ---
    private void consumerLoop() {
        while (!shutdown || !logQueue.isEmpty()) {
            try {
                LogMessage log = logQueue.poll(100, TimeUnit.MILLISECONDS);
                if (log == null) continue;

                for (ILogHandler handler : handlers) {
                    try {
                        handler.handle(log);
                    } catch (Exception e) {
                        System.err.println("Handler failed: " + e.getMessage());
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // Drain remaining
        LogMessage log;
        while ((log = logQueue.poll()) != null) {
            for (ILogHandler handler : handlers) {
                handler.handle(log);
            }
        }
    }

    public void shutdown() {
        shutdown = true;
        consumerThread.interrupt();
        try {
            consumerThread.join(5000);
        } catch (InterruptedException ignored) {}
        for (ILogHandler handler : handlers) {
            handler.close();
        }
    }
}
```

### Demo / Driver

```java
package LoggingServiceDemo;

public class LoggingServiceDemo {
    public static void main(String[] args) throws InterruptedException {
        LoggingService logger = LoggingService.getInstance();

        // Add handlers
        logger.addHandler(new ConsoleLogHandler(LogLevel.INFO));
        logger.addHandler(new FileLogHandler("app.log", LogLevel.DEBUG, 10)); // 10MB max

        // Set global level
        logger.setGlobalLevel(LogLevel.DEBUG);

        // Log from multiple threads
        Thread t1 = new Thread(() -> {
            logger.info("UserService", "User logged in: user-101");
            logger.debug("UserService", "Session created");
            logger.error("UserService", "Failed to load preferences");
        }, "worker-1");

        Thread t2 = new Thread(() -> {
            logger.info("OrderService", "Order placed: ORD-5001");
            logger.warn("OrderService", "Inventory low for SKU-123");
            logger.fatal("OrderService", "Payment gateway unreachable");
        }, "worker-2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        // Change level at runtime
        logger.setGlobalLevel(LogLevel.WARN);
        logger.debug("Main", "This won't be logged");
        logger.error("Main", "This will be logged");

        Thread.sleep(500); // let async consumer flush
        logger.shutdown();
    }
}
```

---

## Existing Code (Basic Version)

The repository contains a simpler synchronous version:

```java
// Basic LogType enum
enum LogType { INFO, DEBUG, WARN, ERROR }

// Basic LogMessage
class LogMessage {
    LogType type;
    String message;
    long timestamp;
    String file;
    // toString() formats the output
}

// Handler interface
interface ILogHandler {
    void appendLog(LogMessage log);
    List<LogMessage> getLog(LogType type);
}

// Console handler — stores in ArrayList, prints immediately
class IConsoleLogHandler implements ILogHandler {
    List<LogMessage> logMessages = new ArrayList<>();
    void appendLog(LogMessage log) {
        logMessages.add(log);
        System.out.println(log.toString());
    }
    List<LogMessage> getLog(LogType type) {
        return logMessages.stream().filter(a -> a.type == type).toList();
    }
}

// Service — delegates to handler
class LoggingService {
    ILogHandler handler;
    void log(LogType type, String message, String file) {
        handler.appendLog(new LogMessage(message, type, System.currentTimeMillis(), file));
    }
    List<String> getLog(LogType type) {
        return handler.getLog(type).stream().map(LogMessage::toString).toList();
    }
}
```

---

## What the Enhanced Version Adds (Interview Differentiators)

| Feature | Basic Version | Enhanced Version |
|---------|--------------|-----------------|
| Log levels | Enum only | Enum with severity + `isAtLeast()` comparison |
| Thread safety | None (ArrayList) | `CopyOnWriteArrayList` + `BlockingQueue` |
| Async logging | Synchronous | Producer-consumer with background thread |
| Multiple handlers | Single handler | List of handlers, all receive messages |
| Level filtering | At query time only | At publish (global) + per-handler |
| File rotation | Not implemented | Size-based rotation with rename |
| Back-pressure | None | Queue full → drop + stderr warning |
| Thread context | None | Captures thread name automatically |
| Shutdown | None | Graceful drain + handler close |
| Singleton | No | Double-checked locking |
| Runtime config | No | Change level/handlers at runtime |

---

## Interview Discussion Points

### Q: Why async logging with a queue?
**A:** Logging I/O (especially file/network) is slow. Synchronous logging blocks the application thread. With a queue:
- Application threads return immediately after `offer()` (nanoseconds)
- I/O happens on a dedicated consumer thread
- Application throughput is unaffected by logging volume

### Q: What happens when the queue is full?
**A:** We use non-blocking `offer()` — if the queue is full, the log message is dropped and a warning goes to stderr. Alternatives:
- **Block** (`put()`) — guarantees no loss but can slow the app
- **Evict oldest** — ring buffer approach
- **Overflow to disk** — spill to a temp file

### Q: Why `CopyOnWriteArrayList` for handlers?
**A:** Handlers are read (iterated) on every log message but modified (add/remove) rarely. `CopyOnWriteArrayList` gives lock-free reads at the cost of expensive writes — perfect for this read-heavy pattern.

### Q: How does level filtering work at two layers?
**A:**
1. **Global level** in `publish()` — rejects messages early before they even enter the queue
2. **Per-handler level** in `handle()` — each handler can have its own threshold (e.g., Console=INFO, File=DEBUG)

This is efficient: most filtering happens before queue insertion (zero allocation for rejected messages).

### Q: How would you implement log rotation?
**A:** Current implementation uses size-based rotation:
- Track `currentSize` as bytes written
- When `currentSize > maxFileSize`, rename current file with timestamp suffix
- Open a new file
- Extensions: time-based rotation, compressed archives, max file count

### Q: Singleton vs Dependency Injection?
**A:** Singleton is simpler for cross-cutting concerns like logging (no need to pass logger everywhere). However, DI is better for:
- Unit testing (mock the logger)
- Multiple isolated loggers (per-module)
- Frameworks (Spring, Guice handle lifecycle)

### Q: How would you extend this for production?
- **Structured logging** — JSON output format for log aggregation (ELK, Splunk)
- **MDC (Mapped Diagnostic Context)** — ThreadLocal for request-scoped metadata (requestId, userId)
- **Log correlation** — trace IDs for distributed tracing
- **Sampling** — log only N% of debug messages under load
- **Rate limiting** — prevent log storms from noisy components
- **Network handler** — send to remote syslog/Kafka/Fluentd
- **Metrics** — count log events by level for alerting

### Q: How does Log4j/SLF4J differ?
- **Logger hierarchy** — `com.app.service.UserService` inherits from `com.app.service`
- **Appender architecture** — more sophisticated handler pipeline
- **Layout/Encoder** — separates formatting from output
- **Async appender** — LMAX Disruptor ring buffer (much faster than BlockingQueue)
- **Configuration files** — XML/YAML config instead of code

---

## Concurrency Model

```
App Thread 1 ──► publish() ──► logQueue.offer() ──┐
App Thread 2 ──► publish() ──► logQueue.offer() ──┤  (non-blocking)
App Thread N ──► publish() ──► logQueue.offer() ──┘
                                                   │
                              BlockingQueue<LogMessage>
                                                   │
                              Consumer Thread ◄─────┘
                                    │
                                    ▼
                    ┌───── handler1.handle(log)  (Console)
                    ├───── handler2.handle(log)  (File — synchronized writes)
                    └───── handler3.handle(log)  (Network)
```

- **Producers** (app threads): Lock-free `offer()` — O(1), non-blocking
- **Consumer** (single thread): Sequential dispatch — no contention between handlers
- **File handler**: Internal `writeLock` for rotation safety
- **Console handler**: No lock needed (`println` is internally synchronized)

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| publish() (enqueue) | O(1) non-blocking | O(1) |
| Consumer dispatch | O(H) where H = handler count | O(1) |
| Level check | O(1) — integer comparison | O(1) |
| File write | O(M) where M = message length | O(M) |
| File rotation | O(1) — rename + reopen | O(1) |
| Overall space | — | O(Q + L) where Q = queue capacity, L = stored logs |
