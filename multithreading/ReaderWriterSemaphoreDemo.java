import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class access {
    int readers = 0;
    Semaphore mutex = new Semaphore(1);
    Semaphore roomEmpty = new Semaphore(1);

    public void readerEnter() throws InterruptedException {
        mutex.acquire();
        readers = readers + 1;
        if (readers == 1) {
            roomEmpty.acquire(); // block writers
        }
        mutex.release();

        System.out.println(Thread.currentThread().getName() + " is reading. Readers count: " + readers);

        mutex.acquire();
        readers = readers - 1;
        if (readers == 0) {
            roomEmpty.release(); // allow writers
        }
        mutex.release();
    }

    public void writerEnter() throws InterruptedException {
        roomEmpty.acquire(); // block readers and other writers
        System.out.println(Thread.currentThread().getName() + " is writing.");
        roomEmpty.release(); // allow readers and other writers
    }
}

public class ReaderWriterSemaphoreDemo {
    public static void main(String[] args) {
        access rwAccess = new access();

        ExecutorService readerPool = Executors.newFixedThreadPool(3);
        ExecutorService writerPool = Executors.newFixedThreadPool(2);

        // Readers
        for (int i = 1; i <= 3; i++) {
            readerPool.submit(() -> {
                try {
                    rwAccess.readerEnter();
                    Thread.sleep(1000); // Simulate reading time
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // Writers
        for (int i = 1; i <= 2; i++) {
            writerPool.submit(() -> {
                try {
                    rwAccess.writerEnter();
                    Thread.sleep(1500); // Simulate writing time
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        
        readerPool.shutdown();
        writerPool.shutdown();
    }
}