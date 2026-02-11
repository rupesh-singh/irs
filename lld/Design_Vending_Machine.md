# LLD: Vending Machine (State Design Pattern)

## 📋 Problem Statement
Design a Vending Machine that dispenses products based on user selections and payments. The machine should handle different states like idle, has money, dispensing, and out of stock.

---

## 🎯 Clarifying Questions to Ask

1. **Payment types?** - Cash only, card, or both?
2. **Multiple products?** - Different prices and quantities?
3. **Change handling?** - Return exact change?
4. **Refund support?** - Cancel and get money back?
5. **Admin operations?** - Refill, collect money, view stats?
6. **Concurrent access?** - Multiple users simultaneously?

---

## ✅ Requirements

### Functional
- Accept money (coins/notes)
- Display available products with prices
- Select product and dispense if paid enough
- Return change if overpaid
- Handle refund/cancel requests
- Track inventory and handle out-of-stock

### Non-Functional
- Thread-safe operations
- Extensible for new payment methods
- Easy to add new states
- Audit trail for transactions

---

## 🎨 State Pattern Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STATE PATTERN                                    │
│                                                                          │
│   Context (VendingMachine)  ─────────────►  State (VendingMachineState) │
│   - currentState                            - insertMoney()              │
│   - setState()                              - selectProduct()            │
│   - insertMoney()                           - dispense()                 │
│   - selectProduct()                         - refund()                   │
│   - dispense()                                      ▲                    │
│                                                     │                    │
│                    ┌────────────────────────────────┼────────────────┐   │
│                    │                    │           │                │   │
│                    ▼                    ▼           ▼                ▼   │
│            ┌───────────┐        ┌───────────┐ ┌───────────┐  ┌───────────┐
│            │   Idle    │        │ HasMoney  │ │Dispensing │  │  NoStock  │
│            │   State   │        │   State   │ │   State   │  │   State   │
│            └───────────┘        └───────────┘ └───────────┘  └───────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Core Classes & Interfaces

