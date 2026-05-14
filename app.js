/* IRS — Interview Revision Service (Redesigned)
 * Architecture: Sidebar nav, Split-pane problems, Command palette, Dashboard home
 * All existing features preserved: DSA, HLD, LLD, Cheatsheets, Custom, Games
 */

const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* ─── Helpers ─── */
function escapeHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function getStatementHtml(p) {
  const raw = typeof p.statement === 'string' ? p.statement : '';
  const t = raw.trim();
  if (!t) return `<p><strong>${escapeHtml(p.title||'Problem')}</strong></p><p>No statement available.</p>`;
  return t.replace(/\r/g,'\n').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean).map(x=>`<p>${escapeHtml(x).replace(/\n/g,'<br/>')}</p>`).join('');
}
function loadTheme() { try { return localStorage.getItem('rev-theme')||'dark'; } catch { return 'dark'; } }
function saveTheme(t) { try { localStorage.setItem('rev-theme',t); } catch {} }
function normalizeNewlines(v='') { return (typeof v==='string'?v:'').replace(/\r\n/g,'\n'); }
function loadRecallRatings() { try { return JSON.parse(localStorage.getItem('irs-recall-ratings')||'{}'); } catch { return {}; } }
function saveRecallRatings(r) { try { localStorage.setItem('irs-recall-ratings',JSON.stringify(r)); } catch {} }
function loadBookmarks() { try { return JSON.parse(localStorage.getItem('irs-bookmarks')||'[]'); } catch { return []; } }
function saveBookmarks(b) { try { localStorage.setItem('irs-bookmarks',JSON.stringify(b)); } catch {} }
function shuffleArray(a) { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r; }
function pickRandom(a,n,ex=new Set()) { return shuffleArray(a.filter(x=>!ex.has(x))).slice(0,n); }

