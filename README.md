# DSA Revision Tool (NeetCode 150 Flashcards)

Swipeable, mobile‑first flashcard web app to quickly revise NeetCode 150 problems by topic. Built with vanilla React + CSS (no build step) so you can just open `index.html` locally or deploy statically (GitHub Pages / Vercel / Netlify).

## Features
- Topic list derived from data (no hardcoding)
- Flip + swipe style cards (tap, click, arrow keys, or swipe)
- Java solution on the back with syntax highlighting via Highlight.js
- Progress per topic persisted in `localStorage`
- Shuffle mode (persisted) for random ordering within a topic
- Light / Dark theme toggle
- Mobile friendly + responsive layout
- Graceful fallback if data fails to load
- Accessible (keyboard navigation, ARIA labels, focus flip)

## File Structure
```
index.html       # Entry page, loads React via CDN
styles.css       # Themed responsive styles & animations
app.js           # React components & logic
data.json        # Sample problems (replace with full list later)
README.md        # This document
```

## Replacing Sample Data With Full NeetCode 150
1. Open `data.json`.
2. Replace the current sample array with an array of 150 problem objects shaped like:
```jsonc
{
  "id": "<uuid>",        // Generate a UUID (can use online generator). Must be unique.
  "title": "Two Sum",
  "topic": "Arrays",      // Consistent topic names used for grouping
  "description": "Problem statement text...",
  "solutionJava": "// Java solution code here..."
}
```
3. Keep topics consistent (e.g., Arrays, Hash Map, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Tries, Heap, Backtracking, Graphs, Intervals, Greedy, DP, Bit Manipulation, Math, etc.).
4. (Optional) You can split very long code blocks into multiple lines; they will scroll.

## Adding More Languages
Add extra fields (e.g., `solutionPython`, `solutionCpp`) and extend the card back to show a tab selector. Highlight.js auto-detect or per-language classes can be used.

## Development / Customization
Because this is build‑less, just open `index.html` in a modern browser. For local file syntax highlighting to work reliably across browsers, you may want to serve via a tiny static server:

### Simple Local Server (PowerShell / Node if installed)
```powershell
npx serve .
# or
python -m http.server 5173
```
Then visit http://localhost:5173 (adjust port as needed).

### Theming
Theme is toggled by adding/removing the `light` class on `<html>`. Adjust CSS variables in `:root` & `html.light` in `styles.css`.

### Animations
Currently using CSS transitions. You can swap for `react-spring`:
1. Add CDN `<script src="https://unpkg.com/@react-spring/web@9/dist/react-spring-web.umd.js"></script>` in `index.html`.
2. Replace manual class logic with springs inside the `FlashCard` / container.

## Deployment
Any static host works:
- **GitHub Pages:** Commit and push, enable Pages (root). Access via `https://<user>.github.io/<repo>/`.
- **Vercel:** `vercel deploy` (project root). No build step needed.
- **Netlify:** Drag & drop folder or link repo; root publish directory is the repository root.

## Accessibility Notes
- Cards are buttons for flip; Enter/Space flips.
- Arrow keys navigate problems.
- Progress text (#/#) displayed consistently.

## LocalStorage Keys
- `dsa_revision_progress_v1` – object: `{ [topic: string]: index }`
- `dsa_revision_theme` – `'dark' | 'light'`
- `dsa_revision_shuffle` – `'1' | '0'`

## Error Handling
If `data.json` fails to load (e.g., network), a red error message shows. The rest of the UI still renders.

## Extending (Ideas)
- Add search across titles
- Add spaced repetition (Leitner system with buckets)
- Add difficulty tagging & filters
- Track last reviewed timestamp per problem
- Import / export progress as JSON
- Add settings panel (font size, code wrapping)
- Multi-language solutions toggle

## License / Attribution
This starter is yours to adapt. NeetCode problem list belongs to its respective owner; ensure compliance with any usage guidelines.

---
Happy revising! 🚀
