import java.util.HashMap;
import java.util.Map;

class CacheStrategy {

    public static void main(String[] args) {
        System.out.println("Demoing different caching strategies");

        LRUCache<String> cache = new LRUCache<>(2);

        cache.put("A","str1");
        cache.put("B","str2");
        System.out.println("Value A: "+cache.get("A"));
        cache.put("C","str3");
        System.out.println("Value B: "+cache.get("B"));
        cache.put("D","str4");
        System.out.println("Value A: "+cache.get("A"));
        System.out.println("Value C: "+cache.get("C"));
        System.out.println("Value D: "+cache.get("D"));

    }
}

interface Cache<T> {
    void put(T key, T value);
    T get(T key);
}

class LRUCache<T> implements Cache<T>{

    private static class NodeEntry<T>{
        T key;
        T value;
        NodeEntry<T> prev;
        NodeEntry<T> next;

        public NodeEntry(T key, T value){
            this.key = key;
            this.value = value;
            this.prev = null;
            this.next = null;
        }
    }

    private final Map<T,NodeEntry<T>> cache;
    private int capacity = 0;
    private NodeEntry<T> head = null;
    private NodeEntry<T> tail = null;

    public LRUCache(int capacity){
        this.capacity = capacity;
        cache = new HashMap<>();
        this.head = new NodeEntry(-1,-1);
        this.tail = new NodeEntry(-1,-1);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    @Override
    public void put(T key, T value) {

        if(cache.containsKey(key)){
            NodeEntry<T> n = cache.get(key);
            remove(n);
        }

        NodeEntry<T> newNode = new NodeEntry<T>(key,value);
        cache.put(key,newNode);
        addNode(newNode);

        if(cache.size() > capacity){
            NodeEntry<T> nodeToDelete = tail.prev;
            remove(nodeToDelete);
            cache.remove(nodeToDelete.key);
        }

    }

    @Override
    public T get(T key) {
        if(!cache.containsKey(key)){
            return null;
        }

        NodeEntry<T> node = cache.get(key);
        remove(node);
        addNode(node);
        return (T)node.value;
    }

    private void addNode(NodeEntry<T> node){
        NodeEntry<T> curr = head.next;
        node.next = curr;
        curr.prev = node;
        head.next = node;
        node.prev = head;
    }

    private void remove(NodeEntry<T> node){
        NodeEntry<T> next = node.next;
        NodeEntry<T> prev = node.prev;
        prev.next = next;
        next.prev = prev;
    }

}