/* ─── Mobile Detection Hook ─── */
function useMobileDetect(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

const HLD_MANIFEST = 'hld/manifest.json';
const LLD_MANIFEST = 'lld/manifest.json';
const CHEATS_MANIFEST = 'cheatsheets/manifest.json';
const CUSTOM_MANIFEST = 'custom/manifest.json';
const MT_MANIFEST = 'multithreading/manifest.json';
const COMPANY_MANIFEST = 'company/manifest.json';

/* ─── SVG Icons (inline, no deps) ─── */
const Icons = {
  home:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  code:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  layers:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  puzzle:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  file:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  tool:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  game:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r=".5" fill="currentColor"/><circle cx="18" cy="13" r=".5" fill="currentColor"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  bookmarkFill: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  threads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>,
};

/* ─── Command Palette ─── */
function CommandPalette({ open, onClose, items, onSelect }) {
  const [query, setQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQuery(''); setFocusIdx(0); setTimeout(()=> inputRef.current?.focus(), 50); } }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 20);
    const q = query.toLowerCase();
    return items.filter(it => it.title.toLowerCase().includes(q)).slice(0, 30);
  }, [items, query]);

  useEffect(() => { setFocusIdx(0); }, [filtered]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i+1, filtered.length-1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i-1, 0)); }
    if (e.key === 'Enter' && filtered[focusIdx]) { onSelect(filtered[focusIdx]); onClose(); }
  }, [filtered, focusIdx, onClose, onSelect]);

  if (!open) return null;
  return (
    <>
      <div className="palette-backdrop" onClick={onClose} />
      <div className="palette" onKeyDown={handleKey}>
        <div className="palette-input-row">
          <span className="palette-icon">{Icons.search}</span>
          <input ref={inputRef} className="palette-input" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search problems, designs, cheatsheets..." autoComplete="off" />
          <span className="palette-kbd">Esc</span>
        </div>
        <div className="palette-results">
          {filtered.length === 0 && <div className="palette-empty">No results found</div>}
          {filtered.map((it, i) => (
            <div key={it.key} className={`palette-item${i===focusIdx?' focused':''}`}
              onClick={() => { onSelect(it); onClose(); }}
              onMouseEnter={() => setFocusIdx(i)}>
              <span className="palette-item-icon">{it.icon || Icons.file}</span>
              <div className="palette-item-text">
                <div className="palette-item-title">{it.title}</div>
                <div className="palette-item-sub">{it.section}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="palette-hint">Navigate with ↑↓ · Enter to open · Esc to dismiss</div>
      </div>
    </>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ activeView, onNavigate, theme, toggleTheme, problemCount, dueCount }) {
  const navItems = [
    { id:'home', label:'Dashboard', icon: Icons.home },
    { id:'problems', label:'DSA Problems', icon: Icons.code, badge: problemCount },
    { id:'hld', label:'High-Level Design', icon: Icons.layers },
    { id:'lld', label:'Low-Level Design', icon: Icons.puzzle },
    { id:'cheats', label:'Cheatsheets', icon: Icons.file },
    { id:'custom', label:'Custom Impls', icon: Icons.tool },
    { id:'mt', label:'Multithreading', icon: Icons.threads },
    { id:'company', label:'Company Prep', icon: Icons.building },
    { id:'games', label:'Revision Games', icon: Icons.game, badge: dueCount > 0 ? dueCount : null },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo" aria-hidden="true">IRS</div>
        <div className="brand-text">
          <span className="brand-name">IRS</span>
          <span className="brand-sub">Interview Revision</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section-label">Navigate</div>
        {navItems.map(n => (
          <button key={n.id} className={`nav-item${activeView===n.id?' active':''}`}
            onClick={() => onNavigate(n.id)} aria-current={activeView===n.id?'page':undefined}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme==='dark' ? Icons.sun : Icons.moon}
          <span>{theme==='dark'?'Light':'Dark'}</span>
        </button>
        <button onClick={() => document.dispatchEvent(new CustomEvent('open-palette'))} title="Search (Ctrl+K)">
          {Icons.search}
          <span>Ctrl+K</span>
        </button>
      </div>
    </aside>
  );
}

/* ─── Bottom Tabs (Mobile) ─── */
function BottomTabs({ activeView, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close "more" menu on outside tap
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [moreOpen]);

  const primaryTabs = [
    { id:'home', label:'Home', icon: Icons.home },
    { id:'problems', label:'Problems', icon: Icons.code },
    { id:'hld', label:'HLD', icon: Icons.layers },
    { id:'lld', label:'LLD', icon: Icons.puzzle },
  ];
  const moreTabs = [
    { id:'cheats', label:'Cheatsheets', icon: Icons.file },
    { id:'custom', label:'Custom Impls', icon: Icons.tool },
    { id:'mt', label:'Multithreading', icon: Icons.threads },
    { id:'company', label:'Company Prep', icon: Icons.building },
    { id:'games', label:'Revision Games', icon: Icons.game },
  ];
  const moreActive = moreTabs.some(t => t.id === activeView);

  return (
    <div className="bottom-tabs">
      <div className="bottom-tabs-inner">
        {primaryTabs.map(t => (
          <button key={t.id} className={`tab-btn${activeView===t.id?' active':''}`}
            onClick={() => { onNavigate(t.id); setMoreOpen(false); }}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
        {/* Search button */}
        <button className="tab-btn" onClick={() => { document.dispatchEvent(new CustomEvent('open-palette')); setMoreOpen(false); }}>
          <span className="tab-icon">{Icons.search}</span>
          <span className="tab-label">Search</span>
        </button>
        {/* More menu */}
        <div className="tab-more-wrap" ref={moreRef}>
          <button className={`tab-btn${moreActive?' active':''}`}
            onClick={() => setMoreOpen(v => !v)}>
            <span className="tab-icon">{Icons.more}</span>
            <span className="tab-label">More</span>
          </button>
          {moreOpen && (
            <div className="tab-more-menu">
              {moreTabs.map(t => (
                <button key={t.id} className={`tab-more-item${activeView===t.id?' active':''}`}
                  onClick={() => { onNavigate(t.id); setMoreOpen(false); }}>
                  <span className="tab-more-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Breadcrumb ─── */
function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {it.onClick ? (
            <button className="breadcrumb-link" onClick={it.onClick}>{it.label}</button>
          ) : (
            <span className="breadcrumb-current">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Doc Nav (prev/next) ─── */
function DocNav({ files, currentFile, onOpen, folder }) {
  const idx = files.indexOf(currentFile);
  const prev = idx > 0 ? files[idx-1] : null;
  const next = idx < files.length-1 ? files[idx+1] : null;
  const clean = (n) => n.replace(/\.(md|markdown|java)$/i,'').replaceAll('_',' ');
  if (!prev && !next) return null;
  return (
    <div className="doc-nav">
      {prev ? (
        <button className="doc-nav-btn" onClick={() => onOpen(prev)}>
          <span className="nav-dir">← Previous</span>
          <span className="nav-title">{clean(prev)}</span>
        </button>
      ) : <div />}
      {next ? (
        <button className="doc-nav-btn next" onClick={() => onOpen(next)}>
          <span className="nav-dir">Next →</span>
          <span className="nav-title">{clean(next)}</span>
        </button>
      ) : <div />}
    </div>
  );
}

/* ─── Dashboard Home ─── */
function Dashboard({ problems, onNavigate, bookmarks, ratings }) {
  const totalProblems = problems.length;
  const ratingEntries = Object.values(ratings);
  const easyCount = ratingEntries.filter(r=>r==='easy').length;
  const mediumCount = ratingEntries.filter(r=>r==='medium').length;
  const hardCount = ratingEntries.filter(r=>r==='hard').length;
  const reviewed = ratingEntries.length;
  const bookmarkCount = bookmarks.length;

  // Weak topics: topics with most "hard" ratings
  const topicHard = {};
  problems.forEach(p => {
    if (ratings[p.id] === 'hard') {
      const t = (p.topic||'Uncategorized').trim();
      topicHard[t] = (topicHard[t]||0) + 1;
    }
  });
  const weakTopics = Object.entries(topicHard).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div className="dashboard">
      <h1 className="dash-greeting">Ready to <span className="accent">revise</span>?</h1>
      <p className="dash-sub">Pick up where you left off, or explore something new.</p>

      <div className="dash-grid">
        <div className="stat-card"><span className="stat-label">Total Problems</span><span className="stat-value accent">{totalProblems}</span></div>
        <div className="stat-card"><span className="stat-label">Reviewed</span><span className="stat-value accent2">{reviewed}</span><span className="stat-detail">{totalProblems?Math.round(reviewed/totalProblems*100):0}% coverage</span></div>
        <div className="stat-card"><span className="stat-label">Confident</span><span className="stat-value success">{easyCount}</span></div>
        <div className="stat-card"><span className="stat-label">Needs Work</span><span className="stat-value warn">{hardCount + mediumCount}</span></div>
      </div>

      <h3 className="dash-section-title">Quick Actions</h3>
      <div className="quick-actions">
        <button className="action-card" onClick={() => onNavigate('problems')}>
          <span className="action-icon">📋</span>
          <div className="action-text">
            <span className="action-title">Browse Problems</span>
            <span className="action-desc">{totalProblems} problems across all topics</span>
          </div>
        </button>
        <button className="action-card" onClick={() => onNavigate('games')}>
          <span className="action-icon">🎮</span>
          <div className="action-text">
            <span className="action-title">Play Revision Games</span>
            <span className="action-desc">Blind recall, pattern match, speed round</span>
          </div>
        </button>
        <button className="action-card" onClick={() => onNavigate('hld')}>
          <span className="action-icon">🏗️</span>
          <div className="action-text">
            <span className="action-title">System Design</span>
            <span className="action-desc">HLD & LLD documents</span>
          </div>
        </button>
        <button className="action-card" onClick={() => onNavigate('cheats')}>
          <span className="action-icon">📄</span>
          <div className="action-text">
            <span className="action-title">Quick References</span>
            <span className="action-desc">Cheatsheets & patterns</span>
          </div>
        </button>
      </div>

      {weakTopics.length > 0 && (
        <>
          <h3 className="dash-section-title">Weak Areas (rated hard)</h3>
          <div className="weak-topics">
            {weakTopics.map(([topic, count]) => (
              <span key={topic} className="weak-pill" onClick={() => onNavigate('problems', { topicFilter: topic })}>
                {topic} ({count})
              </span>
            ))}
          </div>
        </>
      )}
      {weakTopics.length === 0 && reviewed > 0 && (
        <>
          <h3 className="dash-section-title">Weak Areas</h3>
          <div className="weak-topics"><span className="weak-pill none">No weak areas — great job!</span></div>
        </>
      )}
    </div>
  );
}

/* ─── Code Reader (shared) ─── */
function CodeReader({ title='Solution', code='', language='java', editable=true, onChange, onReset, emptyMessage='// No solution shared yet.', isDirty=false }) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const getDefaultWrap = () => typeof window !== 'undefined' && window.matchMedia('(max-width:700px)').matches;
  const [wrapEnabled, setWrapEnabled] = useState(getDefaultWrap);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const sanitizedCode = typeof code === 'string' ? code : '';
  const displayCode = sanitizedCode.trim() ? sanitizedCode : emptyMessage;

  useEffect(() => {
    if (isEditing) return;
    let cancelled = false, retryId = null;
    const apply = () => {
      if (cancelled) return;
      if (window.hljs?.highlight) {
        try { const r = language ? window.hljs.highlight(displayCode,{language}) : window.hljs.highlightAuto(displayCode); setHighlightedHtml(r.value); return; } catch { setHighlightedHtml(escapeHtml(displayCode)); return; }
      }
      setHighlightedHtml(escapeHtml(displayCode));
      retryId = setTimeout(apply, 200);
    };
    apply();
    return () => { cancelled=true; if(retryId) clearTimeout(retryId); };
  }, [displayCode, language, isEditing]);

  useEffect(() => { if(isEditing && editorRef.current) { const el=editorRef.current; el.focus(); el.setSelectionRange(el.value.length,el.value.length); } }, [isEditing]);
  useEffect(() => { if(!isFullscreen) return; const orig=document.body.style.overflow; document.body.style.overflow='hidden'; return ()=>{document.body.style.overflow=orig;}; }, [isFullscreen]);
  useEffect(() => { if(!isFullscreen) return; const h=(e)=>{if(e.key==='Escape')setIsFullscreen(false);}; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); }, [isFullscreen]);

  const copy = useCallback(async()=>{try{await navigator.clipboard.writeText(displayCode);}catch{}}, [displayCode]);
  const toggleEdit = () => { if(editable) setIsEditing(v=>!v); };
  const handleReset = () => { if(onReset)onReset(); setIsEditing(false); };

  const cls = ['code-reader', wrapEnabled?'wrap-enabled':'', isFullscreen?'is-fullscreen':''].filter(Boolean).join(' ');
  return (
    <>
      {isFullscreen && <div className="code-reader-backdrop" onClick={()=>setIsFullscreen(false)} />}
      <div className={cls}>
        <div className="code-reader-toolbar">
          <span className="code-reader-title">{title}</span>
          <div className="code-reader-actions">
            {editable && <button className="pill-btn ghost" onClick={toggleEdit}>{isEditing?'Preview':'Edit'}</button>}
            {onReset && editable && isDirty && <button className="pill-btn ghost" onClick={handleReset}>Reset</button>}
            <button className="pill-btn ghost" onClick={()=>setWrapEnabled(w=>!w)}>{wrapEnabled?'No Wrap':'Wrap'}</button>
            <button className="pill-btn ghost" onClick={()=>setIsFullscreen(v=>!v)}>{isFullscreen?'Close':'Expand'}</button>
            <button className="pill-btn ghost" onClick={copy}>Copy</button>
          </div>
        </div>
        {isEditing ? (
          <textarea ref={editorRef} className="code-reader-textarea" value={code} spellCheck={false}
            wrap={wrapEnabled?'soft':'off'} onChange={e=>onChange?.(e.target.value)} />
        ) : (
          <pre className={`code-reader-pre${wrapEnabled?' wrap':''}`}>
            <code className={`hljs language-${language}`} style={{whiteSpace:wrapEnabled?'pre-wrap':'pre'}}
              dangerouslySetInnerHTML={{__html:highlightedHtml||escapeHtml(displayCode)}} />
          </pre>
        )}
      </div>
    </>
  );
}

/* ─── Split Pane: Problem List + Detail ─── */
function ProblemSplitPane({ problems, bookmarks, toggleBookmark, initialTopicFilter }) {
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState(initialTopicFilter || null);
  const [selectedId, setSelectedId] = useState(null);
  const [solutionDrafts, setSolutionDrafts] = useState({});
  const difficulties = ['Easy','Medium','Hard'];
  const isMobile = useMobileDetect();

  const normalized = useMemo(() => problems.map(p => ({
    ...p, topic:(p.topic||'Uncategorized').trim()||'Uncategorized', difficulty:(p.difficulty||'Unknown').trim()||'Unknown'
  })), [problems]);

  const allTopics = useMemo(() => Array.from(new Set(normalized.map(p=>p.topic))).sort(), [normalized]);

  const filtered = useMemo(() => {
    let list = normalized;
    if (diffFilter) list = list.filter(p=>p.difficulty===diffFilter);
    if (topicFilter) list = list.filter(p=>p.topic===topicFilter);
    if (search.trim()) { const q=search.toLowerCase(); list=list.filter(p=>p.title.toLowerCase().includes(q)); }
    return list;
  }, [normalized, diffFilter, topicFilter, search]);

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(p => { (m[p.topic]=m[p.topic]||[]).push(p); });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [filtered]);

  const selected = useMemo(() => normalized.find(p=>p.id===selectedId), [normalized, selectedId]);
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);

  const solutionFor = useCallback((p) => solutionDrafts.hasOwnProperty(p.id) ? solutionDrafts[p.id] : (typeof p.solution==='string'?p.solution:''), [solutionDrafts]);
  const updateDraft = useCallback((id,base,next) => {
    setSolutionDrafts(prev => {
      const n = normalizeNewlines(next||'');
      if(n===normalizeNewlines(base)) { if(!prev.hasOwnProperty(id)) return prev; const c={...prev}; delete c[id]; return c; }
      return {...prev,[id]:next||''};
    });
  }, []);
  const resetDraft = useCallback((id) => { setSolutionDrafts(prev => { if(!prev.hasOwnProperty(id)) return prev; const c={...prev}; delete c[id]; return c; }); }, []);

  // Set initial topic filter
  useEffect(() => { if (initialTopicFilter) setTopicFilter(initialTopicFilter); }, [initialTopicFilter]);

  // On mobile: show list or detail, not both
  const mobileShowDetail = isMobile && selectedId != null;
  const handleSelect = (id) => { setSelectedId(id); };
  const handleBack = () => { setSelectedId(null); };

  return (
    <div className={`split-pane${mobileShowDetail ? ' mobile-detail-open' : ''}`}>
      {/* Left: list — hidden on mobile when detail is open */}
      <div className={`split-list${mobileShowDetail ? ' mobile-hidden' : ''}`}>
        <div className="split-list-header">
          <div className="split-list-title">Problems ({filtered.length})</div>
          <input type="search" className="split-search" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search..." autoComplete="off" />
          <div className="filter-row">
            {difficulties.map(d => (
              <button key={d} className={`chip diff-chip diff-${d.toLowerCase()}${diffFilter===d?' active':''}`}
                onClick={()=>setDiffFilter(f=>f===d?'':d)}>{d}</button>
            ))}
            {(diffFilter||topicFilter||search) && <button className="chip clear" onClick={()=>{setDiffFilter('');setTopicFilter(null);setSearch('');}}>Reset</button>}
          </div>
          {allTopics.length > 1 && (
            <div className="filter-row topic-filter-row">
              {allTopics.map(t => (
                <button key={t} className={`chip${topicFilter===t?' active':''}`}
                  onClick={()=>setTopicFilter(f=>f===t?null:t)}>{t}</button>
              ))}
            </div>
          )}
        </div>
        <div className="split-items">
          {grouped.map(([topic, list]) => (
            <React.Fragment key={topic}>
              <div className="topic-group-header">{topic} ({list.length})</div>
              {list.map(p => (
                <div key={p.id} className={`problem-item${selectedId===p.id?' selected':''}`}
                  onClick={()=>handleSelect(p.id)}>
                  <button className={`problem-item-bookmark${bookmarkSet.has(p.id)?' bookmarked':''}`}
                    onClick={e=>{e.stopPropagation();toggleBookmark(p.id);}} title="Bookmark">
                    {bookmarkSet.has(p.id) ? Icons.bookmarkFill : Icons.bookmark}
                  </button>
                  <span className="problem-item-title">{p.title}</span>
                  <span className={`problem-item-diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
          {grouped.length === 0 && <div style={{textAlign:'center',padding:'2rem 1rem',color:'var(--text-muted)',fontSize:'var(--fs-sm)'}}>No problems found</div>}
        </div>
      </div>
      {/* Right: detail — full width on mobile when selected */}
      <div className={`split-detail${mobileShowDetail ? ' mobile-full' : ''}`} key={selectedId}>
        {!selected ? (
          !isMobile && <div className="detail-empty">
            <div className="detail-empty-icon">{Icons.code}</div>
            <div className="detail-empty-text">Select a problem from the list</div>
          </div>
        ) : (
          <div className="fade">
            {isMobile && (
              <button className="mobile-back-btn" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to list
              </button>
            )}
            <div className="detail-header">
              <h2 className="detail-title">{selected.title}</h2>
              <div className="detail-meta">
                <span className={`detail-badge ${selected.difficulty.toLowerCase()}`}>{selected.difficulty}</span>
                <span className="tag-chip">{selected.topic}</span>
                {typeof selected.tags === 'string' && selected.tags.split(',').map(t=>t.trim()).filter(Boolean).map(t =>
                  <span key={t} className="tag-chip">{t}</span>
                )}
              </div>
            </div>
            <div className="detail-statement" dangerouslySetInnerHTML={{__html: getStatementHtml(selected)}} />
            <CodeReader
              title="Solution"
              code={solutionFor(selected)}
              language={(selected.language||'java').toLowerCase()}
              onChange={v => updateDraft(selected.id, typeof selected.solution==='string'?selected.solution:'', v)}
              onReset={() => resetDraft(selected.id)}
              isDirty={solutionDrafts.hasOwnProperty(selected.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Markdown List ─── */
function MarkdownList({ title, files, onOpen, sectionLabel }) {
  const [filter, setFilter] = useState('');
  const visible = files.filter(f => f.toLowerCase().includes(filter.toLowerCase()));
  const clean = (n) => n.replace(/\.(md|markdown|java)$/i,'').replaceAll('_',' ');
  return (
    <div className="md-list-view">
      <Breadcrumb items={[{label:'Home',onClick:null},{label:title}]} />
      <h2 className="section-title">{title}</h2>
      <div className="section-filter">
        <input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by title..." />
      </div>
      <div className="md-grid">
        {visible.map(name => (
          <div key={name} className="md-card" onClick={()=>onOpen(name)} tabIndex={0}
            onKeyDown={e=>{if(e.key==='Enter')onOpen(name);}}>
            <span>{clean(name)}</span>
            <span className="chevron">›</span>
          </div>
        ))}
        {visible.length === 0 && <div style={{color:'var(--text-muted)',fontSize:'var(--fs-sm)',padding:'2rem 0',gridColumn:'1/-1',textAlign:'center'}}>No items</div>}
      </div>
    </div>
  );
}

/* ─── Markdown Viewer ─── */
function MarkdownViewer({ title, url, onBack, files, folder, onOpen }) {
  const ref = useRef(null);
  const [html, setHtml] = useState('<p style="color:var(--text-muted)">Loading...</p>');
  useEffect(() => {
    let alive = true;
    fetch(url,{cache:'no-cache'}).then(r=>r.ok?r.text():Promise.reject()).then(md => {
      if(!alive) return;
      setHtml(window.marked ? marked.parse(md,{breaks:true}) : md);
    }).catch(()=>setHtml('<p style="color:var(--danger)">Failed to load content.</p>'));
    return ()=>{alive=false;};
  }, [url]);
  useEffect(() => { if(ref.current) ref.current.querySelectorAll('pre code').forEach(b=>window.hljs&&hljs.highlightElement(b)); }, [html]);

  const currentFile = url.split('/').pop();
  return (
    <div className="md-viewer">
      <Breadcrumb items={[
        {label:'Home', onClick:null},
        {label:folder||'Section', onClick:onBack},
        {label:title}
      ]} />
      <button className="pill-btn ghost" onClick={onBack} style={{margin:'0 0 .75rem'}}>← Back</button>
      <h2 className="section-title">{title.replaceAll('_',' ')}</h2>
      <div className="md-viewer-content" ref={ref} dangerouslySetInnerHTML={{__html:html}} />
      {files && <DocNav files={files} currentFile={currentFile} onOpen={onOpen} folder={folder} />}
    </div>
  );
}

/* ─── Code Viewer (for custom implementations & multithreading) ─── */
function CodeViewer({ title, url, onBack, files, onOpen, sectionLabel }) {
  const label = sectionLabel || 'Custom';
  const [code, setCode] = useState('');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('loading');
  const lang = useMemo(() => {
    const m=url.match(/\.([a-z0-9]+)$/i);
    const ext=(m?.[1]||'').toLowerCase();
    const map={js:'javascript',ts:'typescript',py:'python',java:'java',cs:'csharp',cpp:'cpp',go:'go',rs:'rust',kt:'kotlin',swift:'swift',rb:'ruby',php:'php',scala:'scala'};
    return map[ext]||'';
  }, [url]);

  useEffect(() => {
    let alive=true; setStatus('loading');
    fetch(url,{cache:'no-cache'}).then(r=>r.ok?r.text():Promise.reject()).then(t=>{if(!alive)return;setCode(t);setDraft('');setStatus('ready');}).catch(()=>{if(!alive)return;setCode('');setDraft('');setStatus('error');});
    return ()=>{alive=false;};
  }, [url]);

  const isDirty = normalizeNewlines(draft||'') !== normalizeNewlines(code||'');
  const currentFile = url.split('/').pop();
  return (
    <div className="code-viewer-section">
      <Breadcrumb items={[{label:'Home',onClick:null},{label:label,onClick:onBack},{label:title}]} />
      <div className="viewer-top">
        <button className="pill-btn ghost" onClick={onBack}>← Back</button>
        <div className="viewer-meta">
          <span className="viewer-label">{label}</span>
          <h2 className="section-title" style={{margin:0}}>{title.replaceAll('_',' ')}</h2>
        </div>
      </div>
      {status==='loading' && <p style={{color:'var(--text-muted)',fontSize:'var(--fs-sm)'}}>Loading...</p>}
      {status==='error' && <p style={{color:'var(--danger)',fontSize:'var(--fs-sm)'}}>Failed to load.</p>}
      <CodeReader title="Implementation" code={draft||code} language={lang||'java'} editable
        onChange={v=>setDraft(v)} onReset={()=>setDraft('')} isDirty={isDirty} />
      {files && <DocNav files={files} currentFile={currentFile} onOpen={onOpen} />}
    </div>
  );
}

/* ─── Game Hub ─── */
function GameHub({ problems, onBack }) {
  const [activeGame, setActiveGame] = useState(null);
  if (activeGame==='recall') return <BlindRecall problems={problems} onBack={()=>setActiveGame(null)} />;
  if (activeGame==='pattern') return <PatternMatch problems={problems} onBack={()=>setActiveGame(null)} />;
  if (activeGame==='speed') return <SpeedRound problems={problems} onBack={()=>setActiveGame(null)} />;
  return (
    <div className="game-hub">
      <h2 className="game-hub-title">Revision Games</h2>
      <p className="game-hub-sub">Pick a game mode to test your recall on {problems.length} problems.</p>
      <div className="game-grid">
        <button className="game-card" onClick={()=>setActiveGame('recall')}>
          <span className="game-card-icon">🃏</span>
          <span className="game-card-name">Blind Recall</span>
          <span className="game-card-desc">See the title, recall the approach, then reveal & self-rate.</span>
        </button>
        <button className="game-card" onClick={()=>setActiveGame('pattern')}>
          <span className="game-card-icon">🎯</span>
          <span className="game-card-name">Pattern Match</span>
          <span className="game-card-desc">Read a problem (title hidden), identify the topic/pattern.</span>
        </button>
        <button className="game-card" onClick={()=>setActiveGame('speed')}>
          <span className="game-card-icon">⚡</span>
          <span className="game-card-name">Speed Round</span>
          <span className="game-card-desc">30s timer per problem. Type approach, then compare.</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Blind Recall ─── */
function BlindRecall({ problems, onBack }) {
  const [ratings, setRatings] = useState(loadRecallRatings);
  const [queue] = useState(() => {
    const r = loadRecallRatings();
    return [...problems].map(p => {
      const rating=r[p.id]; let priority=2;
      if(rating==='hard')priority=3; else if(rating==='medium')priority=1; else if(rating==='easy')priority=0;
      return {...p, priority};
    }).sort((a,b) => b.priority-a.priority || Math.random()-0.5);
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({easy:0,medium:0,hard:0});
  const current = queue[index];
  const isFinished = index >= queue.length;

  function rate(level) {
    const next={...ratings,[current.id]:level}; setRatings(next); saveRecallRatings(next);
    setStats(s=>({...s,[level]:s[level]+1})); setRevealed(false); setIndex(i=>i+1);
  }

  return (
    <div className="game-container">
      <button className="pill-btn ghost" onClick={onBack} style={{marginBottom:'.75rem'}}>← Back to Games</button>
      <h2 className="game-title">🃏 Blind Recall</h2>
      {!isFinished && current ? (
        <>
          <div className="game-stats">
            <span>Card {index+1}/{queue.length}</span>
            <span>Easy: {stats.easy}</span><span>Medium: {stats.medium}</span><span>Hard: {stats.hard}</span>
          </div>
          <div className="recall-card">
            <div className="recall-front">
              <span className="recall-label">Can you recall the approach for:</span>
              <h3 className="recall-problem-title">{current.title}</h3>
              <span className="quiz-difficulty" data-diff={current.difficulty?.toLowerCase()}>{current.difficulty}</span>
              {current.tags && <div className="recall-tags">{current.tags.split(',').map(t=>t.trim()).filter(Boolean).map(t=><span key={t} className="tag-chip">{t}</span>)}</div>}
            </div>
            {!revealed ? (
              <button className="pill-btn reveal-btn" onClick={()=>setRevealed(true)}>Reveal Solution</button>
            ) : (
              <div className="recall-revealed fade">
                <div className="recall-solution">
                  <CodeReader title="Solution" code={current.solution||'// No solution'} language={(current.language||'java').toLowerCase()} editable={false} />
                </div>
                <div className="recall-rate">
                  <span className="recall-rate-label">How hard was it to recall?</span>
                  <div className="recall-rate-btns">
                    <button className="pill-btn recall-easy" onClick={()=>rate('easy')}>Easy</button>
                    <button className="pill-btn recall-medium" onClick={()=>rate('medium')}>Medium</button>
                    <button className="pill-btn recall-hard" onClick={()=>rate('hard')}>Hard</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="game-over">
          <h3>Session Complete!</h3>
          <p>You reviewed {stats.easy+stats.medium+stats.hard} problems.</p>
          <div className="game-over-stats">
            <span>Easy: <strong>{stats.easy}</strong></span>
            <span>Medium: <strong>{stats.medium}</strong></span>
            <span>Hard: <strong>{stats.hard}</strong></span>
          </div>
          <p className="recall-hint">Problems rated "Hard" will appear first in your next session.</p>
          <button className="pill-btn" onClick={onBack}>Back to Games</button>
        </div>
      )}
    </div>
  );
}

/* ─── Pattern Match ─── */
function PatternMatch({ problems, onBack }) {
  const allTopics = useMemo(()=>Array.from(new Set(problems.map(p=>(p.topic||'Uncategorized').trim()))).sort(), [problems]);
  const [round,setRound]=useState(0); const [score,setScore]=useState(0);
  const [selected,setSelected]=useState(null); const [showAnswer,setShowAnswer]=useState(false);
  const [timeLeft,setTimeLeft]=useState(45); const timerRef=useRef(null);
  const questionSet=useMemo(()=>shuffleArray(problems.filter(p=>p.statement&&p.statement.trim())).slice(0,Math.min(problems.length,15)),[problems]);
  const current=questionSet[round]; const correctAnswer=current?(current.topic||'Uncategorized').trim():'';
  const options=useMemo(()=>{if(!current)return[];return shuffleArray([correctAnswer,...pickRandom(allTopics,3,new Set([correctAnswer]))]);},[current,allTopics,correctAnswer]);

  useEffect(()=>{
    if(showAnswer||round>=questionSet.length)return; setTimeLeft(45);
    timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setShowAnswer(true);setSelected(null);return 0;}return t-1;});},1000);
    return ()=>clearInterval(timerRef.current);
  },[round,showAnswer,questionSet.length]);

  function handlePick(opt){if(showAnswer)return;clearInterval(timerRef.current);setSelected(opt);setShowAnswer(true);if(opt===correctAnswer)setScore(s=>s+1);}
  function nextRound(){setSelected(null);setShowAnswer(false);setRound(r=>r+1);}
  const isFinished=round>=questionSet.length;
  const statementPreview=current?(current.statement||'').replace(/\r/g,'\n').slice(0,600)+((current.statement||'').length>600?'…':''):'';

  return (
    <div className="game-container">
      <button className="pill-btn ghost" onClick={onBack} style={{marginBottom:'.75rem'}}>← Back to Games</button>
      <h2 className="game-title">🎯 Pattern Match</h2>
      {!isFinished&&current?(
        <>
          <div className="game-stats">
            <span>Round {round+1}/{questionSet.length}</span><span>Score: {score}</span>
            <span className={`timer${timeLeft<=10?' timer-warn':''}`}>⏱ {timeLeft}s</span>
          </div>
          <div className="pattern-card">
            <div className="pattern-statement">
              <span className="pattern-label">Which topic does this problem belong to?</span>
              <div className="pattern-text">{statementPreview.split('\n').filter(Boolean).map((l,i)=><p key={i}>{l}</p>)}</div>
            </div>
            <div className="quiz-options">
              {options.map(opt=>{
                let cls='quiz-opt';
                if(showAnswer){if(opt===correctAnswer)cls+=' correct';else if(opt===selected)cls+=' wrong';}
                return <button key={opt} className={cls} onClick={()=>handlePick(opt)} disabled={showAnswer}>{opt}</button>;
              })}
            </div>
            {showAnswer&&(
              <div className="quiz-feedback fade">
                {selected===correctAnswer?<span className="quiz-correct-msg">Correct! It's <strong>{current.title}</strong></span>
                  :selected===null?<span className="quiz-wrong-msg">Time's up! It was <strong>{current.title}</strong> ({correctAnswer})</span>
                  :<span className="quiz-wrong-msg">Wrong — it's <strong>{current.title}</strong> ({correctAnswer})</span>}
                <button className="pill-btn" onClick={nextRound} style={{marginTop:'.5rem'}}>Next →</button>
              </div>
            )}
          </div>
        </>
      ):(
        <div className="game-over">
          <h3>Pattern Match Complete!</h3>
          <div className="game-over-stats">
            <span>Score: <strong>{score}/{questionSet.length}</strong></span>
            <span>Accuracy: <strong>{questionSet.length?Math.round(score/questionSet.length*100):0}%</strong></span>
          </div>
          <button className="pill-btn" onClick={onBack}>Back to Games</button>
        </div>
      )}
    </div>
  );
}

/* ─── Speed Round ─── */
function SpeedRound({ problems, onBack }) {
  const [round,setRound]=useState(0);const [timeLeft,setTimeLeft]=useState(30);
  const [userAnswer,setUserAnswer]=useState('');const [submitted,setSubmitted]=useState(false);
  const [score,setScore]=useState(0);const [streak,setStreak]=useState(0);const [bestStreak,setBestStreak]=useState(0);
  const [selfCorrect,setSelfCorrect]=useState(null);const timerRef=useRef(null);const inputRef=useRef(null);
  const questionSet=useMemo(()=>shuffleArray(problems).slice(0,Math.min(problems.length,15)),[problems]);
  const current=questionSet[round];

  useEffect(()=>{
    if(submitted||round>=questionSet.length)return;setTimeLeft(30);
    timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setSubmitted(true);return 0;}return t-1;});},1000);
    return ()=>clearInterval(timerRef.current);
  },[round,submitted,questionSet.length]);
  useEffect(()=>{if(!submitted&&inputRef.current)inputRef.current.focus();},[round,submitted]);

  function handleSubmit(e){e?.preventDefault();if(submitted)return;clearInterval(timerRef.current);setSubmitted(true);}
  function handleSelfRate(correct){setSelfCorrect(correct);if(correct){setScore(s=>s+1);setStreak(s=>{const n=s+1;setBestStreak(b=>Math.max(b,n));return n;});}else{setStreak(0);}}
  function nextRound(){setUserAnswer('');setSubmitted(false);setSelfCorrect(null);setRound(r=>r+1);}
  const isFinished=round>=questionSet.length;

  return (
    <div className="game-container">
      <button className="pill-btn ghost" onClick={onBack} style={{marginBottom:'.75rem'}}>← Back to Games</button>
      <h2 className="game-title">⚡ Speed Round</h2>
      {!isFinished&&current?(
        <>
          <div className="game-stats">
            <span>Round {round+1}/{questionSet.length}</span><span>Score: {score}</span>
            <span>Streak: {streak} 🔥</span>
            <span className={`timer${timeLeft<=10?' timer-warn':''}`}>⏱ {timeLeft}s</span>
          </div>
          <div className="speed-card">
            <div className="speed-prompt">
              <span className="speed-label">Describe the key approach for:</span>
              <h3 className="speed-problem-title">{current.title}</h3>
              <span className="quiz-difficulty" data-diff={current.difficulty?.toLowerCase()}>{current.difficulty}</span>
            </div>
            {!submitted?(
              <form onSubmit={handleSubmit} className="speed-form">
                <textarea ref={inputRef} className="speed-input" value={userAnswer} onChange={e=>setUserAnswer(e.target.value)}
                  placeholder="Type the key idea / approach / data structure..." rows={4} />
                <button type="submit" className="pill-btn">Submit</button>
              </form>
            ):(
              <div className="speed-result fade">
                <div className="speed-yours">
                  <span className="speed-result-label">Your Answer:</span>
                  <div className="speed-user-text">{userAnswer||<em>(no answer)</em>}</div>
                </div>
                <CodeReader title="Actual Solution" code={current.solution||'// No solution'} language={(current.language||'java').toLowerCase()} editable={false} />
                {selfCorrect===null?(
                  <div className="speed-self-rate">
                    <span>Did you get it right?</span>
                    <div className="speed-rate-btns">
                      <button className="pill-btn recall-easy" onClick={()=>handleSelfRate(true)}>Yes</button>
                      <button className="pill-btn recall-hard" onClick={()=>handleSelfRate(false)}>No</button>
                    </div>
                  </div>
                ):(
                  <div className="speed-next">
                    <span>{selfCorrect?'Great job!':'Keep practicing!'}</span>
                    <button className="pill-btn" onClick={nextRound}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ):(
        <div className="game-over">
          <h3>Speed Round Complete!</h3>
          <div className="game-over-stats">
            <span>Score: <strong>{score}/{questionSet.length}</strong></span>
            <span>Accuracy: <strong>{questionSet.length?Math.round(score/questionSet.length*100):0}%</strong></span>
            <span>Best Streak: <strong>{bestStreak} 🔥</strong></span>
          </div>
          <button className="pill-btn" onClick={onBack}>Back to Games</button>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home'); // home|problems|hld|lld|cheats|custom|games + sub-views
  const [theme, setTheme] = useState(loadTheme());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [ratings] = useState(loadRecallRatings);
  const contentRef = useRef(null);

  // Section file lists
  const [hldFiles, setHldFiles] = useState([]);
  const [lldFiles, setLldFiles] = useState([]);
  const [cheatFiles, setCheatFiles] = useState([]);
  const [customFiles, setCustomFiles] = useState([]);
  const [mtFiles, setMtFiles] = useState([]);
  const [companyFiles, setCompanyFiles] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [problemNavHint, setProblemNavHint] = useState(null); // {topicFilter}

  // Due count for games badge
  const dueCount = useMemo(() => {
    const r = loadRecallRatings();
    return Object.values(r).filter(v => v === 'hard').length;
  }, []);

  // Theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme==='dark') html.classList.remove('light'); else html.classList.add('light');
    saveTheme(theme);
    const link = document.getElementById('hljs-theme-link');
    if (link) link.href = theme==='dark'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
  }, [theme]);

  // Load data
  useEffect(() => {
    fetch('problems.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error();return r.json();})
      .then(data=>{if(Array.isArray(data))setProblems(data);}).catch(()=>setError('Could not load problems.'));
    const load=(url,set)=>fetch(url,{cache:'no-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]).then(set);
    load(HLD_MANIFEST, setHldFiles); load(LLD_MANIFEST, setLldFiles);
    load(CHEATS_MANIFEST, setCheatFiles); load(CUSTOM_MANIFEST, setCustomFiles);
    load(MT_MANIFEST, setMtFiles);
    load(COMPANY_MANIFEST, setCompanyFiles);
  }, []);

  // Bookmarks
  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id];
      saveBookmarks(next); return next;
    });
  }, []);

  // Global search index for command palette
  const globalIndex = useMemo(() => {
    const items = [];
    problems.forEach(p => items.push({key:`dsa:${p.id}`,section:'DSA Problem',type:'dsa',title:p.title,data:p,icon:Icons.code}));
    hldFiles.forEach(n => items.push({key:`hld:${n}`,section:'High-Level Design',type:'hld',title:n.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '),data:n,icon:Icons.layers}));
    lldFiles.forEach(n => items.push({key:`lld:${n}`,section:'Low-Level Design',type:'lld',title:n.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '),data:n,icon:Icons.puzzle}));
    cheatFiles.forEach(n => items.push({key:`cheats:${n}`,section:'Cheatsheet',type:'cheats',title:n.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '),data:n,icon:Icons.file}));
    customFiles.forEach(n => items.push({key:`custom:${n}`,section:'Custom Impl',type:'custom',title:n.replace(/\.(java)$/i,'').replaceAll('_',' '),data:n,icon:Icons.tool}));
    mtFiles.forEach(n => items.push({key:`mt:${n}`,section:'Multithreading',type:'mt',title:n.replace(/\.(java)$/i,'').replaceAll('_',' '),data:n,icon:Icons.threads}));
    companyFiles.forEach(n => items.push({key:`company:${n}`,section:'Company Prep',type:'company',title:n.replace(/\.(md|markdown)$/i,'').replaceAll('_',' '),data:n,icon:Icons.building}));
    return items;
  }, [problems, hldFiles, lldFiles, cheatFiles, customFiles, mtFiles, companyFiles]);

  const handlePaletteSelect = useCallback((item) => {
    if (item.type==='dsa') { setView('problems'); setProblemNavHint(null); }
    else if (item.type==='hld') { setCurrentDoc({title:item.title,url:`hld/${item.data}`,section:'hld'}); setView('hld-view'); }
    else if (item.type==='lld') { setCurrentDoc({title:item.title,url:`lld/${item.data}`,section:'lld'}); setView('lld-view'); }
    else if (item.type==='cheats') { setCurrentDoc({title:item.title,url:`cheatsheets/${item.data}`,section:'cheats'}); setView('cheats-view'); }
    else if (item.type==='custom') { setCurrentDoc({title:item.title,url:`custom/${item.data}`,section:'custom'}); setView('custom-view'); }
    else if (item.type==='mt') { setCurrentDoc({title:item.title,url:`multithreading/${item.data}`,section:'mt'}); setView('mt-view'); }
    else if (item.type==='company') { setCurrentDoc({title:item.title,url:`company/${item.data}`,section:'company'}); setView('company-view'); }
    window.scrollTo({top:0,behavior:'smooth'});
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(v=>!v); }
    };
    const customHandler = () => setPaletteOpen(true);
    window.addEventListener('keydown', handler);
    document.addEventListener('open-palette', customHandler);
    return () => { window.removeEventListener('keydown', handler); document.removeEventListener('open-palette', customHandler); };
  }, []);

  // Navigate from dashboard or sidebar
  const navigate = useCallback((target, hint) => {
    if (hint) setProblemNavHint(hint);
    else setProblemNavHint(null);
    // Reset sub-views when switching top-level sections
    if (['home','problems','hld','lld','cheats','custom','mt','company','games'].includes(target)) {
      setCurrentDoc(null);
    }
    setView(target);
    window.scrollTo({top:0,behavior:'smooth'});
  }, []);

  const activeSection = view.replace(/-view$/,'');

  // Helpers for opening docs within sections
  const openDoc = useCallback((section, name) => {
    const folder = section==='hld'?'hld':section==='lld'?'lld':section==='cheats'?'cheatsheets':section==='mt'?'multithreading':section==='company'?'company':'custom';
    const title = name.replace(/\.(md|markdown|java)$/i,'');
    setCurrentDoc({title, url:`${folder}/${name}`, section});
    setView(`${section}-view`);
  }, []);

  return (
    <>
      <Sidebar
        activeView={activeSection}
        onNavigate={navigate}
        theme={theme}
        toggleTheme={() => setTheme(t => t==='dark'?'light':'dark')}
        problemCount={problems.length || null}
        dueCount={dueCount}
      />
      <BottomTabs activeView={activeSection} onNavigate={navigate} />
      <div className="main-content">
        <div className="content-area" ref={contentRef} tabIndex={-1}>
          {view === 'home' && (
            <Dashboard problems={problems} onNavigate={navigate} bookmarks={bookmarks} ratings={ratings} />
          )}
          {view === 'problems' && (
            <ProblemSplitPane problems={problems} bookmarks={bookmarks} toggleBookmark={toggleBookmark}
              initialTopicFilter={problemNavHint?.topicFilter} />
          )}
          {view === 'hld' && (
            <MarkdownList title="High-Level Design" files={hldFiles} sectionLabel="HLD"
              onOpen={(name) => openDoc('hld', name)} />
          )}
          {view === 'hld-view' && currentDoc && (
            <MarkdownViewer title={currentDoc.title} url={currentDoc.url} folder="HLD"
              onBack={() => setView('hld')} files={hldFiles} onOpen={(name) => openDoc('hld', name)} />
          )}
          {view === 'lld' && (
            <MarkdownList title="Low-Level Design" files={lldFiles} sectionLabel="LLD"
              onOpen={(name) => openDoc('lld', name)} />
          )}
          {view === 'lld-view' && currentDoc && (
            <MarkdownViewer title={currentDoc.title} url={currentDoc.url} folder="LLD"
              onBack={() => setView('lld')} files={lldFiles} onOpen={(name) => openDoc('lld', name)} />
          )}
          {view === 'cheats' && (
            <MarkdownList title="Cheatsheets" files={cheatFiles} sectionLabel="Cheatsheets"
              onOpen={(name) => openDoc('cheats', name)} />
          )}
          {view === 'cheats-view' && currentDoc && (
            <MarkdownViewer title={currentDoc.title} url={currentDoc.url} folder="Cheatsheets"
              onBack={() => setView('cheats')} files={cheatFiles} onOpen={(name) => openDoc('cheats', name)} />
          )}
          {view === 'custom' && (
            <MarkdownList title="Custom Implementations" files={customFiles} sectionLabel="Custom"
              onOpen={(name) => openDoc('custom', name)} />
          )}
          {view === 'custom-view' && currentDoc && (
            <CodeViewer title={currentDoc.title} url={currentDoc.url} sectionLabel="Custom Implementations"
              onBack={() => setView('custom')} files={customFiles} onOpen={(name) => openDoc('custom', name)} />
          )}
          {view === 'mt' && (
            <MarkdownList title="Multithreading" files={mtFiles} sectionLabel="Multithreading"
              onOpen={(name) => openDoc('mt', name)} />
          )}
          {view === 'mt-view' && currentDoc && (
            <CodeViewer title={currentDoc.title} url={currentDoc.url} sectionLabel="Multithreading"
              onBack={() => setView('mt')} files={mtFiles} onOpen={(name) => openDoc('mt', name)} />
          )}
          {view === 'company' && (
            <MarkdownList title="Company Preparation" files={companyFiles} sectionLabel="Company"
              onOpen={(name) => openDoc('company', name)} />
          )}
          {view === 'company-view' && currentDoc && (
            <MarkdownViewer title={currentDoc.title} url={currentDoc.url} folder="Company"
              onBack={() => setView('company')} files={companyFiles} onOpen={(name) => openDoc('company', name)} />
          )}
          {view === 'games' && <GameHub problems={problems} />}
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}
        items={globalIndex} onSelect={handlePaletteSelect} />
    </>
  );
}

/* ─── Mount ─── */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);