import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/*
 * ============================================================
 * BUILDING H2O PROBLEM
 * ============================================================
 *
 * Setup:
 *   - Two types of threads: Hydrogen (H) and Oxygen (O)
 *   - To form one water molecule, exactly 2 H and 1 O must
 *     bond together at the same time
 *
 * Solution: Permits-as-slots approach
 *
 *   Semaphores:
 *     hydrogen = Semaphore(2)   — exactly 2 H slots per molecule
 *     oxygen   = Semaphore(1)   — exactly 1 O slot per molecule
 *     barrier  = Semaphore(0)   — holds all 3 until molecule complete
 *
 *   The permits directly encode the constraint:
 *     - First 2 hydrogens pass, 3rd blocks (permits exhausted)
 *     - First oxygen passes, 2nd blocks
 *     - Each thread that passes increments a shared counter
 *     - The 3rd thread (whoever it is) sees count==3:
 *         → refills hydrogen(2) and oxygen(1) for next molecule
 *         → releases barrier(3) so all 3 can proceed
 *     - All 3 call barrier.acquire() to sync before finishing
 *
 *   Flow (example: H, H, O arrival order):
 *     H-1: hydrogen.acquire() → pass (permits=1)  → count=1
 *     H-2: hydrogen.acquire() → pass (permits=0)  → count=2
 *     H-3: hydrogen.acquire() → BLOCKS
 *     O-1: oxygen.acquire()   → pass (permits=0)  → count=3 TRIGGER!
 *       → hydrogen.release(2), oxygen.release(1)   // refill slots
 *       → barrier.release(3)                        // unblock group
 *       → count=0
 *     All 3: barrier.acquire() → pass → molecule done
 *     H-3: hydrogen.acquire() → pass (refilled) → next molecule...
 * ============================================================
 */

class H2O {
    private final Semaphore hydrogen = new Semaphore(2);
    private final Semaphore oxygen = new Semaphore(1);
    private final Semaphore barrier = new Semaphore(0);
    private int count = 0;
    private final Object lock = new Object();
    private int moleculeCount = 0;

    public void hydrogen(int id) throws InterruptedException {
        hydrogen.acquire();
        System.out.println("  H-" + id + " bonding");
        release();
    }

    public void oxygen(int id) throws InterruptedException {
        oxygen.acquire();
        System.out.println("  O-" + id + " bonding");
        release();
    }

    private void release() throws InterruptedException {
        synchronized (lock) {
            count++;
            if (count == 3) {
                // All 3 threads arrived — form the molecule
                hydrogen.release(2);    // refill 2 H slots for next molecule
                oxygen.release(1);      // refill 1 O slot for next molecule
                barrier.release(3);     // let all 3 threads proceed
                count = 0;
                moleculeCount++;
                System.out.println(">>> H2O molecule #" + moleculeCount + " formed!");
            }
        }
        barrier.acquire();  // wait until all 3 have bonded
    }
}

public class BuildingH2ODemo {
    public static void main(String[] args) {
        H2O h2o = new H2O();

        // 10 hydrogen + 5 oxygen = 5 water molecules
        int numHydrogen = 10;
        int numOxygen = 5;

        ExecutorService pool = Executors.newFixedThreadPool(numHydrogen + numOxygen);

        for (int i = 1; i <= numHydrogen; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    h2o.hydrogen(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        for (int i = 1; i <= numOxygen; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    h2o.oxygen(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
    }
}
