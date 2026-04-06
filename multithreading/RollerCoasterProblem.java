import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/*
 * ============================================================
 * ROLLER COASTER PROBLEM (1 car, C capacity)
 * ============================================================
 *
 * Setup:
 *   - 1 car with capacity C, N passengers (N divisible by C)
 *   - Cycle: load C passengers → ride → unload → repeat
 *   - Passengers queue up; only C board per ride
 *
 * Semaphores:
 *   mutex         = Semaphore(1)   — protects passenger counter
 *   boardQueue    = Semaphore(0)   — passengers wait here to board
 *   allBoarded    = Semaphore(0)   — captain signals car: all C seated
 *   rideOver      = Semaphore(0)   — car signals passengers: ride done
 *   allExited     = Semaphore(0)   — captain signals car: all C exited
 *
 * Flow:
 *   Passenger:
 *     boardQueue.acquire()         // wait for car to allow boarding
 *     mutex.acquire()
 *       boardCount++
 *       if boardCount == C:        // I'm the last to board (captain)
 *         allBoarded.release()     // tell car: full
 *         boardCount = 0
 *     mutex.release()
 *     rideOver.acquire()           // wait for ride to finish
 *     mutex.acquire()
 *       exitCount++
 *       if exitCount == C:         // I'm the last to exit
 *         allExited.release()      // tell car: empty
 *         exitCount = 0
 *     mutex.release()
 *
 *   Car (runs in loop, numPassengers/C rides):
 *     boardQueue.release(C)        // let C passengers board
 *     allBoarded.acquire()         // wait until all C seated
 *     ride()
 *     rideOver.release(C)          // let all C passengers exit
 *     allExited.acquire()          // wait until all C exited
 * ============================================================
 */

class Car {
    final int capacity;
    final Semaphore mutex = new Semaphore(1);
    final Semaphore boardQueue = new Semaphore(0);   // passengers wait to board
    final Semaphore allBoarded = new Semaphore(0);   // captain → car: all seated
    final Semaphore rideOver = new Semaphore(0);     // car → passengers: ride done
    final Semaphore allExited = new Semaphore(0);    // captain → car: all out
    int boardCount = 0;
    int exitCount = 0;

    public Car(int capacity) {
        this.capacity = capacity;
    }

    // Called by each passenger thread
    public void takeRide(int id) throws InterruptedException {
        // Wait for car to allow boarding
        boardQueue.acquire();
        System.out.println("  Passenger-" + id + " boarding");

        // Count boarders; last one signals car
        mutex.acquire();
        boardCount++;
        if (boardCount == capacity) {
            allBoarded.release();    // tell car: everyone's seated
            boardCount = 0;
        }
        mutex.release();

        // Wait for ride to finish
        rideOver.acquire();
        System.out.println("  Passenger-" + id + " exiting");

        // Count exits; last one signals car
        mutex.acquire();
        exitCount++;
        if (exitCount == capacity) {
            allExited.release();     // tell car: everyone's out
            exitCount = 0;
        }
        mutex.release();
    }

    // Called by the car thread
    public void runRides(int totalPassengers) throws InterruptedException {
        int rides = totalPassengers / capacity;
        for (int r = 1; r <= rides; r++) {
            System.out.println("\n=== Ride #" + r + " — loading ===");
            boardQueue.release(capacity);    // let C passengers board
            allBoarded.acquire();            // wait until all C seated

            System.out.println(">>> Ride #" + r + " — running!");
            Thread.sleep(500);               // simulate ride

            System.out.println("=== Ride #" + r + " — unloading ===");
            rideOver.release(capacity);      // let all C exit
            allExited.acquire();             // wait until all C exited
            System.out.println("=== Ride #" + r + " — done ===");
        }
    }
}

public class RollerCoasterProblem {
    public static void main(String[] args) throws InterruptedException {
        int numPassengers = 12;
        int carCapacity = 4;
        Car car = new Car(carCapacity);

        ExecutorService pool = Executors.newFixedThreadPool(numPassengers + 1); // +1 for car thread

        // Car thread
        pool.submit(() -> {
            try {
                car.runRides(numPassengers);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        // Passenger threads
        for (int i = 1; i <= numPassengers; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    car.takeRide(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);
    }
}
