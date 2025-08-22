import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstrates the Producer-Consumer pattern using BlockingQueue
 * This is another important concurrency pattern where some threads produce data
 * and other threads consume it
 */
public class ProducerConsumerDemo {
    
    // Shared blocking queue with fixed capacity
    private static final BlockingQueue<Task> taskQueue = new ArrayBlockingQueue<>(10);
    
    // Counter for generated tasks
    private static final AtomicInteger taskCounter = new AtomicInteger(0);
    
    // Flag to signal consumers to stop
    private static volatile boolean producingComplete = false;
    
    public static void main(String[] args) {
        int numProducers = 3;
        int numConsumers = 2;
        int tasksPerProducer = 15;
        
        System.out.println("Starting Producer-Consumer demonstration");
        System.out.println("Producers: " + numProducers + ", Consumers: " + numConsumers);
        
        // Create thread pools for producers and consumers
        ExecutorService producerExecutor = Executors.newFixedThreadPool(numProducers);
        ExecutorService consumerExecutor = Executors.newFixedThreadPool(numConsumers);
        
        // Start timing
        long startTime = System.currentTimeMillis();
        
        // Start producers
        for (int i = 0; i < numProducers; i++) {
            final int producerId = i;
            producerExecutor.execute(() -> {
                try {
                    for (int j = 0; j < tasksPerProducer; j++) {
                        Task task = new Task(taskCounter.incrementAndGet(), "Producer-" + producerId);
                        
                        // Put will block if the queue is full
                        taskQueue.put(task);
                        
                        System.out.println("Producer-" + producerId + " created " + task);
                        
                        // Simulate variable production time
                        Thread.sleep((long) (Math.random() * 1000));
                    }
                    System.out.println("Producer-" + producerId + " completed.");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        
        // Start consumers
        for (int i = 0; i < numConsumers; i++) {
            final int consumerId = i;
            consumerExecutor.execute(() -> {
                try {
                    while (!producingComplete || !taskQueue.isEmpty()) {
                        // Poll with timeout rather than take() to allow checking the production status
                        Task task = taskQueue.poll(100, TimeUnit.MILLISECONDS);
                        
                        if (task != null) {
                            // Process the task
                            System.out.println("Consumer-" + consumerId + " processing " + task);
                            
                            // Simulate variable processing time
                            Thread.sleep((long) (Math.random() * 2000));
                            
                            System.out.println("Consumer-" + consumerId + " completed " + task);
                        }
                    }
                    System.out.println("Consumer-" + consumerId + " shutting down.");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        
        // Shutdown producer executor and wait for completion
        producerExecutor.shutdown();
        try {
            producerExecutor.awaitTermination(1, TimeUnit.MINUTES);
            // Signal that production is complete
            producingComplete = true;
            System.out.println("All producers have completed their work.");
            
            // Wait for consumers to finish processing remaining tasks
            consumerExecutor.shutdown();
            boolean consumersFinished = consumerExecutor.awaitTermination(1, TimeUnit.MINUTES);
            
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("\n--- Execution Summary ---");
            System.out.println("All tasks produced and consumed: " + consumersFinished);
            System.out.println("Total execution time: " + duration + " ms");
            System.out.println("Total tasks processed: " + taskCounter.get());
            
        } catch (InterruptedException e) {
            System.err.println("Execution was interrupted");
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * Simple task class for demonstration purposes
     */
    private static class Task {
        private final int id;
        private final String createdBy;
        
        public Task(int id, String createdBy) {
            this.id = id;
            this.createdBy = createdBy;
        }
        
        @Override
        public String toString() {
            return "Task{id=" + id + ", createdBy='" + createdBy + "'}";
        }
    }
}