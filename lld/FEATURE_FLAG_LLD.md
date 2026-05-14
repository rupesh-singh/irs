# Feature Flag Service - LLD Interview Guide

## Problem Statement

Design a **Feature Flag Service** that controls feature rollout with multiple strategies: simple on/off toggles, attribute-based targeting rules, and percentage-based experiment allocation. Support multi-variate experiments with deterministic user bucketing.

---

## Requirements

### Functional Requirements
1. Register and remove feature flags
2. **Simple Toggle** — enable/disable a feature globally
3. **Targeted Toggle** — enable for users matching attribute conditions (e.g., plan=premium)
4. **Experiment** — multi-variate with targeting rules + percentage-based allocation
5. Deterministic evaluation — same user always gets the same variant
6. Kill switch — disable any flag instantly regardless of rules

### Non-Functional Requirements
- Deterministic (hash-based) bucketing — no randomness per request
- Priority-based rule evaluation
- Validation of percentage allocations (must sum ≤ 100)
- Extensible for new rule types

---

## Evaluation Flow

```
evaluate(flagKey, user)
       │
       ▼
  Flag exists? ──No──► return (null, disabled)
       │
      Yes
       ▼
  Flag enabled? ──No──► return (defaultVariant, disabled)
       │
      Yes
       ▼
  Flag type?
       │
  ┌────┴────┐
  │         │
TOGGLE   EXPERIMENT
  │         │
  ▼         ▼
Rules?    Rules match? ──Yes──► return rule.variant
  │         │
 No rules   No match
  │         │
  ▼         ▼
return    Percentage allocation
"on"      hash(userId:flagKey) % 100
          │
          ▼
        In bucket? ──Yes──► return allocated variant
          │
         No (outside %)
          │
          ▼
        return defaultVariant
```

---

## Class Diagram

```
┌───────────────────────────────┐
│       UserContext              │
├───────────────────────────────┤
│ - userId: String              │
│ - attributes: Map<String,String>│
├───────────────────────────────┤
│ + getUserId(): String         │
│ + getAttribute(key): String   │
└───────────────────────────────┘

┌───────────────────────────────────────┐
│       TargetingRule                   │
├───────────────────────────────────────┤
│ - priority: int (lower = higher)      │
│ - conditions: Map<String,String> (AND)│
│ - variant: String                     │
├───────────────────────────────────────┤
│ + matches(UserContext): boolean       │
│ + compareTo(TargetingRule): int       │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│       FlagType (enum)                 │
├───────────────────────────────────────┤
│ TOGGLE, EXPERIMENT                    │
└───────────────────────────────────────┘

┌───────────────────────────────────────────┐
│       FlagDefinition                      │
├───────────────────────────────────────────┤
│ - key: String                             │
│ - type: FlagType                          │
│ - enabled: boolean                        │
│ - variants: List<String>                  │
│ - defaultVariant: String                  │
│ - targetingRules: List<TargetingRule>      │
│ - percentageAllocation: Map<String,Integer>│
├───────────────────────────────────────────┤
│ + toggle(key, enabled): FlagDefinition    │
│ + toggle(key, enabled, rules): FlagDef    │
│ - validateAllocation(): void              │
└───────────────────────────────────────────┘

┌───────────────────────────────────────┐
│       EvaluationResult                │
├───────────────────────────────────────┤
│ - variant: String                     │
│ - enabled: boolean                    │
└───────────────────────────────────────┘

┌───────────────────────────────────────────┐
│       FeatureFlagService                  │
├───────────────────────────────────────────┤
│ - flags: Map<String, FlagDefinition>      │
├───────────────────────────────────────────┤
│ + registerFlag(FlagDefinition): void      │
│ + removeFlag(key): void                   │
│ + evaluate(flagKey, UserContext): Result   │
│ - evaluateToggle(flag, user): Result      │
│ - evaluateExperiment(flag, user): Result  │
│ - resolveByPercentage(flag, user): String │
│ - getBucket(userId, flagKey): int         │
└───────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `FlagType` enum (TOGGLE vs EXPERIMENT) | Clear separation of simple and complex flag behavior |
| Priority-based rules (sorted) | First matching rule wins — predictable evaluation order |
| AND conditions in rules | All conditions must match — simple yet powerful |
| `hash(userId + flagKey) % 100` | Deterministic bucketing — same user always gets same variant |
| Allocation validation (≤ 100%) | Partial rollout supported — unallocated % gets default variant |
| Kill switch (`enabled` flag) | Instant disable without modifying rules |
| Factory methods for toggles | Convenience API — most flags are simple on/off |

---

## Percentage Allocation (Hash Bucketing)

```
User "user-303" + Flag "checkout_redesign"
    │
    ▼
