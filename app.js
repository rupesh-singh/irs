/* DSA Revision Tool - React implementation
 * Features: Topic listing, swipe/flip cards, progress persistence, shuffle mode, dark/light, graceful fallback.
 * NOTE: Sample data loaded from data.json (replace later with full NeetCode 150).
 */

const { useState, useEffect, useCallback, useRef, useMemo } = React;

// External solution loading (per-problem), e.g., solutions/<id>.java
const SOLUTION_DIR = 'solutions';
const SOLUTION_EXTS = ['java', 'txt', 'md'];
const solutionCache = new Map(); // id -> string|null (null means not found)

async function fetchExternalSolution(id) {
  if (solutionCache.has(id)) return solutionCache.get(id);
  for (const ext of SOLUTION_EXTS) {
    const url = `${SOLUTION_DIR}/${id}.${ext}`;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        const txt = await res.text();
        solutionCache.set(id, txt);
        return txt;
      }
    } catch (_) { /* ignore network errors; try next */ }
  }
  solutionCache.set(id, null);
  return null;
}

// Curated descriptionHtml for older entries (brief statement + tiny example)
const ENRICHED_DESC = {
  'valid-anagram': `<p><strong>Valid Anagram</strong></p><p>Check if two strings are anagrams of each other (same character counts).</p><p><em>Example:</em> s="anagram", t="nagaram" → true</p>`,
  'two-sum': `<p><strong>Two Sum</strong></p><p>Return indices of the two numbers such that they add up to target.</p><p><em>Example:</em> nums=[2,7,11,15], target=9 → [0,1]</p>`,
  'group-anagrams': `<p><strong>Group Anagrams</strong></p><p>Group words that are anagrams of each other.</p><p><em>Example:</em> ["eat","tea","tan","ate","nat","bat"] → [["eat","tea","ate"],["tan","nat"],["bat"]]</p>`,
  'top-k-frequent-elements': `<p><strong>Top K Frequent Elements</strong></p><p>Return the k most frequent elements in the array.</p><p><em>Example:</em> nums=[1,1,1,2,2,3], k=2 → [1,2]</p>`,
  'encode-and-decode-strings': `<p><strong>Encode and Decode Strings</strong></p><p>Design methods to encode a list of strings to a single string and decode it back.</p><p><em>Example:</em> encode(["lint","code"]) → "4#lint4#code"</p>`,
  'product-of-array-except-self': `<p><strong>Product of Array Except Self</strong></p><p>Return array where each element is the product of all other elements.</p><p><em>Example:</em> [1,2,3,4] → [24,12,8,6]</p>`,
  'valid-sudoku': `<p><strong>Valid Sudoku</strong></p><p>Check whether a 9×9 Sudoku board is valid (rows, columns, 3×3 boxes).</p><p><em>Example:</em> Valid if no duplicates ignoring '.'.</p>`,
  'longest-consecutive-sequence': `<p><strong>Longest Consecutive Sequence</strong></p><p>Find the length of the longest consecutive elements sequence.</p><p><em>Example:</em> [100,4,200,1,3,2] → 4</p>`,
  'valid-palindrome': `<p><strong>Valid Palindrome</strong></p><p>Check if a string reads the same after removing non-alphanumerics and ignoring case.</p><p><em>Example:</em> "A man, a plan, a canal: Panama" → true</p>`,
  '3sum': `<p><strong>3Sum</strong></p><p>Find all unique triplets that sum to zero.</p><p><em>Example:</em> [-1,0,1,2,-1,-4] → [[-1,-1,2],[-1,0,1]]</p>`,
  'container-with-most-water': `<p><strong>Container With Most Water</strong></p><p>Find two lines that with the x-axis form a container holding the most water.</p><p><em>Example:</em> [1,8,6,2,5,4,8,3,7] → 49</p>`,
  'trapping-rain-water': `<p><strong>Trapping Rain Water</strong></p><p>Compute how much water can be trapped after raining.</p><p><em>Example:</em> [4,2,0,3,2,5] → 9</p>`,
  'best-time-to-buy-and-sell-stock': `<p><strong>Best Time to Buy and Sell Stock</strong></p><p>Max profit from one buy and one sell.</p><p><em>Example:</em> [7,1,5,3,6,4] → 5</p>`,
  'longest-substring-without-repeating-characters': `<p><strong>Longest Substring Without Repeating Characters</strong></p><p>Length of the longest substring without repeating characters.</p><p><em>Example:</em> "abcabcbb" → 3</p>`,
  'longest-repeating-character-replacement': `<p><strong>Longest Repeating Character Replacement</strong></p><p>Longest substring that can be turned into all the same letter with ≤ k replacements.</p><p><em>Example:</em> s="ABAB", k=2 → 4</p>`,
  'minimum-window-substring': `<p><strong>Minimum Window Substring</strong></p><p>Smallest window in s that contains all characters of t.</p><p><em>Example:</em> s="ADOBECODEBANC", t="ABC" → "BANC"</p>`,
  'valid-parentheses': `<p><strong>Valid Parentheses</strong></p><p>Check if parentheses are valid and properly nested.</p><p><em>Example:</em> "()[]{}" → true, "(]" → false</p>`,
  'generate-parentheses': `<p><strong>Generate Parentheses</strong></p><p>Generate all combinations of n pairs of valid parentheses.</p><p><em>Example:</em> n=3 → ["((()))","(()())","(())()","()(())","()()()"]</p>`,
  'daily-temperatures': `<p><strong>Daily Temperatures</strong></p><p>For each day, find how many days to wait until a warmer temperature.</p><p><em>Example:</em> [73,74,75,71,69,72,76,73] → [1,1,4,2,1,1,0,0]</p>`,
  'car-fleet': `<p><strong>Car Fleet</strong></p><p>How many car fleets will arrive at the destination.</p><p><em>Example:</em> target=12, pos=[10,8,0,5,3], speed=[2,4,1,1,3] → 3</p>`,
  'largest-rectangle-in-histogram': `<p><strong>Largest Rectangle in Histogram</strong></p><p>Find the area of the largest rectangle in the histogram.</p><p><em>Example:</em> [2,1,5,6,2,3] → 10</p>`,
  'binary-search': `<p><strong>Binary Search</strong></p><p>Search target in a sorted array in O(log n) time.</p><p><em>Example:</em> nums=[-1,0,3,5,9,12], target=9 → 4</p>`,
  'search-in-rotated-sorted-array': `<p><strong>Search in Rotated Sorted Array</strong></p><p>Find target in rotated sorted array in O(log n).</p><p><em>Example:</em> nums=[4,5,6,7,0,1,2], target=0 → 4</p>`,
  'find-minimum-in-rotated-sorted-array': `<p><strong>Find Minimum in Rotated Sorted Array</strong></p><p>Return the minimum element of a rotated sorted array.</p><p><em>Example:</em> [3,4,5,1,2] → 1</p>`,
  'kth-largest-element-in-an-array': `<p><strong>Kth Largest Element in an Array</strong></p><p>Find the kth largest element (not necessarily distinct) in an unsorted array.</p><p><em>Example:</em> nums=[3,2,1,5,6,4], k=2 → 5</p>`,
  'merge-k-sorted-lists': `<p><strong>Merge k Sorted Lists</strong></p><p>Merge k sorted linked lists and return one sorted list.</p><p><em>Example:</em> [[1,4,5],[1,3,4],[2,6]] → [1,1,2,3,4,4,5,6]</p>`,
  'number-of-islands': `<p><strong>Number of Islands</strong></p><p>Count islands (connected groups of '1's) in a 2D grid.</p><p><em>Example:</em> grid=[["1","1","0"],["0","1","0"],["1","0","1"]] → 3</p>`,
  'rotting-oranges': `<p><strong>Rotting Oranges</strong></p><p>Minutes until no fresh orange remains; -1 if impossible.</p><p><em>Example:</em> [[2,1,1],[1,1,0],[0,1,1]] → 4</p>`,
  'walls-and-gates': `<p><strong>Walls and Gates</strong></p><p>Fill each empty room with distance to its nearest gate.</p><p><em>Example:</em> INF rooms get shortest distance.</p>`,
  'pacific-atlantic-water-flow': `<p><strong>Pacific Atlantic Water Flow</strong></p><p>Cells from which water can flow to both oceans.</p><p><em>Example:</em> Return list of coordinates.</p>`,
  'course-schedule': `<p><strong>Course Schedule</strong></p><p>Can you finish all courses given prerequisites? Detect cycles.</p><p><em>Example:</em> n=2, [[1,0]] → true</p>`,
  'course-schedule-ii': `<p><strong>Course Schedule II</strong></p><p>Return a valid course order (topological sort) or empty if impossible.</p>`,
  'climbing-stairs': `<p><strong>Climbing Stairs</strong></p><p>Ways to climb n steps taking 1 or 2 at a time (Fibonacci).</p><p><em>Example:</em> n=3 → 3</p>`,
  'house-robber': `<p><strong>House Robber</strong></p><p>Max sum of non-adjacent houses.</p><p><em>Example:</em> [1,2,3,1] → 4</p>`,
  'house-robber-ii': `<p><strong>House Robber II</strong></p><p>Rob houses in a circle (first and last adjacent).</p><p><em>Example:</em> [2,3,2] → 3</p>`,
  'coin-change': `<p><strong>Coin Change</strong></p><p>Fewest coins to make up an amount; -1 if impossible.</p><p><em>Example:</em> coins=[1,2,5], amount=11 → 3</p>`,
  'word-break': `<p><strong>Word Break</strong></p><p>Can the string be segmented into a dictionary of words?</p><p><em>Example:</em> s="leetcode", dict=["leet","code"] → true</p>`,
  'longest-common-subsequence': `<p><strong>Longest Common Subsequence</strong></p><p>Length of LCS of two strings.</p><p><em>Example:</em> "abcde", "ace" → 3</p>`,
  'combination-sum': `<p><strong>Combination Sum</strong></p><p>Find combinations that sum to target (reuse allowed).</p><p><em>Example:</em> candidates=[2,3,6,7], target=7 → [[2,2,3],[7]]</p>`,
  'combination-sum-ii': `<p><strong>Combination Sum II</strong></p><p>Find unique combinations (no reuse) that sum to target.</p><p><em>Example:</em> [10,1,2,7,6,1,5], target=8 → [[1,1,6],[1,2,5],[1,7],[2,6]]</p>`,
  'subsets': `<p><strong>Subsets</strong></p><p>Return all possible subsets (the power set).</p><p><em>Example:</em> [1,2,3] → [[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]</p>`,
  'permutations': `<p><strong>Permutations</strong></p><p>Return all permutations of the array.</p><p><em>Example:</em> [1,2,3] → 6 permutations</p>`,
  'permutations-ii': `<p><strong>Permutations II</strong></p><p>Return unique permutations when duplicates exist.</p>`,
};

