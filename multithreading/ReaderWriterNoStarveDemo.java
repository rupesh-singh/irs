import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/**
 * No-Starve Reader-Writer using a turnstile semaphore.
 *
 * turnstile: forces readers to queue behind a waiting writer,
 *            preventing writer starvation.
 *
 * Writer:                          Reader:
 *   turnstile.acquire()              turnstile.acquire()
 *   roomEmpty.acquire()              turnstile.release()
 *   // write                         mutex.acquire()
 *   turnstile.release()              readers++
 *   roomEmpty.release()              if readers == 1: roomEmpty.acquire()
 *                                    mutex.release()
 *                                    // read
 *                                    mutex.acquire()
 *                                    readers--
 *                                    if readers == 0: roomEmpty.release()
 *                                    mutex.release()
 */
class NoStarveAccess {
    private int readers = 0;
    private final Semaphore mutex = new Semaphore(1);       // guards readers count
    private final Semaphore roomEmpty = new Semaphore(1);   // exclusive access for writers
    private final Semaphore turnstile = new Semaphore(1);   // prevents writer starvation

    public void readerEnter() throws InterruptedException {
        // Turnstile: if a writer is waiting, new readers block here
        turnstile.acquire();
        turnstile.release();

        mutex.acquire();
        readers++;
        if (readers == 1) {
            roomEmpty.acquire(); // first reader locks out writers
        }
        mutex.release();

        // --- critical section: read ---
        System.out.println(Thread.currentThread().getName() + " is reading. Readers count: " + readers);
        Thread.sleep(500); // simulate reading

        mutex.acquire();
        readers--;
        if (readers == 0) {
            roomEmpty.release(); // last reader lets writers in
        }
        mutex.release();
    }

    public void writerEnter() throws InterruptedException {
        turnstile.acquire();    // block new readers from entering
        roomEmpty.acquire();    // wait for existing readers to finish

        // --- critical section: write ---
        System.out.println(Thread.currentThread().getName() + " is writing.");
        Thread.sleep(1000); // simulate writing

        turnstile.release();    // let readers pass turnstile again
        roomEmpty.release();    // release exclusive access
    }
}

public class ReaderWriterNoStarveDemo {
    public static void main(String[] args) {
        NoStarveAccess rwAccess = new NoStarveAccess();

        ExecutorService pool = Executors.newFixedThreadPool(5);

        // Interleave readers and writers to demonstrate fairness
        for (int round = 0; round < 3; round++) {
            // Launch readers
            for (int i = 1; i <= 3; i++) {
                pool.submit(() -> {
                    try {
                        rwAccess.readerEnter();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
            // Launch a writer between reader batches
            pool.submit(() -> {
                try {
                    rwAccess.writerEnter();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
    }
}
