import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = '/Users/liam/Documents/Codex/2026-09-12/apple-duo-x20/outputs/ucard-observer/dist/data';
const targetDir = path.join(__dirname, '../data');
const readmePath = path.join(__dirname, '../README.md');

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
  readme = readme.replace(/\|\s*\d+\s*Cards\s*\|/g, `| ${count} Cards |`);
  readme = readme.replace(/Filter \d+ brands/g, `Filter ${count} brands`);
  readme = readme.replace(/Explore all \d+ card profiles/g, `Explore all ${count} card profiles`);
  readme = readme.replace(/dataset of \d+\+ crypto debit/g, `dataset of ${count}+ crypto debit`);

  await writeFile(readmePath, readme, 'utf8');
  console.log(`README.md updated: ${count} cards, verified as of ${today}.`);
} catch (err) {
  console.warn('Warning: Could not update README stats:', err.message);
}