const TOPIC_HINTS = {
  'Arrays & Hashing': 'Work with arrays, hash maps/sets, and frequency counting. Aim for linear time where possible.',
  'Two Pointers': 'Use two indices moving towards each other or sliding to optimize space/time.',
  'Sliding Window': 'Maintain a window with counts/invariants; expand and shrink to meet constraints.',
  'Stack': 'Use a stack to track previous state, monotonic properties, or matching pairs.',
  'Binary Search': 'Leverage monotonic conditions over indices/answers for O(log n) search.',
  'Linked List': 'Mind pointers, dummy heads, and in-place manipulations.',
  'Trees': 'Use DFS/BFS; recursion and stacks/queues are common. Watch base cases.',
  'Tries': 'Prefix tree for efficient prefix/word queries.',
  'Heap / Priority Queue': 'Use min/max-heaps for top-k, merging, or scheduling problems.',
  'Backtracking': 'Build candidates incrementally and backtrack on invalid paths.',
  'Graphs': 'Use BFS/DFS/Topo sort; detect cycles; consider union-find.',
  '1-D DP': 'Subproblem over a linear structure; build from base cases.',
  '2-D DP': 'DP over matrices/strings; watch transitions and boundaries.',
  'Bit Manipulation': 'Use bit ops/masks; understand XOR tricks and shifting.',
  'Intervals': 'Sort by start or end; merge or count overlaps greedily.',
  'Greedy': 'Make locally optimal choices that lead to global optimum.',
  'Math & Geometry': 'Exploit arithmetic properties; beware overflow and precision.',
};

