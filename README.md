# IRS

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

---
Happy Vibe coding! 🚀

