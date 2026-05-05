# Dynamic Programming Cheatsheet

A quick-revision sheet covering the 11 most common DP patterns, how to recognize them, and a worked Java example for each.

---

## 1. 1D Linear DP

**Pattern:** Single variable state, left-to-right scan.

**Use cases:**
- Max/min subarray
- At each step, decide
- `O(n)` state

### How to identify
- State depends only on the previous 1–2 elements
- Answer is `dp[n]` or `max` over all `dp[i]`
- Classic: climbing stairs, house robber, max subarray

### Example — House Robber
> Given an array of non-negative integers, find the maximum sum such that no two adjacent elements are picked.

- **State:** `dp[i]` = max money robbing up to house `i`
- **Choice:** rob it (`dp[i-2] + nums[i]`) or skip (`dp[i-1]`)
- **Recurrence:** `dp[i] = max(dp[i-1], dp[i-2] + nums[i])`
- **Base:** `dp[0] = nums[0]`, `dp[1] = max(nums[0], nums[1])`

**Brute force (recursion)** — `O(2ⁿ)` time, every house has 2 choices:

```java
public int rob(int[] nums) {
    return helper(nums, nums.length - 1);
}
private int helper(int[] nums, int i) {
    if (i < 0) return 0;
    // Choice: rob house i (then skip i-1) OR skip house i
    return Math.max(helper(nums, i - 2) + nums[i],
                    helper(nums, i - 1));
}
```

**Bottom-up DP** — cache subproblem answers:

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];
    int[] dp = new int[nums.length];
    dp[0] = nums[0];
    dp[1] = Math.max(nums[0], nums[1]);
    for (int i = 2; i < nums.length; i++)
        dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i]);
    return dp[nums.length - 1];
}
```

- **Brute force:** `O(2ⁿ)` time
- **DP:** `O(n)` time, `O(n)` → `O(1)` space

---

## 2. 2D Grid DP

**Pattern:** State is a cell `(i, j)`; fill row by row.

**Use cases:**
- Grid paths
- Min cost path
- Unique paths
- Dungeon

### How to identify
- Moving on a 2D grid, usually top-left → bottom-right
- State = `dp[i][j]`, answer = `dp[m-1][n-1]`
- Each cell depends on cell above and/or left

### Example — Minimum Path Sum
> Given an `m × n` grid of non-negative integers, find a path from top-left to bottom-right that minimises the sum. Move only right or down.

- **State:** `dp[i][j]` = min cost to reach cell `(i, j)`
- **Transitions:** came from top `dp[i-1][j]` or left `dp[i][j-1]`
- **Recurrence:** `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`
- Seed first row and first column separately

**Brute force (recursion)** — explores every right/down path, `O(2^(m+n))`:

```java
public int minPathSum(int[][] grid) {
    return helper(grid, grid.length - 1, grid[0].length - 1);
}
private int helper(int[][] g, int i, int j) {
    if (i == 0 && j == 0) return g[0][0];
    if (i < 0 || j < 0) return Integer.MAX_VALUE;
    return g[i][j] + Math.min(helper(g, i - 1, j),
                              helper(g, i, j - 1));
}
```

**Bottom-up DP** — each cell computed once:

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];
    dp[0][0] = grid[0][0];
    for (int j = 1; j < n; j++)
        dp[0][j] = dp[0][j-1] + grid[0][j];
    for (int i = 1; i < m; i++)
        dp[i][0] = dp[i-1][0] + grid[i][0];
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = grid[i][j] +
                Math.min(dp[i-1][j], dp[i][j-1]);
    return dp[m-1][n-1];
}
```

- **Brute force:** `O(2^(m+n))` time
- **DP:** `O(mn)` time, `O(mn)` → `O(n)` space

---

## 3. 0/1 Knapsack

**Pattern:** Pick or skip each item exactly once.

**Use cases:**
- Subset sum
- Can we reach exactly `W`
- Partition equal subset

### How to identify
- Each item used at most once
- `dp[i][w]` = best using first `i` items with capacity `w`
- Inner loop: **descending** to prevent reuse

### Example — Partition Equal Subset Sum
> Given an array, determine if it can be partitioned into two subsets with equal sum.

