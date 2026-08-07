/**
 * Vertical system workflow diagram (Appendix L / system operation scheme)
 * Run: node scripts/generate-system-flow.js
 */
const fs = require('fs');
const path = require('path');
const { buildSystemFlowSvg } = require('./system-flow-svg');

const OUT = path.join(__dirname, '..', 'docs', 'vkr', 'system-workflow-vertical.html');
const OUT_APP = path.join(__dirname, '..', 'docs', 'vkr', 'appendices', 'system-workflow-vertical.html');

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Схема работы системы — вертикальная</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      background: #fff;
      color: #000;
      padding: 28px 24px 40px;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .sub {
      text-align: center;
      font-size: 12pt;
      margin-bottom: 24px;
      color: #333;
    }
    .diagram-wrap {
      max-width: 720px;
      margin: 0 auto;
    }
    .diagram-wrap svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .caption {
      text-align: center;
      font-size: 12pt;
      margin-top: 20px;
      max-width: 720px;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <h1>Схема работы системы ВИСЗ-АНО-ТО</h1>
  <p class="sub">АНО «Точка Открытий» · вертикальная модель (сверху вниз)</p>
  <div class="diagram-wrap">${buildSystemFlowSvg()}</div>
  <p class="caption">Рисунок – Схема работы информационной системы (вертикальная модель)</p>
</body>
</html>`;

fs.mkdirSync(path.dirname(OUT_APP), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
fs.writeFileSync(OUT_APP, html, 'utf8');
console.log('Created:', OUT);
console.log('Created:', OUT_APP);