hash("user-303:checkout_redesign") % 100 = bucket (e.g., 42)
    │
    ▼
Allocation: control=50, variant_A=30 (total=80)
    │
    ▼
bucket 42 < 50 → "control"

If bucket was 65 → 50 ≤ 65 < 80 → "variant_A"
If bucket was 90 → 90 ≥ 80 → falls to default ("control")
```

---

## Implementation

```java
package featureflagdemo;

import java.util.*;

// --- User Context ---
class UserContext {
    private final String userId;
    private final Map<String, String> attributes;

    public UserContext(String userId, Map<String, String> attributes) {
        this.userId = userId;
        this.attributes = attributes != null ? attributes : new HashMap<>();
    }

    public String getUserId() { return userId; }
    public Map<String, String> getAttributes() { return attributes; }
    public String getAttribute(String key) { return attributes.get(key); }
}

// --- Targeting Rule ---
class TargetingRule implements Comparable<TargetingRule> {
    private final int priority;
    private final Map<String, String> conditions;  // all must match (AND)
    private final String variant;

    public TargetingRule(int priority, Map<String, String> conditions, String variant) {
        this.priority = priority;
        this.conditions = conditions;
        this.variant = variant;
    }

    public int getPriority() { return priority; }
    public String getVariant() { return variant; }

    public boolean matches(UserContext user) {
        return conditions.entrySet().stream()
                .allMatch(e -> e.getValue().equals(user.getAttribute(e.getKey())));
    }

    @Override
    public int compareTo(TargetingRule other) {
        return Integer.compare(this.priority, other.priority);
    }
}

// --- Flag Type ---
enum FlagType {
    TOGGLE,      // simple on/off
    EXPERIMENT   // multi-variate with allocation + rules
}

// --- Flag Definition ---
class FlagDefinition {
    private final String key;
    private final FlagType type;
    private boolean enabled;
    private final List<String> variants;
    private final String defaultVariant;
    private final List<TargetingRule> targetingRules;
    private final Map<String, Integer> percentageAllocation;

    public FlagDefinition(String key, FlagType type, boolean enabled, List<String> variants,
                          String defaultVariant, List<TargetingRule> targetingRules,
                          Map<String, Integer> percentageAllocation) {
        this.key = key;
        this.type = type;
        this.enabled = enabled;
        this.variants = variants;
        this.defaultVariant = defaultVariant;
        this.targetingRules = targetingRules != null ? targetingRules : new ArrayList<>();
        this.percentageAllocation = percentageAllocation != null ? percentageAllocation : new LinkedHashMap<>();
        Collections.sort(this.targetingRules);
        if (type == FlagType.EXPERIMENT) {
            validateAllocation();
        }
    }

    public static FlagDefinition toggle(String key, boolean enabled) {
        return new FlagDefinition(key, FlagType.TOGGLE, enabled,
                List.of("on", "off"), "off", null, null);
    }

    public static FlagDefinition toggle(String key, boolean enabled, List<TargetingRule> rules) {
        return new FlagDefinition(key, FlagType.TOGGLE, enabled,
                List.of("on", "off"), "off", rules, null);
    }

