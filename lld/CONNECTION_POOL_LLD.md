# Connection Pool - LLD Interview Guide

## Problem Statement

Design a **Connection Pool** that manages a fixed set of reusable connections. Clients acquire connections from the pool, use them, and return them. The pool should handle concurrency, timeouts, and connection lifecycle (open/blocked/closed).

---

## Requirements

### Functional Requirements
1. Initialize pool with a fixed number of connections
2. `getConnection()` — acquire a free connection (block with timeout if none available)
3. `returnConnection()` — return a connection back to the pool
4. `closeConnection()` — permanently close a connection and replace it with a new one
5. Validate connection ownership before operations

### Non-Functional Requirements
- Thread-safe (multiple threads acquiring/returning concurrently)
- Bounded pool size (never exceeds max)
- Timeout support (don't block forever)
- Self-healing (closed connections are replaced)

---

## Class Diagram

```
┌───────────────────────────────────┐
│   ConnectionState (enum)          │
├───────────────────────────────────┤
│ OPEN, CLOSED, BLOCKED             │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│         Connection                │
├───────────────────────────────────┤
│ - id: int                         │
│ - state: ConnectionState          │
├───────────────────────────────────┤
│ + markedFree(): void              │
│ + markedClosed(): void            │
│ + markedBlocked(): void           │
│ + equals() / hashCode()           │
└───────────────────────────────────┘

┌────────────────────────────────────────────┐
│     IConnectionPoolManager (interface)     │
├────────────────────────────────────────────┤
│ + getConnection(): Connection              │
│ + returnConnection(Connection): void       │
│ + closeConnection(Connection): void        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│          ConnectionPool                    │
├────────────────────────────────────────────┤
│ - freeConnection: BlockingQueue<Connection>│
│ - connections: Set<Connection>             │
│ - maxPoolSize: int                         │
│ - timeoutInMillis: int                     │
│ - idGenerator: int                         │
├────────────────────────────────────────────┤
│ + getConnection(): Connection              │
│ + returnConnection(Connection): void       │
│ + closeConnection(Connection): void        │
│ - createConnection(): Connection           │
└────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `BlockingQueue` for free connections | Built-in thread-safe waiting with timeout support |
| `ArrayBlockingQueue` | Bounded, FIFO ordering, fair option available |
| `ConcurrentHashMap.newKeySet()` for tracking | Thread-safe set for validating connection ownership |
| `synchronized` on state transitions | Prevent state corruption in `Connection` |
| Replace closed connections | Self-healing pool maintains capacity |

---

## Concurrency Model

- **`BlockingQueue.poll(timeout)`** — threads block waiting for a free connection (with timeout)
- **`BlockingQueue.offer()`** — non-blocking return to pool
- **`ConcurrentHashMap.newKeySet()`** — thread-safe membership tracking
- **`synchronized` on Connection methods** — safe state transitions

---

## Connection Lifecycle

```
                 getConnection()
  OPEN (in pool) ──────────────► BLOCKED (in use)
       ▲                              │
       │ returnConnection()           │ closeConnection()
       └──────────────────────        ▼
                                   CLOSED (removed)
                                      │
                                      │ auto-replaced
                                      ▼
                                   NEW CONNECTION (OPEN, in pool)
```

---

## Implementation

```java
package connctionpool;

import java.util.Objects;
import java.util.Set;
import java.util.concurrent.*;

enum ConnectionSate {
    OPEN, CLOSED, BLOCKED;
}

class Connection {
    int id;
    ConnectionSate state;

    public Connection(int id, ConnectionSate state) {
        this.id = id;
        this.state = state;
    }

    public int getId() {
        return id;
    }

    public synchronized void markedFree() {
        state = ConnectionSate.OPEN;
    }

    public synchronized void markedClosed() {
        state = ConnectionSate.CLOSED;
    }

    public synchronized void markedBlocked() {
        state = ConnectionSate.BLOCKED;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Connection that = (Connection) o;
        return id == that.id;
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}

interface IConnectionPoolManager {
    Connection getConnection() throws Exception;
    void returnConnection(Connection con) throws Exception;
    void closeConnection(Connection con) throws Exception;
}

class ConnectionPool implements IConnectionPoolManager {
    BlockingQueue<Connection> freeConnection;
    int maxPoolSize;
    int timeoutInMillis;
    Set<Connection> connections;
    int idGenerator = 0;

    public ConnectionPool(int maxPoolSize, int timeoutInMillis) {
        this.maxPoolSize = maxPoolSize;
        this.timeoutInMillis = timeoutInMillis;
        this.freeConnection = new ArrayBlockingQueue<>(maxPoolSize);
        this.connections = ConcurrentHashMap.newKeySet();
        for (int i = 0; i < maxPoolSize; i++) {
            Connection con = createConnection();
            freeConnection.add(con);
            connections.add(con);
        }
    }

    private Connection createConnection() {
        return new Connection(idGenerator++, ConnectionSate.OPEN);
    }

    public Connection getConnection() throws Exception {
        Connection connection = freeConnection.poll(timeoutInMillis, TimeUnit.MILLISECONDS);
        if (connection == null) {
            throw new Exception("connection timedout");
        }
        connection.markedBlocked();
        return connection;
    }

    public void returnConnection(Connection connection) throws Exception {
        if (!connections.contains(connection)) {
            throw new Exception("Connection doesn't exist");
        }
        if (connection.state == ConnectionSate.CLOSED) {
            return;
        }
        connection.markedFree();
        boolean added = freeConnection.offer(connection);
        if (!added) {
            throw new RuntimeException("pool is full");
        }
    }

    public void closeConnection(Connection connection) throws Exception {
        if (!connections.contains(connection)) {
            throw new Exception("Connection doesn't exist");
        }
        connection.markedClosed();
        connections.remove(connection);

        // Self-healing: replace with a new connection
        Connection con = createConnection();
        connections.add(con);
        freeConnection.add(con);
    }
}
```

---

## Interview Discussion Points

### Q: Why `BlockingQueue` instead of a `List` + `synchronized`?
**A:** `BlockingQueue` gives us built-in thread-safe waiting with `poll(timeout)`. A List would require manual locking + wait/notify, which is error-prone and verbose.

### Q: What if `getConnection()` times out?
**A:** We throw an exception. The caller can retry, use a fallback, or propagate the error. In production, you'd use a custom `ConnectionTimeoutException`.

### Q: How does self-healing work?
**A:** When `closeConnection()` is called, the broken connection is removed from the tracking set, and a brand-new connection is created and added to the free pool. Pool capacity stays constant.

### Q: How would you extend this?
- **Health check thread** — periodically validate idle connections
- **Min/max pool size** — grow/shrink dynamically based on load
- **Connection TTL** — evict connections older than N minutes
- **Metrics** — track wait times, pool utilization, timeouts
- **Connection validation** — test before handing out (e.g., `SELECT 1`)

### Q: Real-world implementations?
- **HikariCP** — fastest Java connection pool
- **Apache DBCP2** — Apache commons
- **c3p0** — older but widely used
- **Tomcat JDBC Pool**

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| getConnection() | O(1) amortized (may block up to timeout) | O(1) |
| returnConnection() | O(1) | O(1) |
| closeConnection() | O(1) | O(1) |
| Overall space | — | O(n) where n = maxPoolSize |
