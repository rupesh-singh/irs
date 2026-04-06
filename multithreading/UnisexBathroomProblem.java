import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class Bathroom {
    int women = 0;
    int men = 0;
    Semaphore womenMutex = new Semaphore(1);  // protects women count
    Semaphore menMutex = new Semaphore(1);    // protects men count
    Semaphore empty = new Semaphore(1);       // bathroom empty — both genders lightswitch on this

    public void enterWomen() throws InterruptedException {
        womenMutex.acquire();
        women++;
        if (women == 1) {
            empty.acquire(); // first woman locks out men
        }
        womenMutex.release();
        // --- critical section: use bathroom ---
        System.out.println("Women using bathroom. Women count: " + women);
        Thread.sleep(1000); // simulate bathroom time
        
        womenMutex.acquire();
        women--;
        if (women == 0) {
            empty.release(); // last woman lets men in
        }
        womenMutex.release();
    }

    public void enterMen() throws InterruptedException {
        menMutex.acquire();
        men++;
        if (men == 1) {
            empty.acquire(); // first man locks out women
        }
        menMutex.release();
        // --- critical section: use bathroom ---
        System.out.println("Men using bathroom. Men count: " + men);
        Thread.sleep(1000); // simulate bathroom time

        menMutex.acquire();
        men--;
        if (men == 0) {
            empty.release(); // last man lets women in
        }
        menMutex.release();
    }
}


public class UnisexBathroomProblem {

    public static void main(String[] args) {
        Bathroom bathroom = new Bathroom();
        
        ExecutorService pool = Executors.newFixedThreadPool(10);
        // Simulate people arriving at the bathroom
        for (int i = 0; i < 5; i++) {
            pool.submit(() -> {
                try {
                    System.out.println("Woman arrives");
                    bathroom.enterWomen();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            pool.submit(() -> {
                try {
                    System.out.println("man arrives");
                    bathroom.enterMen();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        pool.shutdown();
    }
    
}