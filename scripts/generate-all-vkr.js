const { execSync } = require('child_process');
const path = require('path');

const scripts = ['generate-vkr-ch1.js', 'generate-vkr-ch2.js', 'generate-vkr-ch3.js', 'generate-vkr-ch4.js'];
const dir = __dirname;

for (const s of scripts) {
  console.log('Running', s, '...');
  execSync(`node "${path.join(dir, s)}"`, { stdio: 'inherit' });
}
console.log('All chapters generated.');
