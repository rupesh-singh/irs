

/*

There will be 3 tyep of Threads 
1. Search Thread - will search for the element in the MAP and return the index if found else return -1
2. Insert Thread - will insert the element in the MAP if it is not already present and return the index where it is inserted else return -1
3. Delete Thread - will delete the element from the MAP if it is present and return the index where it was deleted else return -1

1. Search - Concurrent reads allowed
2. Insert - Can work concurrently with search but not with other insert or delete   
3. Delete  - Exclusive access - no other thread can work when delete is in progress


*/

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

class SearchInsertDelete {
    Semaphore searchMutex = new Semaphore(1);     // protects searchers count
    Semaphore insertMutex = new Semaphore(1);     // protects inserters count

    Semaphore insertSemaphore = new Semaphore(1); // only 1 inserter at a time
    
    Semaphore noSearcher = new Semaphore(1);      // deleter blocks searchers
    Semaphore noInserter = new Semaphore(1);      // deleter blocks inserters
    
    int searchers = 0;
    int inserters = 0;
    Map<Integer, Integer> map;

    public SearchInsertDelete(Map<Integer, Integer> map) {
        this.map = map;
    }

    public int search(int key) throws InterruptedException {
        searchMutex.acquire();
        searchers++;
        if (searchers == 1) {
            noSearcher.acquire(); // first searcher locks out deleters
        }
        searchMutex.release();
        // Perform search
        int result = map.getOrDefault(key, -1);

        searchMutex.acquire();
        searchers--;
        if (searchers == 0) {           
            noSearcher.release(); // last searcher lets deleters in
        }
        searchMutex.release();
        return result;
    }

    public int insert(int key, int value) throws InterruptedException {
        insertSemaphore.acquire();   // only 1 inserter at a time
        insertMutex.acquire();
        inserters++;
        if (inserters == 1) {
            noInserter.acquire();    // first inserter locks out deleters
        }
        insertMutex.release();

        if (map.containsKey(key)) {
            insertMutex.acquire();
            inserters--;
            if (inserters == 0) {
                noInserter.release();
            }
            insertMutex.release();
            insertSemaphore.release();            
            return -1; // already present
        }
        map.put(key, value);
        insertSemaphore.release();

        insertMutex.acquire();
        inserters--;
        if (inserters == 0) {
            noInserter.release();    // last inserter lets deleters in
        }
        insertMutex.release();
        return value;
    }

    public int delete(int key) throws InterruptedException {
        noSearcher.acquire();  // wait for all searchers to finish
        noInserter.acquire();  // wait for all inserters to finish
        // Exclusive access now
        if (!map.containsKey(key)) {
            noInserter.release();
            noSearcher.release();
            return -1; // not present
        }
        int value = map.remove(key);
        noInserter.release();
        noSearcher.release();
        return value;
    }
}

public class SearchInsertDeleteProblem {
    public static void main(String[] args) throws InterruptedException {
        // Example usage
        Map<Integer, Integer> map = new HashMap<>();
        SearchInsertDelete sid = new SearchInsertDelete(map);
        int searchThreads = 5;
        int insertThreads = 3;
        int deleteThreads = 2;

        ExecutorService pool = Executors.newFixedThreadPool(searchThreads + insertThreads + deleteThreads); 

        // Search Threads
        for (int i = 0; i < 10; i++) {
            final int key = i;
            pool.submit(() -> {
                try {
                    int result = sid.search(key);
                    System.out.println("Search for " + key + ": " + result);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // Insert Threads
        for (int i = 0; i < 10; i++) {
            final int key = i;
            final int value = i * 10;
            pool.submit(() -> {
                try {
                    int result = sid.insert(key, value);
                    System.out.println("Insert " + key + ": " + result);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // Delete Threads
        for (int i = 0; i < 10; i++) {
            final int key = i;
            pool.submit(() -> {
                try {
                    int result = sid.delete(key);
                    System.out.println("Delete " + key + ": " + result);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
        pool.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS);
        
    }
}