import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

class UnionFind {
    int[] parent;
    int[] size;
    int count;
    int time;
    public UnionFind(int node){
        parent = new int[node];
        size = new int[node];
        count = node;
        time =0;
        for(int i=0;i<node;i++){
            parent[i] = i;
            size[i] = i;
        }
    }

    public int findParent(int a){
        if(parent[a] == a)
            return a;

        parent[a] = findParent(parent[a]);
        return parent[a];
    }

    public void union(int a, int b, int time){
        if(count == 1)
            return;

        int parentA = findParent(a);
        int parentB = findParent(b);

        if(parentA == parentB)
                return;

        if(size[parentA] > size[parentB]){
            parent[parentB] = parentA;
            size[parentA] = size[parentA] + size[parentB];
        }
        else if(size[parentB] > size[parentA]){
            parent[parentA] = parentB;
            size[parentB] = size[parentB] + size[parentA];
        }
        else {
            parent[parentB] = parentA;
            size[parentA] = size[parentA] + size[parentB];
        }
        count--;
        this.time = time;
    }
}

class UnionFindDemo {
    public static void main(String[] args){
        int N = 6;
        List<int[]> arr
                = Arrays.asList(new int[][] { { 0, 1, 4 },
                { 3, 4, 5 },
                { 2, 3, 14 },
                { 1, 5, 24 },
                { 2, 4, 12 },
                { 0, 3, 42 },
                { 1, 2, 41 },
                { 4, 5, 11 } });

        findTime(N,arr);

    }

    public static void findTime(int n, List<int[]> arr){
        arr.sort(Comparator.comparingInt(a -> a[2]));
        UnionFind unionFind = new UnionFind(n);

        for(int i=0;i<arr.size();i++){
            int[] temp = arr.get(i);
            if(unionFind.count == 1) {
                System.out.println("Time needed: " + unionFind.time);
                break;
            }
            unionFind.union(temp[0],temp[1],temp[2]);
        }

        System.out.println("Completed");

    }
}
