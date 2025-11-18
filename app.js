/* DSA Revision Tool - React implementation
 * Refactored: Removed flip card view, progress & shuffle mechanics.
 * Provides: Topic listing, accordion list, markdown/code viewers, dark/light theme.
 * Data: Loaded from problems.json (auto-generated from ProblemList.xlsx).
 */

const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* --------------------------- Utility / Helpers --------------------------- */
function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getStatementHtml(problem) {
  const raw = typeof problem.statement === 'string' ? problem.statement : '';
  const trimmed = raw.trim();
  if (!trimmed) {
    return `<p><strong>${escapeHtml(problem.title || 'Problem')}</strong></p><p>No statement available.</p>`;
  }
  const paragraphs = trimmed
    .replace(/\r/g, '\n')
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part).replace(/\n/g, '<br/>')}</p>`);
  return paragraphs.join('') || `<p>${escapeHtml(trimmed)}</p>`;
}
// Theme persistence (keep existing behavior)
function loadTheme() {
  try { return localStorage.getItem('rev-theme') || 'dark'; } catch { return 'dark'; }
}
function saveTheme(t) {
  try { localStorage.setItem('rev-theme', t); } catch {}
}

function normalizeNewlines(value = '') {
  return (typeof value === 'string' ? value : '').replace(/\r\n/g, '\n');
}

// Section manifest constants
const HLD_MANIFEST = 'hld/manifest.json';
const LLD_MANIFEST = 'lld/manifest.json';
const CHEATS_MANIFEST = 'cheatsheets/manifest.json';
const CUSTOM_MANIFEST = 'custom/manifest.json';

// Home page: search + section tiles
function Home({ query, setQuery, results, onSelect, onPickSection }) {
  return (
    <section className="fade home" aria-label="Home">
      <div className="home-inner">
        <h1 className="home-title">DSA Revision Hub</h1>
        <p className="home-sub">Search problems or pick a section below.</p>
        <div className="home-search" role="search">
          <input
            type="search"
            value={query}
            onChange={(e)=> setQuery(e.target.value)}
            placeholder="Global quick search..."
            aria-label="Global quick search"
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
          <button className="section-card" onClick={()=> onPickSection('accordion')}>
            <div className="sc-icon">📋</div>
            <div className="sc-sub">DSA Problems</div>
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
  const [code, setCode] = useState('');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const lang = useMemo(()=> {
    const m = url.match(/\.([a-z0-9]+)$/i);
    const ext = (m?.[1] || '').toLowerCase();
    const map = { js:'javascript', mjs:'javascript', cjs:'javascript', ts:'typescript', py:'python', java:'java', cs:'csharp', cpp:'cpp', cxx:'cpp', cc:'cpp', c:'c', go:'go', rs:'rust', kt:'kotlin', swift:'swift', rb:'ruby', php:'php', scala:'scala', sql:'sql', json:'json', md:'markdown', sh:'bash', bash:'bash' };
    return map[ext] || '';
  }, [url]);

  useEffect(()=> {
    let alive = true;
    setStatus('loading');
    setError(null);
    fetch(url, { cache:'no-cache' })
      .then(r=> r.ok? r.text(): Promise.reject())
      .then(t => {
        if (!alive) return;
        setCode(t);
        setDraft('');
        setStatus('ready');
      })
      .catch(()=> {
        if (!alive) return;
        setCode('');
        setDraft('');
        setStatus('error');
        setError('Unable to load implementation.');
      });
    return ()=> { alive = false; };
  }, [url]);

  const normalizedLang = lang || 'java';
  const isDirty = normalizeNewlines(draft || '') !== normalizeNewlines(code || '');
  const resolvedCode = draft || code;

  return (
    <section className="fade md-container code-viewer">
      <div className="viewer-top">
        <div className="viewer-meta">
          <span className="viewer-label">Custom Implementation</span>
          <h2>{title}</h2>
        </div>
        <a className="pill-btn ghost hide-sm" href={url} target="_blank" rel="noreferrer">Open Raw</a>
      </div>
      {status === 'loading' && <p className="muted">Fetching implementation…</p>}
      {error && <p className="alert" role="alert">{error}</p>}
      <CodeReader
        title="Implementation"
        code={resolvedCode}
        language={normalizedLang}
        editable
        emptyMessage={status === 'loading' ? '// Loading implementation…' : '// Implementation not shared yet.'}
        onChange={(value)=> setDraft(value)}
        onReset={()=> setDraft('')}
        isDirty={isDirty}
      />
    </section>
  );
}

function CodeReader({
  title = 'Solution',
  code = '',
  language = 'java',
  editable = true,
  onChange,
  onReset,
  emptyMessage = '// No solution shared yet.',
  isDirty = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const codeRef = useRef(null);
  const editorRef = useRef(null);
  const sanitizedCode = typeof code === 'string' ? code : '';
  const displayCode = sanitizedCode.trim() ? sanitizedCode : emptyMessage;

  useEffect(() => {
    if (!isEditing && codeRef.current && window.hljs) {
      window.hljs.highlightElement(codeRef.current);
    }
  }, [displayCode, isEditing, language]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      const el = editorRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
    } catch {/* ignore */}
  }, [displayCode]);

  const toggleEdit = () => {
    if (!editable) return;
    setIsEditing(v => !v);
  };

  const handleReset = () => {
    if (onReset) onReset();
    setIsEditing(false);
  };

  return (
    <div className="code-reader" aria-label={`${title} code ${isEditing ? 'editor' : 'viewer'}`}>
      <div className="code-reader-toolbar">
        <span className="code-reader-title">{title}</span>
        <div className="code-reader-actions">
          {editable && (
            <button className="pill-btn ghost" onClick={toggleEdit} aria-pressed={isEditing}>
              {isEditing ? 'Preview' : 'Edit'}
            </button>
          )}
          {onReset && editable && isDirty && (
            <button className="pill-btn ghost" onClick={handleReset}>Reset</button>
          )}
          <button className="pill-btn ghost" onClick={copy}>Copy</button>
        </div>
      </div>
      {isEditing ? (
        <textarea
          ref={editorRef}
          className="code-reader-textarea"
          value={code}
          spellCheck={false}
          onChange={(e)=> onChange?.(e.target.value)}
          aria-label={`${title} editor`}
        />
      ) : (
        <pre className="code-reader-pre" aria-label={`${title} highlighted code`}>
          <code ref={codeRef} className={`language-${language}`} style={{whiteSpace:'pre'}}>{displayCode}</code>
        </pre>
      )}
    </div>
  );
}

/**
 * Grind75-style Accordion List (collapsible topics + expandable problems)
 */
function ProblemAccordion({ problems, onBack, error }) {
  const [expandedTopic, setExpandedTopic] = useState(null); // topic string or null
  const [openProblem, setOpenProblem] = useState(null); // problem id
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState(''); // '', 'Easy', 'Medium', 'Hard'
  const [topicFilter, setTopicFilter] = useState(null); // specific topic chip
  const [solutionDrafts, setSolutionDrafts] = useState({});

  const normalizedProblems = useMemo(()=> problems.map(p => ({
    ...p,
    topic: (p.topic || 'Uncategorized').trim() || 'Uncategorized',
    difficulty: (p.difficulty || 'Unknown').trim() || 'Unknown'
  })), [problems]);

  // Gather topics and difficulties
  const allTopics = useMemo(()=> Array.from(new Set(normalizedProblems.map(p=> p.topic))).sort(), [normalizedProblems]);
  const difficulties = ['Easy','Medium','Hard'];

  // Filtering pipeline
  const filtered = useMemo(()=> {
    let list = normalizedProblems;
    if (difficultyFilter) list = list.filter(p=> p.difficulty === difficultyFilter);
    if (topicFilter) list = list.filter(p=> p.topic === topicFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p=> p.title.toLowerCase().includes(q));
    }
    return list;
  }, [normalizedProblems, difficultyFilter, topicFilter, search]);

  const grouped = useMemo(()=> {
    const map = {};
    filtered.forEach(p=> { (map[p.topic] = map[p.topic] || []).push(p); });
    return Object.entries(map).sort((a,b)=> a[0].localeCompare(b[0]));
  }, [filtered]);

  function toggleTopic(topic) { setExpandedTopic(t => t === topic ? null : topic); }
  function toggleProblem(p) { setOpenProblem(id => id === p.id ? null : p.id); }

  const highlight = useCallback((title)=> {
    if (!search) return title;
    const idx = title.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return title;
    return <>{title.slice(0,idx)}<span className="highlight-inline">{title.slice(idx, idx+search.length)}</span>{title.slice(idx+search.length)}</>;
  }, [search]);

  const solutionTextFor = useCallback((problem) => {
    if (solutionDrafts.hasOwnProperty(problem.id)) return solutionDrafts[problem.id];
    return typeof problem.solution === 'string' ? problem.solution : '';
  }, [solutionDrafts]);

  const updateSolutionDraft = useCallback((id, baseValue, nextValue) => {
    setSolutionDrafts(prev => {
      const desired = typeof nextValue === 'string' ? nextValue : '';
      const normalizedBase = normalizeNewlines(baseValue);
      const normalizedNext = normalizeNewlines(desired);
      if (normalizedNext === normalizedBase) {
        if (!prev.hasOwnProperty(id)) return prev;
        const clone = { ...prev };
        delete clone[id];
        return clone;
      }
      return { ...prev, [id]: desired };
    });
  }, []);

  const resetSolutionDraft = useCallback((id) => {
    setSolutionDrafts(prev => {
      if (!prev.hasOwnProperty(id)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <section className="fade accordion-root" aria-label="All problems accordion">
      <div className="accordion-header">
        <h2 style={{margin:'0 0 .75rem'}}>All Problems (Accordion)</h2>
        <div className="filter-bar">
          <input
            type="search"
            value={search}
            onChange={(e)=> setSearch(e.target.value)}
            placeholder="Search problem titles..."
            aria-label="Search problem titles"
          />
          <div className="chip-row" aria-label="Difficulty filter">
            {difficulties.map(d => (
              <button
                key={d}
                className={"chip diff-chip diff-"+d.toLowerCase()+ (difficultyFilter===d? ' active':'')}
                onClick={()=> setDifficultyFilter(f=> f===d? '': d)}
                aria-pressed={difficultyFilter===d}
              >{d}</button>
            ))}
          </div>
          <div className="chip-row" aria-label="Topic filter">
            {allTopics.map(t => (
              <button
                key={t}
                className={"chip topic-chip"+ (topicFilter===t? ' active':'')}
                onClick={()=> setTopicFilter(f=> f===t? null: t)}
                aria-pressed={topicFilter===t}
              >{t}</button>
            ))}
          </div>
          {(difficultyFilter || topicFilter || search) && (
            <button className="chip clear big" onClick={()=> { setDifficultyFilter(''); setTopicFilter(null); setSearch(''); }} aria-label="Clear filters">Reset Filters ✕</button>
          )}
        </div>
        <p className="accordion-sub" style={{margin:'0 0 1rem', fontSize:'.85rem', opacity:.7}}>
          {filtered.length} match{filtered.length!==1?'es':''} shown. Expand a topic, then a problem to view its description and solution.
        </p>
        {error && <p style={{color:'var(--danger)', margin:'0 0 1rem'}} role="alert">{error}</p>}
      </div>
      <div className="accordion-topics" role="list">
        {grouped.map(([topic, list]) => {
          const isOpen = expandedTopic === topic;
          return (
            <div key={topic} role="listitem" className="accordion-topic">
              <button
                className="accordion-topic-toggle"
                onClick={()=> toggleTopic(topic)}
                aria-expanded={isOpen}
                aria-controls={`topic-panel-${topic}`}
              >
                <span className={"chevron" + (isOpen? ' open':'')}>▸</span>
                <span className="topic-title">{topic}</span>
                <span className="count" aria-label="Problem count">{list.length}</span>
              </button>
              {isOpen && (
                <div id={`topic-panel-${topic}`} className="topic-panel" role="region" aria-label={topic+ ' problems'}>
                  <ul className="problem-list" style={{listStyle:'none', margin:0, padding:0}}>
                    {list.map(p => {
                      const open = openProblem === p.id;
                      const baseSolution = typeof p.solution === 'string' ? p.solution : '';
                      const tags = typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                      const currentCode = solutionTextFor(p) || baseSolution;
                      const hasDraft = solutionDrafts.hasOwnProperty(p.id);
                      const language = (p.language || 'java').toLowerCase();
                      return (
                        <li key={p.id} className="problem-row">
                          <div className="problem-head">
                            <button
                              className="problem-toggle"
                              onClick={()=> toggleProblem(p)}
                              aria-expanded={open}
                              aria-controls={`problem-panel-${p.id}`}
                            >
                              <span className={"chevron" + (open? ' open':'')}>▸</span>
                              <span className="problem-title">{highlight(p.title)}</span>
                              <span className="problem-meta">{p.difficulty}</span>
                            </button>
                          </div>
                          {open && (
                            <div id={`problem-panel-${p.id}`} className="problem-panel" role="region" aria-label={p.title + ' details'}>
                              {tags.length > 0 && (
                                <div className="problem-tags" aria-label="Tags">
                                  {tags.map(tag => (
                                    <span key={tag} className="chip tag-chip">{tag}</span>
                                  ))}
                                </div>
                              )}
                              <div className="description" dangerouslySetInnerHTML={{ __html: getStatementHtml(p) }} />
                              <CodeReader
                                title="Solution"
                                code={currentCode || ''}
                                language={language}
                                onChange={(value)=> updateSolutionDraft(p.id, baseSolution, value)}
                                onReset={()=> resetSolutionDraft(p.id)}
                                isDirty={hasDraft}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {grouped.length === 0 && <p className="empty">No problems loaded.</p>}
      </div>
    </section>
  );
}
function Header({ onBack, canGoBack, theme, toggleTheme }) {
  return (
    <header className="app-header" role="banner">
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className="header-left">
        {canGoBack && (
          <button onClick={onBack} aria-label="Back to previous section" title="Back" className="pill-btn ghost back-btn">← <span className="txt">Back</span></button>
        )}
        <div className="brand-block" aria-label="DSA Revision Hub">
          <div className="logo-pill" aria-hidden="true">IRS</div>
          <div className="brand-copy">
            <span className="brand-title">DSA Revision Hub</span>
            <span className="brand-tagline">Dark-mode grind · Interview ready</span>
          </div>
        </div>
      </div>
      <div className="header-right">
        <button onClick={toggleTheme} aria-label="Toggle theme" className="pill-btn ghost icon-only theme-btn" title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'} <span className="txt">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
}

// TopicList & TopicProblemList removed (accordion is sole DSA browsing UI)

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

// (Flip card related components removed.)

function App() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('home'); // 'home' | 'accordion' | 'hld' | 'lld' | 'cheats' | 'custom' | 'hld-view' | 'lld-view' | 'cheats-view' | 'custom-view'
  const [theme, setTheme] = useState(loadTheme());
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
    let alive = true;
    fetch('problems.json', { cache: 'no-cache' })
      .then(res => { if (!res.ok) throw new Error('Failed to load problems'); return res.json(); })
      .then(data => {
        if (!alive) return;
        if (!Array.isArray(data)) throw new Error('Unexpected data shape');
        setProblems(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        if (alive) setError('Could not load problems.');
      });
    return ()=> { alive = false; };
  }, []);

  // Load manifests for new sections (once)
  useEffect(()=> {
    const load = (url, set)=> fetch(url, {cache:'no-cache'}).then(r=> r.ok? r.json(): []).catch(()=> [] ).then(set);
    load(HLD_MANIFEST, setHldFiles);
    load(LLD_MANIFEST, setLldFiles);
    load(CHEATS_MANIFEST, setCheatFiles);
    load(CUSTOM_MANIFEST, setCustomFiles);
  }, []);

  // (selectedTopic removed)
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

  const handleGlobalSelect = useCallback((item)=> {
    if (item.type === 'dsa') { setViewMode('accordion'); setSearchQuery(''); window.scrollTo({top:0, behavior:'smooth'}); return; }
    if (item.type === 'hld') { setCurrentDoc({ title:item.title, url:`hld/${item.data}`, section:'hld' }); setViewMode('hld-view'); }
    else if (item.type === 'lld') { setCurrentDoc({ title:item.title, url:`lld/${item.data}`, section:'lld' }); setViewMode('lld-view'); }
    else if (item.type === 'cheats') { setCurrentDoc({ title:item.title, url:`cheatsheets/${item.data}`, section:'cheats' }); setViewMode('cheats-view'); }
    else if (item.type === 'custom') { setCurrentDoc({ title:item.title, url:`custom/${item.data}`, section:'custom' }); setViewMode('custom-view'); }
    setSearchQuery('');
    window.scrollTo({top:0, behavior:'smooth'});
  }, []);

  // Focus main on view change for better keyboard/screen reader UX
  useEffect(()=> {
    if (mainRef.current) {
      mainRef.current.focus();
    }
    // Optional: update title to reflect context
    const base = 'DSA Revision Tool';
    if (viewMode === 'home') document.title = base + ' · Home';
  // topics/topic-list removed
    else if (viewMode === 'accordion') document.title = base + ' · All Problems';
  }, [viewMode]);

  return (
    <>
      <Header
        canGoBack={viewMode !== 'home'}
        onBack={()=> {
          // Back logic simplified: any section except home returns to home
          if (['hld-view','lld-view','cheats-view','custom-view'].includes(viewMode)) {
            const back = viewMode.replace('-view',''); setViewMode(back);
          } else if (['hld','lld','cheats','custom','accordion'].includes(viewMode)) {
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
        {viewMode === 'accordion' && (
          <ProblemAccordion
            problems={problems}
            error={error}
            onBack={()=> setViewMode('home')}
          />
        )}
        {/* Removed topics & topic-list views; accordion supersedes */}
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