```java
// ==================== ENTITIES ====================
class Product {
    String id;
    String name;
    double price;
    int quantity;
    String slot;  // e.g., "A1", "B2"
    
    boolean isAvailable() {
        return quantity > 0;
    }
    
    void decrementQuantity() {
        if (quantity > 0) quantity--;
    }
}

class Coin {
    CoinType type;
    double value;
}

enum CoinType {
    PENNY(0.01), NICKEL(0.05), DIME(0.10), QUARTER(0.25), DOLLAR(1.00);
    
    private final double value;
    CoinType(double value) { this.value = value; }
    public double getValue() { return value; }
}

class Inventory {
    private final Map<String, Product> products;  // slot -> product
    
    void addProduct(String slot, Product product) {
        products.put(slot, product);
    }
    
    Product getProduct(String slot) {
        return products.get(slot);
    }
    
    boolean isAvailable(String slot) {
        Product p = products.get(slot);
        return p != null && p.isAvailable();
    }
    
    void dispense(String slot) {
        Product p = products.get(slot);
        if (p != null) p.decrementQuantity();
    }
    
    List<Product> getAvailableProducts() {
        return products.values().stream()
            .filter(Product::isAvailable)
            .collect(Collectors.toList());
    }
}

// ==================== STATE INTERFACE ====================
interface VendingMachineState {
    void insertMoney(VendingMachine machine, double amount);
    void selectProduct(VendingMachine machine, String slot);
    void dispense(VendingMachine machine);
    void refund(VendingMachine machine);
    String getStateName();
}

// ==================== CONCRETE STATES ====================
class IdleState implements VendingMachineState {
    
    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        machine.addBalance(amount);
        System.out.println("Inserted: $" + amount + ". Current balance: $" + machine.getBalance());
        machine.setState(new HasMoneyState());
    }
    
    @Override
    public void selectProduct(VendingMachine machine, String slot) {
        System.out.println("Please insert money first.");
    }
    
    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Please insert money and select a product first.");
    }
    
    @Override
    public void refund(VendingMachine machine) {
        System.out.println("No money to refund.");
    }
    
    @Override
    public String getStateName() {
        return "IDLE";
    }
}

class HasMoneyState implements VendingMachineState {
    
    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        machine.addBalance(amount);
        System.out.println("Added: $" + amount + ". Current balance: $" + machine.getBalance());
    }
    
    @Override
    public void selectProduct(VendingMachine machine, String slot) {
        Product product = machine.getInventory().getProduct(slot);
        
        if (product == null) {
            System.out.println("Invalid slot: " + slot);
            return;
        }
        
        if (!product.isAvailable()) {
            System.out.println("Product " + product.name + " is out of stock.");
            machine.setState(new NoStockState());
            return;
        }
        
        if (machine.getBalance() < product.price) {
            System.out.println("Insufficient balance. Need $" + 
                (product.price - machine.getBalance()) + " more.");
            return;
        }
        
        machine.setSelectedSlot(slot);
        machine.setState(new DispensingState());
        machine.dispense();  // Trigger dispense immediately
    }
    
    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Please select a product first.");
    }
    
    @Override
    public void refund(VendingMachine machine) {
        double balance = machine.getBalance();
        machine.resetBalance();
        System.out.println("Refunded: $" + balance);
        machine.setState(new IdleState());
    }
    
    @Override
    public String getStateName() {
        return "HAS_MONEY";
    }
}

class DispensingState implements VendingMachineState {
    
    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        System.out.println("Please wait, dispensing in progress...");
    }
    
    @Override
    public void selectProduct(VendingMachine machine, String slot) {
        System.out.println("Please wait, dispensing in progress...");
    }
    
    @Override
    public void dispense(VendingMachine machine) {
        String slot = machine.getSelectedSlot();
        Product product = machine.getInventory().getProduct(slot);
        
        // Dispense product
        machine.getInventory().dispense(slot);
        System.out.println("Dispensing: " + product.name);
        
        // Calculate and return change
        double change = machine.getBalance() - product.price;
        if (change > 0) {
            System.out.println("Returning change: $" + String.format("%.2f", change));
        }
        
        // Reset machine
        machine.resetBalance();
        machine.setSelectedSlot(null);
        
        // Record transaction
        machine.recordTransaction(product, change);
        
        // Transition to appropriate state
        if (machine.getInventory().getAvailableProducts().isEmpty()) {
            machine.setState(new NoStockState());
        } else {
            machine.setState(new IdleState());
        }
    }
    
    @Override
    public void refund(VendingMachine machine) {
        System.out.println("Cannot refund while dispensing.");
    }
    
    @Override
    public String getStateName() {
        return "DISPENSING";
    }
}

class NoStockState implements VendingMachineState {
    
    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        System.out.println("Sorry, machine is out of stock. Please try later.");
    }
    
    @Override
    public void selectProduct(VendingMachine machine, String slot) {
        System.out.println("Sorry, machine is out of stock. Please try later.");
    }
    
    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Cannot dispense. Machine is out of stock.");
    }
    
    @Override
    public void refund(VendingMachine machine) {
        double balance = machine.getBalance();
        if (balance > 0) {
            machine.resetBalance();
            System.out.println("Refunded: $" + balance);
        } else {
            System.out.println("No money to refund.");
        }
    }
    
    @Override
    public String getStateName() {
        return "NO_STOCK";
    }
}

// ==================== CONTEXT (VENDING MACHINE) ====================
class VendingMachine {
    private VendingMachineState currentState;
    private final Inventory inventory;
    private double balance;
    private String selectedSlot;
    private final List<Transaction> transactions;
    private final Lock lock = new ReentrantLock();
    
    public VendingMachine() {
        this.currentState = new IdleState();
        this.inventory = new Inventory();
        this.balance = 0;
        this.transactions = new ArrayList<>();
    }
    
    // State management
    public void setState(VendingMachineState state) {
        System.out.println("State transition: " + currentState.getStateName() + " -> " + state.getStateName());
        this.currentState = state;
    }
    
    public VendingMachineState getState() {
        return currentState;
    }
    
    // Delegate operations to current state
    public void insertMoney(double amount) {
        lock.lock();
        try {
            currentState.insertMoney(this, amount);
        } finally {
            lock.unlock();
        }
    }
    
    public void selectProduct(String slot) {
        lock.lock();
        try {
            currentState.selectProduct(this, slot);
        } finally {
            lock.unlock();
        }
    }
    
    public void dispense() {
        lock.lock();
        try {
            currentState.dispense(this);
        } finally {
            lock.unlock();
        }
    }
    
    public void refund() {
        lock.lock();
        try {
            currentState.refund(this);
        } finally {
            lock.unlock();
        }
    }
    
    // Balance management
    public void addBalance(double amount) {
        this.balance += amount;
    }
    
    public double getBalance() {
        return balance;
    }
    
    public void resetBalance() {
        this.balance = 0;
    }
    
    // Inventory access
    public Inventory getInventory() {
        return inventory;
    }
    
    // Selection management
    public void setSelectedSlot(String slot) {
        this.selectedSlot = slot;
    }
    
    public String getSelectedSlot() {
        return selectedSlot;
    }
    
    // Transaction recording
    public void recordTransaction(Product product, double change) {
        transactions.add(new Transaction(product, change, LocalDateTime.now()));
    }
    
    // Admin operations
    public void refillProduct(String slot, int quantity) {
        lock.lock();
        try {
            Product p = inventory.getProduct(slot);
            if (p != null) {
                p.quantity += quantity;
                System.out.println("Refilled " + p.name + ". New quantity: " + p.quantity);
                
                // If was out of stock, transition to idle
                if (currentState instanceof NoStockState) {
                    setState(new IdleState());
                }
            }
        } finally {
            lock.unlock();
        }
    }
    
    public void displayProducts() {
        System.out.println("\n=== Available Products ===");
        for (Product p : inventory.getAvailableProducts()) {
            System.out.printf("%s: %s - $%.2f (Qty: %d)%n", 
                p.slot, p.name, p.price, p.quantity);
        }
        System.out.println("==========================\n");
    }
}

class Transaction {
    String id;
    Product product;
    double amountPaid;
    double changeReturned;
    LocalDateTime timestamp;
    
    Transaction(Product product, double change, LocalDateTime timestamp) {
        this.id = UUID.randomUUID().toString();
        this.product = product;
        this.changeReturned = change;
        this.timestamp = timestamp;
    }
}
```

