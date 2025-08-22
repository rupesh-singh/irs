# Dynamic Programming Cheatsheet

## Patterns
- 1D DP (climb stairs, house robber)
- 2D DP (LCS, edit distance)
- Knapsack variants

## Tips
- Define state, transition, base case, order
- Space optimize with rolling arrays

## Table

| Problem | State | Transition |
|---|---|---|
| Climb Stairs | dp[i] | dp[i-1] + dp[i-2] |
| LCS | dp[i][j] | max(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]+match) |

<details>
<summary>When to use DP?</summary>
Use DP when greedy fails and subproblems overlap.
</details>