function getDescriptionHtml(problem) {
  if (ENRICHED_DESC[problem.id]) return ENRICHED_DESC[problem.id];
  const raw = problem.descriptionHtml || '';
  const onlyTitle = /^\s*<p><strong>[^<]*<\/strong><\/p>\s*$/i.test(raw);
  if (onlyTitle) {
    const hint = TOPIC_HINTS[problem.topic] || 'Flip to see the solution and approach.';
    return `${raw}<p>${hint}</p>`;
  }
  if (raw) return raw;
  return problem.description || '';
}


/****************************** Utility Helpers ******************************/
const STORAGE_KEY = 'dsa_revision_progress_v1';
const THEME_KEY = 'dsa_revision_theme';
const SHUFFLE_KEY = 'dsa_revision_shuffle';
const HLD_MANIFEST = 'hld/manifest.json';
const LLD_MANIFEST = 'lld/manifest.json';
const CHEATS_MANIFEST = 'cheatsheets/manifest.json';
const CUSTOM_MANIFEST = 'custom/manifest.json';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}
function saveTheme(theme) { localStorage.setItem(THEME_KEY, theme); }
function loadShuffle() { return localStorage.getItem(SHUFFLE_KEY) === '1'; }
function saveShuffle(on) { localStorage.setItem(SHUFFLE_KEY, on ? '1' : '0'); }