---

## 🔄 State Transition Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    ▼                                             │
            ┌───────────────┐                                     │
            │               │  insertMoney()                      │
     ┌──────│   IDLE        │────────────────┐                    │
     │      │               │                │                    │
     │      └───────────────┘                ▼                    │
     │              ▲              ┌───────────────┐              │
     │              │              │               │              │
     │   refund()   │              │  HAS_MONEY    │──────────────┤
     │   or         │              │               │  selectProduct()
     │   dispense   │              └───────┬───────┘  (out of stock)
     │   complete   │                      │                      │
     │              │      selectProduct() │                      │
     │              │      (enough money)  │                      ▼
     │              │                      ▼              ┌───────────────┐
     │              │              ┌───────────────┐      │               │
     │              │              │               │      │   NO_STOCK    │
     │              └──────────────│  DISPENSING   │      │               │
     │                             │               │      └───────┬───────┘
     │                             └───────────────┘              │
     │                                                            │
     │                                   refill()                 │
     └────────────────────────────────────────────────────────────┘
```

---

## 📊 Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VendingMachine                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ - currentState: VendingMachineState                                     │
│ - inventory: Inventory                                                  │
│ - balance: double                                                       │
│ - selectedSlot: String                                                  │
│ - transactions: List<Transaction>                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ + insertMoney(amount): void                                             │
│ + selectProduct(slot): void                                             │
│ + dispense(): void                                                      │
│ + refund(): void                                                        │
│ + setState(state): void                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ uses
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    <<interface>> VendingMachineState                    │
├─────────────────────────────────────────────────────────────────────────┤
│ + insertMoney(machine, amount): void                                    │
│ + selectProduct(machine, slot): void                                    │
│ + dispense(machine): void                                               │
│ + refund(machine): void                                                 │
└─────────────────────────────────────────────────────────────────────────┘
           ▲              ▲                ▲               ▲
           │              │                │               │
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  IdleState   │ │HasMoneyState │ │DispensingState│ │NoStockState  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🧪 Usage Example

```java
public class VendingMachineDemo {
    public static void main(String[] args) {
        VendingMachine machine = new VendingMachine();
        
        // Setup inventory
        machine.getInventory().addProduct("A1", new Product("1", "Coke", 1.50, 5, "A1"));
        machine.getInventory().addProduct("A2", new Product("2", "Pepsi", 1.50, 3, "A2"));
        machine.getInventory().addProduct("B1", new Product("3", "Chips", 2.00, 2, "B1"));
        machine.getInventory().addProduct("B2", new Product("4", "Candy", 1.00, 10, "B2"));
        
        // Display products
        machine.displayProducts();
        
        // Scenario 1: Successful purchase
        System.out.println("--- Scenario 1: Buy Coke ---");
        machine.insertMoney(2.00);      // State: IDLE -> HAS_MONEY
        machine.selectProduct("A1");     // State: HAS_MONEY -> DISPENSING -> IDLE
        // Output: Dispensing Coke, Returning change: $0.50
        
        // Scenario 2: Insufficient funds
        System.out.println("\n--- Scenario 2: Insufficient funds ---");
        machine.insertMoney(1.00);
        machine.selectProduct("B1");     // Chips costs $2.00
        // Output: Insufficient balance. Need $1.00 more.
        machine.insertMoney(1.00);
        machine.selectProduct("B1");     // Now enough
        
        // Scenario 3: Refund
        System.out.println("\n--- Scenario 3: Refund ---");
        machine.insertMoney(5.00);
        machine.refund();
        // Output: Refunded: $5.00
        
        // Scenario 4: Out of stock
        System.out.println("\n--- Scenario 4: Out of stock ---");
        // Assume Chips (B1) only had 1 left and we bought it
        machine.insertMoney(2.00);
        machine.selectProduct("B1");     // Out of stock
        // Output: Product Chips is out of stock.
    }
}
```

---

## ❓ Follow-up Questions & Answers

### Q1: Why use State pattern instead of if-else/switch statements?
**Answer:**
- **Open/Closed Principle**: Add new states without modifying existing code
- **Single Responsibility**: Each state handles its own behavior
- **Eliminates complex conditionals**: No giant switch statements
- **Easier testing**: Test each state independently
- **Clear state transitions**: Explicit setState() calls

```java
// BAD: Without State Pattern
void selectProduct(String slot) {
    if (state == IDLE) {
        // ... 20 lines
    } else if (state == HAS_MONEY) {
        // ... 30 lines
    } else if (state == DISPENSING) {
        // ... 15 lines
    }
    // Nightmare to maintain!
}

