Drop per-problem solutions here to override JSON code on the back of flashcards.

Naming: <problem-id>.<ext>
- Preferred: .java (will be highlighted as Java)
- Also supported: .txt, .md

Examples:
- two-sum.java
- reverse-integer.java

Notes:
- The app will first try to load .java, then .txt, then .md.
- If no matching file is found, it falls back to the solutionJava string from data.json.
- Browser fetch requires these files be served by your local server (opening index.html directly as a file may block fetch).
