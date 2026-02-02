/**
 * Represents a cache entry.
 * Each node stores key, value, and access frequency.
 */
class CacheNode {
    int key;
    int value;
    int frequency;
    CacheNode prev;
    CacheNode next;

    public CacheNode(int key, int value) {
        this.key = key;
        this.value = value;
        this.frequency = 1; // new node starts with frequency 1
    }
}

/**
 * Doubly linked list to store nodes of the same frequency.
 * Most recently used node is placed near the head.
 */
class DoublyLinkedList {
    CacheNode head;
    CacheNode tail;

    public DoublyLinkedList() {
        // Dummy head and tail to simplify insert/remove
        head = new CacheNode(-1, -1);
        tail = new CacheNode(-1, -1);
        head.next = tail;
        tail.prev = head;
    }
}

class LFUCache {

    // Maps key -> cache node
    HashMap<Integer, CacheNode> keyToNodeMap = new HashMap<>();

    // Maps frequency -> doubly linked list of nodes with that frequency
    HashMap<Integer, DoublyLinkedList> frequencyToListMap = new HashMap<>();

    int capacity;
    int minFrequency; // tracks minimum frequency in the cache

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.minFrequency = 0;
    }

    /**
     * Returns value associated with key if present.
     * Also updates the node's frequency.
     */
    public int get(int key) {
        if (!keyToNodeMap.containsKey(key)) {
            return -1;
        }

        CacheNode node = keyToNodeMap.get(key);
        updateFrequency(node);
        return node.value;
    }

    /**
     * Inserts or updates a key-value pair.
     * Evicts least frequently used node if capacity is full.
     */
    public void put(int key, int value) {
        if (capacity == 0) return;

        if (keyToNodeMap.containsKey(key)) {
            // Update existing node
            CacheNode node = keyToNodeMap.get(key);
            node.value = value;
            updateFrequency(node);
        } else {
            // Evict LFU node if cache is full
            if (keyToNodeMap.size() == capacity) {
                CacheNode nodeToRemove =
                        frequencyToListMap.get(minFrequency).tail.prev;

                keyToNodeMap.remove(nodeToRemove.key);
                removeNode(nodeToRemove);

                // Remove frequency list if it becomes empty
                if (frequencyToListMap.get(minFrequency).head.next ==
                    frequencyToListMap.get(minFrequency).tail) {
                    frequencyToListMap.remove(minFrequency);
                }
            }

            // Insert new node with frequency 1
            CacheNode newNode = new CacheNode(key, value);
            minFrequency = 1;
            keyToNodeMap.put(key, newNode);
            addNodeToFrequencyList(newNode);
        }
    }

    /**
     * Updates frequency of a node and moves it
     * to the appropriate frequency list.
     */
    public void updateFrequency(CacheNode node) {
        int currentFreq = node.frequency;

        // Remove node from current frequency list
        removeNode(node);
        node.frequency++;

        // If current list becomes empty, remove it
        if (frequencyToListMap.get(currentFreq).head.next ==
            frequencyToListMap.get(currentFreq).tail) {

            frequencyToListMap.remove(currentFreq);
            if (minFrequency == currentFreq) {
                minFrequency++;
            }
        }

        // Add node to new frequency list
        addNodeToFrequencyList(node);
    }

    /**
     * Removes a node from its doubly linked list.
     */
    public void removeNode(CacheNode node) {
        CacheNode prevNode = node.prev;
        CacheNode nextNode = node.next;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;
    }

    /**
     * Adds a node to the front (most recently used)
     * of its frequency list.
     */
    public void addNodeToFrequencyList(CacheNode node) {
        int freq = node.frequency;

        if (!frequencyToListMap.containsKey(freq)) {
            frequencyToListMap.put(freq, new DoublyLinkedList());
        }

        DoublyLinkedList list = frequencyToListMap.get(freq);
        CacheNode nextNode = list.head.next;

        list.head.next = node;
        node.prev = list.head;
        node.next = nextNode;
        nextNode.prev = node;
    }
}
