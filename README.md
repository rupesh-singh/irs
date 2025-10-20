# IRS

## Features
- Single accordion-based browsing experience (topics collapse, problems expand inline)
- Topic & problem data derived from JSON (no hardcoding of lists)
- Inline Java solution with syntax highlighting (Highlight.js)
- External solution override support (`solutions/<id>.java|md|txt`) loaded lazily
- Light / Dark theme toggle (persisted in localStorage)
- Mobile friendly & responsive layout
- Graceful fallback if problem data fails to load
- Accessible (keyboard navigation, ARIA labels, focus management, skip link)
- Fast global search from Home (jumps to accordion / docs)

## File Structure
```
index.html       # Entry page, loads React via CDN
styles.css       # Themed responsive styles & animations
app.js           # React components & logic
data.json        # Sample problems (fallback if generated not present)
data.generated.json # Build output from tools/manifest/build.js
README.md        # This document
```

## Browsing Problems (Accordion)
From Home choose the "Accordion list view" tile (or hit a problem via global search):
* Collapsible topics display problem counts
* Expand a topic, then expand a problem for description + solution
* Lazy loading of external solution file if present
* Inline syntax highlighting (auto-matches theme)
* Keyboard friendly (Tab through toggles; Enter/Space to expand)

## Updating Data
Use `node tools/manifest/add-problem.js "Title" --topic "Topic" --difficulty Easy` then `node tools/manifest/build.js` to regenerate `data.generated.json`.

---
Happy studying! 🚀


