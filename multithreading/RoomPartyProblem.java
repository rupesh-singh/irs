import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/*
 * ============================================================
 * ROOM PARTY PROBLEM (State Machine)
 * ============================================================
 *
 * Setup:
 *   - Students can party in a room
 *   - Dean can enter to search the room
 *   - Rules:
 *     • Students can enter while dean is NOT physically present
 *     • Dean enters immediately if room is empty
 *     • Dean waits if students are partying — last student
 *       leaving lets the dean in
 *     • Students arriving while dean is inside must wait
 *     • When dean leaves, waiting students enter
 *
 * States:
 *   EMPTY         — nobody in the room
 *   PARTY         — students partying, no dean
 *   DEAN_WAITING  — dean wants in, students still inside
 *   DEAN_IN       — dean is in the room
 *
 * Transitions:
 *   EMPTY ──student arrives──→ PARTY
 *   PARTY ──dean arrives────→ DEAN_WAITING
 *   DEAN_WAITING ──last student leaves──→ DEAN_IN
 *   DEAN_IN ──dean leaves───→ EMPTY (or PARTY if students waiting)
 *   EMPTY ──dean arrives────→ DEAN_IN
 *
 * Semaphores:
 *   mutex  = Semaphore(1)  — protects state, students, studentsWaiting
 *   turn   = Semaphore(0)  — dean blocks here until last student lets them in
 *   clear  = Semaphore(0)  — students block here while dean is inside
 *
 * Student:
 *   ENTER:
 *     mutex.acquire()
 *     if state == DEAN_IN:
 *       studentsWaiting++
 *       mutex.release()
 *       clear.acquire()             // wait for dean to leave
 *       // woken: students already incremented for me
 *     else:
 *       students++
 *       if students == 1 && state == EMPTY:
 *         state = PARTY
 *       mutex.release()
 *
 *     PARTY!
 *
 *   LEAVE:
 *     mutex.acquire()
 *     students--
 *     if students == 0 && state == DEAN_WAITING:
 *       state = DEAN_IN              // let dean in
 *       turn.release()               // "pass the baton"
 *     elif students == 0:
 *       state = EMPTY
 *     mutex.release()
 *
 * Dean:
 *   ENTER:
 *     mutex.acquire()
 *     if state == EMPTY:
 *       state = DEAN_IN              // enter immediately
 *       mutex.release()
 *     elif state == PARTY:
 *       state = DEAN_WAITING         // wait for students
 *       mutex.release()
 *       turn.acquire()               // block until last student signals
 *
 *     SEARCH ROOM
 *
 *   LEAVE:
 *     mutex.acquire()
 *     if studentsWaiting > 0:
 *       n = studentsWaiting
 *       studentsWaiting = 0
 *       students = n                 // "I'll do it for you"
 *       state = PARTY
 *       clear.release(n)             // "pass the baton" — let them in
 *     else:
 *       state = EMPTY
 *     mutex.release()
 * ============================================================
 */

class Room {
    enum State { EMPTY, PARTY, DEAN_WAITING, DEAN_IN }

    final Semaphore mutex = new Semaphore(1);
    final Semaphore turn = new Semaphore(0);    // dean waits here
    final Semaphore clear = new Semaphore(0);   // students wait here while dean is in

    State state = State.EMPTY;
    int students = 0;
    int studentsWaiting = 0;   // students blocked on clear

    public void student(int id) throws InterruptedException {
        // --- ENTER ---
        mutex.acquire();
        if (state == State.DEAN_IN) {
            studentsWaiting++;
            System.out.println("  Student-" + id + " waits (dean inside). Waiting: " + studentsWaiting);
            mutex.release();
            clear.acquire();
            // Woken — dean updated students count for me ("I'll do it for you")
            System.out.println("  Student-" + id + " enters (dean left). Students: " + students);
        } else {
            students++;
            if (students == 1 && state == State.EMPTY) {
                state = State.PARTY;
            }
            System.out.println("  Student-" + id + " enters. State: " + state + ", Students: " + students);
            mutex.release();
        }

        // --- PARTY ---
        Thread.sleep((long) (Math.random() * 1000 + 500));

        // --- LEAVE ---
        mutex.acquire();
        students--;
        if (students == 0 && state == State.DEAN_WAITING) {
            state = State.DEAN_IN;
            System.out.println("  Student-" + id + " is last out → lets dean in.");
            turn.release();             // "pass the baton" to dean
        } else if (students == 0) {
            state = State.EMPTY;
            System.out.println("  Student-" + id + " leaves (last). State: EMPTY");
        } else {
            System.out.println("  Student-" + id + " leaves. Students remaining: " + students);
        }
        mutex.release();
    }

    public void dean(int visit) throws InterruptedException {
        // --- ENTER ---
        mutex.acquire();
        if (state == State.EMPTY) {
            state = State.DEAN_IN;
            System.out.println(">>> Dean visit #" + visit + ": room empty → enters immediately.");
            mutex.release();
        } else if (state == State.PARTY) {
            state = State.DEAN_WAITING;
            System.out.println(">>> Dean visit #" + visit + ": party in progress → waits. Students: " + students);
            mutex.release();
            turn.acquire();             // wait for last student to let me in
            System.out.println(">>> Dean visit #" + visit + ": last student left → enters.");
        } else {
            // DEAN_IN or DEAN_WAITING shouldn't happen (only 1 dean)
            mutex.release();
            return;
        }

        // --- SEARCH ROOM ---
        System.out.println(">>> Dean visit #" + visit + ": searching room...");
        Thread.sleep(1500);

        // --- LEAVE ---
        mutex.acquire();
        if (studentsWaiting > 0) {
            int n = studentsWaiting;
            studentsWaiting = 0;
            students = n;               // "I'll do it for you"
            state = State.PARTY;
            System.out.println(">>> Dean visit #" + visit + ": done. Letting " + n + " waiting students in.");
            clear.release(n);           // "pass the baton"
        } else {
            state = State.EMPTY;
            System.out.println(">>> Dean visit #" + visit + ": done. Room empty.");
        }
        mutex.release();
    }
}

public class RoomPartyProblem {
    public static void main(String[] args) throws InterruptedException {
        Room room = new Room();
        int numStudents = 10;
        int deanVisits = 3;

        ExecutorService pool = Executors.newFixedThreadPool(numStudents + 1);

        // Dean thread — visits multiple times
        pool.submit(() -> {
            try {
                for (int v = 1; v <= deanVisits; v++) {
                    Thread.sleep(2000);  // dean arrives periodically
                    room.dean(v);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        // Student threads — staggered arrivals
        for (int i = 1; i <= numStudents; i++) {
            final int id = i;
            Thread.sleep(300);  // stagger student arrivals
            pool.submit(() -> {
                try {
                    room.student(id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);
    }
}