function groupByTopic(problems) {
  const map = {};
  problems.forEach(p => { (map[p.topic] = map[p.topic] || []).push(p); });
  // stable sort problems by title inside topic for deterministic order
  Object.values(map).forEach(arr => arr.sort((a,b)=> a.title.localeCompare(b.title)));
  return Object.entries(map).sort((a,b)=> a[0].localeCompare(b[0]));
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length -1; i>0; i--) {
    const j = Math.floor(Math.random()* (i+1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/****************************** Components ******************************/
// Top navigation removed; home tiles provide entry points

function Home({ query, setQuery, results, onSelect, onPickSection }) {
  return (
  <section className="home-hero fade" aria-label="Home">
      <div className="home-inner">
    <p className="home-sub">Search across DSA, HLD, LLD, Cheatsheets, and Custom Java implementations.</p>
        <div className="home-search" role="search">
          <input
            type="search"
            value={query}
            onChange={(e)=> setQuery(e.target.value)}
            placeholder="Search everything..."
            aria-label="Search across all sections"
            autoComplete="off"
          />
          {query && (
            <div className="home-results" role="list" aria-label="Search results">
              {results.length === 0 && <div className="home-result empty" role="listitem">No matches</div>}
              {results.map((r)=> (
                <div key={r.key} className="home-result" role="listitem" tabIndex={0}
                  onClick={()=> onSelect(r)}
                  onKeyDown={(e)=> { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); onSelect(r); } }}>
                  <span className="hr-title">{r.title}</span>
                  <span className="hr-type">{r.section}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="section-grid">
          <button className="section-card" onClick={()=> onPickSection('topics')}>
            <div className="sc-icon">🧠</div>
            <div className="sc-sub">Flip cards for NeetCode 150</div>
          </button>
          <button className="section-card" onClick={()=> onPickSection('hld')}>
            <div className="sc-icon">🏗️</div>
            <div className="sc-sub">High-Level Design</div>
          </button>
          <button className="section-card" onClick={()=> onPickSection('lld')}>
            <div className="sc-icon">🧩</div>
            <div className="sc-sub">Low-Level Design</div>
          </button>
          <button className="section-card" onClick={()=> onPickSection('cheats')}>
            <div className="sc-icon">📄</div>
            <div className="sc-sub">Quick references</div>
          </button>
          <button className="section-card" onClick={()=> onPickSection('custom')}>
            <div className="sc-icon">⚙️</div>
            <div className="sc-sub">Custom Implementations</div>
          </button>
        </div>
      </div>
    </section>
  );
}

function MarkdownList({ title, files, onOpen, filter, setFilter }) {
  return (
    <section className="fade md-container">
      <h2 style={{margin:'0 0 .5rem'}}>{title}</h2>
      <div className="section-filter" role="search">
        <input type="search" value={filter} onChange={(e)=> setFilter(e.target.value)} placeholder="Filter by title" aria-label="Filter by title" />
        {filter && <button className="search-clear-btn" onClick={()=> setFilter('')}>Clear</button>}
      </div>
      <div className="md-list" role="list">
        {files.map(name => (
          <div key={name} role="listitem" tabIndex={0} className="md-item" onClick={()=> onOpen(name)} onKeyDown={(e)=> { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); onOpen(name); } }}>
            <span>{name.replace(/\.(md|markdown)$/i, '').replaceAll('_',' ')}</span>
            <span className="chevron">›</span>
          </div>
        ))}
        {files.length===0 && <p className="empty" style={{margin:'1rem 0'}}>No items</p>}
      </div>
    </section>
  );
}

function MarkdownViewer({ title, url, onBack }) {
  const ref = useRef(null);
  const [html, setHtml] = useState('<p>Loading...</p>');
  useEffect(()=> {
    let alive = true;
    fetch(url, { cache:'no-cache' }).then(r=> r.ok? r.text(): Promise.reject()).then(md => {
      if (!alive) return;
      const safeHtml = window.marked ? marked.parse(md, { breaks: true }) : md;
      setHtml(safeHtml);
    }).catch(()=> setHtml('<p style="color:var(--danger)">Failed to load content.</p>'));
    return ()=> { alive = false; };
  }, [url]);
  useEffect(()=> {
    if (ref.current) {
      ref.current.querySelectorAll('pre code').forEach(b=> window.hljs && hljs.highlightElement(b));
    }
  }, [html]);
  return (
    <section className="fade md-container">
      <button className="pill-btn" onClick={onBack} aria-label="Back" style={{margin:'0 0 .75rem'}}>← Back</button>
      <h2 style={{margin:'0 0 .5rem'}}>{title}</h2>
      <div className="md-content" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

function CodeViewer({ title, url, onBack }) {
  const ref = useRef(null);
  const [code, setCode] = useState('');
  // Infer language from file extension (fallback to auto-detect)
  const lang = useMemo(()=> {
    const m = url.match(/\.([a-z0-9]+)$/i);
    const ext = (m?.[1] || '').toLowerCase();
    const map = { js:'javascript', mjs:'javascript', cjs:'javascript', ts:'typescript', py:'python', java:'java', cs:'csharp', cpp:'cpp', cxx:'cpp', cc:'cpp', c:'c', go:'go', rs:'rust', kt:'kotlin', swift:'swift', rb:'ruby', php:'php', scala:'scala', sql:'sql', json:'json', md:'markdown', sh:'bash', bash:'bash' };
    return map[ext] || '';
  }, [url]);
  useEffect(()=> {
    let alive = true;
    fetch(url, { cache:'no-cache' }).then(r=> r.ok? r.text(): Promise.reject()).then(t => { if(alive) setCode(t); }).catch(()=> setCode('// Failed to load file'));
    return ()=> { alive = false; };
  }, [url]);
  useEffect(()=> {
    if (ref.current) {
      const blocks = ref.current.querySelectorAll('pre code');
      blocks.forEach(b=> {
        if (window.hljs) {
          hljs.highlightElement(b);
        }
      });
    }
  }, [code]);
  const copy = async()=> { try { await navigator.clipboard.writeText(code); } catch {} };
  return (
    <section className="fade md-container">
      <button className="pill-btn" onClick={onBack} aria-label="Back" style={{margin:'0 0 .75rem'}}>← Back</button>
      <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
        <h2 style={{margin:'0'}}>{title}</h2>
        <button className="copy-btn" onClick={copy} aria-label="Copy code">Copy</button>
      </div>
      <div className="md-content" ref={ref}>
        <pre><code className={lang? `language-${lang}`: ''} style={{whiteSpace:'pre', display:'block'}}>{code}</code></pre>
      </div>
    </section>
  );
}
function Header({ onBack, canGoBack, theme, toggleTheme }) {
  return (
    <header className="app-header">
  <a href="#main" className="skip-link">Skip to main content</a>
      {canGoBack && <button onClick={onBack} aria-label="Back" title="Back">← <span className="txt">Back</span></button>}
  <h1 aria-label="DSA Revision Tool"><span aria-hidden>IRS</span><span className="sr-only">Revision Tool</span></h1>
      <div style={{marginLeft:'auto'}} className="inline-group">
        <button onClick={toggleTheme} aria-label="Toggle theme" className={"icon-only"} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'} <span className="txt">{theme === 'dark' ? 'Light' : 'Dark'}</span></button>
        <a className="pill-btn hide-sm" href="https://neetcode.io/" target="_blank" rel="noreferrer">NeetCode</a>
      </div>
    </header>
  );
}

function TopicList({ problems, onSelectTopic, onOpenProblem }) {
  const [filter, setFilter] = useState('');
  const grouped = useMemo(()=> groupByTopic(problems), [problems]);
  const visible = useMemo(()=> {
    const q = filter.trim().toLowerCase();
    if (!q) return grouped;
    return grouped
      .map(([topic, probs]) => [topic, probs.filter(p=> p.title.toLowerCase().includes(q))])
      .filter(([, probs]) => probs.length > 0);
  }, [grouped, filter]);
  const problemMatches = useMemo(()=> {
    const q = filter.trim().toLowerCase();
    if (!q) return [];
    return problems.filter(p=> p.title.toLowerCase().includes(q)).slice(0, 50);
  }, [problems, filter]);
  if (!grouped.length) return <p className="empty">No problems available.</p>;
  return (
    <div className="fade" style={{padding:'0 1rem'}}>
      <h2 className="page-title">Topics</h2>
      <div className="section-filter topic-filter" role="search">
        <input type="search" value={filter} onChange={(e)=> setFilter(e.target.value)} placeholder="Search problems by title" aria-label="Search problems by title" />
        {filter && <button className="search-clear-btn" onClick={()=> setFilter('')}>Clear</button>}
      </div>
      {filter && (
        <div className="search-results" role="list" aria-label="Problem matches">
          {problemMatches.length === 0 && <p className="search-empty">No matches</p>}
          {problemMatches.map(p => (
            <div
              key={p.id}
              role="listitem"
              className="search-hit"
              tabIndex={0}
              onClick={()=> onOpenProblem && onOpenProblem(p)}
              onKeyDown={(e)=> { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); onOpenProblem && onOpenProblem(p); } }}
            >
              <p className="search-hit-title">{p.title}</p>
              <div className="search-hit-meta"><span>{p.topic}</span></div>
            </div>
          ))}
        </div>
      )}
      <div className="topic-list" role="list">
        {visible.map(([topic, probs]) => (
          <div
            key={topic}
            role="listitem"
            className="topic-row"
            onClick={()=> onSelectTopic(topic)}
            tabIndex={0}
            onKeyDown={(e)=> { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTopic(topic); } }}
          >
            <h3>{topic}</h3>
            <small>{probs.length} problem{probs.length!==1?'s':''}</small>
            <span className="chevron">›</span>
          </div>
        ))}
        {visible.length===0 && <p className="empty" style={{margin:'1rem 0'}}>No matches</p>}
      </div>
    </div>
  );
}

function TopicProblemList({ topic, problems, onBack, onOpen }) {
  const sorted = useMemo(()=> [...problems].sort((a,b)=> a.title.localeCompare(b.title)), [problems]);
  return (
    <section className="fade" style={{padding:'0 1rem 2rem'}} role="region" aria-labelledby="topic-heading">
      <button className="pill-btn" onClick={onBack} aria-label="Back to topics" style={{margin:'1rem 0'}}>← Back to Topics</button>
      <h2 id="topic-heading" style={{margin:'0 0 .5rem'}}>{topic}</h2>
      <div role="list" className="problem-list-view">
        {sorted.map(p => (
          <div
            key={p.id}
            role="listitem"
            className="problem-list-item"
            onClick={()=> onOpen(p.id)}
            tabIndex={0}
            onKeyDown={(e)=> { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p.id); } }}
          >
            <div className="pli-title">{p.title}</div>
            <div className="pli-meta">
              <span className="badge">{p.difficulty}</span>
            </div>
            <span className="chevron">›</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchBar({ query, setQuery, onClear }) {
  return (
    <div className="search-bar-wrapper" role="search">
      <input
        type="search"
        value={query}
        onChange={e=> setQuery(e.target.value)}
        placeholder="Search problems by title..."
        aria-label="Search problems by title"
        autoComplete="off"
      />
      {query && <button className="search-clear-btn" onClick={onClear} aria-label="Clear search">Clear</button>}
    </div>
  );
}

function SearchResults({ results, onJump, query }) {
  if (!query) return null;
  if (query && results.length === 0) return <div className="search-results"><p className="search-empty">No matches</p></div>;
  const highlight = (title) => {
    const idx = title.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return title;
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + query.length);
    const after = title.slice(idx + query.length);
    return (<>{before}<span className="highlight">{match}</span>{after}</>);
  };
  return (
    <div className="search-results" role="list" aria-label="Search results">
      {results.map(r => (
        <div
          key={r.id}
          role="listitem"
          className="search-hit"
          onClick={()=> onJump(r)}
          tabIndex={0}
          onKeyDown={(e)=> { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onJump(r); } }}
        >
          <p className="search-hit-title">{highlight(r.title)}</p>
          <div className="search-hit-meta">
            <span>{r.topic}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlashCard({ problem, flipped, onFlip }) {
  const cardRef = useRef(null);
  const [externalCode, setExternalCode] = useState(null);
  // Try to load external solution on problem change
  useEffect(()=> {
    let alive = true;
    setExternalCode(null); // reset while loading/new problem
    fetchExternalSolution(problem.id).then(code => { if (alive && code != null) setExternalCode(code); });
    return ()=> { alive = false; };
  }, [problem.id]);
  // highlight code when flipping to back
  useEffect(()=> {
    if (flipped && cardRef.current) {
      cardRef.current.querySelectorAll('pre code').forEach(block => { window.hljs && hljs.highlightElement(block); });
    }
  }, [flipped, problem, externalCode]);

  return (
    <div className={"flash-card "+ (flipped? 'flipped':'')} onClick={onFlip} role="button" aria-pressed={flipped} aria-label="Flashcard. Click to flip" tabIndex={0} onKeyDown={(e)=> { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); onFlip(); } }}>
      <div className="card-inner" ref={cardRef}>
        <div className="face front">
          <span className="topic-label">{problem.topic}</span>
          <h2 className="card-title" style={{marginTop:'.25rem'}}>{problem.title}</h2>
          <div className="separator" />
            <div className="problem-desc" dangerouslySetInnerHTML={{ __html: getDescriptionHtml(problem) }} />
          <div style={{marginTop:'auto', fontSize:'.65rem', opacity:.6}}>Tap / click to see solution</div>
        </div>
        <div className="face back solution-block">
          <span className="topic-label">Solution</span>
          <pre><code className="language-java" style={{whiteSpace:'pre', display:'block'}}>{externalCode ?? problem.solutionJava}</code></pre>
          <div style={{marginTop:'auto', fontSize:'.65rem', opacity:.6}}>Tap to go back</div>
        </div>
      </div>
    </div>
  );
}

function NavigationControls({ onPrev, onNext, onFlip, onShuffleToggle, shuffle, progressText }) {
  return (
    <div className="nav-controls">
      <div className="nav-cluster">
        <div className="nav-main-row">
          <button className="nav-btn" onClick={onPrev} aria-label="Previous (Left Arrow)">⟵</button>
          <button className="nav-btn primary" onClick={onFlip} aria-label="Flip card">↺</button>
          <button className="nav-btn" onClick={onNext} aria-label="Next (Right Arrow)">⟶</button>
        </div>
        <div className="nav-mini-row">
          <button className={"toggle" + (shuffle? ' active':'')} onClick={onShuffleToggle} aria-pressed={shuffle} aria-label="Toggle shuffle">Shuffle</button>
          <span className="progress-chip" aria-label="Progress">{progressText}</span>
        </div>
      </div>
    </div>
  );
}

function CardView({ topic, problems, focusProblemId, onExit, progressState, updateProgress, shuffleEnabled, setShuffleEnabled }) {
  const storedIndex = progressState[topic] || 0;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState('right'); // 'left' | 'right'
  const [leaving, setLeaving] = useState(null);
  const [shuffledOrder, setShuffledOrder] = useState(shuffleEnabled ? shuffleArray(problems) : problems);
  const currentIdRef = useRef(null);

  const findIndexById = useCallback((arr, id)=> arr.findIndex(p => p.id === id), []);

  // Recompute order when shuffle toggled
  useEffect(()=> {
    const order = shuffleEnabled ? shuffleArray(problems) : problems;
    setShuffledOrder(order);
    // Preserve focus if provided or current item, else use stored progress
    let desiredId = focusProblemId || currentIdRef.current;
    let idx = 0;
    if (desiredId) {
      const fi = findIndexById(order, desiredId);
      idx = fi >= 0 ? fi : 0;
    } else {
      idx = storedIndex < order.length ? storedIndex : 0;
    }
    setIndex(idx);
  }, [shuffleEnabled, problems, focusProblemId]);

  // Persist progress when index changes and update current id ref
  useEffect(()=> {
    updateProgress(topic, index);
    const cur = shuffledOrder[index];
    if (cur) currentIdRef.current = cur.id;
  }, [index, topic, shuffledOrder]);

  const current = shuffledOrder[index];

  const go = useCallback((delta)=> {
    setFlipped(false);
    setDirection(delta>0? 'right':'left');
    setLeaving(delta>0? 'leaving-left':'leaving-right'); // leaving anim direction is opposite
    // delay increment until animation ends (~300ms)
    setTimeout(()=> {
      setAnimKey(k=> k+1);
      setLeaving(null);
      setIndex(i => {
        const next = i + delta;
        if (next < 0) return 0;
        if (next >= shuffledOrder.length) return shuffledOrder.length -1;
        return next;
      });
    }, 180);
  }, [shuffledOrder.length]);

  const handleKey = useCallback((e)=> {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f=> !f); }
  }, [go]);

  useEffect(()=> {
    window.addEventListener('keydown', handleKey);
    return ()=> window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const progressText = `${index+1}/${shuffledOrder.length}`;

  return (
    <div className="card-container" role="region" aria-label={`Cards for ${topic}`}>
      <div className="swipe-area">
        {current && (
          <div key={animKey} className={`swipe-anim ${direction==='right'? 'entering-right':'entering-left'}`} style={{width:'100%', display:'flex', justifyContent:'center'}}>
            <FlashCard problem={current} flipped={flipped} onFlip={()=> setFlipped(f=> !f)} />
            <span className="progress-indicator" role="status" aria-live="polite" aria-atomic="true">{progressText}</span>
          </div>
        )}
      </div>
      <NavigationControls
        onPrev={()=> go(-1)}
        onNext={()=> go(1)}
        onFlip={()=> setFlipped(f=> !f)}
        shuffle={shuffleEnabled}
        onShuffleToggle={()=> { const val = !shuffleEnabled; setShuffleEnabled(val); saveShuffle(val); }}
        progressText={progressText}
      />
    </div>
  );
}

function App() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'topics' | 'topic-list' | 'cards' | 'hld' | 'lld' | 'cheats' | 'custom' | 'hld-view' | 'lld-view' | 'cheats-view' | 'custom-view'
  const [focusProblemId, setFocusProblemId] = useState(null);
  const [progress, setProgress] = useState(loadProgress());
  const [theme, setTheme] = useState(loadTheme());
  const [shuffleEnabled, setShuffleEnabled] = useState(loadShuffle());
  const [searchQuery, setSearchQuery] = useState('');
  const mainRef = useRef(null);
  // Section states
  const [hldFiles, setHldFiles] = useState([]);
  const [lldFiles, setLldFiles] = useState([]);
  const [cheatFiles, setCheatFiles] = useState([]);
  const [customFiles, setCustomFiles] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null); // { title, url, section }
  const [sectionFilter, setSectionFilter] = useState('');

  // Apply theme class
  useEffect(()=> {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.remove('light'); else html.classList.add('light');
    saveTheme(theme);
    // Switch highlight.js theme to match app theme
    const link = document.getElementById('hljs-theme-link');
    if (link) {
      link.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
  }, [theme]);

  useEffect(()=> {
    // Load data
    fetch('data.json', {cache: 'no-cache'})
      .then(r => { if(!r.ok) throw new Error('Failed to load data'); return r.json(); })
      .then(setProblems)
      .catch(err => { console.error(err); setError('Could not load problems.'); });
  }, []);

  // Load manifests for new sections (once)
  useEffect(()=> {
    const load = (url, set)=> fetch(url, {cache:'no-cache'}).then(r=> r.ok? r.json(): []).catch(()=> [] ).then(set);
    load(HLD_MANIFEST, setHldFiles);
    load(LLD_MANIFEST, setLldFiles);
    load(CHEATS_MANIFEST, setCheatFiles);
    load(CUSTOM_MANIFEST, setCustomFiles);
  }, []);

  const updateProgress = useCallback((topic, idx)=> {
    setProgress(p=> { const next = { ...p, [topic]: idx }; saveProgress(next); return next; });
  }, []);

  const topicProblems = useMemo(()=> problems.filter(p=> p.topic === selectedTopic), [problems, selectedTopic]);
  // Build global search index and results for Home
  const globalIndex = useMemo(()=> {
    const items = [];
    problems.forEach(p=> items.push({ key:`dsa:${p.id}`, section:'DSA', type:'dsa', title:p.title, data:p }));
    hldFiles.forEach(name=> items.push({ key:`hld:${name}`, section:'HLD', type:'hld', title: name.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '), data:name }));
    lldFiles.forEach(name=> items.push({ key:`lld:${name}`, section:'LLD', type:'lld', title: name.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '), data:name }));
    cheatFiles.forEach(name=> items.push({ key:`cheats:${name}`, section:'Cheatsheet', type:'cheats', title: name.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '), data:name }));
    customFiles.forEach(name=> items.push({ key:`custom:${name}`, section:'Custom', type:'custom', title: name.replace(/\.(java)$/i,'').replaceAll('_',' '), data:name }));
    return items;
  }, [problems, hldFiles, lldFiles, cheatFiles, customFiles]);

  const globalResults = useMemo(()=> {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return globalIndex.filter(it => it.title.toLowerCase().includes(q)).slice(0, 30);
  }, [globalIndex, searchQuery]);

  const jumpToProblem = useCallback((problem)=> {
    setSelectedTopic(problem.topic);
    setFocusProblemId(problem.id);
    setViewMode('cards');
    setSearchQuery('');
    window.scrollTo({top:0, behavior:'smooth'});
  }, []);

  const handleGlobalSelect = useCallback((item)=> {
    if (item.type === 'dsa') return jumpToProblem(item.data);
    if (item.type === 'hld') { setCurrentDoc({ title:item.title, url:`hld/${item.data}`, section:'hld' }); setViewMode('hld-view'); }
    else if (item.type === 'lld') { setCurrentDoc({ title:item.title, url:`lld/${item.data}`, section:'lld' }); setViewMode('lld-view'); }
    else if (item.type === 'cheats') { setCurrentDoc({ title:item.title, url:`cheatsheets/${item.data}`, section:'cheats' }); setViewMode('cheats-view'); }
    else if (item.type === 'custom') { setCurrentDoc({ title:item.title, url:`custom/${item.data}`, section:'custom' }); setViewMode('custom-view'); }
    setSearchQuery('');
    window.scrollTo({top:0, behavior:'smooth'});
  }, [jumpToProblem]);

  // Focus main on view change for better keyboard/screen reader UX
  useEffect(()=> {
    if (mainRef.current) {
      mainRef.current.focus();
    }
    // Optional: update title to reflect context
    const base = 'DSA Revision Tool';
  if (viewMode === 'home') document.title = base + ' · Home';
  else if (viewMode === 'topics') document.title = base + ' · Topics';
    else if (viewMode === 'topic-list' && selectedTopic) document.title = base + ' · ' + selectedTopic;
    else if (viewMode === 'cards' && selectedTopic) document.title = base + ' · ' + selectedTopic + ' (Cards)';
  }, [viewMode, selectedTopic]);

  return (
    <>
      <Header
        canGoBack={viewMode !== 'home'}
        onBack={()=> {
          if (viewMode === 'cards') { setViewMode('topic-list'); setFocusProblemId(null); }
          else if (viewMode === 'topic-list') { setSelectedTopic(null); setViewMode('topics'); }
          else if (['hld-view','lld-view','cheats-view','custom-view'].includes(viewMode)) {
            const back = viewMode.replace('-view',''); setViewMode(back);
          } else if (['hld','lld','cheats','custom','topics'].includes(viewMode)) {
            setViewMode('home');
          }
        }}
        theme={theme}
        toggleTheme={()=> setTheme(t=> t==='dark'? 'light':'dark')}
      />
  {/* Top navigation removed per request; navigation is via home tiles and back button */}
      <main id="main" ref={mainRef} tabIndex={-1} aria-live="off">
        {viewMode === 'home' && (
          <Home
            query={searchQuery}
            setQuery={setSearchQuery}
            results={globalResults}
            onSelect={handleGlobalSelect}
            onPickSection={(key)=> setViewMode(key)}
          />
        )}
        {viewMode === 'topics' && (
          <>
            {error && <p style={{color:'var(--danger)', textAlign:'center'}}>{error}</p>}
            <TopicList
              problems={problems}
              onSelectTopic={(topic)=> { setSelectedTopic(topic); setViewMode('topic-list'); }}
              onOpenProblem={(p)=> { setSelectedTopic(p.topic); setFocusProblemId(p.id); setViewMode('cards'); window.scrollTo({top:0, behavior:'smooth'}); }}
            />
            <p style={{textAlign:'center', fontSize:'.65rem', color:'var(--text-dim)', padding:'0 1rem 2rem'}}>
              Sample subset loaded. Replace <code>data.json</code> with full NeetCode 150 list later.
            </p>
          </>
        )}
        {viewMode === 'topic-list' && selectedTopic && (
          <TopicProblemList
            topic={selectedTopic}
            problems={topicProblems}
            onBack={()=> { setSelectedTopic(null); setViewMode('topics'); }}
            onOpen={(id)=> { setFocusProblemId(id); setViewMode('cards'); window.scrollTo({top:0, behavior:'smooth'}); }}
          />
        )}
        {viewMode === 'cards' && selectedTopic && (
          <CardView
            topic={selectedTopic}
              problems={topicProblems}
              focusProblemId={focusProblemId}
              onExit={()=> { setViewMode('topic-list'); setFocusProblemId(null); }}
              progressState={progress}
              updateProgress={updateProgress}
              shuffleEnabled={shuffleEnabled}
              setShuffleEnabled={setShuffleEnabled}
          />
        )}
        {viewMode === 'hld' && (
          <MarkdownList
            title="High-Level Design"
            files={hldFiles.filter(f=> f.toLowerCase().includes(sectionFilter.toLowerCase()))}
            onOpen={(name)=> { setCurrentDoc({ title: name.replace(/\.(md|markdown)$/i,''), url: `hld/${name}`, section:'hld' }); setViewMode('hld-view'); }}
            filter={sectionFilter}
            setFilter={setSectionFilter}
          />
        )}
        {viewMode === 'hld-view' && currentDoc && (
          <MarkdownViewer title={currentDoc.title} url={currentDoc.url} onBack={()=> setViewMode('hld')} />
        )}
        {viewMode === 'lld' && (
          <MarkdownList
            title="Low-Level Design"
            files={lldFiles.filter(f=> f.toLowerCase().includes(sectionFilter.toLowerCase()))}
            onOpen={(name)=> { setCurrentDoc({ title: name.replace(/\.(md|markdown)$/i,''), url: `lld/${name}`, section:'lld' }); setViewMode('lld-view'); }}
            filter={sectionFilter}
            setFilter={setSectionFilter}
          />
        )}
        {viewMode === 'lld-view' && currentDoc && (
          <MarkdownViewer title={currentDoc.title} url={currentDoc.url} onBack={()=> setViewMode('lld')} />
        )}
        {viewMode === 'cheats' && (
          <MarkdownList
            title="Cheatsheets"
            files={cheatFiles.filter(f=> f.toLowerCase().includes(sectionFilter.toLowerCase()))}
            onOpen={(name)=> { setCurrentDoc({ title: name.replace(/\.(md|markdown)$/i,''), url: `cheatsheets/${name}`, section:'cheats' }); setViewMode('cheats-view'); }}
            filter={sectionFilter}
            setFilter={setSectionFilter}
          />
        )}
        {viewMode === 'cheats-view' && currentDoc && (
          <MarkdownViewer title={currentDoc.title} url={currentDoc.url} onBack={()=> setViewMode('cheats')} />
        )}
        {viewMode === 'custom' && (
          <MarkdownList
            title="Custom Implementations"
            files={customFiles.filter(f=> f.toLowerCase().includes(sectionFilter.toLowerCase()))}
            onOpen={(name)=> { setCurrentDoc({ title: name.replace(/\.(java)$/i,''), url: `custom/${name}`, section:'custom' }); setViewMode('custom-view'); }}
            filter={sectionFilter}
            setFilter={setSectionFilter}
          />
        )}
        {viewMode === 'custom-view' && currentDoc && (
          <CodeViewer title={currentDoc.title} url={currentDoc.url} onBack={()=> setViewMode('custom')} />
        )}
      </main>
    </>
  );
}

/****************************** Mount App ******************************/
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