    private void validateAllocation() {
        int total = percentageAllocation.values().stream().mapToInt(Integer::intValue).sum();
        if (total > 100) {
            throw new IllegalArgumentException(
                    "Percentage allocation for flag '" + key + "' sums to " + total + ", must be ≤ 100");
        }
        for (Map.Entry<String, Integer> entry : percentageAllocation.entrySet()) {
            if (entry.getValue() < 0) {
                throw new IllegalArgumentException(
                        "Negative allocation for variant '" + entry.getKey() + "' in flag '" + key + "'");
            }
            if (!variants.contains(entry.getKey())) {
                throw new IllegalArgumentException(
                        "Allocation references unknown variant '" + entry.getKey() + "' in flag '" + key + "'");
            }
        }
    }

    public String getKey() { return key; }
    public FlagType getType() { return type; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public List<String> getVariants() { return variants; }
    public String getDefaultVariant() { return defaultVariant; }
    public List<TargetingRule> getTargetingRules() { return targetingRules; }
    public Map<String, Integer> getPercentageAllocation() { return percentageAllocation; }
}

// --- Evaluation Result ---
class EvaluationResult {
    private final String variant;
    private final boolean enabled;

    public EvaluationResult(String variant, boolean enabled) {
        this.variant = variant;
        this.enabled = enabled;
    }

    public String getVariant() { return variant; }
    public boolean isEnabled() { return enabled; }
}

// --- Feature Flag Service ---
class FeatureFlagService {
    private final Map<String, FlagDefinition> flags = new HashMap<>();

    public void registerFlag(FlagDefinition flag) {
        flags.put(flag.getKey(), flag);
    }

    public void removeFlag(String key) {
        flags.remove(key);
    }

    public EvaluationResult evaluate(String flagKey, UserContext user) {
        FlagDefinition flag = flags.get(flagKey);
        if (flag == null) {
            return new EvaluationResult(null, false);
        }

        // Kill switch
        if (!flag.isEnabled()) {
            return new EvaluationResult(flag.getDefaultVariant(), false);
        }

        if (flag.getType() == FlagType.TOGGLE) {
            return evaluateToggle(flag, user);
        } else {
            return evaluateExperiment(flag, user);
        }
    }

    private EvaluationResult evaluateToggle(FlagDefinition flag, UserContext user) {
        if (flag.getTargetingRules().isEmpty()) {
            return new EvaluationResult("on", true);
        }
        for (TargetingRule rule : flag.getTargetingRules()) {
            if (rule.matches(user)) {
                return new EvaluationResult("on", true);
            }
        }
        return new EvaluationResult("off", false);
    }

    private EvaluationResult evaluateExperiment(FlagDefinition flag, UserContext user) {
        // Rules first (attribute-based targeting)
        for (TargetingRule rule : flag.getTargetingRules()) {
            if (rule.matches(user)) {
                return new EvaluationResult(rule.getVariant(), true);
            }
        }

        // Hash-based percentage rollout
        String variant = resolveByPercentage(flag, user);
        if (variant != null) {
            return new EvaluationResult(variant, true);
        }

        return new EvaluationResult(flag.getDefaultVariant(), true);
    }

    private String resolveByPercentage(FlagDefinition flag, UserContext user) {
        if (flag.getPercentageAllocation().isEmpty()) {
            return null;
        }
        int bucket = getBucket(user.getUserId(), flag.getKey());
        int cumulative = 0;
        for (Map.Entry<String, Integer> entry : flag.getPercentageAllocation().entrySet()) {
            cumulative += entry.getValue();
            if (bucket < cumulative) {
                return entry.getKey();
            }
        }
        return null; // outside allocated percentage
    }

