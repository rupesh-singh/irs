#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const ROOT = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const INPUT_PATH = path.resolve(ROOT, 'ProblemList.xlsx');
const OUTPUT_PATH = path.resolve(ROOT, 'problems.json');

function normalizeRow(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key) continue;
    normalized[key.trim().toLowerCase()] = value;
  }
  return normalized;
}

function toStringValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toString();
  return String(value);
}

function buildRecord(row, index) {
  const r = normalizeRow(row);
  const record = {
    id: toStringValue(r['id']).trim(),
    title: toStringValue(r['title']),
    topic: toStringValue(r['topic']),
    difficulty: toStringValue(r['difficulty']),
    tags: toStringValue(r['tags']),
    statement: toStringValue(r['problem statement']),
    solution: toStringValue(r['solution'])
  };

  if (!record.id) {
    throw new Error(`Row ${index + 2} is missing an id.`);
  }
  if (!record.title) {
    throw new Error(`Row ${index + 2} is missing a title.`);
  }
  return record;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Excel file not found at ${INPUT_PATH}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(INPUT_PATH);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    console.error('❌ No sheets were found in the Excel file.');
    process.exit(1);
  }

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (!rows.length) {
    console.error('❌ The Excel sheet is empty.');
    process.exit(1);
  }

  const records = rows.map((row, idx) => buildRecord(row, idx));

  const seen = new Map();
  records.forEach((rec) => {
    if (seen.has(rec.id)) {
      throw new Error(`Duplicate id detected: ${rec.id}`);
    }
    seen.set(rec.id, true);
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records, null, 2));
  console.log(`✅ Generated ${records.length} problems -> ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
