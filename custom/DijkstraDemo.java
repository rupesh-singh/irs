class Node {
    int v;
    int d;
    public Node(int v, int d){
        this.v = v;
        this.d = d;
    }
}

class Solution {
    public int[] dijkstra(int V, int[][] edges, int src) {
        // code here
        List<List<Node>> adj = new ArrayList<>();
        
        for(int i=0;i<V;i++)
        {
            adj.add(new ArrayList<>());
        }
        
        for(int[] edge: edges){
            adj.get(edge[0]).add(new Node(edge[1],edge[2]));
            adj.get(edge[1]).add(new Node(edge[0],edge[2]));
        }
        
        // sort based on distance
        PriorityQueue<Node> pq = new PriorityQueue<>((a,b) -> a.d - b.d);
        
        pq.offer(new Node(src,0));
        
        int[] dist = new int[V];
        dist[src] = 0;
        
        for(int i=0;i<V;i++){
            if(i != src)
                dist[i] = Integer.MAX_VALUE;
        }
        
        while(!pq.isEmpty()){
            Node temp = pq.poll();
            
            // all the nodes which are traversed from src
            List<Node> list = adj.get(temp.v);
            for(Node n: list){
                if(dist[n.v] > temp.d + n.d){
                    dist[n.v] = temp.d + n.d;
                    pq.add(new Node(n.v,temp.d + n.d));
                }
            }
            
        }
        
        return dist;
        
        
    }
}
