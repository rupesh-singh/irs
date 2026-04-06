import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

class FixedBlockingQueue<T> {
    private final Object[] buffer;
    private int head = 0;
    private int tail = 0;
    private int count = 0;
    private final int capacity;

    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public FixedBlockingQueue(int capacity) {
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    public void enqueue(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == capacity) {
                notFull.await();
            }

            buffer[tail] = item;
            tail = (tail + 1) % capacity;
            count++;

            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    public T dequeue() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await();
            }

            T item = (T) buffer[head];
            buffer[head] = null; // avoid memory leak (good practice)

            head = (head + 1) % capacity;
            count--;

            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}

public class FixedBlockingQueueDemo {
    public static void main(String[] args) {
        FixedBlockingQueue<Integer> queue = new FixedBlockingQueue<>(5);

        // Producer
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                try {
                    queue.enqueue(i);
                    System.out.println("Produced: " + i);
                    Thread.sleep(500); // simulate work
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }).start();

        // Consumer
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                try {
                    int item = queue.dequeue();
                    System.out.println("Consumed: " + item);
                    Thread.sleep(800); // simulate work
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }).start();
    }
}