// GOOD: With State Pattern
void selectProduct(String slot) {
    currentState.selectProduct(this, slot);  // Clean delegation
}
```

### Q2: How would you handle concurrent access (multiple buttons pressed)?
**Answer:**
- Use **ReentrantLock** for thread safety (already implemented)
- Consider **optimistic locking** for distributed systems
- Use **atomic state transitions**
```java
public void insertMoney(double amount) {
    lock.lock();
    try {
        currentState.insertMoney(this, amount);
    } finally {
        lock.unlock();
    }
}
```

### Q3: How would you add a new payment method (e.g., card payment)?
**Answer:**
- Use **Strategy Pattern** for payment methods
- Combine with State Pattern
```java
interface PaymentStrategy {
    boolean processPayment(double amount);
    void refund(double amount);
}

class CashPayment implements PaymentStrategy { ... }
class CardPayment implements PaymentStrategy { ... }
class MobilePayment implements PaymentStrategy { ... }

class VendingMachine {
    private PaymentStrategy paymentStrategy;
    
    void setPaymentMethod(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }
}
```

### Q4: How would you handle exact change scenarios?
**Answer:**
```java
class ChangeDispenser {
    private Map<CoinType, Integer> coinInventory;
    
    List<Coin> calculateChange(double amount) {
        List<Coin> change = new ArrayList<>();
        double remaining = amount;
        
        // Greedy: Use largest coins first
        for (CoinType coin : CoinType.values()) {  // Sorted by value desc
            while (remaining >= coin.getValue() && coinInventory.get(coin) > 0) {
                change.add(new Coin(coin));
                remaining -= coin.getValue();
                coinInventory.put(coin, coinInventory.get(coin) - 1);
            }
        }
        
        if (remaining > 0.001) {  // Floating point tolerance
            throw new ExactChangeException("Cannot provide exact change");
        }
        
        return change;
    }
}
```

### Q5: How would you add admin features like viewing sales reports?
**Answer:**
```java
class VendingMachineAdmin {
    private final VendingMachine machine;
    