- Reduce to: can we pick a subset summing to `total / 2`?
- **State:** `dp[j]` = `true` if sum `j` is achievable
- Loop items outer, capacities **descending** inner
- If `dp[target]` is `true` at end → yes

**Brute force (recursion)** — try take/skip for every item, `O(2ⁿ)`:

```java
public boolean canPartition(int[] nums) {
    int total = 0;
    for (int n : nums) total += n;
    if (total % 2 != 0) return false;
    return helper(nums, 0, total / 2);
}
private boolean helper(int[] nums, int i, int target) {
    if (target == 0) return true;
    if (target < 0 || i == nums.length) return false;
    // Choice: include nums[i] or skip it
    return helper(nums, i + 1, target - nums[i])
        || helper(nums, i + 1, target);
}
```

**Bottom-up DP** — reuse subset-sum results for each capacity:

```java
public boolean canPartition(int[] nums) {
    int total = 0;
    for (int n : nums) total += n;
    if (total % 2 != 0) return false;
    int target = total / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int num : nums)
        for (int j = target; j >= num; j--)
            dp[j] = dp[j] || dp[j - num];
    return dp[target];
}
```

- **Brute force:** `O(2ⁿ)` time
- **DP:** `O(n · W)` time, `O(W)` space

---

## 4. Unbounded Knapsack

**Pattern:** Reuse items any number of times.

**Use cases:**
- Coin change
- Minimum coins
- Rod cutting
- Item reusable

### How to identify
- Same item can be picked multiple times
- Iterate capacities **forward** (inner loop ascending)
- Classic: coin change, rod cutting

### Example — Coin Change
> Given coin denominations and amount, find the minimum number of coins that make up the amount. Coins can be reused.

- **State:** `dp[i]` = min coins to make amount `i`
- **Init:** `dp[0] = 0`, rest = `amount + 1` (sentinel for infinity)
- For each amount, try every coin: `dp[i] = min(dp[i], dp[i-coin] + 1)`
- Forward iteration because reuse is allowed

**Brute force (recursion)** — try every coin at every step, exponential blowup:

```java
public int coinChange(int[] coins, int amount) {
    int res = helper(coins, amount);
    return res == Integer.MAX_VALUE ? -1 : res;
}
private int helper(int[] coins, int amount) {
    if (amount == 0) return 0;
    if (amount < 0) return Integer.MAX_VALUE;
    int best = Integer.MAX_VALUE;
    for (int coin : coins) {
        int sub = helper(coins, amount - coin);
        if (sub != Integer.MAX_VALUE) best = Math.min(best, sub + 1);
    }
    return best;
}
```

**Bottom-up DP** — each amount solved once, ascending order so reuse is natural:

```java
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++)
        for (int coin : coins)
            if (i >= coin)
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

- **Brute force:** `O(coins^amount)` time
- **DP:** `O(amount · coins)` time, `O(amount)` space

---

## 5. Interval DP

**Pattern:** State = subarray `[i..j]`; fill by increasing length.

**Use cases:**
- Burst balloons
- Matrix chain multiplication
- Palindrome partition
- Merge stones

### How to identify
- Answer for range `[i, j]` depends on sub-ranges
- Loop: length `l` from `2 → n`, then `i`, then split `k`
- Ask: *what is the last operation on `[i..j]`?*

### Example — Burst Balloons
> Given `n` balloons with values, burst all to maximise coins. Bursting balloon `i` gives `nums[i-1] * nums[i] * nums[i+1]`.

- Reverse think: which balloon is burst **LAST** in `[i..j]`?
- **State:** `dp[i][j]` = max coins bursting all in open `(i..j)`
- For each split `k`: `dp[i][j] = max(dp[i][k] + nums[i]*nums[k]*nums[j] + dp[k][j])`
- Pad array with `1`s at both ends

**Brute force (recursion)** — try every balloon as the **last** to burst in `(i..j)`:

```java
public int maxCoins(int[] nums) {
    int n = nums.length + 2;
    int[] arr = new int[n];
    arr[0] = arr[n-1] = 1;
    for (int i = 1; i < n-1; i++) arr[i] = nums[i-1];
    return helper(arr, 0, n - 1);
}
private int helper(int[] arr, int i, int j) {
    if (i + 1 == j) return 0;
    int best = 0;
    for (int k = i + 1; k < j; k++) {
        int coins = arr[i] * arr[k] * arr[j]
                  + helper(arr, i, k) + helper(arr, k, j);
        best = Math.max(best, coins);
    }
    return best;
}
```

**Bottom-up DP** — fill by interval length so smaller ranges are ready:

```java
public int maxCoins(int[] nums) {
    int n = nums.length + 2;
    int[] arr = new int[n];
    arr[0] = arr[n-1] = 1;
    for (int i = 1; i < n-1; i++) arr[i] = nums[i-1];
    int[][] dp = new int[n][n];
    for (int len = 2; len < n; len++) {
        for (int i = 0; i < n - len; i++) {
            int j = i + len;
            for (int k = i+1; k < j; k++)
                dp[i][j] = Math.max(dp[i][j],
                    dp[i][k] + arr[i]*arr[k]*arr[j] + dp[k][j]);
        }
    }
    return dp[0][n-1];
}
```

- **Brute force:** exponential time
- **DP:** `O(n³)` time, `O(n²)` space

---

## 6. LCS / String DP

**Pattern:** `dp[i][j]` = answer for prefix `s1[:i]`, `s2[:j]`.

**Use cases:**
- Two strings
- Edit distance
- Longest common subsequence
- Interleaving strings

### How to identify
- Two sequences need to be aligned or compared
- **Match:** `dp[i][j] = dp[i-1][j-1] + something`
- **Mismatch:** take best of `dp[i-1][j]` and `dp[i][j-1]`

### Example — Edit Distance
> Given two strings `word1` and `word2`, find the minimum operations (insert, delete, replace) to convert `word1` to `word2`.

- **State:** `dp[i][j]` = min ops to convert `word1[:i]` → `word2[:j]`
- If chars match: `dp[i][j] = dp[i-1][j-1]` (free)
- Else: `min(replace dp[i-1][j-1]+1, delete dp[i-1][j]+1, insert dp[i][j-1]+1)`
- **Base:** `dp[i][0] = i`, `dp[0][j] = j`

**Brute force (recursion)** — branch 3 ways on every mismatch, `O(3^max(m,n))`:

```java
public int minDistance(String w1, String w2) {
    return helper(w1, w2, w1.length(), w2.length());
}
private int helper(String a, String b, int i, int j) {
    if (i == 0) return j;   // insert remaining of b
    if (j == 0) return i;   // delete remaining of a
    if (a.charAt(i-1) == b.charAt(j-1))
        return helper(a, b, i - 1, j - 1);
    return 1 + Math.min(helper(a, b, i - 1, j - 1),  // replace
             Math.min(helper(a, b, i - 1, j),         // delete
                      helper(a, b, i, j - 1)));       // insert
}
```

**Bottom-up DP** — table of `(m+1)×(n+1)`, each cell once:

```java
public int minDistance(String w1, String w2) {
    int m = w1.length(), n = w2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (w1.charAt(i-1) == w2.charAt(j-1))
                dp[i][j] = dp[i-1][j-1];
            else
                dp[i][j] = 1 + Math.min(dp[i-1][j-1],
                                Math.min(dp[i-1][j], dp[i][j-1]));
        }
    }
    return dp[m][n];
}
```

- **Brute force:** `O(3^max(m,n))` time
- **DP:** `O(mn)` time, `O(mn)` → `O(n)` space

---

## 7. State Machine DP

**Pattern:** Multiple explicit states with transitions.

**Use cases:**
- Stock problems
- Cooldown
- Hold / sell / rest
- At most `k` transactions

### How to identify
- You're in one of several named states at each step
- Transitions between states have costs or gains
- Best stock problems: `held`, `sold`, `rest`

### Example — Best Time to Buy/Sell with Cooldown
> Stock prices array. After selling, must rest 1 day. Find max profit.

3 states per day: `held` (holding stock), `sold` (just sold), `rest` (idle).

- `held = max(held, rest - price)` — buy or keep
- `sold = held + price` — sell today
- `rest = max(rest, prevSold)` — off cooldown

**Brute force (recursion)** — at every day, branch on action (`buy` / `sell` / `idle`):

```java
public int maxProfit(int[] prices) {
    return helper(prices, 0, false);
}
// holding = true means we currently own a stock
private int helper(int[] prices, int day, boolean holding) {
    if (day >= prices.length) return 0;
    int doNothing = helper(prices, day + 1, holding);
    int act;
    if (holding) // sell today, then must rest 1 day
        act = prices[day] + helper(prices, day + 2, false);
    else         // buy today
        act = -prices[day] + helper(prices, day + 1, true);
    return Math.max(doNothing, act);
}
```

**Bottom-up DP** — collapse to 3 rolling state variables:

```java
public int maxProfit(int[] prices) {
    int held = Integer.MIN_VALUE, sold = 0, rest = 0;
    for (int price : prices) {
        int prevSold = sold;
        sold = held + price;
        held = Math.max(held, rest - price);
        rest = Math.max(rest, prevSold);
    }
    return Math.max(sold, rest);
}
```

- **Brute force:** `O(2ⁿ)` time
- **DP:** `O(n)` time, `O(1)` space

---

## 8. Bitmask DP

**Pattern:** State encodes a subset as an integer bitmask.

**Use cases:**
- All permutations tried
- Assign `N` items to `N` slots
- TSP (Travelling Salesman)
- `n ≤ 20`

### How to identify
- `n` is small (≤ 20), need to track which items used
- `dp[mask][i]` = best visiting subset `mask`, ending at `i`
- Classic: TSP, visit all nodes

### Example — Shortest Path Visiting All Nodes
> Given an undirected graph of `n` nodes, find shortest path that visits every node. Can revisit nodes.

- **State:** `dp[mask][node]` = min steps visiting exactly nodes in `mask`, currently at `node`
- **Init:** `dp[1 << i][i] = 0` for all `i`
- BFS is cleaner: enqueue `(mask, node)`, expand neighbours
- **Goal:** `mask == (1 << n) - 1`

**Brute force (recursion / DFS)** — try every permutation of node ordering, `O(n!)`:

```java
public int shortestPathLength(int[][] graph) {
    int n = graph.length, best = Integer.MAX_VALUE;
    int full = (1 << n) - 1;
    for (int start = 0; start < n; start++)
        best = Math.min(best, dfs(graph, start, 1 << start, full, 0));
    return best;
}
private int dfs(int[][] g, int u, int mask, int full, int steps) {
    if (mask == full) return steps;
    int best = Integer.MAX_VALUE;
    for (int v : g[u]) {
        // allow revisits but cap depth to avoid infinite loops
        if (steps > g.length * 2) continue;
        int sub = dfs(g, v, mask | (1 << v), full, steps + 1);
        best = Math.min(best, sub);
    }
    return best;
}
```

**Bottom-up DP (BFS over `(mask, node)` states)** — each state visited once:

```java
public int shortestPathLength(int[][] graph) {
    int n = graph.length, full = (1 << n) - 1;
    int[][] dist = new int[1 << n][n];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    Queue<int[]> q = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        dist[1 << i][i] = 0;
        q.offer(new int[]{1 << i, i});
    }
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        int mask = cur[0], u = cur[1];
        if (mask == full) return dist[mask][u];
        for (int v : graph[u]) {
            int nm = mask | (1 << v);
            if (dist[nm][v] > dist[mask][u] + 1) {
                dist[nm][v] = dist[mask][u] + 1;
                q.offer(new int[]{nm, v});
            }
        }
    }
    return 0;
}
```

- **Brute force:** `O(n!)` time (intractable beyond `n ≈ 10`)
- **DP:** `O(2ⁿ · n)` time and space

---

## 9. Game Theory DP (Minimax)

**Pattern:** Two players alternate turns and play optimally; DP stores the score difference (current player − opponent).

**Use cases:**
- Stone game / pick from ends
- Predict the Winner
- Nim-style games
- Optimal strategy with alternating turns

### How to identify
- Two players, **both play optimally**
- Question asks who wins, or the max score the first player can guarantee
- Trick: define `dp` as **score of current player minus opponent** so the recurrence is symmetric
- On each move, current player **maximises** `value − dp(next state)`

### Example — Predict the Winner / Stone Game
> Players take turns picking a number from either end of an array. Each takes the picked number into their score. Return `true` if Player 1 can guarantee a win (score ≥ Player 2).

- **State:** `dp[i][j]` = max (current player score − opponent score) achievable on subarray `nums[i..j]`
- **Choice:** pick left → `nums[i] - dp[i+1][j]`, or pick right → `nums[j] - dp[i][j-1]`
- **Recurrence:** `dp[i][j] = max(nums[i] - dp[i+1][j], nums[j] - dp[i][j-1])`
- **Base:** `dp[i][i] = nums[i]`
- Player 1 wins iff `dp[0][n-1] >= 0`

**Brute force (recursion / minimax)** — each turn, branch on left vs right pick:

```java
public boolean PredictTheWinner(int[] nums) {
    return score(nums, 0, nums.length - 1) >= 0;
}
// returns (current player score - opponent score) on nums[i..j]
private int score(int[] nums, int i, int j) {
    if (i == j) return nums[i];
    int pickLeft  = nums[i] - score(nums, i + 1, j);
    int pickRight = nums[j] - score(nums, i, j - 1);
    return Math.max(pickLeft, pickRight);
}
```

**Bottom-up DP** — fill by increasing interval length:

```java
public boolean PredictTheWinner(int[] nums) {
    int n = nums.length;
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = nums[i];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Math.max(
                nums[i] - dp[i+1][j],
                nums[j] - dp[i][j-1]
            );
        }
    }
    return dp[0][n-1] >= 0;
}
```

- **Brute force:** `O(2ⁿ)` time
- **DP:** `O(n²)` time, `O(n²)` → `O(n)` space

> **Tip:** For games on a single pile with fixed move sets (e.g. take 1, 2, or 3 stones), use 1D `dp[i] = canWin from i stones` with `dp[i] = any(!dp[i - move])`.

---

## 10. Tree DP

**Pattern:** DP on a rooted tree computed bottom-up via DFS; each node combines results from its children.

**Use cases:**
- House Robber III
- Tree diameter / longest path
- Maximum independent set on tree
- Subtree aggregate problems

### How to identify
- Input is a tree (or graph that is a tree)
- Answer at a node depends on answers at its children
- Often returns a small tuple per node (e.g. `{include, exclude}`)

### Example — House Robber III
> Binary tree where each node has a value. You cannot rob two directly-connected nodes. Return the max sum.

- For each node return `{rob, notRob}`:
  - `rob` = `node.val + left.notRob + right.notRob`
  - `notRob` = `max(left.rob, left.notRob) + max(right.rob, right.notRob)`
- Answer at root = `max(rob, notRob)`

**Brute force (naive recursion)** — visit grandchildren when robbing, recompute many subtrees, `O(2ⁿ)`:

```java
public int rob(TreeNode root) {
    if (root == null) return 0;
    // Choice 1: rob this node + grandchildren
    int robThis = root.val;
    if (root.left != null)
        robThis += rob(root.left.left) + rob(root.left.right);
    if (root.right != null)
        robThis += rob(root.right.left) + rob(root.right.right);
    // Choice 2: skip this node, take best from children
    int skipThis = rob(root.left) + rob(root.right);
    return Math.max(robThis, skipThis);
}
```

**Bottom-up DP (single DFS returning a tuple)** — each node visited once:

```java
public int rob(TreeNode root) {
    int[] res = dfs(root);
    return Math.max(res[0], res[1]);
}
// returns [robThis, skipThis]
private int[] dfs(TreeNode node) {
    if (node == null) return new int[]{0, 0};
    int[] l = dfs(node.left);
    int[] r = dfs(node.right);
    int rob    = node.val + l[1] + r[1];
    int notRob = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);
    return new int[]{rob, notRob};
}
```

- **Brute force:** `O(2ⁿ)` time (subtrees recomputed)
- **DP:** `O(n)` time, `O(h)` recursion stack

---

## 11. LIS / Sequence DP

**Pattern:** For each index, find best answer ending at `i` by scanning prior indices; or use patience-sort with binary search for `O(n log n)`.

**Use cases:**
- Longest Increasing Subsequence
- Longest Bitonic Subsequence
- Russian Doll Envelopes
- Number of LIS

### How to identify
- Need a subsequence (not subarray) satisfying an order constraint
- Standard `O(n²)`: `dp[i] = 1 + max(dp[j])` for valid `j < i`
- Optimised `O(n log n)`: maintain `tails[]` array, binary search insertion point

### Example — Longest Increasing Subsequence (`O(n log n)`)
> Given an integer array, return the length of the longest strictly increasing subsequence.

- Maintain `tails[k]` = smallest possible tail value of an increasing subsequence of length `k+1`
- For each `num`, binary-search the leftmost `tails[i] >= num` and replace it (or append if none)
- Final length of `tails` is the LIS length (the array itself is **not** a valid LIS, only its length is meaningful)

**Brute force (recursion)** — for every index, branch include vs skip while tracking previous:

```java
public int lengthOfLIS(int[] nums) {
    return helper(nums, -1, 0);
}
private int helper(int[] nums, int prev, int i) {
    if (i == nums.length) return 0;
    int skip = helper(nums, prev, i + 1);
    int take = 0;
    if (prev == -1 || nums[i] > nums[prev])
        take = 1 + helper(nums, i, i + 1);
    return Math.max(skip, take);
}
```

**`O(n²)` DP** — `dp[i]` = LIS ending at `i`:

```java
public int lengthOfLIS(int[] nums) {
    int n = nums.length, best = 0;
    int[] dp = new int[n];
    for (int i = 0; i < n; i++) {
        dp[i] = 1;
        for (int j = 0; j < i; j++)
            if (nums[j] < nums[i])
                dp[i] = Math.max(dp[i], dp[j] + 1);
        best = Math.max(best, dp[i]);
    }
    return best;
}
```

**`O(n log n)` DP** — patience sort / binary search:

```java
public int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];
    int size = 0;
    for (int num : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < num) lo = mid + 1;
            else hi = mid;
        }
        tails[lo] = num;
        if (lo == size) size++;
    }
    return size;
}
```

- **Brute force:** `O(2ⁿ)` time
- **DP:** `O(n²)` simple, `O(n log n)` optimised; `O(n)` space

---

## Quick Pattern Lookup

| # | Pattern            | State           | Identify by                            | Classic problem            |
|---|--------------------|-----------------|----------------------------------------|----------------------------|
| 1 | 1D Linear          | `dp[i]`         | Depends on prev 1–2 elements           | House Robber               |
| 2 | 2D Grid            | `dp[i][j]`      | Move on grid, top-left → bottom-right  | Min Path Sum               |
| 3 | 0/1 Knapsack       | `dp[i][w]`      | Each item once, descending inner loop  | Partition Equal Subset Sum |
| 4 | Unbounded Knapsack | `dp[i]`         | Item reusable, ascending inner loop    | Coin Change                |
| 5 | Interval           | `dp[i][j]`      | Range answer built from sub-ranges     | Burst Balloons             |
| 6 | LCS / String       | `dp[i][j]`      | Two sequences aligned / compared       | Edit Distance              |
| 7 | State Machine      | `dp[i][state]`  | Named states with transitions          | Stock with Cooldown        |
| 8 | Bitmask            | `dp[mask][i]`   | `n ≤ 20`, track used subset            | Shortest Path All Nodes    |
| 9 | Game Theory        | `dp[i][j]`      | Two players, optimal play              | Predict the Winner         |
| 10| Tree DP            | DFS returns tuple | Answer aggregates from children      | House Robber III           |
| 11| LIS / Sequence     | `dp[i]` or `tails[]` | Longest ordered subsequence       | Longest Increasing Subseq. |

---

## Other Patterns Worth Knowing

| Pattern              | When to use                                                              | Classic problem                  |
|----------------------|--------------------------------------------------------------------------|----------------------------------|
| **Digit DP**         | Count numbers in `[L, R]` with a digit property; state `(pos, tight, ...)` | Count numbers ≤ N with no `4`    |
| **Probability / EV** | Random transitions; `dp[state] = Σ p · dp[next]`                         | Knight Probability on Chessboard |
| **DP + Bitmask on subsets** | Iterate submasks `for (s = mask; s; s = (s-1) & mask)`            | Partition to K Equal Subsets     |
| **DP on DAG**        | Longest/shortest path when graph is acyclic; topo-order relax            | Longest Path in DAG              |
| **SOS DP (Sum over Subsets)** | Aggregate over all subsets in `O(2ⁿ · n)`                       | Subset Sum Queries               |


