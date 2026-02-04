# 🚀 Interview Patterns & Techniques Quick Reference

> **Quick revision guide compiled from 150+ coding problems**  
> Last updated: February 2026

---

## 📑 Table of Contents
1. [Arrays & Hashing](#1-arrays--hashing)
2. [Two Pointers](#2-two-pointers)
3. [Sliding Window](#3-sliding-window)
4. [Stack Patterns](#4-stack-patterns)
5. [Binary Search](#5-binary-search)
6. [Linked List](#6-linked-list)
7. [Trees](#7-trees)
8. [Graphs](#8-graphs)
9. [Dynamic Programming](#9-dynamic-programming)
10. [Heap/Priority Queue](#10-heappriority-queue)
11. [Intervals](#11-intervals)
12. [Backtracking](#12-backtracking)
13. [Greedy](#13-greedy)
14. [Trie](#14-trie)
15. [Union Find](#15-union-find)

---

## 1. Arrays & Hashing

### 🔑 Key Patterns

#### **Boyer-Moore Voting Algorithm**
> Find majority element (appears > n/2 times)
```java
int count = 1, candidate = nums[0];
for(int i = 1; i < n; i++) {
    if(nums[i] != candidate) {
        count--;
        if(count == 0) { candidate = nums[i]; count = 1; }
    } else count++;
}
return candidate;
```

#### **Prefix Product (No Division)**
> Product of array except self
```java
// Left pass: prefix[i] = product of all elements before i
// Right pass: multiply by suffix product
int left = 1, right = 1;
for(int i = 0; i < n; i++) { output[i] = left; left *= nums[i]; }
for(int i = n-2; i >= 0; i--) { right *= nums[i+1]; output[i] *= right; }
```

#### **Prefix Sum with HashMap**
> Find subarray sum equals K
```java
map.put(0, 1);  // Base case: empty subarray
for(int n : nums) {
    total += n;
    if(map.containsKey(total - k)) count += map.get(total - k);
    map.put(total, map.getOrDefault(total, 0) + 1);
}
```

#### **Longest Consecutive Sequence**
> O(n) using HashSet
```java
Set<Integer> set = new HashSet<>(nums);
for(int n : set) {
    if(!set.contains(n - 1)) {  // Only start from sequence beginning
        int streak = 1;
        while(set.contains(n + streak)) streak++;
        max = Math.max(max, streak);
    }
}
```

#### **Contiguous Array (Equal 0s and 1s)**
> Treat 0 as -1, find subarray with sum = 0
```java
map.put(0, -1);  // count -> first index
for(int i = 0; i < n; i++) {
    count += (nums[i] == 0) ? -1 : 1;
    if(map.containsKey(count)) ans = Math.max(ans, i - map.get(count));
    else map.put(count, i);
}
```

#### **Negative Marking (Find Duplicate)**
> Use array indices as markers
```java
for(int num : nums) {
    int idx = Math.abs(num) - 1;
    if(nums[idx] < 0) return Math.abs(num);  // Already visited
    nums[idx] *= -1;  // Mark as visited
}
```

#### **Cyclic Rotation**
> Rotate array by k positions in O(1) space
```java
for(int curr = 0; count < n; curr++) {
    int startIdx = curr, prevVal = nums[curr];
    do {
        int nextIdx = (currIdx + k) % n;
        int temp = nums[nextIdx];
        nums[nextIdx] = prevVal;
        prevVal = temp;
        currIdx = nextIdx;
        count++;
    } while(startIdx != currIdx);
}
```

---

## 2. Two Pointers

### 🔑 Key Patterns

#### **3Sum Pattern**
> Sort + Skip duplicates + Two pointers
```java
Arrays.sort(nums);
for(int i = 0; i < n; i++) {
    if(i > 0 && nums[i] == nums[i-1]) continue;  // Skip duplicates
    int target = -nums[i];
    // Two pointer for remaining sum
}
```

#### **Container With Most Water**
> Move pointer with smaller height
```java
int i = 0, j = n - 1;
while(i < j) {
    int area = Math.min(height[i], height[j]) * (j - i);
    max = Math.max(max, area);
    if(height[i] < height[j]) i++;
    else j--;
}
```

#### **Dutch National Flag (Sort Colors)**
> Three pointers: red, white, blue
```java
int red = 0, white = 0, blue = n - 1;
while(white <= blue) {
    if(nums[white] == 0) swap(nums, red++, white++);
    else if(nums[white] == 1) white++;
    else swap(nums, white, blue--);
}
```

#### **Palindrome Expansion**
> Expand from center for odd/even length
```java
for(int i = 0; i < n; i++) {
    expand(s, i, i);      // Odd length
    expand(s, i, i + 1);  // Even length
}
// In expand: while(l >= 0 && r < n && s.charAt(l) == s.charAt(r))
```

---

## 3. Sliding Window

### 🔑 Key Patterns

#### **Fixed Window**
```java
// Build first window, then slide
for(int i = 0; i < k; i++) sum += nums[i];
for(int i = k; i < n; i++) {
    sum += nums[i] - nums[i - k];  // Add new, remove old
    max = Math.max(max, sum);
}
```

#### **Variable Window (Minimum Window Substring)**
```java
int[] map = new int[128];
for(char c : t.toCharArray()) map[c]++;
int i = 0, j = 0, count = t.length();
while(j < n) {
    if(map[s.charAt(j++)]-- > 0) count--;  // Expand
    while(count == 0) {  // Shrink
        // Record answer
        if(map[s.charAt(i++)]++ == 0) count++;
    }
}
```

#### **Sliding Window with Two Heaps**
> Track min/max in window efficiently
```java
PriorityQueue<int[]> minHeap, maxHeap;  // Store {value, index}
while(right < n) {
    minHeap.add({nums[right], right});
    maxHeap.add({nums[right], right});
    // Clean up out-of-window elements from heap tops
    while(!maxHeap.isEmpty() && maxHeap.peek()[1] < left) maxHeap.poll();
    // Calculate window answer
}
```

---

## 4. Stack Patterns

### 🔑 Key Patterns

#### **Monotonic Stack (Next Greater/Smaller)**
```java
// Next Greater Element (decreasing stack)
for(int i = n - 1; i >= 0; i--) {
    while(!stack.isEmpty() && stack.peek() <= nums[i]) stack.pop();
    result[i] = stack.isEmpty() ? -1 : stack.peek();
    stack.push(nums[i]);
}
```

#### **Largest Rectangle in Histogram**
```java
for(int i = 0; i <= n; i++) {
    int h = (i == n) ? 0 : heights[i];
    while(!stack.isEmpty() && heights[stack.peek()] > h) {
        int height = heights[stack.pop()];
        int width = stack.isEmpty() ? i : i - stack.peek() - 1;
        max = Math.max(max, height * width);
    }
    stack.push(i);
}
```

#### **Valid Parentheses with Stars**
```java
Stack<Integer> leftPar = new Stack<>();  // Indices of '('
Stack<Integer> stars = new Stack<>();    // Indices of '*'
// Process ')': prefer '(' first, then '*'
// Finally: each '(' must have a '*' after it
```

#### **Basic Calculator Pattern**
```java
int result = 0, number = 0, sign = 1;
for(char c : s.toCharArray()) {
    if(Character.isDigit(c)) number = number * 10 + (c - '0');
    else if(c == '+') { result += sign * number; sign = 1; number = 0; }
    else if(c == '-') { result += sign * number; sign = -1; number = 0; }
    else if(c == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
    else if(c == ')') { result += sign * number; result *= stack.pop(); result += stack.pop(); number = 0; }
}
```

#### **Decode String Pattern**
```java
Stack<Integer> numStack = new Stack<>();
Stack<StringBuilder> strStack = new Stack<>();
// On '[': push current string & number, reset
// On ']': pop and repeat
```

---

## 5. Binary Search

### 🔑 Key Patterns

#### **Classic Binary Search**
```java
while(left <= right) {
    int mid = left + (right - left) / 2;
    if(nums[mid] == target) return mid;
    else if(nums[mid] < target) left = mid + 1;
    else right = mid - 1;
}
```

#### **Search in Rotated Array**
> Find pivot first, then binary search
```java
// Find pivot (minimum element)
while(l < r) {
    int m = (l + r) / 2;
    if(nums[m] > nums[r]) l = m + 1;
    else r = m;
}
// Binary search in appropriate half
```

#### **Search on Answer Space**
> Koko Eating Bananas, Ship Packages
```java
int left = minPossible, right = maxPossible;
while(left < right) {
    int mid = (left + right) / 2;
    if(canAchieve(mid)) right = mid;  // Try smaller
    else left = mid + 1;
}
```

#### **2D Matrix Search**
```java
// Binary search on rows first, then columns
while(top <= bottom) {
    int mid = (top + bottom) / 2;
    if(matrix[mid][0] > target) bottom = mid - 1;
    else if(matrix[mid][cols-1] < target) top = mid + 1;
    else break;  // Found the row
}
// Binary search within row
```

---

## 6. Linked List

### 🔑 Key Patterns

#### **Reverse Linked List**
```java
ListNode prev = null, curr = head;
while(curr != null) {
    ListNode next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
}
return prev;
```

#### **Reverse in K-Groups**
```java
ListNode dummy = new ListNode(-1);
dummy.next = head;
ListNode prevGroup = dummy;
while(hasKNodes(prevGroup, k)) {
    ListNode start = prevGroup.next;
    // Reverse k nodes
    prevGroup.next = reversed_end;
    start.next = next_group_start;
    prevGroup = start;
}
```

#### **LRU Cache (Doubly Linked List + HashMap)**
```java
class Node { int key, val; Node prev, next; }
HashMap<Integer, Node> cache;
Node head, tail;  // Dummy nodes
// addNode: add to head
// removeNode: remove from list
// get: move to head
// put: add/update, evict from tail if needed
```

#### **Find Middle (Fast/Slow Pointers)**
```java
ListNode slow = head, fast = head;
while(fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow is at middle
```

---

## 7. Trees

### 🔑 Key Patterns

#### **Tree Traversals**
```java
// Inorder: Left -> Root -> Right (BST gives sorted order)
// Preorder: Root -> Left -> Right (Good for copying)
// Postorder: Left -> Right -> Root (Good for deletion)
// Level Order: BFS with queue
```

#### **Diameter of Binary Tree**
```java
int diameter = 0;
int height(TreeNode root) {
    if(root == null) return 0;
    int left = height(root.left);
    int right = height(root.right);
    diameter = Math.max(diameter, left + right);  // Update diameter
    return Math.max(left, right) + 1;
}
```

#### **Lowest Common Ancestor**
```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if(root == null || root == p || root == q) return root;
    TreeNode left = lca(root.left, p, q);
    TreeNode right = lca(root.right, p, q);
    if(left != null && right != null) return root;  // Found in both subtrees
    return left != null ? left : right;
}
```

#### **Maximum Path Sum**
```java
int maxSum = Integer.MIN_VALUE;
int maxGain(TreeNode node) {
    if(node == null) return 0;
    int left = Math.max(maxGain(node.left), 0);   // Ignore negative paths
    int right = Math.max(maxGain(node.right), 0);
    maxSum = Math.max(maxSum, left + right + node.val);  // Update if path through node is better
    return Math.max(left, right) + node.val;  // Return max gain to parent
}
```

#### **Serialize/Deserialize**
```java
// BFS: Use queue, null as "#"
// Serialize: level order with "#" for nulls
// Deserialize: rebuild using queue
```

#### **Construct from Preorder + Inorder**
```java
// Preorder: first is root
// Inorder: left of root = left subtree, right = right subtree
// Recursively build with ranges
```

---

## 8. Graphs

### 🔑 Key Patterns

#### **BFS Template**
```java
Queue<int[]> queue = new LinkedList<>();
boolean[][] visited = new boolean[n][m];
queue.add(start);
visited[start[0]][start[1]] = true;
while(!queue.isEmpty()) {
    int[] curr = queue.poll();
    for(int[] dir : directions) {
        int nr = curr[0] + dir[0], nc = curr[1] + dir[1];
        if(isValid(nr, nc) && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.add(new int[]{nr, nc});
        }
    }
}
```

#### **DFS Template**
```java
void dfs(int[][] grid, int i, int j) {
    if(i < 0 || j < 0 || i >= n || j >= m || visited[i][j]) return;
    visited[i][j] = true;
    for(int[] dir : directions) dfs(grid, i + dir[0], j + dir[1]);
}
```

#### **Topological Sort (Kahn's Algorithm)**
```java
int[] indegree = new int[n];
Queue<Integer> queue = new LinkedList<>();
for(int i = 0; i < n; i++) if(indegree[i] == 0) queue.add(i);
while(!queue.isEmpty()) {
    int curr = queue.poll();
    result.add(curr);
    for(int neighbor : adj.get(curr)) {
        if(--indegree[neighbor] == 0) queue.add(neighbor);
    }
}
return result.size() == n ? result : new ArrayList<>();  // Cycle check
```

#### **Dijkstra's Algorithm**
```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
int[] dist = new int[n]; Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;
pq.add(new int[]{src, 0});
while(!pq.isEmpty()) {
    int[] curr = pq.poll();
    if(curr[1] > dist[curr[0]]) continue;
    for(int[] neighbor : adj.get(curr[0])) {
        int newDist = dist[curr[0]] + neighbor[1];
        if(newDist < dist[neighbor[0]]) {
            dist[neighbor[0]] = newDist;
            pq.add(new int[]{neighbor[0], newDist});
        }
    }
}
```

#### **Multi-Source BFS**
```java
// Add all sources to queue initially (e.g., all rotten oranges)
Queue<int[]> queue = new LinkedList<>();
for(sources) queue.add(source);
// BFS spreads from all sources simultaneously
```

#### **Clone Graph**
```java
Map<Node, Node> visited = new HashMap<>();
Node clone(Node node) {
    if(visited.containsKey(node)) return visited.get(node);
    Node copy = new Node(node.val);
    visited.put(node, copy);
    for(Node neighbor : node.neighbors) copy.neighbors.add(clone(neighbor));
    return copy;
}
```

#### **Minimum Spanning Tree (Prim's)**
```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
boolean[] visited = new boolean[n];
pq.add(new int[]{0, 0});  // {node, weight}
while(!pq.isEmpty()) {
    int[] curr = pq.poll();
    if(visited[curr[0]]) continue;
    visited[curr[0]] = true;
    totalWeight += curr[1];
    for(neighbor : adj.get(curr[0])) pq.add(neighbor);
}
```

#### **Minimum Height Trees**
> Peel leaves layer by layer until 1-2 nodes remain
```java
while(remaining > 2) {
    List<Integer> newLeaves = new ArrayList<>();
    for(int leaf : leaves) {
        for(int neighbor : adj.get(leaf)) {
            if(--degree[neighbor] == 1) newLeaves.add(neighbor);
        }
    }
    remaining -= leaves.size();
    leaves = newLeaves;
}
```

---

## 9. Dynamic Programming

### 🔑 Key Patterns

#### **1D DP - Climbing Stairs / House Robber**
```java
dp[i] = dp[i-1] + dp[i-2];  // Fibonacci pattern
// House Robber: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
```

#### **0/1 Knapsack**
```java
for(int i = 1; i <= n; i++) {
    for(int j = 1; j <= capacity; j++) {
        dp[i][j] = dp[i-1][j];  // Don't take
        if(weight[i-1] <= j) 
            dp[i][j] = Math.max(dp[i][j], dp[i-1][j-weight[i-1]] + value[i-1]);
    }
}
```

#### **Unbounded Knapsack (Coin Change)**
```java
dp[0] = 0;  // 0 coins for amount 0
for(int i = 1; i <= amount; i++) {
    for(int coin : coins) {
        if(i >= coin && dp[i-coin] != Integer.MAX_VALUE)
            dp[i] = Math.min(dp[i], dp[i-coin] + 1);
    }
}
```

#### **Longest Increasing Subsequence**
```java
// O(n²)
for(int i = 1; i < n; i++) {
    for(int j = 0; j < i; j++) {
        if(nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
}
// O(n log n) with binary search on tail array
```

#### **Longest Common Subsequence**
```java
for(int i = 1; i <= m; i++) {
    for(int j = 1; j <= n; j++) {
        if(s1.charAt(i-1) == s2.charAt(j-1)) dp[i][j] = dp[i-1][j-1] + 1;
        else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
}
```

#### **Edit Distance**
```java
// Base: dp[i][0] = i, dp[0][j] = j
for(int i = 1; i <= m; i++) {
    for(int j = 1; j <= n; j++) {
        if(s1.charAt(i-1) == s2.charAt(j-1)) dp[i][j] = dp[i-1][j-1];
        else dp[i][j] = 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
    }
}
```

#### **Maximum Product Subarray**
```java
int prefix = 0, suffix = 0, max = nums[0];
for(int i = 0; i < n; i++) {
    prefix = nums[i] * (prefix == 0 ? 1 : prefix);
    suffix = nums[n-i-1] * (suffix == 0 ? 1 : suffix);
    max = Math.max(max, Math.max(prefix, suffix));
}
```

#### **Kadane's Algorithm (Maximum Subarray)**
```java
int maxSum = nums[0], currSum = nums[0];
for(int i = 1; i < n; i++) {
    currSum = Math.max(nums[i], currSum + nums[i]);
    maxSum = Math.max(maxSum, currSum);
}
```

#### **Maximal Square**
```java
for(int i = 0; i < m; i++) {
    for(int j = 0; j < n; j++) {
        if(matrix[i][j] == '1') {
            if(i == 0 || j == 0) dp[i][j] = 1;
            else dp[i][j] = Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1])) + 1;
            max = Math.max(max, dp[i][j]);
        }
    }
}
return max * max;
```

#### **Burst Balloons (Interval DP)**
```java
// Think of which balloon to burst LAST
int coins(int[] nums, int l, int r) {
    if(l > r) return 0;
    int max = 0;
    for(int i = l; i <= r; i++) {
        int curr = nums[l-1] * nums[i] * nums[r+1];
        curr += coins(nums, l, i-1) + coins(nums, i+1, r);
        max = Math.max(max, curr);
    }
    return max;
}
```

#### **Word Break**
```java
dp[n] = true;  // Empty string is valid
for(int i = n-1; i >= 0; i--) {
    for(String word : dict) {
        if(i + word.length() <= n && s.startsWith(word, i))
            dp[i] = dp[i + word.length()];
        if(dp[i]) break;
    }
}
```

---

## 10. Heap/Priority Queue

### 🔑 Key Patterns

#### **K-th Largest Element**
```java
// Min heap of size k
PriorityQueue<Integer> pq = new PriorityQueue<>();
for(int num : nums) {
    pq.offer(num);
    if(pq.size() > k) pq.poll();
}
return pq.peek();
```

#### **Top K Frequent Elements**
```java
Map<Integer, Integer> freq = new HashMap<>();
PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> freq.get(b) - freq.get(a));
// Build frequency map, add to max heap
```

#### **Merge K Sorted Lists**
```java
PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
for(ListNode head : lists) if(head != null) pq.offer(head);
while(!pq.isEmpty()) {
    ListNode curr = pq.poll();
    tail.next = curr;
    tail = tail.next;
    if(curr.next != null) pq.offer(curr.next);
}
```

#### **Find Median from Data Stream**
```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());  // Left half
PriorityQueue<Integer> minHeap = new PriorityQueue<>();  // Right half
void addNum(int num) {
    maxHeap.offer(num);
    minHeap.offer(maxHeap.poll());
    if(minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
}
double findMedian() {
    return maxHeap.size() > minHeap.size() ? maxHeap.peek() : (maxHeap.peek() + minHeap.peek()) / 2.0;
}
```

#### **Task Scheduler**
```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[1] - a[1]);
Queue<int[]> cooldown = new LinkedList<>();
while(!pq.isEmpty() || !cooldown.isEmpty()) {
    time++;
    if(!pq.isEmpty()) {
        int[] curr = pq.poll();
        if(--curr[1] > 0) cooldown.add(new int[]{curr[0], curr[1], time + n});
    }
    if(!cooldown.isEmpty() && cooldown.peek()[2] == time) pq.offer(cooldown.poll());
}
```

#### **Smallest Range Covering K Lists**
```java
// Min heap: {value, listIndex, elementIndex}
// Track global max, update range when min changes
```

---

## 11. Intervals

### 🔑 Key Patterns

#### **Merge Intervals**
```java
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
int start = intervals[0][0], end = intervals[0][1];
for(int i = 1; i < n; i++) {
    if(intervals[i][0] <= end) end = Math.max(end, intervals[i][1]);
    else { result.add(new int[]{start, end}); start = intervals[i][0]; end = intervals[i][1]; }
}
result.add(new int[]{start, end});
```

#### **Meeting Rooms II (Min Rooms)**
```java
// Sort start and end times separately
int[] starts = ..., ends = ...;
int i = 0, j = 0, rooms = 0;
while(i < n) {
    if(starts[i] < ends[j]) rooms++;
    else j++;
    i++;
    maxRooms = Math.max(maxRooms, rooms);
}
```

#### **Non-overlapping Intervals (Min Removals)**
```java
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
int end = intervals[0][1], count = 0;
for(int i = 1; i < n; i++) {
    if(intervals[i][0] < end) { count++; end = Math.min(end, intervals[i][1]); }  // Keep shorter
    else end = intervals[i][1];
}
```

---

## 12. Backtracking

### 🔑 Key Patterns

#### **Subsets**
```java
void backtrack(int[] nums, int start, List<Integer> path) {
    result.add(new ArrayList<>(path));
    for(int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path);
        path.remove(path.size() - 1);
    }
}
```

#### **Permutations**
```java
void backtrack(int[] nums, Set<Integer> used, List<Integer> path) {
    if(path.size() == nums.length) { result.add(new ArrayList<>(path)); return; }
    for(int i = 0; i < nums.length; i++) {
        if(used.contains(i)) continue;
        used.add(i); path.add(nums[i]);
        backtrack(nums, used, path);
        used.remove(i); path.remove(path.size() - 1);
    }
}
```

#### **Combination Sum (Unlimited Use)**
```java
void backtrack(int[] candidates, int target, int start, List<Integer> path) {
    if(target == 0) { result.add(new ArrayList<>(path)); return; }
    for(int i = start; i < candidates.length; i++) {
        if(candidates[i] > target) continue;
        path.add(candidates[i]);
        backtrack(candidates, target - candidates[i], i, path);  // Same index allowed
        path.remove(path.size() - 1);
    }
}
```

#### **N-Queens**
```java
void solve(char[][] board, int col) {
    if(col == n) { addResult(board); return; }
    for(int row = 0; row < n; row++) {
        if(isSafe(board, row, col)) {
            board[row][col] = 'Q';
            solve(board, col + 1);
            board[row][col] = '.';
        }
    }
}
// Use arrays for O(1) checking: leftCol[], upperDiag[], lowerDiag[]
```

#### **Palindrome Partitioning**
```java
void backtrack(String s, int start, List<String> path) {
    if(start == s.length()) { result.add(new ArrayList<>(path)); return; }
    for(int end = start; end < s.length(); end++) {
        if(isPalindrome(s, start, end)) {
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, path);
            path.remove(path.size() - 1);
        }
    }
}
```

---

## 13. Greedy

### 🔑 Key Patterns

#### **Jump Game (Can Reach End)**
```java
int maxReach = 0;
for(int i = 0; i < n && i <= maxReach; i++) {
    maxReach = Math.max(maxReach, i + nums[i]);
}
return maxReach >= n - 1;
```

#### **Gas Station**
```java
int totalGas = 0, totalCost = 0, tank = 0, start = 0;
for(int i = 0; i < n; i++) {
    totalGas += gas[i]; totalCost += cost[i];
    tank += gas[i] - cost[i];
    if(tank < 0) { start = i + 1; tank = 0; }
}
return totalGas >= totalCost ? start : -1;
```

#### **Partition Labels**
```java
int[] lastIndex = new int[26];
for(int i = 0; i < n; i++) lastIndex[s.charAt(i) - 'a'] = i;
int start = 0, end = 0;
for(int i = 0; i < n; i++) {
    end = Math.max(end, lastIndex[s.charAt(i) - 'a']);
    if(i == end) { result.add(end - start + 1); start = i + 1; }
}
```

---

## 14. Trie

### 🔑 Key Patterns

#### **Trie Node Structure**
```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd;
}
```

#### **Insert/Search**
```java
void insert(String word) {
    TrieNode node = root;
    for(char c : word.toCharArray()) {
        if(node.children[c - 'a'] == null) node.children[c - 'a'] = new TrieNode();
        node = node.children[c - 'a'];
    }
    node.isEnd = true;
}
```

#### **Word Search II (Matrix + Trie)**
```java
// Build Trie from words, DFS on matrix with Trie pruning
void dfs(char[][] board, int i, int j, TrieNode node, String path) {
    if(node.isEnd) { result.add(path); node.isEnd = false; }  // Avoid duplicates
    char c = board[i][j];
    if(c == '#' || node.children[c - 'a'] == null) return;
    board[i][j] = '#';  // Mark visited
    // DFS in 4 directions
    board[i][j] = c;    // Restore
}
```

---

## 15. Union Find

### 🔑 Key Patterns

#### **Union Find with Path Compression + Rank**
```java
class UnionFind {
    int[] parent, rank;
    int components;
    
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        components = n;
        for(int i = 0; i < n; i++) parent[i] = i;
    }
    
    int find(int x) {
        if(parent[x] != x) parent[x] = find(parent[x]);  // Path compression
        return parent[x];
    }
    
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if(px == py) return false;
        if(rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if(rank[px] == rank[py]) rank[px]++;
        components--;
        return true;
    }
}
```

#### **Accounts Merge**
```java
// Union emails that belong to same account
// Finally, group emails by parent
Map<String, Integer> emailToId = new HashMap<>();
for(each account) {
    for(each email except first) {
        union(firstEmail, currentEmail);
    }
}
```

#### **Redundant Connection**
```java
// The edge that creates a cycle
for(int[] edge : edges) {
    if(!union(edge[0], edge[1])) return edge;
}
```

---

## 🎯 Quick Tips

### Time Complexity Hints
| Constraint | Expected Complexity | Common Approach |
|------------|-------------------|-----------------|
| n ≤ 10 | O(n!) | Backtracking |
| n ≤ 20 | O(2^n) | Bitmask DP |
| n ≤ 500 | O(n³) | Floyd-Warshall |
| n ≤ 5000 | O(n²) | DP, Two Pointers |
| n ≤ 10^6 | O(n log n) | Sorting, Binary Search |
| n ≤ 10^8 | O(n) | Linear, Two Pointers |

### Common Patterns to Recognize
- **"Find all/count"** → Often DP or Backtracking
- **"Minimum/Maximum"** → DP, Greedy, or Binary Search
- **"Subarray"** → Sliding Window or Prefix Sum
- **"Subsequence"** → DP
- **"k-th element"** → Heap or QuickSelect
- **"Connected components"** → Union Find or DFS
- **"Shortest path"** → BFS (unweighted) or Dijkstra
- **"Dependencies"** → Topological Sort
- **"Overlapping intervals"** → Sort + Sweep Line

---

## 📝 Final Notes

1. **Always clarify constraints** - they hint at expected complexity
2. **Start with brute force**, then optimize
3. **Draw examples** - visualize the problem
4. **Edge cases**: empty input, single element, all same, sorted/reverse sorted
5. **Practice explaining** your thought process

Good luck with your interviews! 🍀

---

## 16. Advanced Patterns (From Problems)

### Monotonic Stack (Deep Dive)

**Daily Temperatures / Next Greater Element**
```java
// Traverse right to left, maintain decreasing stack
int[] result = new int[n];
Deque<Integer> stack = new ArrayDeque<>();
for(int i = n - 1; i >= 0; i--) {
    while(!stack.isEmpty() && temps[stack.peek()] <= temps[i]) stack.pop();
    result[i] = stack.isEmpty() ? 0 : stack.peek() - i;
    stack.push(i);
}
```

**Largest Rectangle in Histogram**
```java
// Area = height * (nextSmaller - prevSmaller - 1)
Deque<Integer> stack = new ArrayDeque<>();
int maxArea = 0;
for(int i = 0; i <= n; i++) {
    int h = (i == n) ? 0 : heights[i];
    while(!stack.isEmpty() && heights[stack.peek()] > h) {
        int height = heights[stack.pop()];
        int width = stack.isEmpty() ? i : i - stack.peek() - 1;
        maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
}
```

### Two Heap Pattern

**Find Median from Data Stream**
```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // smaller half
PriorityQueue<Integer> minHeap = new PriorityQueue<>(); // larger half

void addNum(int num) {
    maxHeap.offer(num);
    minHeap.offer(maxHeap.poll());
    if(minHeap.size() > maxHeap.size()) maxHeap.offer(minHeap.poll());
}

double findMedian() {
    return maxHeap.size() > minHeap.size() ? maxHeap.peek() 
           : (maxHeap.peek() + minHeap.peek()) / 2.0;
}
```

### State Machine DP (Stock Problems)

**Best Time to Buy/Sell with Cooldown**
```java
int hold = Integer.MIN_VALUE, sold = 0, rest = 0;
for(int price : prices) {
    int prevHold = hold, prevSold = sold;
    hold = Math.max(hold, rest - price);
    sold = prevHold + price;
    rest = Math.max(rest, prevSold);
}
return Math.max(sold, rest);
```

### Interval DP

**Burst Balloons**
```java
// dp[i][j] = max coins for bursting all in (i,j), k = LAST to burst
for(int len = 2; len <= n + 2; len++) {
    for(int i = 0; i + len - 1 < n + 2; i++) {
        int j = i + len - 1;
        for(int k = i + 1; k < j; k++) {
            dp[i][j] = Math.max(dp[i][j], dp[i][k] + nums[i]*nums[k]*nums[j] + dp[k][j]);
        }
    }
}
```

### Game Theory DP

**Stone Game / Predict the Winner**
```java
// dp[i][j] = max score diff current player achieves
for(int i = 0; i < n; i++) dp[i][i] = piles[i];
for(int len = 2; len <= n; len++) {
    for(int i = 0; i + len - 1 < n; i++) {
        int j = i + len - 1;
        dp[i][j] = Math.max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1]);
    }
}
return dp[0][n-1] >= 0;
```

### Binary Search on Answer Space

**Koko Eating Bananas / Ship Packages**
```java
int left = 1, right = maxVal;
while(left < right) {
    int mid = (left + right) / 2;
    if(canFinish(mid)) right = mid;
    else left = mid + 1;
}
return left;
```

### Graph Advanced

**Cheapest Flights K Stops (Bellman-Ford)**
```java
int[] dist = new int[n]; Arrays.fill(dist, Integer.MAX_VALUE); dist[src] = 0;
for(int i = 0; i <= k; i++) {
    int[] temp = dist.clone();
    for(int[] f : flights)
        if(dist[f[0]] != Integer.MAX_VALUE) temp[f[1]] = Math.min(temp[f[1]], dist[f[0]] + f[2]);
    dist = temp;
}
return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
```

**Clone Graph**
```java
Map<Node, Node> visited = new HashMap<>();
Node cloneGraph(Node node) {
    if(node == null) return null;
    if(visited.containsKey(node)) return visited.get(node);
    Node clone = new Node(node.val);
    visited.put(node, clone);
    for(Node neighbor : node.neighbors) clone.neighbors.add(cloneGraph(neighbor));
    return clone;
}
```

---

## Problem-to-Pattern Quick Lookup

| Problem | Pattern | Key Insight |
|---------|---------|-------------|
| 3Sum | Two Pointers | Sort + skip duplicates |
| Container With Most Water | Two Pointers | Move shorter pointer |
| Trapping Rain Water | Monotonic Stack | Or prefix max arrays |
| Sliding Window Maximum | Deque | Monotonic decreasing |
| Daily Temperatures | Monotonic Stack | Next greater element |
| Largest Rectangle Histogram | Monotonic Stack | Prev/next smaller |
| LRU Cache | Design | HashMap + DLL |
| Find Median from Stream | Two Heaps | Balance max/min |
| Course Schedule | Topo Sort | In-degree + queue |
| Network Delay Time | Dijkstra | Weighted shortest path |
| Accounts Merge | Union Find | Group by common |
| Word Search II | Trie + Backtrack | Trie pruning |
| Coin Change | DP | Unbounded knapsack |
| Edit Distance | 2D DP | 3 operations |
| Burst Balloons | Interval DP | Last to burst |
| Stone Game | Game Theory DP | Score difference |
| Koko Eating Bananas | Binary Search | Answer space |