    // Sales report
    SalesReport generateReport(LocalDate from, LocalDate to) {
        List<Transaction> filtered = machine.getTransactions().stream()
            .filter(t -> t.timestamp.isAfter(from.atStartOfDay()))
            .filter(t -> t.timestamp.isBefore(to.plusDays(1).atStartOfDay()))
            .collect(Collectors.toList());
        
        return new SalesReport(filtered);
    }
    
    // Collect money
    double collectMoney() {
        double total = machine.getCashBox();
        machine.resetCashBox();
        return total;
    }
    
    // Inventory management
    void refillAll(Map<String, Integer> quantities) {
        for (var entry : quantities.entrySet()) {
            machine.refillProduct(entry.getKey(), entry.getValue());
        }
    }
}
```

### Q6: How would you implement a maintenance mode?
**Answer:**
```java
class MaintenanceState implements VendingMachineState {
    private final String reason;
    
    MaintenanceState(String reason) {
        this.reason = reason;
    }
    
    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        System.out.println("Machine under maintenance: " + reason);
    }
    
    @Override
    public void selectProduct(VendingMachine machine, String slot) {
        System.out.println("Machine under maintenance: " + reason);
    }
    
    // All operations blocked during maintenance
    
    // Only admin can exit maintenance mode
    public void exitMaintenance(VendingMachine machine, AdminCredentials creds) {
        if (authenticate(creds)) {
            machine.setState(new IdleState());
        }
    }
}
```

---

## 🔄 Alternative: Order/Workflow State Machine

The State pattern applies to many other domains:

```java
// Order Management Example
interface OrderState {
    void confirm(Order order);
    void ship(Order order);
    void deliver(Order order);
    void cancel(Order order);
}

class PendingState implements OrderState { ... }
class ConfirmedState implements OrderState { ... }
class ShippedState implements OrderState { ... }
class DeliveredState implements OrderState { ... }
class CancelledState implements OrderState { ... }

// Document Workflow Example
interface DocumentState {
    void submit(Document doc);
    void approve(Document doc);
    void reject(Document doc);
    void publish(Document doc);
}

class DraftState implements DocumentState { ... }
class ReviewState implements DocumentState { ... }
class ApprovedState implements DocumentState { ... }
class PublishedState implements DocumentState { ... }
```

---

## 💡 Key Interview Tips

1. **Draw the state diagram first** - Shows clear understanding
2. **Identify all states** - Don't miss edge cases like maintenance
3. **Define valid transitions** - Not all actions valid in all states
4. **Discuss thread safety** - Important for real-world scenarios
5. **Mention extensibility** - Easy to add new states/actions
6. **Salesforce context** - Case status, Opportunity stages, Approval processes

---

## 🔗 Related Patterns
- **Strategy Pattern**: For interchangeable algorithms (payment methods)
- **Singleton Pattern**: For machine instance management
- **Observer Pattern**: For notifications (stock alerts, sales events)
- **Command Pattern**: For undo/redo operations
- **Factory Pattern**: For creating different machine configurations
