import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class BarberShop {
    int waitingCustomers = 0;
    int CAPACITY;
    Semaphore customerSemaphore;
    Semaphore barberSemaphore;
    Semaphore mutex = new Semaphore(1);

    BarberShop(int capacity) {   
        this.CAPACITY = capacity;     
        customerSemaphore = new Semaphore(0, true); // waiting room capacity
        barberSemaphore = new Semaphore(0, true);      // barber is initially sleeping
    }

    public void customerArrivers(int id) throws InterruptedException{        
        mutex.acquire();
        if(waitingCustomers == CAPACITY){
            System.out.println("Customer " + id + " leaves (no space).");
            mutex.release();
            return; // leave if no space
        }
        waitingCustomers++;
        System.out.println("Customer " + id + " is waiting. Waiting customers: " + waitingCustomers);
        customerSemaphore.release();
        mutex.release();      
    }

    public void barberWorks() throws InterruptedException {
        while (true) {
            customerSemaphore.acquire();
            mutex.acquire();
            waitingCustomers--;
            System.out.println("Barber is cutting hair. Waiting customers: " + waitingCustomers);
            barberSemaphore.release(); // signal customer to get haircut
            mutex.release();
            Thread.sleep(1000); // simulate haircut time
        }
    }


}

class BarberShopSemaphoreDemo{
    public static void main(String[] args) throws InterruptedException {
        BarberShop shop = new BarberShop(3); // waiting room capacity
        ExecutorService customerPool = Executors.newFixedThreadPool(5);
        ExecutorService barberPool = Executors.newSingleThreadExecutor();
        
        for(int i = 1; i <= 5; i++){
            final int id = i;
            customerPool.submit(() -> {
                try{
                    shop.customerArrivers(id);
                    Thread.sleep((long) (Math.random() * 2000)); // random arrival time
                }
                catch(Exception e){
                    System.out.println("Exception: "+e);
                }
            });
        }

        barberPool.submit(() -> {
            try{
                shop.barberWorks();
            }
            catch(Exception e){
                System.out.println("Exception: "+e);
            }
        });

        Thread.sleep(5000); // Let the simulation run for a while
        customerPool.shutdownNow();
        barberPool.shutdownNow();
    }
}