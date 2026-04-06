import java.util.concurrent.Semaphore;

class Barrier {
    private int n;                 // total threads
    private int count = 0;

    private Semaphore mutex = new Semaphore(1);
    private Semaphore barrier = new Semaphore(0); // turnstile

    public Barrier(int n) {
        this.n = n;
    }

    public void await() throws InterruptedException {
        // ---- Phase 1: Arrival ----
        mutex.acquire();
        count++;
        if (count == n) {
            barrier.release(); // open the gate for first thread
        }
        mutex.release();

        // ---- Phase 2: Turnstile ----
        barrier.acquire();   // wait for gate
        barrier.release();   // pass the baton to next thread
    }
}

class Worker extends Thread {
    Barrier barrier;
    int id;

    public Worker(Barrier barrier, int id){
        this.barrier = barrier;
        this.id = id;
    }

    public void run(){
        try {
            System.out.println("Thread " + id + " before barrier");

            Thread.sleep((int)(Math.random() * 1000)); // simulate work

            barrier.await();

            System.out.println("Thread " + id + " after barrier");

        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }


}
public class MutexBarrierDemo {
    public static void main(String[] args) {
        int n = 5;
        Barrier barrier = new Barrier(n);
        for (int i = 0; i < n; i++) {
            new Worker(barrier, i).start();
        }
    }
}
