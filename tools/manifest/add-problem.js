#!/usr/bin/env node
/*
 Scaffolds a new problem folder under problems/<topic>/<slug>/
 Creates problem.md with front matter + stub solution.java
 Usage: node add-problem.js "Two Sum" --topic "Arrays & Hashing" --difficulty Easy --id two-sum
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PROBLEMS_DIR = path.join(ROOT, 'problems');

function toSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Title is required. Example: node add-problem.js "Two Sum" --topic Arrays --difficulty Easy');
    process.exit(1);
  }
  const title = args[0];
  const out = { title };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--topic') { out.topic = args[++i]; continue; }
    if (a === '--difficulty') { out.difficulty = args[++i]; continue; }
    if (a === '--id') { out.id = args[++i]; continue; }
  }
  if (!out.topic) out.topic = 'Misc';
  if (!out.difficulty) out.difficulty = 'Medium';
  if (!out.id) out.id = toSlug(title);
  return out;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function main() {
  const { title, topic, difficulty, id } = parseArgs();
  const topicSlug = toSlug(topic);
  const folder = path.join(PROBLEMS_DIR, topicSlug, id);
  ensureDir(folder);
  const md = `---\n`+
`title: ${title}\n`+
`id: ${id}\n`+
`topic: ${topic}\n`+
`difficulty: ${difficulty}\n`+
`tags: []\n`+
`---\n\n`+
`Write the problem statement here in Markdown.\n`;
  fs.writeFileSync(path.join(folder, 'problem.md'), md, 'utf8');
  const stub = `// ${title} (${difficulty})\n// Topic: ${topic}\nclass Solution {\n    // TODO: implement\n}`;
  fs.writeFileSync(path.join(folder, 'solution.java'), stub, 'utf8');
  console.log(`Created ${path.relative(ROOT, folder)}`);
  console.log('Next: run node tools/manifest/build.js to regenerate data.generated.json');
}

main();
