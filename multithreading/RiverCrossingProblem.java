import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class Boat {
    Semaphore hackers = new Semaphore(0);
    Semaphore serfs = new Semaphore(0);
    Semaphore mutex = new Semaphore(1);
    int hackersCount = 0;
    int serfsCount = 0;
    int boatCapacity = 4;

    public Boat() {
    }

    public void arriveHacker() throws InterruptedException{
        mutex.acquire();
        hackersCount++;
        if (hackersCount == boatCapacity) {
            hackers.release(3);          // wake 3 others (captain doesn't acquire)
            hackersCount -= 4;
            mutex.release();
        } else if (hackersCount >= 2 && serfsCount >= 2) {
            hackers.release(1);          // 1 other hacker
            serfs.release(2);            // 2 serfs
            hackersCount -= 2;
            serfsCount -= 2;
            mutex.release();
        }
        else {
            mutex.release();
            hackers.acquire();
            return;
        }
    }

    public void arriveSerf() throws InterruptedException{
        mutex.acquire();
        serfsCount++;
        if (serfsCount == boatCapacity) {
            serfs.release(3);            // wake 3 others
            serfsCount -= 4;
            mutex.release();
        } else if (hackersCount >= 2 && serfsCount >= 2) {
            serfs.release(1);            // 1 other serf
            hackers.release(2);          // 2 hackers
            hackersCount -= 2;
            serfsCount -= 2;
            mutex.release();
        }
        else {
            mutex.release();
            serfs.acquire();
            return;
        }
    }

}


class RiverCrossingProblem {
    public static void main(String[] args) {
        int numHackers = 8;
        int numSerfs = 8;
        ExecutorService pool = Executors.newFixedThreadPool(numHackers + numSerfs);
        Boat boat = new Boat();

        for (int i = 1; i <= numHackers; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    boat.arriveHacker();
                    System.out.println("Hacker-" + id + " boarded");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        for (int i = 1; i <= numSerfs; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    boat.arriveSerf();
                    System.out.println("Serf-" + id + " boarded");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
    }
}

