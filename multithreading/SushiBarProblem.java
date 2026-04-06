import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/*
 * ============================================================
 * SUSHI BAR PROBLEM
 * ============================================================
 *
 * Setup:
 *   - Sushi bar with 5 seats
 *   - If seats available → customer sits immediately
 *   - If all 5 full → customer waits at the bar
 *   - When all 5 eating customers get up → waiters fill seats
 *
 * Semaphores:
 *   mutex   = Semaphore(1)   — protects eating/waiting counts
 *   block   = Semaphore(0)   — waiting customers block here
 *   allDone = Semaphore(0)   — barrier: eaters wait until all 5 finish
 *
 * Counters:
 *   eating  = 0              — customers currently at seats
 *   waiting = 0              — customers waiting at the bar
 *
 * Customer:
 *   ENTER:
 *     mutex.acquire()
 *     if eating < 5:
 *       eating++                           // sit down
 *       mutex.release()
 *     else:
 *       waiting++                          // bar is full
 *       mutex.release()
 *       block.acquire()                    // wait until signaled
 *       // when unblocked, eating already incremented for me
 *       // ("I'll do it for you")
 *
 *   EAT SUSHI
 *
 *   EXIT:
 *     mutex.acquire()
 *     eating--
 *     if eating > 0:                      // not the last — wait for others
 *       mutex.release()
 *       allDone.acquire()                 // barrier: wait for all 5 to finish
 *     else:                               // I'm the last eater (all 5 done)
 *       allDone.release(4)                // wake the 4 waiting eaters
 *       if waiting > 0:
 *         n = min(waiting, 5)
 *         waiting -= n
 *         eating += n                     // "I'll do it for you"
 *         block.release(n)               // "pass the baton" — seat waiters
 *       mutex.release()
 *
 * Why "I'll do it for you"?
 *   The last leaving customer increments eating and decrements
 *   waiting ON BEHALF of the woken customers. This way, woken
 *   customers don't need to re-acquire mutex and re-check — the
 *   state is already correct when they wake up.
 *
 * Why "pass the baton"?
 *   The leaving customer signals specific waiters (block.release(n))
 *   while still holding mutex. The state update is done atomically
 *   before the signal — no window for a race condition.
 *   The woken threads proceed directly to eating.
 * ============================================================
 */

class SushiBar {
    static final int SEATS = 5;

    final Semaphore mutex = new Semaphore(1);
    final Semaphore block = new Semaphore(0);   // waiters block here
    final Semaphore allDone = new Semaphore(0); // barrier: eaters wait for all 5
    int eating = 0;
    int waiting = 0;

    public void customer(int id) throws InterruptedException {
        // --- ENTER ---
        mutex.acquire();
        if (eating < SEATS) {
            eating++;
            System.out.println("  Customer-" + id + " sits down. Eating: " + eating);
            mutex.release();
        } else {
            waiting++;
            System.out.println("  Customer-" + id + " waits (bar full). Waiting: " + waiting);
            mutex.release();
            block.acquire();
            // Woken up — eating already incremented for me by the last leaver
            System.out.println("  Customer-" + id + " sits down (was waiting). Eating: " + eating);
        }

        // --- EAT ---
        Thread.sleep((long) (Math.random() * 1000 + 500));  // eat for 500-1500ms
        System.out.println("  Customer-" + id + " finished eating.");

        // --- EXIT (all 5 leave together) ---
        mutex.acquire();
        eating--;
        if (eating > 0) {
            // Not the last — release mutex and wait for others
            mutex.release();
            allDone.acquire();   // barrier: wait for all 5 to finish eating
            System.out.println("  Customer-" + id + " gets up (group leaving).");
        } else {
            // I'm the last eater — all 5 are done
            System.out.println(">>> All 5 done! Customer-" + id + " is last.");
            allDone.release(4);  // wake the 4 waiting eaters

            if (waiting > 0) {
                // "I'll do it for you" — seat waiters
                int n = Math.min(waiting, SEATS);
                waiting -= n;
                eating += n;
                System.out.println(">>> Seating " + n + " waiting customers.");
                block.release(n);   // "pass the baton" — wake n waiters
            }
            mutex.release();
        }
    }
}

public class SushiBarProblem {
    public static void main(String[] args) throws InterruptedException {
        SushiBar bar = new SushiBar();
        int numCustomers = 15;
        ExecutorService pool = Executors.newFixedThreadPool(numCustomers);

        for (int i = 1; i <= numCustomers; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    bar.customer(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });

            // Stagger arrivals to see the waiting behavior
            Thread.sleep(100);
        }

        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);
    }
}
