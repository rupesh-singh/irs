class MyConcurrentHashMap<K, V> {

    private static class Node<K, V> {
        final K key;
        V value;
        Node<K, V> next;

        Node(K key, V value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity = 16;
    private final Node<K, V>[] buckets;
    private final Object[] locks; // one lock per bucket

    @SuppressWarnings("unchecked")
    public MyConcurrentHashMap() {
        buckets = new Node[capacity];
        locks = new Object[capacity];
        for (int i = 0; i < capacity; i++) {
            locks[i] = new Object();
        }
    }

    private int getIndex(K key) {
        return Math.abs(key.hashCode()) % capacity;
    }

    // PUT
    public void put(K key, V value) {
        int index = getIndex(key);

        synchronized (locks[index]) {
            Node<K, V> head = buckets[index];
            Node<K, V> curr = head;

            while (curr != null) {
                if (curr.key.equals(key)) {
                    curr.value = value;
                    return;
                }
                curr = curr.next;
            }

            Node<K, V> newNode = new Node<>(key, value);
            newNode.next = head;
            buckets[index] = newNode;
        }
    }

    // GET
    public V get(K key) {
        int index = getIndex(key);

        synchronized (locks[index]) {
            Node<K, V> curr = buckets[index];
            while (curr != null) {
                if (curr.key.equals(key)) {
                    return curr.value;
                }
                curr = curr.next;
            }
        }
        return null;
    }

    // REMOVE
    public void remove(K key) {
        int index = getIndex(key);

        synchronized (locks[index]) {
            Node<K, V> curr = buckets[index];
            Node<K, V> prev = null;

            while (curr != null) {
                if (curr.key.equals(key)) {
                    if (prev == null) {
                        buckets[index] = curr.next;
                    } else {
                        prev.next = curr.next;
                    }
                    return;
                }
                prev = curr;
                curr = curr.next;
            }
        }
    }
}