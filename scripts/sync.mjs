import { cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = '/Users/liam/Documents/Codex/2026-09-12/apple-duo-x20/outputs/ucard-observer/dist/data';
const targetDir = path.join(__dirname, '../data');

console.log(`Syncing datasets from: ${sourceDir} -> ${targetDir}...`);
await cp(sourceDir, targetDir, { recursive: true });
const files = await readdir(targetDir);
console.log(`Sync complete! ${files.length} dataset files updated.`);
