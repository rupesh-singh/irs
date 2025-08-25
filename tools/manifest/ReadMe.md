# Manifest Builder (frictionless content updates)

This tool generates `data.generated.json` from simple files so you don’t have to edit large JSON by hand.

Supports two sources (use any or both):
1) problems/<topic>/<slug>/
   - problem.md (YAML front matter + Markdown body)
   - solution.java (or .py/.cpp/.md)
2) solutions/<slug>.<ext>
   - If no per-problem folder exists, the builder links this as the solution.

Merging order in the app (no runtime changes required on your part):
- App prefers `data.generated.json`; falls back to `data.json`.
- App also merges `data.neetcode150.skeleton.json` (optional) for items not in the base.

## Front matter
At the top of `problem.md`:
```yaml
---
id: two-sum
title: Two Sum
topic: Arrays & Hashing
difficulty: Easy
tags: [hashmap, array]
link: https://example.com/optional
---
```

## Build
```powershell
cd tools/manifest
node build.js
```
Outputs `../../data.generated.json`.

## Quick add helper
```powershell
node add-problem.js "Two Sum" --topic "Arrays & Hashing" --difficulty Easy --id "two-sum"
```
Creates: `../../problems/Arrays & Hashing/two-sum/problem.md` and `solution.java`.
