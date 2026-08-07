/**
 * ER diagram (English) — logical model, clean layout
 * Run: node scripts/generate-er-english.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs', 'vkr', 'er-diagram-english.html');
const OUT_APPENDIX = path.join(__dirname, '..', 'docs', 'vkr', 'appendices', 'er-diagram-english.html');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function erEntity(x, y, w, title, fields) {
  const headerH = 24;
  const rowH = 15;
  const bodyH = fields.length * rowH + 10;
  const rows = fields
    .map(
      (f, i) =>
        `<text x="${x + 8}" y="${y + headerH + 14 + i * rowH}" font-family="Times New Roman, serif" font-size="11">${esc(f)}</text>`
    )
    .join('');
  const bottom = y + headerH + bodyH;
  return {
    svg: `
    <g id="${title.replace(/\W/g, '_')}">
      <rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="#5B9BD5" stroke="#000" stroke-width="1"/>
      <text x="${x + w / 2}" y="${y + 16}" text-anchor="middle" font-family="Times New Roman, serif" font-size="12" font-weight="bold" fill="#fff">${esc(title)}</text>
      <rect x="${x}" y="${y + headerH}" width="${w}" height="${bodyH}" fill="#fff" stroke="#000" stroke-width="1"/>
      ${rows}
    </g>`,
    x,
    y,
    w,
    h: headerH + bodyH,
    cx: x + w / 2,
    top: y,
    bottom,
    left: x,
    right: x + w,
  };
}

/** Orthogonal connector with crow's foot at end (many side) */
function linkMany(points, label, lx, ly) {
  const d = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const horizEnd = Math.abs(last[0] - prev[0]) >= Math.abs(last[1] - prev[1]);
  let crow;
  if (horizEnd) {
    crow = `<line x1="${last[0] - 8}" y1="${last[1] - 7}" x2="${last[0] - 8}" y2="${last[1] + 7}" stroke="#000" stroke-width="1"/>
            <line x1="${last[0]}" y1="${last[1] - 7}" x2="${last[0]}" y2="${last[1] + 7}" stroke="#000" stroke-width="1"/>`;
  } else {
    crow = `<line x1="${last[0] - 7}" y1="${last[1] - 8}" x2="${last[0] + 7}" y2="${last[1] - 8}" stroke="#000" stroke-width="1"/>
            <line x1="${last[0] - 7}" y1="${last[1]}" x2="${last[0] + 7}" y2="${last[1]}" stroke="#000" stroke-width="1"/>`;
  }
  const lbl =
    label != null
      ? `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="Times New Roman, serif" font-size="10" fill="#222">${esc(label)}</text>`
      : '';
  return `<path d="${d}" fill="none" stroke="#000" stroke-width="1"/>${crow}${lbl}`;
}

function oneMark(x, y, vertical) {
  if (vertical) {
    return `<line x1="${x - 7}" y1="${y}" x2="${x + 7}" y2="${y}" stroke="#000" stroke-width="1"/>`;
  }
  return `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" stroke="#000" stroke-width="1"/>`;
}

const roles = erEntity(390, 24, 130, 'ROLES', ['id: INT (PK)', 'name: VARCHAR', 'description: TEXT']);
const users = erEntity(355, 118, 200, 'USERS', [
  'id: INT (PK)',
  'full_name: VARCHAR',
  'phone: VARCHAR',
  'email: VARCHAR',
  'status: VARCHAR',
  'created_at: TIMESTAMP',
  'role_id: FK',
]);
const slots = erEntity(32, 24, 210, 'SCHEDULE_SLOTS', [
  'id: INT (PK)',
  'specialist_id: FK',
  'date_time: TIMESTAMP',
  'is_available: BOOLEAN',
  'comment: TEXT',
  'created_at: TIMESTAMP',
]);
const audit = erEntity(620, 24, 170, 'AUDIT_LOG', [
  'id: INT (PK)',
  'user_id: FK',
  'action: VARCHAR',
  'timestamp: TIMESTAMP',
  'ip_address: VARCHAR',
]);
const ai = erEntity(32, 148, 150, 'AI_DIALOGS', [
  'id: INT (PK)',
  'user_id: FK',
  'context: TEXT',
  'created_at: TIMESTAMP',
]);
const appt = erEntity(32, 468, 220, 'APPOINTMENTS', [
  'id: INT (PK)',
  'date_time: TIMESTAMP',
  'status: VARCHAR',
  'client_id: FK → USERS',
  'specialist_id: FK → USERS',
  'service_id: FK',
  'slot_id: FK',
  'created_at: TIMESTAMP',
]);
const services = erEntity(310, 498, 150, 'SERVICES', [
  'id: INT (PK)',
  'name: VARCHAR',
  'description: TEXT',
  'duration: INT',
  'price: DECIMAL',
]);
const reviews = erEntity(720, 498, 170, 'REVIEWS', [
  'id: INT (PK)',
  'appointment_id: FK',
  'client_id: FK → USERS',
  'rating: INT',
  'comment: TEXT',
  'date: TIMESTAMP',
]);

