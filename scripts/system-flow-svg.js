/**
 * Vertical system workflow SVG — faithful to the original Word diagram.
 * Two parallel arrows server↔DB: «сохранение» (down) and «чтение» (up).
 */
const W = 720;
const H = 700;

const CX = 360;
const DB_X = 360;
const ADM_X = 558;
const CHAT_X = 198;
const FORM_X = 522;

const FLOW_DEFS = `<defs>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
    <path d="M0,0 L10,5 L0,10z" fill="#000000"/>
  </marker>
  <marker id="arr-rev" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
    <path d="M10,0 L0,5 L10,10z" fill="#000000"/>
  </marker>
</defs>`;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function T(x, y, s, o = {}) {
  const { sz = 10, anchor = 'middle', bold = false } = o;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${sz}" font-family="Times New Roman, Times, serif"${bold ? ' font-weight="bold"' : ''} fill="#000">${esc(s)}</text>`;
}

function boxText(x, y, w, h, lines, sz = 10) {
  const lh = Array.isArray(lines) ? lines : [lines];
  const blockH = (lh.length - 1) * 14 + 11;
  const startY = y + (h - blockH) / 2 + 10;
  return lh.map((l, i) => T(x + w / 2, startY + i * 14, l, { sz: l.length > 28 ? 9 : sz })).join('');
}

function Box(x, y, w, h, lines) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-width="1.25"/>${boxText(x, y, w, h, lines)}`;
}

function Rr(x, y, w, h, lines, rx = 10) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="#ffffff" stroke="#000000" stroke-width="1.25"/>${boxText(x, y, w, h, lines)}`;
}

function Cyl(cx, y, w, h, lines) {
  const hw = w / 2;
  const cap = 10;
  const bodyBottom = y + h - cap;
  return `<ellipse cx="${cx}" cy="${y + cap}" rx="${hw}" ry="${cap}" fill="#ffffff" stroke="#000000" stroke-width="1.25"/>
    <rect x="${cx - hw}" y="${y + cap}" width="${w}" height="${bodyBottom - (y + cap)}" fill="#ffffff" stroke="none"/>
    <line x1="${cx - hw}" y1="${y + cap}" x2="${cx - hw}" y2="${bodyBottom}" stroke="#000000" stroke-width="1.25"/>
    <line x1="${cx + hw}" y1="${y + cap}" x2="${cx + hw}" y2="${bodyBottom}" stroke="#000000" stroke-width="1.25"/>
    <ellipse cx="${cx}" cy="${bodyBottom}" rx="${hw}" ry="${cap}" fill="#ffffff" stroke="#000000" stroke-width="1.25"/>
    <ellipse cx="${cx}" cy="${y + cap}" rx="${hw}" ry="${cap}" fill="none" stroke="#000000" stroke-width="1.25"/>
    ${boxText(cx - hw, y, w, h, lines)}`;
}

function L(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="1.25" marker-end="url(#arr)"/>`;
}

function L2(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="1.25" marker-start="url(#arr-rev)" marker-end="url(#arr)"/>`;
}

function Lgap(x, y1, y2, label) {
  return `${L(x, y1, x, y2)}${T(x, (y1 + y2) / 2 + 4, label, { sz: 9 })}`;
}

function Ld(x, y1, y2, label) {
  const mid = (y1 + y2) / 2;
  return `${L(x, y1, x, y2)}${T(x + 8, mid + 3, label, { sz: 9, anchor: 'start' })}`;
}

