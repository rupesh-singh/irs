# 🕸️ Graphs — Interview Revision Cheatsheet

> **Compiled & expanded from personal handwritten notes**
> Covers traversals, cycle detection, topological sort, shortest paths, MST, and advanced (SCC, bridges, articulation points).

---

## 📑 Table of Contents
1. [Graph Representation](#1-graph-representation)
2. [BFS & DFS](#2-bfs--dfs)
3. [Connected Components & Grid Problems](#3-connected-components--grid-problems)
4. [Cycle Detection](#4-cycle-detection)
5. [Bipartite Graph](#5-bipartite-graph)
6. [Topological Sort](#6-topological-sort)
7. [Shortest Path Algorithms](#7-shortest-path-algorithms)
8. [Minimum Spanning Tree (MST)](#8-minimum-spanning-tree-mst)
9. [Disjoint Set Union (DSU)](#9-disjoint-set-union-dsu)
10. [Strongly Connected Components (Kosaraju)](#10-strongly-connected-components-kosaraju)
11. [Bridges & Articulation Points (Tarjan)](#11-bridges--articulation-points-tarjan)
12. [Algorithm Selection Guide](#12-algorithm-selection-guide)
13. [Complexity Cheat Table](#13-complexity-cheat-table)

---

## 1. Graph Representation

**The starting point for almost every problem:** build an adjacency list, then run BFS/DFS.

```java
// Adjacency list for n nodes
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

// Undirected edge u-v
adj.get(u).add(v);
adj.get(v).add(u);

// Directed edge u->v
adj.get(u).add(v);

// Weighted: store int[]{neighbor, weight} or use a Pair/record
List<List<int[]>> wadj = new ArrayList<>();
wadj.get(u).add(new int[]{v, w});
```

| Representation | Space | Best for |
|----------------|-------|----------|
| Adjacency List | O(V + E) | Sparse graphs (most problems) |
| Adjacency Matrix | O(V²) | Dense graphs, Floyd-Warshall, O(1) edge lookup |
| Edge List | O(E) | Kruskal, Bellman-Ford |

---

## 2. BFS & DFS

### BFS (level-order, uses Queue)
```java
void bfs(int start, List<List<Integer>> adj, boolean[] vis) {
    Queue<Integer> q = new LinkedList<>();
    q.add(start); vis[start] = true;
    while (!q.isEmpty()) {
        int node = q.poll();
        for (int nei : adj.get(node)) {
            if (!vis[nei]) { vis[nei] = true; q.add(nei); }
        }
    }
}
```

### DFS (uses recursion / explicit stack)
```java
void dfs(int node, List<List<Integer>> adj, boolean[] vis) {
    vis[node] = true;
    for (int nei : adj.get(node)) {
        if (!vis[nei]) dfs(nei, adj, vis);
    }
}
```

> 🔑 **Rule of thumb:** BFS → shortest path in *unweighted* graphs / level-by-level. DFS → path existence, cycle detection, topo sort, components.

---

## 3. Connected Components & Grid Problems

### 1️⃣ Number of Provinces (Connected Components)
> Count how many times you *start* a fresh DFS/BFS — each start = one disconnected component.
```java
int provinces = 0;
for (int i = 0; i < n; i++) {
    if (!vis[i]) { dfs(i, adj, vis); provinces++; }
}
```
Each DFS marks its whole component visited, so an unvisited node means a new component.

### 2️⃣ Rotten Oranges (Multi-source BFS)
> Push **all** rotten oranges into the queue at time 0, do BFS level by level. Answer = max time to rot everything.
```java
// Multi-source BFS: add every source first, then expand simultaneously
Queue<int[]> q = new LinkedList<>(); // {row, col, time}
// ...add all rotten cells, track fresh count
// each minute = one BFS level; return -1 if fresh remain
```
**Pattern:** "spread / minimum time to fill" → multi-source BFS.

### 4️⃣ Distance of Nearest Cell with 1 (0/1 Matrix)
> Multi-source BFS from all `1`s simultaneously; first time you reach a `0` is its nearest distance.

### 5️⃣ Surrounded Regions / 6️⃣ Number of Enclaves
> **Trick:** anything connected to the **boundary** is safe. DFS/BFS from all boundary cells, mark them; the unmarked `1`s are surrounded (enclaves = count of `1`s not connected to boundary).

> 🧠 **Grid traversal directions:**
> ```java
> int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}}; // up, down, left, right
> ```

---

## 4. Cycle Detection

### 3️⃣ Undirected Graph — track parent
> A cycle exists if you reach a visited node that is **not** the node you came from.

**BFS:** store `{node, parent}` in queue; if a visited neighbor ≠ parent → cycle.
**DFS:**
```java
boolean dfsCycle(int node, int parent, List<List<Integer>> adj, boolean[] vis) {
    vis[node] = true;
    for (int nei : adj.get(node)) {
        if (!vis[nei]) {
            if (dfsCycle(nei, node, adj, vis)) return true;
        } else if (nei != parent) {
            return true; // visited & not parent → cycle
        }
    }
    return false;
}
```

### 8️⃣ Directed Graph — track path (recursion stack)
> Just `visited` is **not enough**. Also keep `pathVis` that is **unset on backtrack**. A cycle exists if you hit a node already in the current DFS path.
```java
boolean dfsCycle(int node, List<List<Integer>> adj, boolean[] vis, boolean[] pathVis) {
    vis[node] = true; pathVis[node] = true;
    for (int nei : adj.get(node)) {
        if (!vis[nei]) {
            if (dfsCycle(nei, adj, vis, pathVis)) return true;
        } else if (pathVis[nei]) {
            return true; // node in current path → cycle
        }
    }
    pathVis[node] = false; // backtrack: leaving this path
    return false;
}
```
> ✅ Alternative for directed cycle: **Kahn's algorithm** — if topo sort can't include all nodes, there's a cycle.

---

## 5. Bipartite Graph

### 7️⃣ Two-Coloring
> Color the graph with 2 colors so **no two adjacent nodes share a color**. If you ever must give an adjacent node the same color → not bipartite.
```java
boolean bfsBipartite(int start, List<List<Integer>> adj, int[] color) {
    Queue<Integer> q = new LinkedList<>();
    q.add(start); color[start] = 0;
    while (!q.isEmpty()) {
        int node = q.poll();
        for (int nei : adj.get(node)) {
            if (color[nei] == -1) {          // uncolored
                color[nei] = 1 - color[node]; // opposite color
                q.add(nei);
            } else if (color[nei] == color[node]) {
                return false;                 // same color → not bipartite
            }
        }
    }
    return true;
}
```
> 🧠 A graph is bipartite **iff** it has no odd-length cycle.

---

## 6. Topological Sort

> **Only valid for a DAG** (Directed Acyclic Graph). Linear ordering where for every edge u→v, u comes before v.

### 9️⃣ DFS-based (use a stack)
> DFS, and **after** exploring all children, push node onto a stack. Reverse of finish order = topo order.
```java
void topoDfs(int node, List<List<Integer>> adj, boolean[] vis, Deque<Integer> st) {
    vis[node] = true;
    for (int nei : adj.get(node)) if (!vis[nei]) topoDfs(nei, adj, vis, st);
    st.push(node); // push after children done
}
// pop stack → topological order
```

### 🔟 Kahn's Algorithm (BFS-based, using indegree)
> Build **indegree** (count of incoming edges). Start with indegree-0 nodes in a queue. Remove a node → decrement neighbors' indegree → add new zeros.
```java
int[] indeg = new int[n];
for (int u = 0; u < n; u++) for (int v : adj.get(u)) indeg[v]++;

Queue<Integer> q = new LinkedList<>();
for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);

List<Integer> topo = new ArrayList<>();
while (!q.isEmpty()) {
    int node = q.poll();
    topo.add(node);
    for (int nei : adj.get(node)) {
        if (--indeg[nei] == 0) q.add(nei);
    }
}
// if topo.size() != n → graph has a cycle (not a DAG)
```

### Applications
- **1️⃣1️⃣ Course Schedule I/II** → can you finish all courses? (cycle check) / return valid order (topo order).
- **1️⃣2️⃣ Eventual Safe Nodes** → reverse the edges, run Kahn's; nodes that end up in the topo order (terminal-reaching) are safe.
- **1️⃣3️⃣ Alien Dictionary** → derive edges from adjacent words' first differing char, then topo sort the alphabet.

---

## 7. Shortest Path Algorithms

### 1️⃣4️⃣ Word Ladder I & II → plain **BFS** (each transformation = 1 edge, unweighted).

### 1️⃣5️⃣ Dijkstra's Algorithm  `O(E log V)`
> Single-source shortest path for **non-negative** weights. Min-heap (priority queue) + distance array.
```java
int[] dijkstra(int src, int n, List<List<int[]>> adj) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    // PQ holds {distance, node}, ordered by distance
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.add(new int[]{0, src});
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], node = top[1];
        if (d > dist[node]) continue;          // stale entry
        for (int[] e : adj.get(node)) {
            int nei = e[0], w = e[1];
            if (dist[node] + w < dist[nei]) {
                dist[nei] = dist[node] + w;
                pq.add(new int[]{dist[nei], nei});
            }
        }
    }
    return dist;
}
```
> ⚠️ **Fails with negative weights** — use Bellman-Ford instead.

### 1️⃣6️⃣ Bellman-Ford  `O(V × E)`
> Single-source shortest path that **handles negative edges** and **detects negative cycles**. Relax all edges `V-1` times.
```java
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;

for (int i = 1; i <= n - 1; i++) {          // relax V-1 times
    for (int[] edge : edges) {              // edge = {u, v, w}
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
        }
    }
}
// One more pass: if any edge still relaxes → negative cycle exists
for (int[] edge : edges) {
    int u = edge[0], v = edge[1], w = edge[2];
    if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
        // negative weight cycle detected
    }
}
```
> 🧠 Why `V-1`? The longest simple shortest path has at most `V-1` edges. A reduction on the `V`-th pass ⇒ negative cycle.

### 1️⃣7️⃣ Floyd-Warshall  `O(V³)`
> **All-pairs** shortest path (multi-source). Uses an adjacency **matrix**. Try every node `k` as an intermediate.
```java
// dist[i][j] initialized with edge weights, INF if none, 0 on diagonal
for (int k = 0; k < n; k++)
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (dist[i][k] != INF && dist[k][j] != INF)
                dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);

// Negative cycle if any dist[i][i] < 0
```
> 🔑 Outer loop is **k (the intermediate)** — getting this order wrong is the classic bug.

---

## 8. Minimum Spanning Tree (MST)

> A tree connecting all `N` nodes with exactly `N-1` edges and **minimum total weight**, where all nodes are reachable from each other.

### 1️⃣9️⃣ Prim's Algorithm `O(E log V)` (grow from a node)
> Similar to Dijkstra. Min-heap of `{weight, node}`; repeatedly pull the cheapest edge to an unvisited node and add it to the MST.
```java
int primMST(int n, List<List<int[]>> adj) {
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.add(new int[]{0, 0}); // {weight, node}
    int total = 0;
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int w = top[0], node = top[1];
        if (inMST[node]) continue;     // skip already-added
        inMST[node] = true;
        total += w;
        for (int[] e : adj.get(node))
            if (!inMST[e[0]]) pq.add(new int[]{e[1], e[0]});
    }
    return total;
}
```

### 2️⃣1️⃣ Kruskal's Algorithm `O(E log E)` (pick cheapest edges + DSU)
> Sort all edges by weight, treat each node as independent, and join them one by one with **DSU** — skip an edge if it would form a cycle. Done when all are connected.
```java
edges.sort((a, b) -> a[2] - b[2]); // sort by weight
DSU dsu = new DSU(n);
int total = 0;
for (int[] e : edges) {            // e = {u, v, w}
    if (dsu.find(e[0]) != dsu.find(e[1])) { // different components → no cycle
        dsu.union(e[0], e[1]);
        total += e[2];
    }
}
```

| | Prim | Kruskal |
|--|------|---------|
| Approach | Grow tree from a vertex | Add globally cheapest edges |
| Structure | Min-heap | Sorted edges + DSU |
| Best for | Dense graphs | Sparse graphs |

---

## 9. Disjoint Set Union (DSU)

### 2️⃣0️⃣ Union-Find with path compression + union by rank/size → near `O(1)` (α) per op.
```java
class DSU {
    int[] parent, rank;
    DSU(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {                       // path compression
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    void union(int a, int b) {              // union by rank
        int ra = find(a), rb = find(b);
        if (ra == rb) return;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
    }
}
```
> 🔑 Use DSU for: Kruskal's MST, "number of connected components," cycle detection in undirected graphs, "accounts merge," "redundant connection."

---

## 10. Strongly Connected Components (Kosaraju)

### 2️⃣2️⃣ Kosaraju's Algorithm — **directed graphs only**
> An SCC is a maximal set where every node is reachable from every other node.

**Three steps:**
1. DFS on the original graph, push nodes onto a stack **in order of finish time**.
2. **Reverse** all edges (transpose the graph).
3. Pop nodes from the stack; for each unvisited node, DFS on the reversed graph — **each DFS call = one SCC**.

```java
// Step 1: order by finish time
void dfs1(int node, ...) { vis[node]=true; for nei dfs1(nei); st.push(node); }
// Step 2: build reversed adjacency list
// Step 3: count SCCs
int scc = 0;
while (!st.isEmpty()) {
    int node = st.pop();
    if (!vis2[node]) { dfs2(node, revAdj, vis2); scc++; }
}
```
> Number of DFS calls in step 3 = number of SCCs. Time: `O(V + E)`.

---

## 11. Bridges & Articulation Points (Tarjan)

### 2️⃣3️⃣ Bridges in a Graph — Tarjan's Algorithm
> A **bridge** is an edge whose removal increases the number of components. Uses `disc[]` (discovery time) and `low[]` (lowest reachable discovery time).

```java
int timer = 1;
int[] disc, low;           // disc = insertion time, low = lowest reachable
boolean[] vis;

void dfs(int node, int parent, List<List<Integer>> adj, List<List<Integer>> bridges) {
    vis[node] = true;
    disc[node] = low[node] = timer++;
    for (int nei : adj.get(node)) {
        if (nei == parent) continue;
        if (!vis[nei]) {
            dfs(nei, node, adj, bridges);
            low[node] = Math.min(low[node], low[nei]);
            // bridge condition: child can't reach node or earlier
            if (low[nei] > disc[node]) {
                bridges.add(Arrays.asList(node, nei));
            }
        } else {
            low[node] = Math.min(low[node], disc[nei]); // back edge
        }
    }
}
```
> 🔑 **Bridge:** `low[child] > disc[node]` (strictly greater — child has no back edge to node or above).

### Articulation Points (cut vertices) — same machinery
> A vertex whose removal increases components.
> - **Non-root:** articulation if some child has `low[child] >= disc[node]`.
> - **Root:** articulation if it has **more than one** DFS child.

```java
// inside the !vis[nei] branch, with a child counter for the root:
if (low[nei] >= disc[node] && parent != -1) isAP[node] = true;
// and after the loop: if (parent == -1 && children > 1) isAP[node] = true;
```
> Note `>=` for articulation points vs `>` for bridges.

---

## 12. Algorithm Selection Guide

```
Need shortest path?
├─ Unweighted graph ............... BFS
├─ Weighted, non-negative ......... Dijkstra (PQ)
├─ Has negative edges ............. Bellman-Ford
├─ Need ALL pairs ................. Floyd-Warshall
└─ DAG only ....................... Topo sort + relax

Need ordering / dependencies?
├─ Linear order of DAG ............ Topological sort (Kahn / DFS)
└─ Detect impossible order ........ Cycle ⇒ no valid topo

Need connectivity?
├─ Count components (undirected) .. DFS/BFS or DSU
├─ Dynamic union/find ............. DSU
├─ Strongly connected (directed) .. Kosaraju / Tarjan SCC
└─ Critical edges/vertices ........ Tarjan bridges / articulation

Need minimum cost to connect all?
└─ MST ............................ Prim (dense) / Kruskal (sparse)

Cycle detection?
├─ Undirected ..................... DFS+parent / DSU
└─ Directed ....................... DFS+pathVis / Kahn
```

---

## 13. Complexity Cheat Table

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| BFS / DFS | O(V + E) | O(V) | Traversal baseline |
| Cycle detection | O(V + E) | O(V) | DFS or DSU |
| Topological Sort | O(V + E) | O(V) | DAG only |
| Dijkstra | O(E log V) | O(V) | No negative weights |
| Bellman-Ford | O(V · E) | O(V) | Handles −ve, detects −ve cycle |
| Floyd-Warshall | O(V³) | O(V²) | All-pairs, matrix |
| Prim's MST | O(E log V) | O(V) | Min-heap |
| Kruskal's MST | O(E log E) | O(V) | Sort + DSU |
| DSU op (find/union) | ~O(α(N)) ≈ O(1) | O(V) | With compression + rank |
| Kosaraju SCC | O(V + E) | O(V) | Directed, 2 DFS passes |
| Tarjan bridges/AP | O(V + E) | O(V) | disc[] + low[] |

---

## 🎯 Quick Revision Triggers (notes recap)
- **"Number of islands/provinces/components"** → DFS/BFS count of fresh starts, or DSU.
- **"Minimum time to spread"** → multi-source BFS.
- **"Connected to boundary is safe"** → border DFS (enclaves, surrounded regions).
- **"Two groups / no same neighbor"** → bipartite 2-coloring.
- **"Order with prerequisites"** → topological sort.
- **"Cheapest path, positive weights"** → Dijkstra.
- **"Negative weights / detect negative cycle"** → Bellman-Ford / Floyd-Warshall.
- **"Connect everything cheaply"** → MST (Prim/Kruskal).
- **"Critical connection"** → Tarjan bridges.

---

## 14. ⚠️ Common Issues — Edge Creation (the part everyone trips on)

This is the #1 source of bugs. The fix is to **slow down and ask two questions every time** before you write a single `.add()`:

> **Q1. Is the edge directed or undirected?**
> **Q2. What does the input format actually give me?**

Answer those two and edge creation becomes mechanical.

### 🧠 The core mental model

Think of the adjacency list as a **"who can I go to next?"** map.
`adj.get(u)` answers: *"standing on u, where am I allowed to step?"*

- **Undirected** = friendship. If A is B's friend, B is A's friend → **add both ways**.
- **Directed** = one-way street / "depends on". If A → B, you can go A to B but **not** back → **add one way only**.

```java
// UNDIRECTED — always two lines (friendship goes both ways)
adj.get(u).add(v);
adj.get(v).add(u);

// DIRECTED — one line (one-way street)
adj.get(u).add(v);
```
> 💡 **Memory hook:** *Undirected = both, Directed = one.* If you ever write two lines for a directed graph, you've created a fake reverse edge.

---

### 🔑 Topological Sort — the direction that confuses everyone

Topo sort questions are almost always phrased as **"B depends on A"** / **"do A before B"** / **"A is a prerequisite for B"**. The trap is figuring out **which way the arrow points**.

**Golden rule:** the arrow points from **prerequisite → dependent** (*"do me first, then you"*).

So for *"to do B you must first finish A"*:
```
A ──────▶ B
(first)   (after)
```
```java
// "A before B"  →  edge A → B
adj.get(A).add(B);
indegree[B]++;     // B has one more thing it must wait for
```

> 💡 **Memory hook:** **indegree = "how many things am I still waiting on?"**
> A node with **indegree 0 = nothing left to wait for = safe to do now** → goes into the queue first.

### The Course Schedule trap (read this twice)

LeetCode gives prerequisites as `[a, b]` meaning **"to take course `a`, you must first take `b`"**.
So `b` is the prerequisite → the edge is **`b → a`**, *not* `a → b`.

```java
// input: prerequisites[i] = [a, b]  means  b must come before a
for (int[] p : prerequisites) {
    int a = p[0], b = p[1];
    adj.get(b).add(a);   // b → a   (prerequisite → dependent)
    indegree[a]++;       // a waits on one more course
}
```
> ⚠️ If your topo sort returns reversed or "impossible" on a valid input, **you almost certainly flipped this edge.** Re-read the problem's `[a, b]` meaning — it's the single most common bug.

---

### 🧩 Match the edge code to the input format

| Input looks like | Meaning | What to write |
|------------------|---------|---------------|
| `edges[][] = {{u,v}}`, undirected | friendship | `adj.get(u).add(v); adj.get(v).add(u);` |
| `edges[][] = {{u,v}}`, directed | u → v | `adj.get(u).add(v);` |
| `"u must come before v"` | prereq | `adj.get(u).add(v); indegree[v]++;` |
| `prerequisites = {{a,b}}` (LC style) | b before a | `adj.get(b).add(a); indegree[a]++;` |
| weighted `{u,v,w}` | edge + cost | `adj.get(u).add(new int[]{v, w});` (+reverse if undirected) |
| grid cell `(r,c)` | implicit edges | 4 neighbors via `dirs[][]`, no explicit list |

---

### ✅ 30-second pre-flight checklist before you code edges

1. **Directed or undirected?** → one `.add()` or two.
2. **Topo sort?** → arrow = *prerequisite → dependent*, and bump `indegree[dependent]++`.
3. **Re-read the input pair's meaning** — is it `[a,b] = a→b` or `[a,b] = b→a`? Don't assume.
4. **Weighted?** → store `int[]{neighbor, weight}`, and add the reverse too if undirected.
5. **Grid?** → don't build a list; generate neighbors on the fly with the `dirs` array.

> 🎯 **One-liner to remember it all:**
> *"Undirected adds both, directed adds one, and in topo sort the arrow flows from the thing-you-do-first to the thing-that-waits."*

---

_Happy revising! Build the adjacency list first — half the battle is just modeling the problem as a graph._ 🚀

