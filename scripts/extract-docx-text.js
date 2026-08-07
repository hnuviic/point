const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = process.argv[2] || path.join(__dirname, '..', '..');
const namePart = process.argv[3] || 'методич';
const exact = process.argv[4];

const doc = exact
  ? fs.readdirSync(dir).find((n) => n === exact || n.normalize() === exact.normalize())
  : fs.readdirSync(dir).find(
      (n) =>
        n.endsWith('.docx') &&
        n.includes(namePart) &&
        !n.includes('копия') &&
        !n.includes('(') &&
        !n.startsWith('~$') &&
        !n.startsWith('Введение')
    );

if (!doc) {
  console.error('No docx found in', dir);
  process.exit(1);
}

const zipPath = path.join(__dirname, '..', 'docs', 'temp-method.zip');
const outDir = path.join(__dirname, '..', 'docs', 'temp-method');
fs.copyFileSync(path.join(dir, doc), zipPath);
try {
  fs.rmSync(outDir, { recursive: true, force: true });
} catch (_) {}
fs.mkdirSync(outDir, { recursive: true });
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force"`,
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

const out = process.argv[5] || path.join(__dirname, '..', 'docs', 'methodology.extracted.txt');
fs.writeFileSync(out, text, 'utf8');
console.log('Extracted:', doc, '->', out);
