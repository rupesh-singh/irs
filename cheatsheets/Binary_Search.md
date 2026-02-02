How to correctly set bounds for binary search ?

----------------

This confusion is extremely common, even among experienced engineers — and it’s a great sign you’re asking this, because once this clicks, binary search becomes mechanical instead of guessy.

I’ll explain this in a clean mental model, not memorization.

1️⃣ Root Cause of Confusion

Most people mix two different binary search goals:

Goal	Example
Find exact element	nums[mid] == target
Find boundary / minimum valid value	Minimum capacity, minimum speed, first true

👉 Problems like Ship Within Days, Koko Eating Bananas, Split Array, etc. are NOT searching for an element — they’re searching for a boundary.

This requires a lower-bound binary search.

2️⃣ What Is Lower Bound Binary Search?
Definition (Very Important)

Lower bound finds the smallest value x such that a condition becomes true.

Visualize:

false false false false true true true
                  ↑
              answer (first true)


Your job:

Find the first position/value where condition flips from false → true.

3️⃣ Golden Rule (Memorize This)

If mid is valid, keep it — don’t discard it.

That single rule removes all confusion.

4️⃣ Binary Search Templates (ONLY TWO YOU NEED)
✅ Template 1: Lower Bound (Most Important)

Used when:

Looking for minimum

Condition is monotonic (false → true)

Template
while (left < right) {
    int mid = left + (right - left) / 2;

    if (isValid(mid)) {
        right = mid;        // keep mid
    } else {
        left = mid + 1;     // discard mid
    }
}
return left;

Why?

mid might be the answer

So we keep it in search space

❌ Why NOT right = mid - 1 here?

Because:

You would discard a valid candidate

You might skip the smallest valid answer

5️⃣ Template 2: Exact Match Search (Rare in LeetCode)

Used when:

Searching for an exact number

Not monotonic

Template
while (left <= right) {
    int mid = left + (right - left) / 2;

    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
}


👉 This is where mid - 1 appears.

6️⃣ How to Decide Which Template to Use (Instant Test)

Ask yourself this:

“Am I searching for a value, or the first point where a condition becomes true?”

Answer	Template
Exact value	Exact-match (mid ± 1)
Minimum / Maximum	Lower / Upper bound
7️⃣ Apply This to Your Problem (Ship Within Days)
Question

“What is the minimum capacity that allows shipping in D days?”

Search Space
capacity: [maxWeight ... totalWeight]

Condition
isValid(capacity):
    can ship in <= D days


This produces:

false false false true true true


👉 You want the first true
👉 That is lower bound

Correct Update
if (isValid(mid)) {
    right = mid;   // keep mid
} else {
    left = mid + 1;
}

8️⃣ Why left < right (Not <=)?

Because:

We stop when search space collapses to one element

That element is the answer

9️⃣ Common Binary Search Problems = Lower Bound

If the problem asks for:

1. Minimum capacity
2. Minimum speed
3. Minimum days
4. Maximum minimum
5. Split array
6. Koko bananas

Shipping packages

👉 ALWAYS lower bound

🔟 Mental Checklist (Use This Every Time)

Before writing code:

Is my answer a minimum / maximum?
Is the condition monotonic?
If mid is valid, should I keep it?
If yes → lower bound

🧠 One-Liner to Memorize (Interview Gold)

“When searching for a minimum valid value, I use lower-bound binary search — if mid works, I keep it and move right to mid.”

🏁 Final Summary
Question	Answer
Why confusion happens	Mixing two binary search types
What is lower bound	First true in monotonic condition
When to use right = mid	Mid might be answer
When to use right = mid - 1	Exact-match search only
Key mental rule	Never discard a valid mid