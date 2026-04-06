import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/*
 * ============================================================
 * DINING PHILOSOPHERS PROBLEM
 * ============================================================
 *
 * Setup:
 *   - 5 philosophers sit around a circular table
 *   - Between each pair of philosophers is 1 fork (5 forks total)
 *   - To eat, a philosopher needs BOTH the left and right fork
 *   - After eating, they put both forks down and think
 *
 * The challenge:
 *   If all 5 philosophers pick up their left fork simultaneously,
 *   nobody can pick up their right fork → DEADLOCK.
 *
 * Solution: Footman (waiter) approach
 *   - A footman semaphore allows at most 4 philosophers to sit
 *     at the table at the same time
 *   - With only 4 competing for 5 forks, at least one philosopher
 *     can always get both forks → no deadlock
 *
 *   Philosopher i:
 *     while true:
 *       think()
 *       footman.acquire()          // ask permission to sit
 *       fork[i].acquire()          // pick up left fork
 *       fork[(i+1) % 5].acquire()  // pick up right fork
 *       eat()
 *       fork[i].release()          // put down left fork
 *       fork[(i+1) % 5].release()  // put down right fork
 *       footman.release()          // leave the table
 *
 * Why this works:
 *   - Pigeonhole principle: 4 philosophers, 5 forks
 *     → at least 1 philosopher can grab both forks
 *   - That philosopher eats and releases forks
 *     → unblocks others → no deadlock, no starvation
 *
 * Other valid solutions:
 *   1. Asymmetric: one philosopher picks right fork first (breaks circular wait)
 *   2. Tanenbaum: use states (THINKING, HUNGRY, EATING) with a mutex
 *   3. Chandy/Misra: message-passing with dirty/clean forks
 * ============================================================
 */

public class DiningPhilosophersDemo {

    static final int NUM_PHILOSOPHERS = 5;
    static final int EATING_ROUNDS = 3;

    // Each fork is a binary semaphore (mutex)
    static final Semaphore[] forks = new Semaphore[NUM_PHILOSOPHERS];

    // Footman: limits table occupancy to N-1 = 4
    static final Semaphore footman = new Semaphore(NUM_PHILOSOPHERS - 1, true);

    static void think(int id) throws InterruptedException {
        System.out.println("Philosopher " + id + " is thinking");
        Thread.sleep((long) (Math.random() * 500 + 100));
    }

    static void eat(int id) throws InterruptedException {
        System.out.println("Philosopher " + id + " is eating  <- (has fork " + id + " and fork " + (id + 1) % NUM_PHILOSOPHERS + ")");
        Thread.sleep((long) (Math.random() * 500 + 100));
    }

    public static void main(String[] args) {
        // Initialize forks
        for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
            forks[i] = new Semaphore(1);
        }

        ExecutorService pool = Executors.newFixedThreadPool(NUM_PHILOSOPHERS);

        for (int i = 0; i < NUM_PHILOSOPHERS; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    for (int round = 0; round < 1; round++) {
                        think(id);

                        footman.acquire();                          // sit at table
                        forks[id].acquire();                        // pick up left fork
                        forks[(id + 1) % NUM_PHILOSOPHERS].acquire(); // pick up right fork

                        eat(id);

                        forks[id].release();                        // put down left fork
                        forks[(id + 1) % NUM_PHILOSOPHERS].release(); // put down right fork
                        footman.release();                          // leave table
                    }
                    System.out.println("Philosopher " + id + " finished all rounds");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
    }
}
