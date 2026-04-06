import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class Buffer {
    private final Queue<String> queue;
    private final Semaphore mutex = new Semaphore(1);
    private final Semaphore items = new Semaphore(0);    // counts items in buffer
    private final Semaphore spaces;                       // counts empty spaces in buffer

    public Buffer(int capacity) {
        this.queue = new LinkedList<>();
        this.spaces = new Semaphore(capacity);
    }

    public void add(String event) throws InterruptedException {
        spaces.acquire();       // wait for empty space
        mutex.acquire();        // lock buffer
        queue.add(event);
        System.out.println(Thread.currentThread().getName() + " produced: " + event + " | buffer size: " + queue.size());
        mutex.release();        // unlock buffer
        items.release();        // signal that an item is available
    }

    public String get() throws InterruptedException {
        items.acquire();        // wait for item
        mutex.acquire();        // lock buffer
        String event = queue.poll();
        System.out.println(Thread.currentThread().getName() + " consumed: " + event + " | buffer size: " + queue.size());
        mutex.release();        // unlock buffer
        spaces.release();       // signal that a space is available
        return event;
    }
}

public class ProducerConsumerSemaphore {
    public static void main(String[] args) {
        Buffer buffer = new Buffer(2);

        ExecutorService producerPool = Executors.newFixedThreadPool(2);
        ExecutorService consumerPool = Executors.newFixedThreadPool(2);

        // Producers
        for (int i = 1; i <= 2; i++) {
            final int id = i;
            producerPool.submit(() -> {
                int count = 0;
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        String event = "Event-P" + id + "-" + (count++);
                        buffer.add(event);
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }

        // Consumers
        for (int i = 1; i <= 2; i++) {
            consumerPool.submit(() -> {
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        buffer.get();
                        Thread.sleep(1500);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }
    }
}
