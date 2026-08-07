/**
 * Быстро прописать URL туннеля в site-config.js
 * Пример: node scripts/set-api-url.js https://abc.trycloudflare.com
 */
const fs = require('fs');
const path = require('path');

const url = (process.argv[2] || '').replace(/\/$/, '');
if (!url.startsWith('https://')) {
  console.error('Укажите URL: node scripts/set-api-url.js https://xxxx.trycloudflare.com');
  process.exit(1);
}

const file = path.join(__dirname, '..', 'js', 'site-config.js');
let text = fs.readFileSync(file, 'utf8');
text = text.replace(/const API_BASE = '[^']*';/, `const API_BASE = '${url}';`);
fs.writeFileSync(file, text, 'utf8');
console.log('OK: API_BASE =', url);
console.log('Залейте js/site-config.js на REG.RU через FTP');
