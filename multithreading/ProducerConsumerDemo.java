import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.BlockingQueue;

class Producer implements Runnable {
    BlockingQueue<String> bq;
    int id;

    public Producer(BlockingQueue<String> q, int id){
        this.bq = q;
        this.id = id;
    }

    public void run(){
        while(!Thread.currentThread().isInterrupted())
        {
            long timeInMilliseconds = System.currentTimeMillis();
            try
            {
                System.out.println("Producer " + id + " adding to queue");
                this.bq.put(timeInMilliseconds + " ms");
                Thread.sleep(1000);
            }
            catch(InterruptedException e)
            {
                Thread.currentThread().interrupt();
                System.out.println("Producer " + id + " interrupted");
            }
        }
    }
}

class Consumer implements Runnable {
    BlockingQueue<String> bq;
    int id;

    public Consumer(BlockingQueue<String> q, int id){
        this.bq = q;
        this.id = id;
    }

    public void run(){
        while(!Thread.currentThread().isInterrupted()){
            try {
                String item = this.bq.take();
                System.out.println("Consumer " + id + " consuming from queue: " + item);
            }
            catch (InterruptedException e){
                Thread.currentThread().interrupt();
                System.out.println("Consumer " + id + " interrupted");
            }
        }
    }
}

public class ProducerConsumerDemo {
    public static void main(String[] args) {
        BlockingQueue<String> bq = new LinkedBlockingQueue<>(2);

        ExecutorService producerPool = Executors.newFixedThreadPool(2);
        ExecutorService consumerPool = Executors.newFixedThreadPool(2);

        producerPool.submit(new Producer(bq, 1));
        producerPool.submit(new Producer(bq, 2));

        consumerPool.submit(new Consumer(bq, 1));
        consumerPool.submit(new Consumer(bq, 2));

        // To shut down gracefully, call:
        // producerPool.shutdownNow();
        // consumerPool.shutdownNow();
    }
}
