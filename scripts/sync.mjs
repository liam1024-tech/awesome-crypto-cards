import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = '/Users/liam/Documents/Codex/2026-09-12/apple-duo-x20/outputs/ucard-observer/dist/data';
const targetDir = path.join(__dirname, '../data');
const readmePath = path.join(__dirname, '../README.md');

const readJson = async (file) => JSON.parse(await readFile(path.join(targetDir, file), 'utf8'));
const jsonLength = (value) => (Array.isArray(value) ? value.length : Object.keys(value || {}).length);
// Counts CSV records, honouring quoted fields so an embedded newline inside a
// quoted cell does not read as a new row. Returns data rows, excluding the header.
const countCsvRecords = async (file) => {
  const text = await readFile(path.join(targetDir, file), 'utf8');
  let rows = 0, quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (quoted && text[i + 1] === '"') { i++; continue; } quoted = !quoted; }
    else if (ch === '\n' && !quoted) rows++;
  }
  return Math.max(0, rows - 1);
};

// The README table's third column, per file. `cashback-comparison.csv` describes
// fixed spending tiers rather than a row count, so it deliberately has no entry
// and keeps whatever the table already says.
async function datasetRowCounts(dir, cardCount) {
  const privacy = await readJson('app-privacy-matrix.json');
  const bins = await readJson('crypto-card-bins.json');
  const cardsLabel = `${cardCount} Cards`;
  return {
    'cards.json': cardsLabel,
    'crypto-card-bins.json': `${jsonLength(bins.bins)} BINs`,
    'crypto-card-bins.csv': `${jsonLength(bins.bins)} BINs`,
    'ucard-coverage.csv': cardsLabel,
    'ucard-coverage.json': cardsLabel,
    'payment-compatibility.csv': cardsLabel,
    'status-radar.json': cardsLabel,
    'card-changelogs.csv': `${await countCsvRecords('card-changelogs.csv')} Events`,
    // The privacy matrix audits a subset of the directory, so it must report its
    // own total — both files are generated from the same records.
    'app-privacy-matrix.csv': `${privacy.cards.length} Cards`,
    'app-privacy-matrix.json': `${privacy.cards.length} Cards`
  };
}

console.log(`Syncing datasets from: ${sourceDir} -> ${targetDir}...`);
await cp(sourceDir, targetDir, { recursive: true });
const files = await readdir(targetDir);
console.log(`Sync complete! ${files.length} dataset files updated.`);

// Auto-sync README stats & dates
try {
  const cardsRaw = JSON.parse(await readFile(path.join(targetDir, 'cards.json'), 'utf8'));
  const cards = Array.isArray(cardsRaw) ? cardsRaw : cardsRaw.cards || [];
  const count = cards.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayBadge = today.replace(/-/g, '--');

  let readme = await readFile(readmePath, 'utf8');
  readme = readme.replace(/Cards_Tracked-\d+_Brands/, `Cards_Tracked-${count}_Brands`);
  readme = readme.replace(/Verified-\d{4}--\d{2}--\d{2}/, `Verified-${todayBadge}`);
  readme = readme.replace(/Data updated and verified as of \*\*\d{4}-\d{2}-\d{2}\*\*/, `Data updated and verified as of **${today}**`);
  readme = readme.replace(/Filter \d+ brands/g, `Filter ${count} brands`);
  readme = readme.replace(/Explore all \d+ card profiles/g, `Explore all ${count} card profiles`);
  readme = readme.replace(/dataset of \d+\+ crypto debit/g, `dataset of ${count}+ crypto debit`);
  // Each dataset row in the table gets its own row count. A blanket
  // `| N Cards |` replace used to stamp the card total onto every row, so the
  // privacy matrix claimed as many rows as the card directory even though it
  // audits fewer cards (127 of 135), and card-changelogs kept a count from a
  // previous generation.
  const rowCounts = await datasetRowCounts(targetDir, count);
  readme = readme.split('\n').map((line) => {
    const m = line.match(/^\|\s*\[`data\/([^`]+)`\]/);
    if (!m) return line;
    const label = rowCounts[m[1]];
    if (!label) return line;
    const cells = line.split('|');
    if (cells.length < 5) return line;
    cells[3] = ` ${label} `;
    return cells.join('|');
  }).join('\n');

  await writeFile(readmePath, readme, 'utf8');
  console.log(`README.md updated: ${count} cards, verified as of ${today}.`);
} catch (err) {
  console.warn('Warning: Could not update README stats:', err.message);
}
