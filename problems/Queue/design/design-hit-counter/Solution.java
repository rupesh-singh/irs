import java.util.ArrayDeque;
import java.util.Deque;

// Design Hit Counter
// - hit(timestamp): record a hit
// - getHits(timestamp): return hits in the last 300 seconds (open-left window)
// Assumptions: timestamps are strictly increasing.
class HitCounter {
    private static class Entry {
        int ts;     // timestamp
        int count;  // hits at this timestamp
        Entry(int ts, int count) { this.ts = ts; this.count = count; }
    }

    private final Deque<Entry> q = new ArrayDeque<>();
    private int total = 0;

    public HitCounter() {}

    public void hit(int timestamp) {
        // Coalesce with last if same timestamp
        if (!q.isEmpty() && q.peekLast().ts == timestamp) {
            q.peekLast().count++;
        } else {
            q.addLast(new Entry(timestamp, 1));
        }
        total++;
        evictOld(timestamp);
    }

    public int getHits(int timestamp) {
        evictOld(timestamp);
        return total;
    }

    private void evictOld(int timestamp) {
        int boundary = timestamp - 300; // remove entries with ts <= boundary
        while (!q.isEmpty() && q.peekFirst().ts <= boundary) {
            total -= q.removeFirst().count;
        }
    }
}
