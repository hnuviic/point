const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = [
  'index.html',
  'glav.html',
  'info.html',
  'news.html',
  'contact.html',
  'zap.html',
  'podbor.html',
  'seansy.html',
  'proect.html',
  'proect-konsult.html',
];

const footerRe = /<footer[\s\S]*?<\/footer>/;
const newFooter = '<footer id="site-footer" class="site-footer"></footer>';
const cssLink = '    <link rel="stylesheet" href="css/site-footer.css">';
const jsScript = '    <script src="js/site-footer.js"></script>';

for (const f of files) {
  const p = path.join(dir, f);
  let html = fs.readFileSync(p, 'utf8');
  if (!footerRe.test(html)) {
    console.log('SKIP footer', f);
    continue;
  }
  html = html.replace(footerRe, newFooter);
  if (!html.includes('site-footer.css')) {
    html = html.replace(/(<link rel="stylesheet" href="[^"]+\.css">)/, `$1\n${cssLink}`);
  }
  if (!html.includes('site-footer.js')) {
    html = html.replace(/(<script src="js\/site-config\.js"><\/script>)/, `$1\n${jsScript}`);
  }
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK', f);
}
