import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/**
 * FIFO No-Starvation Mutex
 *
 * Each thread gets a personal semaphore. A shared queue enforces
 * strict first-come-first-served ordering.
 *
 * Why standard Semaphore isn't enough:
 *   Semaphore.acquire() doesn't guarantee FIFO wakeup order.
 *   (Java's Semaphore(1, true) uses a fair mode, but that's
 *    a library feature — this shows how to build it from scratch.)
 */
class FifoMutex {
    private final Queue<Semaphore> waitQueue = new LinkedList<>();
    private final Semaphore guard = new Semaphore(1); // protects the queue
    private boolean locked = false;

    public void acquire() throws InterruptedException {
        Semaphore personal = new Semaphore(0); // starts blocked

        guard.acquire();
        if (!locked) {
            // No one holds the lock — take it immediately
            locked = true;
            guard.release();
        } else {
            // Someone holds the lock — enqueue and wait
            waitQueue.add(personal);
            guard.release();
            personal.acquire(); // block until signaled by release()
        }
    }

    public void release() throws InterruptedException {
        guard.acquire();
        if (waitQueue.isEmpty()) {
            // No one waiting — just unlock
            locked = false;
        } else {
            // Wake up the next thread in FIFO order
            Semaphore next = waitQueue.poll();
            next.release(); // unblock exactly the next-in-line
        }
        guard.release();
    }
}

/**
 * Shared resource protected by the FIFO mutex.
 * Prints thread name and an order counter to verify FIFO behavior.
 */
class SharedResource {
    private final FifoMutex fifoMutex = new FifoMutex();
    private int accessOrder = 0;

    public void doWork(int threadId) throws InterruptedException {
        System.out.println("Thread-" + threadId + " requesting lock");
        long requestTime = System.currentTimeMillis();

        fifoMutex.acquire();

        accessOrder++;
        long waitTime = System.currentTimeMillis() - requestTime;
        System.out.println("Thread-" + threadId + " acquired lock | order: " + accessOrder
                + " | waited: " + waitTime + "ms");

        Thread.sleep(200); // simulate critical section work

        fifoMutex.release();
        System.out.println("Thread-" + threadId + " released lock");
    }
}

public class FifoMutexDemo {
    public static void main(String[] args) throws InterruptedException {
        SharedResource resource = new SharedResource();
        ExecutorService pool = Executors.newFixedThreadPool(6);

        // Launch 6 threads near-simultaneously
        // With FIFO mutex, they should acquire in roughly the order they requested
        for (int i = 1; i <= 6; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    resource.doWork(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            Thread.sleep(10); // tiny stagger so request order is deterministic
        }

        pool.shutdown();
    }
}