function ResBox(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-width="1.25"/>
    ${T(x + w / 2, y + 22, 'Результат работы системы', { sz: 10, bold: true })}
    ${T(x + 24, y + 40, '• публикация информации', { anchor: 'start', sz: 10 })}
    ${T(x + 24, y + 54, '• обработка заявок', { anchor: 'start', sz: 10 })}
    ${T(x + 24, y + 68, '• обратная связь', { anchor: 'start', sz: 10 })}
    ${T(x + 24, y + 82, '• отчётность', { anchor: 'start', sz: 10 })}`;
}

function buildSystemFlowInner() {
  const user = { x: CX - 88, y: 10, w: 176, h: 32 };
  const pub = { x: CX - 170, y: 58, w: 340, h: 34 };
  const chat = { x: CHAT_X - 78, y: 116, w: 156, h: 40 };
  const form = { x: FORM_X - 78, y: 116, w: 156, h: 44 };
  const srv = { x: CX - 170, y: 188, w: 340, h: 46 };
  const db = { y: 286, w: 132, h: 64 };
  const adm = { x: ADM_X - 92, y: 290, w: 184, h: 40 };
  const staff = { x: ADM_X - 92, y: 360, w: 184, h: 58 };
  const catY = 442;
  const cats = [
    { x: 52, w: 128, h: 54, lines: ['Новости,', 'события,', 'материалы'] },
    { x: 192, w: 128, h: 54, lines: ['Обращения', 'и заявки'] },
    { x: 332, w: 128, h: 44, lines: 'Отчёты' },
  ];
  const res = { x: CX - 196, y: 568, w: 392, h: 88 };

  const userBot = user.y + user.h;
  const pubBot = pub.y + pub.h;
  const chatBot = chat.y + chat.h;
  const formBot = form.y + form.h;
  const srvBot = srv.y + srv.h;
  const dbTop = db.y + 10;
  const dbBot = db.y + db.h - 10;
  const admBot = adm.y + adm.h;
  const catCx = cats.map((c) => c.x + c.w / 2);

  const saveX = 342;
  const readX = 378;
  const laneMid = (srvBot + dbTop) / 2;

  const shapes = `
    ${Box(user.x, user.y, user.w, user.h, 'Пользователь')}
    ${Rr(pub.x, pub.y, pub.w, pub.h, 'Публичный веб-интерфейс')}
    ${Rr(chat.x, chat.y, chat.w, chat.h, 'Чат-помощник')}
    ${Rr(form.x, form.y, form.w, form.h, ['Формы обращения', 'и записи'])}
    ${Rr(srv.x, srv.y, srv.w, srv.h, ['Серверное приложение', 'Node.js / Express'])}
    ${Cyl(DB_X, db.y, db.w, db.h, ['База данных', 'SQLite'])}
    ${Rr(adm.x, adm.y, adm.w, adm.h, ['Административная', 'панель'])}
    ${Box(staff.x, staff.y, staff.w, staff.h, ['Администратор', 'Координатор', 'Специалист'])}
    ${Rr(cats[0].x, catY, cats[0].w, cats[0].h, cats[0].lines)}
    ${Rr(cats[1].x, catY, cats[1].w, cats[1].h, cats[1].lines)}
    ${Rr(cats[2].x, catY, cats[2].w, cats[2].h, cats[2].lines)}
    ${ResBox(res.x, res.y, res.w, res.h)}
  `;

  const links = `
    ${Lgap(CX, userBot + 2, pub.y - 2, 'открывает сайт')}
    ${L(CX, pubBot + 2, CX, pubBot + 10)}
    ${L(CX, pubBot + 10, CHAT_X, chat.y - 2)}
    ${L(CX, pubBot + 10, FORM_X, chat.y - 2)}
    ${Ld(CHAT_X, chatBot + 2, srv.y - 2, 'запрос')}
    ${Ld(FORM_X, formBot + 2, srv.y - 2, 'данные формы')}
    ${L(saveX, srvBot + 2, saveX, dbTop)}${T(saveX + 10, laneMid - 2, 'сохранение', { sz: 9, anchor: 'start' })}
    ${L(readX, dbTop, readX, srvBot + 2)}${T(readX + 10, laneMid + 10, 'чтение', { sz: 9, anchor: 'start' })}
    ${L(430, srvBot + 2, 430, adm.y - 2)}${L(430, adm.y - 2, ADM_X, adm.y - 2)}${L(ADM_X, adm.y - 2, ADM_X, adm.y)}${T(494, adm.y - 12, 'данные', { sz: 9 })}
    ${L2(ADM_X, admBot + 2, ADM_X, staff.y - 2)}${T(ADM_X + 10, (admBot + staff.y) / 2 + 2, 'обработка', { sz: 9, anchor: 'start' })}
    ${L(DB_X, dbBot + 2, DB_X, catY - 12)}
    ${L(DB_X, catY - 12, catCx[0], catY - 2)}
    ${L(DB_X, catY - 12, catCx[1], catY - 2)}
    ${L(DB_X, catY - 12, catCx[2], catY - 2)}
    ${L(catCx[0], catY + cats[0].h + 2, CX, res.y - 2)}
    ${L(catCx[1], catY + cats[1].h + 2, CX, res.y - 2)}
    ${L(catCx[2], catY + cats[2].h + 2, CX, res.y - 2)}
  `;

  return shapes + links;
}

function buildSystemFlowSvg() {
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${FLOW_DEFS}<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>${buildSystemFlowInner()}</svg>`;
}

module.exports = { W, H, buildSystemFlowInner, buildSystemFlowSvg };