    private int getBucket(String userId, String flagKey) {
        int hash = (userId + ":" + flagKey).hashCode();
        return Math.abs(hash % 100);
    }
}
```

### Demo / Driver

```java
public class FeatureFlagDemo {
    public static void main(String[] args) {
        FeatureFlagService service = new FeatureFlagService();

        // 1. Simple toggle
        FlagDefinition darkMode = FlagDefinition.toggle("dark_mode", true);
        service.registerFlag(darkMode);

        // 2. Toggle with targeting rules (premium only)
        List<TargetingRule> toggleRules = new ArrayList<>();
        toggleRules.add(new TargetingRule(1, Map.of("plan", "premium"), "on"));
        FlagDefinition betaFeature = FlagDefinition.toggle("beta_feature", true, toggleRules);
        service.registerFlag(betaFeature);

        // 3. Experiment: multi-variate with rules + percentage rollout
        List<TargetingRule> expRules = new ArrayList<>();
        expRules.add(new TargetingRule(1, Map.of("plan", "premium"), "variant_A"));
        expRules.add(new TargetingRule(2, Map.of("region", "US"), "variant_B"));

        Map<String, Integer> allocation = new LinkedHashMap<>();
        allocation.put("control", 50);
        allocation.put("variant_A", 30);
        // total = 80% → remaining 20% gets default

        FlagDefinition experiment = new FlagDefinition(
                "checkout_redesign", FlagType.EXPERIMENT, true,
                List.of("control", "variant_A", "variant_B"),
                "control", expRules, allocation
        );
        service.registerFlag(experiment);

        // Evaluate
        UserContext premiumUser = new UserContext("user-101", Map.of("plan", "premium", "region", "EU"));
        UserContext usUser = new UserContext("user-202", Map.of("plan", "free", "region", "US"));
        UserContext regularUser = new UserContext("user-303", Map.of("plan", "free", "region", "EU"));

        System.out.println(service.evaluate("dark_mode", regularUser).getVariant());       // "on"
        System.out.println(service.evaluate("beta_feature", premiumUser).getVariant());    // "on"
        System.out.println(service.evaluate("beta_feature", regularUser).getVariant());    // "off"
        System.out.println(service.evaluate("checkout_redesign", premiumUser).getVariant()); // "variant_A" (rule)
        System.out.println(service.evaluate("checkout_redesign", usUser).getVariant());      // "variant_B" (rule)
        System.out.println(service.evaluate("checkout_redesign", regularUser).getVariant()); // hash-based
    }
}
```

---

## Interview Discussion Points

### Q: Why hash-based bucketing instead of random?
**A:** Deterministic — the same user always sees the same variant. This is crucial for:
- Consistent UX (no flickering between variants)
- Valid experiment results (user stays in same cohort)
- Debugging (reproducible behavior)

### Q: What if allocation sums to less than 100%?
**A:** Users whose bucket falls outside the allocated range get the `defaultVariant`. This enables **gradual rollout** — start at 10%, increase to 50%, then 100%.

### Q: How do targeting rules interact with percentage allocation?
**A:** Rules are evaluated first (priority order). If a rule matches, its variant is returned immediately — percentage allocation is skipped. This allows VIP overrides.

### Q: How would you extend this?
- **OR conditions** — support OR logic in targeting rules
- **Segment-based targeting** — pre-defined user segments
- **Mutual exclusion** — ensure a user is in only one experiment
- **Audit log** — track all flag changes
- **Remote config** — fetch flags from a config service (LaunchDarkly, Unleash)
- **Stickiness** — override hash key (e.g., session-based instead of user-based)
- **Scheduled rollout** — auto-enable at a future timestamp

### Q: Real-world systems?
- **LaunchDarkly** — industry-leading feature flag service
- **Unleash** — open-source feature toggles
- **Split.io** — experimentation platform
- **Firebase Remote Config** — mobile feature flags
- **Azure App Configuration** — feature management for Azure apps

---

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| evaluate() | O(R) where R = number of rules | O(1) |
| registerFlag() | O(R log R) for sorting rules | O(R + V) |
| getBucket() | O(1) — hash computation | O(1) |
| Overall space | — | O(F × R) where F = flags, R = avg rules per flag |
