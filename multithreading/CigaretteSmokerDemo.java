import java.util.concurrent.Semaphore;
import java.util.Random;

class CigaretteSmokerDemo {
    static Semaphore agent = new Semaphore(1);
    static Semaphore tobacco = new Semaphore(0);
    static Semaphore paper = new Semaphore(0);
    static Semaphore matches = new Semaphore(0);

    static class Agent implements Runnable {
        Random rand = new Random();

        public void run() {
            while (true) {
                try {
                    agent.acquire();
                    int choice = rand.nextInt(3);
                    switch (choice) {
                        case 0:
                            System.out.println("Agent puts paper and matches");
                            tobacco.release(); // Smoker with tobacco can proceed
                            break;
                        case 1:
                            System.out.println("Agent puts tobacco and matches");
                            paper.release(); // Smoker with paper can proceed
                            break;
                        case 2:
                            System.out.println("Agent puts tobacco and paper");
                            matches.release(); // Smoker with matches can proceed
                            break;
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    static class Smoker implements Runnable {
        private Semaphore myIngredient;
        private String name;

        Smoker(Semaphore ingredient, String name) {
            this.myIngredient = ingredient;
            this.name = name;
        }

        public void run() {
            while (true) {
                try {
                    myIngredient.acquire();
                    System.out.println(name + " makes and smokes a cigarette");
                    Thread.sleep(500); // Simulate smoking time
                    agent.release(); // Signal agent to continue
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    public static void main(String[] args) {
        new Thread(new Agent()).start();
        new Thread(new Smoker(tobacco, "Smoker with Tobacco")).start();
        new Thread(new Smoker(paper, "Smoker with Paper")).start();
        new Thread(new Smoker(matches, "Smoker with Matches")).start();
    }
}