const links = `
  <g id="relationships">
    ${linkMany([[roles.cx, roles.bottom], [roles.cx, users.top - 18], [users.cx, users.top - 18], [users.cx, users.top]], 'has', roles.cx + 50, 78)}
    ${oneMark(users.cx, users.top - 18, false)}

    ${linkMany([[slots.right, slots.top + 40], [300, slots.top + 40], [300, users.top + 20], [users.left, users.top + 20]], null, null, null)}
    ${oneMark(slots.right, slots.top + 40, true)}

    ${linkMany([[audit.left, audit.bottom - 20], [users.right + 40, audit.bottom - 20], [users.right + 40, users.top + 30], [users.right, users.top + 30]], null, null, null)}
    ${oneMark(audit.left, audit.bottom - 20, false)}

    ${linkMany([[ai.right, ai.top + 30], [users.left - 30, ai.top + 30], [users.left - 30, users.top + 50], [users.left, users.top + 50]], null, null, null)}
    ${oneMark(ai.right, ai.top + 30, true)}

    ${linkMany([[users.cx - 40, users.bottom], [users.cx - 40, 420], [142, 420], [142, appt.top]], 'creates', 240, 412)}
    ${oneMark(users.cx - 40, users.bottom, true)}

    ${linkMany([[users.cx + 50, users.bottom], [users.cx + 50, 440], [142, 440], [142, appt.top + 20]], 'assigned', 268, 432)}
    ${oneMark(users.cx + 50, users.bottom, true)}

    ${linkMany([[slots.cx, slots.bottom], [slots.cx, 450], [142, 450], [142, appt.top + 40]], 'slot', 200, 442)}
    ${oneMark(slots.cx, slots.bottom, true)}

    ${linkMany([[services.right, services.top + 30], [appt.right - 10, services.top + 30]], null, null, null)}
    ${oneMark(services.right, services.top + 30, true)}

    ${linkMany([[appt.right, appt.top + 50], [520, appt.top + 50], [520, reviews.top + 20], [reviews.left, reviews.top + 20]], null, null, null)}
    ${oneMark(appt.right, appt.top + 50, true)}

    ${linkMany([[users.right, users.bottom - 10], [860, users.bottom - 10], [860, reviews.top + 40], [reviews.left + 40, reviews.top + 40]], 'client', 780, users.bottom + 8)}
    ${oneMark(users.right, users.bottom - 10, true)}
  </g>`;

const svg = `
<svg viewBox="0 0 980 660" xmlns="http://www.w3.org/2000/svg">
  <rect width="980" height="660" fill="#ffffff"/>
  ${links}
  ${roles.svg}
  ${users.svg}
  ${slots.svg}
  ${audit.svg}
  ${ai.svg}
  ${appt.svg}
  ${services.svg}
  ${reviews.svg}
  <g font-family="Times New Roman, serif" font-size="10" fill="#444">
    <text x="32" y="648">Legend: single line = one; double perpendicular lines = many (crow's foot)</text>
  </g>
</svg>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>ER Diagram — English</title>
  <style>
    body { margin: 24px; font-family: "Times New Roman", serif; background: #f5f5f5; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 8px; }
    .intro { font-size: 12pt; max-width: 920px; margin: 0 auto 16px; text-align: justify; }
    .wrap { max-width: 980px; margin: 0 auto; background: #fff; padding: 20px 16px 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
    svg { width: 100%; height: auto; display: block; }
    .caption { text-align: center; font-size: 12pt; margin: 16px auto 0; max-width: 980px; }
  </style>
</head>
<body>
  <h1>Entity-Relationship Diagram (English)</h1>
  <p class="intro">
    Logical ER model: ROLES, USERS, SCHEDULE_SLOTS, SERVICES, APPOINTMENTS, REVIEWS,
    AI_DIALOGS, AUDIT_LOG. Foreign keys to USERS are shown on APPOINTMENTS and REVIEWS
    (no duplicate USERS box). Crow's foot = one-to-many.
  </p>
  <div class="wrap">${svg}</div>
  <p class="caption">Figure — Entity-Relationship diagram (logical model, English notation)</p>
</body>
</html>`;

fs.mkdirSync(path.dirname(OUT_APPENDIX), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
fs.writeFileSync(OUT_APPENDIX, html, 'utf8');
console.log('Created:', OUT);
console.log('Created:', OUT_APPENDIX);
