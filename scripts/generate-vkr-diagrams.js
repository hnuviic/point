/**
 * Генерация всех ч/б SVG-диаграмм ВКР (белый фон, чёрный текст, стрелки к границам).
 * Запуск: node scripts/generate-vkr-diagrams.js
 */
const fs = require('fs');
const path = require('path');
const { buildSystemFlowSvg } = require('./system-flow-svg');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'docs', 'vkr', 'appendices');

const DEFS = `<defs>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
    <path d="M0,0 L10,5 L0,10z" fill="#000000"/>
  </marker>
  <marker id="arr-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
    <path d="M0,0 L10,5 L0,10z" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  </marker>
</defs>`;

/** UML-класс: заголовок + атрибуты */
function umlClass(x, y, w, h, name, attrs, stereotype) {
  const headH = stereotype ? 38 : 24;
  const bodyH = attrs.length * 14 + 14;
  const totalH = h > 0 ? h : headH + bodyH;
  let g = `<rect class="shape" x="${x}" y="${y}" width="${w}" height="${totalH}"/>`;
  if (stereotype) {
    g += T(x + w / 2, y + 12, `«${stereotype}»`, { sz: 9 });
    g += T(x + w / 2, y + 26, name, { bold: true, sz: 10 });
    g += `<line class="line" x1="${x}" y1="${y + headH}" x2="${x + w}" y2="${y + headH}"/>`;
  } else {
    g += T(x + w / 2, y + 16, name, { bold: true, sz: 10 });
    g += `<line class="line" x1="${x}" y1="${y + 22}" x2="${x + w}" y2="${y + 22}"/>`;
  }
  const bodyY = y + headH + 12;
  attrs.forEach((a, i) => {
    g += T(x + 8, bodyY + i * 14, a, { anchor: 'start', sz: 9 });
  });
  return g;
}

function multLabel(x, y, t) {
  return T(x, y, t, { sz: 9 });
}

/** «Лапка» ER (много записей) в конце линии */
function erMany(x, y, vertical) {
  if (vertical) {
    return `<line class="line" x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}"/>
      <line class="line" x1="${x - 5}" y1="${y + 8}" x2="${x + 5}" y2="${y + 8}"/>`;
  }
  return `<line class="line" x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}"/>
    <line class="line" x1="${x + 8}" y1="${y - 5}" x2="${x + 8}" y2="${y + 5}"/>`;
}

function legend(items, y) {
  return items
    .map((item, i) => {
      const x = 40 + i * 200;
      return item.dash
        ? `<line class="line" x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" stroke-dasharray="6 4" marker-end="url(#arr-open)"/>${T(x + 38, y + 4, item.text, { anchor: 'start', sz: 9 })}`
        : `<line class="line" x1="${x}" y1="${y}" x2="${x + 30}" y2="${y}" marker-end="url(#arr)"/>${T(x + 38, y + 4, item.text, { anchor: 'start', sz: 9 })}`;
    })
    .join('');
}

function bg(w, h) {
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
}

function T(x, y, s, o = {}) {
  const { sz = 11, anchor = 'middle', bold = false } = o;
  return `<text class="label" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${sz}"${bold ? ' font-weight="bold"' : ''}>${esc(s)}</text>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function R(x, y, w, h, lines, rx = 2) {
  const lh = Array.isArray(lines) ? lines : [lines];
  const startY = y + (h <= 40 ? 22 : 18);
  const step = lh.length > 2 ? 13 : 15;
  const labels = lh.map((l, i) => T(x + w / 2, startY + i * step, l, { sz: l.length > 28 ? 9 : 10 })).join('');
  return `<rect class="shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>${labels}`;
}

function E(cx, cy, rx, ry, label) {
  return `<ellipse class="shape" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>${T(cx, cy + 4, label, { sz: 11 })}`;
}

function D(cx, cy, label) {
  const t = Array.isArray(label) ? label : [label];
  const y0 = cy - (t.length - 1) * 6;
  const ts = t.map((l, i) => T(cx, y0 + i * 13, l, { sz: 10 })).join('');
  return `<polygon class="shape" points="${cx},${cy - 30} ${cx + 42},${cy} ${cx},${cy + 30} ${cx - 42},${cy}"/>${ts}`;
}

function L(x1, y1, x2, y2, dash = false) {
  const d = dash ? ' stroke-dasharray="6 4"' : '';
  return `<line class="line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arr)"${d}/>`;
}

function P(d, dash = false) {
  const ds = dash ? ' stroke-dasharray="6 4"' : '';
  return `<path class="line" d="${d}" marker-end="url(#arr)"${ds}/>`;
}

function Lo(x1, y1, x2, y2) {
  return `<line class="line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arr-open)" stroke-dasharray="6 4"/>`;
}

function Po(d) {
  return `<path class="line" d="${d}" marker-end="url(#arr-open)" stroke-dasharray="6 4"/>`;
}

function svg(w, h, inner) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${DEFS}${bg(w, h)}${inner}</svg>`;
}

function appendixHtml(title, appendixCode, name, intro, svgContent, caption) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="appendix-common.css">
  <meta name="color-scheme" content="light only">
</head>
<body>
  <nav class="nav"><a href="index.html">← Все приложения</a></nav>
  <p class="appendix-title">Приложение ${appendixCode}</p>
  <p class="appendix-status">(обязательное)</p>
  <p class="appendix-name">${name}</p>
  ${intro ? `<p>${intro}</p>` : ''}
  <div class="diagram-wrap">${svgContent}</div>
  <p class="caption-fig">${caption}</p>
</body>
</html>`;
}

