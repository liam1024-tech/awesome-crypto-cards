import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');

const raw = JSON.parse(await readFile(path.join(dataDir, 'cards.json'), 'utf8'));
const cards = Array.isArray(raw) ? raw : raw.cards;
const coverageCsv = await readFile(path.join(dataDir, 'ucard-coverage.csv'), 'utf8');
const compatibilityCsv = await readFile(path.join(dataDir, 'payment-compatibility.csv'), 'utf8');

if (!Array.isArray(cards) || cards.length < 100) {
  throw new Error(`Validation failed: cards.json contains only ${cards?.length} items`);
}

const lines = coverageCsv.trim().split('\n');
if (lines.length !== cards.length + 1) {
  throw new Error(`Validation failed: ucard-coverage.csv has ${lines.length} lines, expected ${cards.length + 1}`);
}

console.log(`Validation PASS! ${cards.length} cards verified across JSON and CSV datasets.`);
