const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = 'c:/Users/adm/Desktop';
const doc = fs
  .readdirSync(dir)
  .find(
    (n) =>
      n.endsWith('.docx') &&
      n.includes('методичке') &&
      !n.includes('копия') &&
      !n.includes('(') &&
      !n.startsWith('~') &&
      !n.startsWith('Введение')
  );

if (!doc) throw new Error('doc not found');
console.log('Using:', doc);

const zipPath = path.join(__dirname, '..', 'docs', 'temp-method.zip');
const outDir = path.join(__dirname, '..', 'docs', 'temp-method');
fs.copyFileSync(path.join(dir, doc), zipPath);
try {
  fs.rmSync(outDir, { recursive: true, force: true });
} catch (_) {}
fs.mkdirSync(outDir, { recursive: true });
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${outDir}' -Force"`,
  { stdio: 'inherit' }
);

const xml = fs.readFileSync(path.join(outDir, 'word/document.xml'), 'utf8');
const text = xml
  .replace(/<w:tab[^/]*\/>/g, '\t')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const out = path.join(__dirname, '..', 'docs', 'konechnarik.extracted.txt');
fs.writeFileSync(out, text, 'utf8');
console.log('Written', out, text.length, 'chars');