function flowHtml(title, figCaption, h1, subtitle, svgContent, note, lanes) {
  const lanesHtml = lanes
    ? `<div class="lanes">${lanes.map((l) => `<span>${l}</span>`).join('')}</div>`
    : '';
  const m = figCaption.match(/^(Рисунок[^–]+)\s*–\s*(.+)$/);
  const figLabel = m ? m[1].trim() : 'Рисунок';
  const figDesc = m ? m[2].trim() : figCaption;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="docs/vkr/diagram-bw.css">
  <meta name="color-scheme" content="light only">
</head>
<body>
  <p class="caption">ВИСЗ-АНО-ТО</p>
  <h1>${h1}</h1>
  <p class="subtitle">${subtitle}</p>
  ${lanesHtml}
  <div class="flow-wrap">${svgContent}</div>
  ${note ? `<div class="note-box">${note}</div>` : ''}
  <p class="figure-note"><strong>${figLabel}</strong> – ${figDesc}</p>
</body>
</html>`;
}

function actor(x, y, label) {
  return `<g fill="none" stroke="#000000" stroke-width="1.25">
    <circle cx="${x}" cy="${y}" r="13"/>
    <line x1="${x}" y1="${y + 13}" x2="${x}" y2="${y + 44}"/>
    <line x1="${x - 20}" y1="${y + 27}" x2="${x + 20}" y2="${y + 27}"/>
    <line x1="${x}" y1="${y + 44}" x2="${x - 16}" y2="${y + 64}"/>
    <line x1="${x}" y1="${y + 44}" x2="${x + 16}" y2="${y + 64}"/>
  </g>${T(x, y + 84, label, { sz: 12 })}`;
}

/* ——— Приложение Г — прецеденты ——— */
function diagramG() {
  const w = 980;
  const h = 540;
  const inner = `
    <rect class="shape" x="158" y="42" width="818" height="468" fill="#ffffff"/>
    ${T(567, 66, 'ВИСЗ-АНО-ТО', { bold: true, sz: 14 })}
    ${actor(88, 108, 'Посетитель')}
    ${actor(88, 248, 'Родитель')}
    ${actor(88, 388, 'Сотрудник')}
    ${ellipseCase(320, 118, 94, 26, ['Просмотр информации'])}
    ${ellipseCase(530, 118, 72, 26, ['Чат-помощник'])}
    ${ellipseCase(720, 118, 88, 26, ['Просмотр новостей'])}
    ${ellipseCase(900, 118, 64, 24, ['API контента', 'GET /api/content'])}
    ${ellipseCase(310, 248, 100, 28, ['Обратная связь', '(ВХ-01)'])}
    ${ellipseCase(560, 248, 100, 28, ['Запись на приём', '(ВХ-02)'])}
    ${ellipseCase(360, 368, 80, 26, ['Вход в систему'])}
    ${ellipseCase(560, 368, 96, 26, ['Обработка заявок'])}
    ${ellipseCase(430, 468, 104, 26, ['Управление контентом'])}
    ${ellipseCase(650, 468, 108, 26, ['Управление пользователями'])}
    ${ellipseCase(830, 468, 96, 26, ['Библиотека материалов'])}
    ${L(104, 122, 226, 118)}${L(104, 124, 458, 118)}${L(104, 126, 632, 118)}
    ${L(104, 262, 210, 248)}${L(104, 264, 460, 248)}
    ${L(104, 402, 280, 368)}${L(104, 406, 464, 368)}${L(104, 410, 326, 468)}
    ${L(104, 414, 542, 468)}${L(104, 418, 734, 468)}
    ${Lo(808, 118, 836, 118)}${T(822, 106, '<<include>>', { sz: 9 })}
    ${Lo(440, 368, 464, 368)}${T(452, 356, '<<include>>', { sz: 9 })}
    ${L(175, 525, 215, 525)}${T(222, 529, 'связь актора с прецедентом', { sz: 10, anchor: 'start' })}
    <line class="line" x1="400" y1="525" x2="440" y2="525" stroke-dasharray="6 4" marker-end="url(#arr-open)"/>
    ${T(447, 529, 'зависимость <<include>>', { sz: 10, anchor: 'start' })}
  `;
  const intro =
    'Диаграмма вариантов использования (UML): граница системы — прямоугольник «ВИСЗ-АНО-ТО»; актёры вне границы; прецеденты — овалы; связь «include» — для обязательного подпрецедента (вход в систему, API контента).';
  return appendixHtml('Приложение Г — Диаграмма прецедентов', 'Г', 'Диаграмма прецедентов', intro, svg(w, h, inner), 'Рисунок Г.1 – Диаграмма прецедентов веб-приложения ВИСЗ-АНО-ТО');
}

function ellipseCase(cx, cy, rx, ry, lines) {
  const t = lines.map((l, i) => T(cx, cy - (lines.length - 1) * 5 + i * 13, l, { sz: lines[1] && lines[1].length < 12 ? 9 : 11 })).join('');
  return `<ellipse class="shape" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>${t}`;
}

/* ——— Приложение Д — деятельность ——— */
function diagramD() {
  const w = 940;
  const h = 520;
  const inner = `
    <line class="line" x1="208" y1="40" x2="208" y2="480" stroke-width="1"/>
    <line class="line" x1="468" y1="40" x2="468" y2="480" stroke-width="1"/>
    <line class="line" x1="628" y1="40" x2="628" y2="480" stroke-width="1"/>
    ${T(104, 58, 'Клиент', { bold: true, sz: 12 })}
    ${T(338, 58, 'Сервер (Express)', { bold: true, sz: 12 })}
    ${T(548, 58, 'SQLite', { bold: true, sz: 12 })}
    ${T(734, 58, 'Сотрудник', { bold: true, sz: 12 })}
    ${E(104, 90, 34, 15, 'Начало')}
    ${R(34, 118, 140, 36, 'Заполнить форму')}
    ${R(34, 168, 140, 36, 'POST JSON')}
    ${R(34, 258, 140, 40, ['Сообщение', 'об ошибке'])}
    ${R(34, 348, 140, 36, 'Подтверждение')}
    ${E(104, 430, 34, 15, 'Конец')}
    ${R(258, 168, 160, 36, 'Валидация данных')}
    ${D(338, 248, 'OK?')}
    ${R(258, 100, 160, 40, ['Ответ HTTP 400', '(ошибка валидации)'])}
    ${R(258, 298, 160, 36, 'INSERT в таблицу')}
    ${R(478, 298, 140, 36, 'Запись в БД')}
    ${R(664, 318, 140, 36, 'Просмотр /admin')}
    ${R(664, 378, 140, 36, 'Смена status')}
    ${E(734, 448, 34, 15, 'Конец')}
    ${L(104, 105, 104, 118)}${L(104, 154, 104, 168)}
    ${L(174, 186, 258, 186)}
    ${L(338, 204, 338, 218)}${L(338, 278, 338, 298)}
    ${L(418, 316, 478, 316)}${T(448, 308, 'да', { sz: 10 })}
    ${P('M 338 334 L 338 354 L 104 354 L 104 348')}
    ${L(104, 384, 104, 415)}
    ${P('M 296 248 L 246 248 L 246 100 L 338 100')}
    ${T(268, 240, 'нет', { sz: 10 })}
    ${P('M 338 140 L 338 210 L 104 210 L 104 258')}
    ${L(104, 298, 104, 415)}
    ${L(734, 354, 734, 378)}${L(734, 414, 734, 433)}
    ${P('M 618 316 L 664 316 L 664 318', true)}${T(642, 306, 'позже', { sz: 9 })}
    ${L(40, 492, 75, 492)}${T(82, 496, 'основной поток', { sz: 10, anchor: 'start' })}
    <line class="line" x1="200" y1="492" x2="235" y2="492" stroke-dasharray="6 4" marker-end="url(#arr)"/>
    ${T(242, 496, 'обработка сотрудником (отложенно)', { sz: 10, anchor: 'start' })}
  `;
  return appendixHtml(
    'Приложение Д — Диаграмма деятельности',
    'Д',
    'Диаграмма деятельности',
    'Диаграмма деятельности: приём и обработка заявки (ВХ-01, ВХ-02). Нотация UML, дорожки ответственности.',
    svg(w, h, inner),
    'Рисунок Д.1 – Диаграмма деятельности (приём заявки contact/booking)'
  );
}

/* ——— Приложение Е — классы (сущности предметной области) ——— */
function diagramE() {
  const links = `
    <g id="links">
      ${Po('M 410 98 L 410 100')}
      ${P('M 410 194 L 410 212 L 133 212 L 133 230')}
      ${multLabel(400, 200, '1')}${multLabel(128, 222, '*')}
      ${P('M 410 194 L 403 194 L 403 230')}
      ${multLabel(408, 200, '1')}${multLabel(398, 222, '*')}
      ${P('M 410 194 L 410 212 L 663 212 L 663 230')}
      ${multLabel(655, 222, '*')}${T(580, 204, 'author_id', { sz: 9 })}
      ${Po('M 133 310 L 133 395 L 360 395 L 360 420')}
      ${Po('M 403 310 L 403 395 L 390 395 L 390 420')}
      ${Po('M 663 310 L 663 395 L 460 395 L 460 420')}
      ${Po('M 410 194 L 410 395 L 420 395 L 420 420')}
    </g>
  `;
  const boxes = `
    ${umlClass(295, 18, 230, 0, 'ВИСЗ-АНО-ТО', ['веб-приложение', 'реализация: server.js'], 'компонент')}
    ${umlClass(325, 100, 170, 0, 'AdminUser', ['id: int', 'username: string', 'role: string', 'password_hash: string'])}
    ${umlClass(45, 230, 175, 0, 'ContactRequest', ['id, name, phone', 'status, assigned_to: FK', 'таблица contact_requests'])}
    ${umlClass(315, 230, 175, 0, 'BookingRequest', ['child_name, direction', 'assigned_to: FK', 'таблица booking_requests'])}
    ${umlClass(585, 230, 155, 0, 'SiteNews', ['title, body', 'author_id: FK', 'таблица site_news'])}
    ${umlClass(300, 420, 220, 65, 'data.sqlite', ['СУБД SQLite', 'таблицы ВХ-01…ВХ-07'], 'хранилище')}
    ${legend(
      [
        { text: 'ассоциация 1 : * (FK)', dash: false },
        { text: 'зависимость «использует»', dash: true },
      ],
      510
    )}
  `;
  const intro =
    'Логическая диаграмма классов предметной области: сущности соответствуют таблицам базы data.sqlite (глава 3, приложение И). Связь assigned_to и author_id — внешние ключи на AdminUser.';
  return appendixHtml('Приложение Е — Диаграмма классов', 'Е', 'Диаграмма классов', intro, svg(820, 540, links + boxes), 'Рисунок Е.1 – Диаграмма классов предметной области');
}

function classBox(x, y, w, title, lines) {
  const h = 22 + lines.length * 14 + 8;
  const head = `<rect class="shape" x="${x}" y="${y}" width="${w}" height="22"/><line class="line" x1="${x}" y1="${y + 22}" x2="${x + w}" y2="${y + 22}"/>`;
  const body = `<rect class="shape" x="${x}" y="${y + 22}" width="${w}" height="${h - 22}"/>`;
  const tl = T(x + w / 2, y + 15, title, { bold: true, sz: 10 });
  const bl = lines.map((l, i) => T(x + 8, y + 38 + i * 14, l, { anchor: 'start', sz: 10 })).join('');
  return head + body + tl + bl;
}

/* ——— Ж, И, К, Л ——— */
function extEntity(x, y, w, h, label) {
  return `
    <rect class="shape" x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-dasharray="6 4"/>
    <rect class="shape" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="#000000"/>
    ${T(x + w / 2, y + h / 2 + 4, label, { sz: 11 })}
  `;
}

function funcBlock(x, y, w, h, title, lines) {
  const lh = lines.map((l, i) => T(x + w / 2, y + 28 + i * 13, l, { sz: 9 })).join('');
  return `
    <rect class="shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>
    ${T(x + w / 2, y + 18, title, { bold: true, sz: 10 })}
    ${lh}
  `;
}

function idef0Block(x, y, w, h, code, title, lines) {
  const inner = lines.map((l, i) => T(x + w / 2, y + 36 + i * 12, l, { sz: 9 })).join('');
  return `
    <rect class="shape" x="${x}" y="${y}" width="${w}" height="${h}"/>
    <text class="label" x="${x + 14}" y="${y + 16}" font-size="11" font-weight="bold">${code}</text>
    ${T(x + w / 2, y + 28, title, { bold: true, sz: 10 })}
    ${inner}
  `;
}

function diagramZh() {
  const links = `
    <g id="links">
      ${P('M 126 252 L 126 168 L 440 168 L 440 118')}
      ${P('M 330 252 L 330 168 L 440 168')}
      ${P('M 534 252 L 534 168 L 440 168')}
      ${P('M 738 252 L 738 168 L 440 168')}
      ${P('M 114 300 L 114 268 L 126 268 L 126 252')}
      ${P('M 114 300 L 114 276 L 330 276 L 330 252')}
      ${P('M 422 300 L 422 276 L 330 276')}
      ${P('M 422 300 L 422 268 L 534 268 L 534 252')}
      ${P('M 422 300 L 422 260 L 738 260 L 738 252')}
      ${P('M 724 300 L 724 268 L 534 268')}
      ${P('M 724 300 L 724 260 L 738 260')}
    </g>
  `;
  const boxes = `
    ${idef0Block(300, 28, 280, 90, 'A0', 'ВИСЗ-АНО-ТО', ['Вход: HTTP, JSON', 'Выход: HTML, ВЫ-01…06', 'Назначение: портал центра'])}
    ${idef0Block(24, 152, 192, 100, 'A1', 'Информирование', ['Вход: site_news, events', 'Выход: страницы, API'])}
    ${idef0Block(232, 152, 192, 100, 'A2', 'Обращения', ['Вход: ВХ-01, ВХ-02', 'Выход: заявки в БД'])}
    ${idef0Block(440, 152, 192, 100, 'A3', 'Контент', ['Вход: ВХ-05, ВХ-06', 'Выход: публикации'])}
    ${idef0Block(648, 152, 192, 100, 'A4', 'Админ', ['Вход: ВХ-04, ВХ-07', 'Выход: сессия, /admin'])}
    ${extEntity(36, 300, 156, 48, 'Посетитель')}
    ${extEntity(352, 300, 140, 48, 'Координатор')}
    ${extEntity(656, 300, 136, 48, 'SQLite')}
    ${T(440, 145, 'декомпозиция A0', { sz: 9 })}
  `;
  return appendixHtml(
    'Приложение Ж — Функциональная модель',
    'Ж',
    'Функциональная модель',
    'Модель IDEF0: блок A0 — система в целом; блоки A1–A4 — подсистемы по п. 3.1.2 технического проекта.',
    svg(880, 380, links + boxes),
    'Рисунок Ж.1 – Функциональная модель системы (IDEF0)'
  );
}

function erTable(x, y, w, title, fields) {
  const fh = 20 + fields.length * 14;
  return `
    <rect class="shape" x="${x}" y="${y}" width="${w}" height="20"/>
    ${T(x + w / 2, y + 14, title, { bold: true, sz: 10 })}
    <rect class="shape" x="${x}" y="${y + 20}" width="${w}" height="${fh}"/>
    ${fields.map((f, i) => T(x + 8, y + 36 + i * 14, f, { anchor: 'start', sz: 10 })).join('')}
  `;
}

function erTableLink(fromX, fromY, toX, toY, label) {
  const midY = Math.round((fromY + toY) / 2);
  const d = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
  return `${P(d)}${erMany(toX, toY, true)}${multLabel((fromX + toX) / 2, midY - 8, label || '1 : M')}`;
}

function diagramI() {
  const adminBottom = 28 + 20 + 4 * 14;
  const links = `
    <g id="links">
      ${erTableLink(450, adminBottom, 135, 160, 'assigned_to')}
      ${erTableLink(450, adminBottom, 355, 160, 'assigned_to')}
      ${erTableLink(450, adminBottom, 555, 160, 'author_id')}
      ${erTableLink(450, adminBottom, 735, 160, 'author_id')}
      ${erTableLink(450, adminBottom, 555, 290, 'author_id')}
      ${erTableLink(450, adminBottom, 755, 290, 'author_id')}
    </g>
  `;
  const tables = `
    ${erTable(370, 28, 160, 'admin_users', ['id PK', 'username UK', 'role', 'password_hash'])}
    ${erTable(40, 160, 190, 'contact_requests', ['id PK', 'name, phone, status', 'assigned_to FK', 'consent, created_at'])}
    ${erTable(260, 160, 190, 'booking_requests', ['id PK', 'child_name, direction', 'assigned_to FK', 'specialist_note'])}
    ${erTable(480, 160, 150, 'site_news', ['id PK', 'title, body', 'published, author_id FK'])}
    ${erTable(660, 160, 150, 'site_events', ['id PK', 'event_date', 'author_id FK'])}
    ${erTable(480, 290, 150, 'site_reports', ['id PK', 'title, body', 'author_id FK'])}
    ${erTable(660, 290, 170, 'library_materials', ['id PK', 'link, status', 'author_id FK'])}
    ${legend([{ text: '1 : M (один администратор — много записей)', dash: false }], 400)}
    ${T(450, 430, 'СУБД: SQLite, файл data.sqlite, нормальная форма 3НФ (см. initDb в server.js)', { sz: 10 })}
  `;
  const intro =
    'Логическая ER-модель: сущность admin_users связана с зависимыми таблицами по внешним ключам assigned_to (заявки) и author_id (контент). Обозначение «1 : M» — один ко многим.';
  return appendixHtml('Приложение И — ER-диаграмма', 'И', 'ER-диаграмма', intro, svg(860, 450, links + tables), 'Рисунок И.1 – ER-диаграмма базы данных');
}

function dfdEntity(x, y, w, h, label) {
  return extEntity(x, y, w, h, label);
}

function diagramK() {
  const px = 310;
  const py = 150;
  const pw = 200;
  const ph = 96;
  const pcx = px + pw / 2;
  const pcy = py + ph / 2;
  const links = `
    <g id="links">
      ${P(`M 188 74 L 250 74 L 250 ${pcy} L ${px} ${pcy}`)}${T(218, 66, 'F1: ВХ-01…03', { sz: 9, anchor: 'start' })}
      ${P(`M ${px + pw} ${pcy} L 600 74 L 652 74`)}${T(560, 66, 'F5: API чата', { sz: 9, anchor: 'start' })}
      ${P(`M ${px + pw} ${pcy + 20} L 600 314 L 652 314`)}${T(560, 306, 'F4: SQL', { sz: 9, anchor: 'start' })}
      ${P(`M 188 314 L 250 314 L 250 ${pcy + 20} L ${px} ${pcy + 20}`)}${T(218, 306, 'F3: ВХ-04…07', { sz: 9, anchor: 'start' })}
      ${P(`M ${pcx} ${py} L ${pcx} 120 L 188 120 L 188 100`)}${T(248, 112, 'F2: HTML, ВЫ', { sz: 9, anchor: 'start' })}
      ${P(`M ${pcx} ${py + ph} L ${pcx} 260 L 188 260 L 188 288`)}${T(248, 252, 'ВЫ-01, ВЫ-02', { sz: 9, anchor: 'start' })}
    </g>
  `;
  const inner = `
    ${links}
    ${dfdEntity(48, 48, 140, 52, 'Посетитель / Родитель')}
    ${dfdEntity(48, 288, 140, 52, 'Сотрудник центра')}
    ${dfdEntity(652, 48, 140, 52, 'OpenAI API')}
    ${dfdEntity(652, 288, 140, 52, 'data.sqlite')}
    ${R(px, py, pw, ph, ['0', 'ВИСЗ-АНО-ТО', 'Приём · учёт · публикация'])}
  `;
  const table = `
  <p class="caption-table">Таблица К.1 – Потоки информационной модели</p>
  <table class="data">
    <tr><th>Поток</th><th>Источник</th><th>Приёмник</th><th>Содержание</th></tr>
    <tr><td>F1</td><td>Клиент</td><td>Система</td><td>JSON форм, сообщения чата</td></tr>
    <tr><td>F2</td><td>Система</td><td>Клиент</td><td>HTML-страницы, подтверждения</td></tr>
    <tr><td>F3</td><td>Сотрудник</td><td>Система</td><td>Логин, контент, статусы</td></tr>
    <tr><td>F4</td><td>Система</td><td>data.sqlite</td><td>Записи 7 таблиц</td></tr>
    <tr><td>F5</td><td>Система</td><td>OpenAI</td><td>POST /v1/chat/completions</td></tr>
  </table>`;
  const intro =
    'Контекстная диаграмма потоков данных (DFD, уровень 0): процесс «0» — система; прямоугольники с двойной рамкой — внешние сущности; стрелки — потоки F1…F5 (таблица К.1).';
  const page = appendixHtml('Приложение К — Информационная модель', 'К', 'Информационная модель', intro, svg(840, 380, inner), 'Рисунок К.1 – Информационная модель (контекстная DFD)');
  return page.replace('</body>', table + '\n</body>');
}

function diagramL() {
  const intro =
    'Схема работы системы (вертикальная модель): поток данных от пользователя через публичный интерфейс и сервер Node.js/Express к базе SQLite и административной панели; итог — публикация контента, обработка заявок и отчётность.';
  return appendixHtml(
    'Приложение Л — Схема работы системы',
    'Л',
    'Схема работы системы',
    intro,
    buildSystemFlowSvg(),
    'Рисунок Л.1 – Схема работы системы ВИСЗ-АНО-ТО (вертикальная модель)'
  );
}

/* ——— Блок-схема: вертикальный поток ——— */
function flowVertical(steps, w = 680) {
  const cx = w / 2;
  let y = 28;
  let parts = [E(cx, y + 18, 56, 16, 'Начало')];
  y += 44;
  parts.push(L(cx, y - 10, cx, y));
  y += 4;

  const endY = [];
  for (const step of steps) {
    if (step.type === 'rect') {
      const h = step.h || 44;
      parts.push(R(cx - step.w / 2, y, step.w, h, step.lines));
      const bottom = y + h;
      if (step.next !== false) {
        parts.push(L(cx, bottom, cx, bottom + 24));
        y = bottom + 24;
      } else y = bottom;
    } else if (step.type === 'diamond') {
      parts.push(D(cx, y + 30, step.lines));
      const cy = y + 30;
      const no = step.no;
      if (no) {
        const nx = no.x;
        const ny = no.y;
        parts.push(R(nx, ny, no.w, no.h, no.lines));
        parts.push(T((cx + nx) / 2, cy, 'нет', { sz: 10 }));
        parts.push(P(`M ${cx - 42} ${cy} L ${nx + no.w} ${cy}`));
        if (no.mergeY) parts.push(P(`M ${nx + no.w / 2} ${ny + no.h} L ${nx + no.w / 2} ${no.mergeY} L ${cx} ${no.mergeY} L ${cx} ${y + 84}`, true));
      }
      if (step.yesLabel) parts.push(T(cx + 48, cy + 36, step.yesLabel, { sz: 10, anchor: 'start' }));
      parts.push(L(cx, cy + 30, cx, y + 84));
      y += 84;
    }
  }
  parts.push(E(cx, y + 18, 56, 16, 'Конец'));
  return svg(w, y + 50, parts.join(''));
}

function flowBooking() {
  const w = 720;
  const h = 980;
  const c = 120;
  const s = 360;
  const d = 600;
  const inner = `
    <line class="line" x1="240" y1="52" x2="240" y2="${h - 20}" stroke-dasharray="6 4"/>
    <line class="line" x1="480" y1="52" x2="480" y2="${h - 20}" stroke-dasharray="6 4"/>
    ${E(s, 36, 56, 16, 'Начало')}${L(s, 54, c, 88)}
    ${R(30, 88, 180, 44, ['Открытие zap.html', 'форма #bookingForm'])}
    ${L(c, 132, c, 156)}${R(20, 156, 200, 68, ['Ввод данных', 'name, phone *', 'child_name, direction', 'consent'])}
    ${L(c, 224, c, 248)}${R(25, 248, 190, 48, ['submit → POST JSON', 'кнопка disabled'])}
    ${P(`M ${c} 296 L ${s} 332`)}${T(240, 318, 'POST JSON', { sz: 10 })}
    ${R(260, 332, 200, 44, ['POST /api/booking', 'express.json()'])}
    ${L(s, 376, s, 404)}${D(s, 434, ['name и phone', 'заполнены?'])}
    ${P(`M ${s - 42} 434 L ${c} 434`)}${T(196, 426, 'нет', { sz: 10 })}
    ${R(30, 406, 180, 48, ['HTTP 400', 'обязательные поля'])}
    ${P(`M ${c} 454 L ${c} 820 L ${s} 900`, true)}
    ${R(30, 792, 180, 44, ['alert: ошибка', 'кнопка активна'])}
    ${L(s, 464, s, 492)}${T(376, 482, 'да', { sz: 10, anchor: 'start' })}
    ${R(255, 492, 210, 56, ['Формирование record', 'status=new', 'created_at, ip'])}
    ${L(s, 548, s, 576)}${D(s, 606, ['consent = 1?'])}
    ${P(`M ${s - 42} 606 L ${c} 606`)}${T(196, 598, 'нет', { sz: 10 })}
    ${R(30, 578, 180, 48, ['HTTP 400', 'согласие ПДн'])}
    ${P(`M ${c} 626 L ${c} 792`, true)}
    ${L(s, 636, d, 672)}${T(376, 656, 'да', { sz: 10, anchor: 'start' })}
    ${R(500, 672, 200, 48, ['INSERT', 'booking_requests'])}
    ${P(`M ${d} 720 L ${s} 756`)}
    ${R(265, 756, 190, 40, ['200 { ok: true, id }'])}
    ${P(`M ${s} 796 L ${c} 720 L ${c} 756`)}
    ${R(25, 756, 190, 48, ['Успех на клиенте', 'скрыть форму'])}
    ${L(c, 804, c, 860)}${P(`M ${c} 860 L ${s} 900`)}
    ${E(s, 918, 56, 16, 'Конец')}
  `;
  return flowHtml(
    'Рисунок 11 — Запись на приём',
    'Рисунок 11 – Алгоритм работы модуля «Запись на приём»',
    'Алгоритм работы модуля «Запись на приём»',
    'Клиент (zap.html) → Booking Handler (server.js) → booking_requests (SQLite)',
    svg(w, h, inner),
    'Модуль «Запись на приём»: zap.html и POST /api/booking. Обязательны name, phone, consent=1. Заявка обрабатывается в /admin.',
    ['Клиент (браузер)', 'Сервер (Express)', 'База данных']
  );
}

function flowSimple(title, figNum, subtitle, steps, note, mergeErr = 850) {
  const cx = 340;
  let y = 28;
  let g = [E(cx, y + 18, 52, 16, 'Начало')];
  y += 46;
  g.push(L(cx, y - 8, cx, y));
  for (const st of steps) {
    if (st.t === 'r') {
      const h = st.h || 48;
      g.push(R(cx - st.w / 2, y, st.w, h, st.l));
      const b = y + h;
      g.push(L(cx, b, cx, b + 20));
      y = b + 20;
    } else if (st.t === 'd') {
      g.push(D(cx, y + 30, st.l));
      const cy = y + 30;
      if (st.no) {
        g.push(P(`M ${cx - 42} ${cy} L 100 ${cy}`));
        g.push(T(170, cy - 8, 'нет', { sz: 10 }));
        g.push(R(20, cy - 28, 140, 52, st.no));
        g.push(P(`M 90 ${cy + 24} L 90 ${mergeErr} L ${cx - 20} ${mergeErr}`, true));
      }
      g.push(T(cx + 50, cy + 4, 'да', { sz: 10, anchor: 'start' }));
      g.push(L(cx, cy + 30, cx, y + 76));
      y += 76;
    }
  }
  g.push(L(cx, y, cx, y + 16));
  g.push(E(cx, y + 34, 52, 16, 'Конец'));
  return flowHtml(title, `Рисунок ${figNum}`, subtitle, svg(680, y + 60, g.join('')), note);
}

function flowContentAdmin() {
  const cx = 350;
  const inner = `
    ${E(cx, 30, 52, 16, 'Начало')}
    ${L(cx, 48, cx, 68)}${R(200, 68, 300, 48, ['Сотрудник: /admin', 'requireAdmin'])}
    ${L(cx, 116, cx, 148)}${D(cx, 178, ['Роль admin или', 'coordinator?'])}
    ${P(`M ${cx - 42} 178 L 100 178`)}${T(175, 170, 'нет', { sz: 10 })}
    ${R(30, 150, 140, 52, ['HTTP 403', 'нет прав'])}
    ${P(`M 100 202 L 100 830 L 298 830 L 298 854`, true)}
    ${L(cx, 208, cx, 248)}${T(368, 228, 'да', { sz: 10, anchor: 'start' })}
    ${R(160, 248, 380, 52, ['GET /admin/news|events', 'SELECT → admin-*.ejs'])}
    ${L(cx, 300, cx, 340)}${R(180, 340, 340, 48, ['POST: новая запись'])}
    ${L(cx, 388, cx, 428)}${D(cx, 458, ['Поля', 'заполнены?'])}
    ${P(`M ${cx - 42} 458 L 100 458`)}${T(175, 450, 'нет', { sz: 10 })}
    ${R(30, 430, 140, 52, ['HTTP 400'])}
    ${P(`M 100 482 L 100 830`, true)}
    ${L(cx, 488, cx, 528)}${T(368, 508, 'да', { sz: 10, anchor: 'start' })}
    ${R(190, 528, 320, 52, ['INSERT SQLite', 'author_id, published'])}
    ${L(cx, 580, cx, 620)}${R(150, 620, 400, 44, ['redirect; toggle published'])}
    ${L(cx, 664, cx, 704)}${R(130, 704, 440, 52, ['GET /api/content → сайт'])}
    ${L(cx, 756, cx, 792)}${E(cx, 810, 52, 16, 'Конец')}
  `;
  return flowHtml('Рисунок 12', 'Рисунок 12 – Алгоритм работы модуля «Управление контентом»', 'Алгоритм работы модуля «Управление контентом»', 'Кабинет сотрудника → SQLite → API → сайт', svg(700, 840, inner), 'Модуль контента: /admin/news, events, reports, library. Роли admin и coordinator.');
}

function flowUsersAdmin() {
  const cx = 340;
  const inner = `
    ${E(cx, 30, 52, 16, 'Начало')}
    ${L(cx, 48, cx, 68)}${R(190, 68, 300, 48, ['/admin/users', "requireRole('admin')"])}
    ${L(cx, 116, cx, 148)}${D(cx, 178, ['role = admin?'])}
    ${P(`M ${cx - 42} 178 L 90 178`)}${T(165, 170, 'нет', { sz: 10 })}
    ${R(20, 150, 140, 52, ['HTTP 403'])}
    ${P(`M 90 202 L 90 820 L 288 820 L 288 848`, true)}
    ${L(cx, 208, cx, 248)}${T(358, 228, 'да', { sz: 10, anchor: 'start' })}
    ${R(170, 248, 340, 48, ['GET /admin/users', 'SELECT → ejs'])}
    ${L(cx, 296, cx, 336)}${R(160, 336, 360, 52, ['POST форма', 'username, password, role'])}
    ${L(cx, 388, cx, 428)}${D(cx, 458, ['login, password', 'и role OK?'])}
    ${P(`M ${cx - 42} 458 L 90 458`)}${R(20, 430, 140, 52, ['HTTP 400'])}
    ${P(`M 90 482 L 90 820`, true)}
    ${L(cx, 488, cx, 528)}${R(180, 528, 320, 44, ['bcrypt.hashSync(10)'])}
    ${L(cx, 572, cx, 612)}${D(cx, 642, ['username', 'уникален?'])}
    ${P(`M ${cx - 42} 642 L 90 642`)}${R(20, 614, 140, 52, ['HTTP 400', 'логин занят'])}
    ${P(`M 90 666 L 90 820`, true)}
    ${L(cx, 672, cx, 712)}${R(190, 712, 300, 48, ['INSERT admin_users'])}
    ${L(cx, 760, cx, 796)}${E(cx, 814, 52, 16, 'Конец')}
  `;
  return flowHtml('Рисунок 14', 'Рисунок 14 – Алгоритм работы модуля «Управление пользователями»', 'Алгоритм работы модуля «Управление пользователями»', 'Только роль admin → admin_users', svg(680, 860, inner), 'Управление пользователями: bcrypt, роли admin/coordinator/specialist.');
}

function flowRequests() {
  const cx = 320;
  const inner = `
    ${E(cx, 30, 52, 16, 'Начало')}
    ${L(cx, 48, cx, 68)}${R(140, 68, 360, 52, ['Ввод данных', 'contact.html или zap.html', 'согласие ПДн'])}
    ${L(cx, 120, cx, 148)}${R(200, 148, 240, 44, ['POST /api/contact или /api/booking'])}
    ${L(cx, 192, cx, 220)}${D(cx, 250, ['Валидация', 'полей и consent?'])}
    ${P(`M ${cx - 42} 250 L 90 250`)}${R(20, 222, 140, 48, ['HTTP 400'])}
    ${P(`M 90 270 L 90 720 L 298 720`, true)}
    ${L(cx, 280, cx, 308)}${T(338, 268, 'да', { sz: 10, anchor: 'start' })}
    ${R(180, 308, 280, 48, ['INSERT SQLite', 'contact или booking'])}
    ${L(cx, 356, cx, 384)}${R(200, 384, 240, 44, ['200 OK, { ok: true }'])}
    ${L(cx, 428, cx, 456)}${R(160, 456, 320, 44, ['Подтверждение на клиенте'])}
    ${L(cx, 500, cx, 528)}${R(180, 528, 280, 40, ['Заявка в /admin'])}
    ${L(cx, 568, cx, 604)}${E(cx, 622, 52, 16, 'Конец')}
  `;
  return flowHtml('Обработка заявок', 'Рисунок – Алгоритм обработки заявок', 'Алгоритм обработки заявок', 'contact.html и zap.html → API → SQLite', svg(640, 660, inner), 'Обработка заявок: валидация, consent, INSERT, учёт в админ-панели.');
}

function flowAdminAuth() {
  const cx = 320;
  const inner = `
    ${E(cx, 30, 52, 16, 'Начало')}
    ${L(cx, 48, cx, 68)}${R(130, 68, 380, 52, ['Ввод логина и пароля', 'POST /admin/login'])}
    ${L(cx, 120, cx, 148)}${R(150, 148, 340, 48, ['SELECT admin_users', 'WHERE username = ?'])}
    ${L(cx, 196, cx, 224)}${D(cx, 254, ['Пользователь', 'найден?'])}
    ${P(`M ${cx - 42} 254 L 90 254`)}${R(10, 226, 160, 48, ['Ошибка 401'])}
    ${P(`M 90 274 L 90 780 L 298 780`, true)}
    ${L(cx, 284, cx, 312)}${T(338, 272, 'да', { sz: 10, anchor: 'start' })}
    ${R(140, 312, 360, 48, ['bcrypt.compareSync', 'пароль и hash'])}
    ${L(cx, 360, cx, 388)}${D(cx, 418, ['Хеши', 'совпадают?'])}
    ${P(`M ${cx + 42} 418 L 530 418`)}${R(530, 390, 100, 48, ['401'])}
    ${P(`M 580 438 L 580 780 L 380 780`, true)}
    ${L(cx, 448, cx, 476)}${T(338, 436, 'да', { sz: 10, anchor: 'start' })}
    ${R(130, 476, 380, 48, ['req.session.adminUser', 'создание сессии'])}
    ${L(cx, 524, cx, 552)}${R(160, 552, 320, 44, ['redirect /admin'])}
    ${L(cx, 596, cx, 632)}${E(cx, 650, 52, 16, 'Конец')}
  `;
  return flowHtml('Админ-аутентификация', 'Рисунок – Алгоритм административной аутентификации', 'Алгоритм административной аутентификации', 'POST /admin/login · bcrypt · session', svg(640, 700, inner), 'Аутентификация: поиск пользователя, сравнение хеша, сессия, редирект в /admin.');
}

function flowAiChat() {
  const cx = 340;
  const inner = `
    ${E(cx, 30, 52, 16, 'Начало')}
    ${L(cx, 48, cx, 68)}${R(150, 68, 380, 48, ['Ввод сообщения', 'POST /api/chat'])}
    ${L(cx, 116, cx, 144)}${R(190, 144, 300, 40, ['Проверка: не пустое'])}
    ${L(cx, 184, cx, 212)}${R(160, 212, 360, 48, ['Анализ текста', 'trim, regex ключевых слов'])}
    <rect class="shape" x="480" y="212" width="180" height="64" fill="#ffffff" stroke="#000000" stroke-dasharray="6 4"/>
    ${T(570, 238, 'Опционально OpenAI', { sz: 10 })}${T(570, 254, 'если OPENAI_API_KEY', { sz: 9 })}
    <line class="line" x1="520" y1="244" x2="480" y2="244" stroke-dasharray="6 4" marker-end="url(#arr)"/>
    ${L(cx, 260, cx, 288)}${R(170, 288, 340, 48, ['Поиск шаблона ответа'])}
    ${L(cx, 336, cx, 364)}${D(cx, 394, ['Шаблон', 'найден?'])}
    ${P(`M ${cx - 42} 394 L 100 394`)}${R(20, 366, 160, 48, ['Ответ по умолчанию'])}
    ${P(`M 100 414 L 100 520 L ${cx} 520 L ${cx} 548`)}
    ${L(cx, 424, cx, 452)}${T(358, 412, 'да', { sz: 10, anchor: 'start' })}
    ${R(200, 452, 280, 44, ['Ответ по шаблону + ссылки'])}
    ${L(cx, 496, cx, 524)}${R(200, 524, 280, 40, ['JSON { reply } клиенту'])}
    ${L(cx, 564, cx, 600)}${E(cx, 618, 52, 16, 'Конец')}
  `;
  return flowHtml('ИИ-помощник', 'Рисунок – Алгоритм работы ИИ-помощника', 'Алгоритм работы ИИ-помощника', 'ai-chat.js · шаблоны + OpenAI', svg(680, 660, inner), 'Чат: локальные шаблоны; при наличии ключа — запрос к OpenAI API.');
}

function flowEjs() {
  const inner = `
    ${E(310, 30, 52, 16, 'Начало')}
    ${L(310, 48, 310, 68)}${R(120, 68, 380, 48, ['1. HTTP GET /admin', 'браузер → Express'])}
    ${L(310, 116, 310, 136)}${R(150, 136, 320, 36, ['requireAdmin (иначе login)'])}
    ${L(310, 172, 310, 192)}${R(110, 192, 400, 56, ['2. SELECT SQLite', 'contact + booking → requests'])}
    ${L(310, 248, 310, 268)}${R(120, 268, 380, 56, ['3. res.render admin.ejs', 'подстановка <%= %>'])}
    ${L(310, 324, 310, 344)}${R(130, 344, 360, 44, ['4. HTTP 200 text/html'])}
    ${L(310, 388, 310, 408)}${R(120, 408, 380, 56, ['5. Браузер: CSS, таблица'])}
    ${L(310, 464, 310, 484)}${R(120, 484, 380, 48, ['6. JS: обработчики форм'])}
    ${L(310, 532, 310, 568)}${E(310, 586, 52, 16, 'Конец')}
    <rect class="shape" x="430" y="408" width="175" height="72" fill="#ffffff" stroke="#000000" stroke-dasharray="6 4"/>
    ${T(517, 432, 'Статические *.html', { sz: 10 })}
    ${T(517, 448, 'без EJS', { sz: 9 })}
    <line class="line" x1="430" y1="444" x2="380" y2="464" stroke-dasharray="6 4" marker-end="url(#arr)"/>
  `;
  return flowHtml('EJS рендеринг', 'Рисунок – Алгоритм динамического рендеринга страниц', 'Алгоритм динамического рендеринга страниц', 'GET /admin · EJS + SQLite', svg(620, 620, inner), 'Серверная генерация HTML: загрузка данных, EJS, отдача в браузер.');
}

/* ——— Запись файлов ——— */
const writes = [
  [path.join(APP, 'appendix-g-use-case.html'), diagramG()],
  [path.join(APP, 'appendix-d-activity.html'), diagramD()],
  [path.join(APP, 'appendix-e-class.html'), diagramE()],
  [path.join(APP, 'appendix-zh-functional.html'), diagramZh()],
  [path.join(APP, 'appendix-i-er.html'), diagramI()],
  [path.join(APP, 'appendix-k-info-model.html'), diagramK()],
  [path.join(APP, 'appendix-l-system.html'), diagramL()],
  [path.join(ROOT, 'flowchart-booking.html'), flowBooking()],
  [path.join(ROOT, 'flowchart-content-admin.html'), flowContentAdmin()],
  [path.join(ROOT, 'flowchart-users-admin.html'), flowUsersAdmin()],
  [path.join(ROOT, 'flowchart-requests.html'), flowRequests()],
  [path.join(ROOT, 'flowchart-admin-auth.html'), flowAdminAuth()],
  [path.join(ROOT, 'flowchart-ai-chat.html'), flowAiChat()],
  [path.join(ROOT, 'flowchart-ejs-render.html'), flowEjs()],
];

for (const [file, html] of writes) {
  fs.writeFileSync(file, html, 'utf8');
  console.log('OK', path.relative(ROOT, file));
}

console.log(`\nСгенерировано ${writes.length} диаграмм.`);
