import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentSkipListMap;

import static java.util.Objects.hash;

class Server {
    private final String serverId;
    Map<String,String> map;
    private final String IpAddress;

    public Server(String serverId, String IpAddress) {
        this.serverId = serverId;
        this.IpAddress = IpAddress;
        this.map = new HashMap<String,String>();
    }

    public void put(String key, String value) {
        map.put(key, value);
    }

    public String get(String key) {
        return map.getOrDefault(key, "");
    }


    public String getServerId() {
        // each server will be assigned a random server id,
        // we'll basically hash this server id to get the position of our node in the consistent hash ring
        return serverId;
    }

    @Override
    public String toString() {
        return String.format("server-id: %s, with Ip: %s & server-hash: %s", serverId, IpAddress, serverId.hashCode());
    }

}

class ConsistentHashing {
    int numberOfReplicas;
    private final ConcurrentSkipListMap<Integer, Server> hashRing = new ConcurrentSkipListMap<>();

    public ConsistentHashing(int numberOfReplicas, Collection<Server> servers){
        this.numberOfReplicas = numberOfReplicas;
        for (Server server: servers){
            addServers(server);
        }
    }

    public void addServers(Server server){
        for(int i=0;i<numberOfReplicas;i++){
            int hash = hash(server.getServerId() + i);
            hashRing.put(hash,server);
        }
    }

    public void removeServers(Server server){
        for(int i=0;i<numberOfReplicas;i++){
            int hash = hash(server.getServerId() + i);
            hashRing.remove(hash,server);
        }
    }

    public List<Server> getServerForKey(String key, int replicas){
        if(hashRing.isEmpty()){
            return Collections.emptyList();
        }

        int hash = hash(key);
        List<Server> server = new ArrayList<>();
        NavigableMap<Integer,Server> tailMap = hashRing.tailMap(hash, true);

        for(Server serverNodes: tailMap.values()){
            if(!server.contains(serverNodes)){
                server.add(serverNodes);
            }
            if(server.size() == replicas){
                break;
            }
        }

        if(server.size() < replicas){
            for(Server s: hashRing.values()){
                if(!server.contains(s)){
                    server.add(s);
                }
                if(server.size() == replicas){
                    break;
                }
            }
        }

        return server;
    }

    public int hash(String key){
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(key.getBytes(StandardCharsets.UTF_8));
            return ((digest[0] & 0xFF) << 24) | ((digest[1] & 0xFF) << 16) | ((digest[2] & 0xFF) << 8) | (digest[3] & 0xFF);
        }
        catch (Exception e){
            throw new RuntimeException("Hashing Error", e);
        }
    }

}


public class ConsistentHashingDemo {

    public static void main(String[] args) {
        List<Server> servers = new ArrayList<>();

        Server server1 = new Server("Server A","123.123.234");
        Server server2 = new Server("Server B","535.123.234");
        Server server3 = new Server("Server C","123.678.234");

        servers.add(server1);
        servers.add(server2);
        servers.add(server3);

        ConsistentHashing consistentHashing = new ConsistentHashing(2,servers);

        String key = "my-data-key";
        List<Server> responsibleNodes = consistentHashing.getServerForKey(key, 2);


        for(Server nodes: responsibleNodes){
            System.out.println(nodes);
        }


    }
}
