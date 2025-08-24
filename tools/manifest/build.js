#!/usr/bin/env node
/*
 Build data.generated.json from:
 - problems/<topic>/<slug>/problem.md (+solution.*)
 - solutions/<slug>.<ext> (fallback)
 Keeps shape compatible with app's data.json entries.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PROBLEMS_DIR = path.join(ROOT, 'problems');
const SOLUTIONS_DIR = path.join(ROOT, 'solutions');
const OUT_FILE = path.join(ROOT, 'data.generated.json');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function parseFrontMatter(content) {
  // very small YAML-ish front matter parser
  const fm = { body: content };
  if (!content.startsWith('---')) return fm;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return fm;
  const head = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\r?\n/, '');
  const meta = {};
  for (const line of head.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      const k = m[1];
      let v = m[2].trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        try { v = JSON.parse(v); } catch { /* leave as string */ }
      }
      meta[k] = v;
    }
  }
  return { meta, body };
}

function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function pickSolutionFiles(dirOrSlug) {
  // returns { ext, content } for priority list
  const exts = ['java','py','cpp','js','ts','md','txt'];
  for (const ext of exts) {
    const p = path.join(SOLUTIONS_DIR, `${dirOrSlug}.${ext}`);
    if (fs.existsSync(p)) {
      const content = readText(p) || '';
      return { ext, content };
    }
  }
  return null;
}

function buildFromProblems() {
  const items = [];
  if (!fs.existsSync(PROBLEMS_DIR)) return items;
  const topics = fs.readdirSync(PROBLEMS_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const topic of topics) {
    const topicDir = path.join(PROBLEMS_DIR, topic);
    const slugs = fs.readdirSync(topicDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const slug of slugs) {
      const folder = path.join(topicDir, slug);
      const mdPath = path.join(folder, 'problem.md');
      const md = readText(mdPath);
      if (!md) continue;
      const { meta, body } = parseFrontMatter(md);
      const id = meta?.id || slug;
      const title = meta?.title || slug;
      const difficulty = meta?.difficulty || 'Medium';
      const topicName = meta?.topic || topic;
      // descriptionHtml from Markdown body using a tiny converter (no external deps)
      const descriptionHtml = [`<p><strong>${title}</strong></p>`, mdToHtml(body || '')].filter(Boolean).join('\n');
      // solution from per-problem folder first
      let solutionJava = '';
      const localSolution = ['java','py','cpp','js','ts','md','txt'].map(ext => path.join(folder, `solution.${ext}`)).find(p => fs.existsSync(p));
      if (localSolution) {
        if (localSolution.endsWith('.java')) {
          solutionJava = readText(localSolution) || '';
        }
      } else {
        // fallback to global solutions/<id>.*
        const global = pickSolutionFiles(id);
        if (global && global.ext === 'java') solutionJava = global.content;
      }
      items.push({ id, title, topic: topicName, difficulty, descriptionHtml, solutionJava });
    }
  }
  return items;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function mdToHtml(src) {
  if (!src) return '';
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let inUl = false;
  let inOl = false;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      const text = para.join(' ').trim();
      if (text) out.push(`<p>${inlineMd(escapeHtml(text))}</p>`);
      para = [];
    }
  };
  const flushUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };
  const flushOl = () => { if (inOl) { out.push('</ol>'); inOl = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*$/.test(line)) {
      flushPara();
      flushUl();
      flushOl();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(); flushUl(); flushOl();
      const level = h[1].length;
      out.push(`<h${level}>${inlineMd(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara(); flushOl();
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inlineMd(escapeHtml(ul[1]))}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara(); flushUl();
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${inlineMd(escapeHtml(ol[1]))}</li>`);
      continue;
    }
    // paragraph text (accumulate)
    para.push(line);
  }
  flushPara(); flushUl(); flushOl();
  return out.join('\n');
}

function inlineMd(s) {
  // very small subset: `code`, **bold**, *italic*
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function buildFromSolutionsOnly() {
  const items = [];
  if (!fs.existsSync(SOLUTIONS_DIR)) return items;
  const files = fs.readdirSync(SOLUTIONS_DIR).filter(f => /\.(java|py|cpp|js|ts|md|txt)$/i.test(f));
  for (const f of files) {
    const slug = f.replace(/\.[^.]+$/, '');
    // default placeholders if only solution file exists
    const content = readText(path.join(SOLUTIONS_DIR, f)) || '';
    items.push({
      id: slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      topic: 'Misc',
      difficulty: 'Medium',
      descriptionHtml: `<p><strong>${slug}</strong></p>`,
      solutionJava: /\.java$/i.test(f) ? content : ''
    });
  }
  return items;
}

function mergeUnique(base, extra) {
  const map = new Map(base.map(p => [p.id, p]));
  for (const p of extra) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

function main() {
  let items = buildFromProblems();
  if (items.length === 0) {
    // fallback: derive from solutions only
    items = buildFromSolutionsOnly();
  }
  // Optional: merge existing data.json (to preserve fields you didn’t set)
  const dataJson = path.join(ROOT, 'data.json');
  if (fs.existsSync(dataJson)) {
    try {
      const base = JSON.parse(fs.readFileSync(dataJson, 'utf8'));
      if (Array.isArray(base)) items = mergeUnique(base, items);
    } catch {}
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log(`Wrote ${items.length} problems to ${path.relative(ROOT, OUT_FILE)}`);
}

main();
