# IRS

## Features
- Single accordion-based browsing experience (topics collapse, problems expand inline)
- Source of truth is `ProblemList.xlsx`, exported to JSON with one command
- Inline Java solution with syntax highlighting (Highlight.js)
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
ProblemList.xlsx # Master spreadsheet (title/id/topic/difficulty/tags/statement/solution)
problems.json    # Auto-generated JSON consumed by the UI
tools/build-problems-json.js # Helper to convert the spreadsheet to JSON
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
1. Open `ProblemList.xlsx` and edit/add rows (do **not** rename the existing column headers).
2. Regenerate the JSON that powers the site:

	```powershell
	npm run build:data
	```

	This reads the spreadsheet and rewrites `problems.json` with the exact sheet contents.
3. Refresh the site (or restart `npm start`) to pick up the changes.

---
Happy studying! 🚀


