const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const { createPlatform } = require('./lib/platform');
require('dotenv').config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

// When running behind a reverse proxy (Render/Railway/Nginx/Cloudflare),
// trust X-Forwarded-* so secure cookies can work correctly.
app.set('trust proxy', 1);

const db = new Database(DB_PATH);

function getTableColumns(table) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return new Set(cols.map((c) => c.name));
}

function addColumnIfMissing(table, columnName, columnSql) {
  const cols = getTableColumns(table);
  if (cols.has(columnName)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnSql};`);
}

function initDb() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      topic TEXT,
      message TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      ip TEXT,
      user_agent TEXT,
      assigned_to INTEGER,
      admin_note TEXT
    );

    CREATE TABLE IF NOT EXISTS booking_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      child_name TEXT,
      direction TEXT,
      desired_date TEXT,
      comment TEXT,
      consent INTEGER NOT NULL DEFAULT 0,
      ip TEXT,
      user_agent TEXT,
      assigned_to INTEGER,
      specialist_note TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      full_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      author_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS site_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      event_date TEXT,
      event_time TEXT,
      place TEXT,
      tag TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      author_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS site_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      author_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS library_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      link TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      author_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS therapy_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      session_date TEXT NOT NULL,
      session_time TEXT,
      duration_min INTEGER NOT NULL DEFAULT 45,
      direction TEXT,
      place TEXT DEFAULT 'Кабинет «Точка Открытий»',
      specialist_id INTEGER,
      max_slots INTEGER NOT NULL DEFAULT 1,
      tips_for_parents TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      author_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      age_min INTEGER,
      age_max INTEGER,
      tags TEXT,
      icon TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS parent_quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      parent_name TEXT,
      child_age TEXT,
      answers_json TEXT,
      recommended_course_id INTEGER,
      recommended_title TEXT,
      score_json TEXT,
      ip TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      message TEXT NOT NULL,
      reply TEXT,
      source TEXT,
      ip TEXT
    );
  `);

  // Migrations for existing DBs (SQLite has limited ALTER TABLE support).
  addColumnIfMissing('contact_requests', 'status', "status TEXT NOT NULL DEFAULT 'new'");
  addColumnIfMissing('contact_requests', 'assigned_to', 'assigned_to INTEGER');
  addColumnIfMissing('contact_requests', 'admin_note', 'admin_note TEXT');

  addColumnIfMissing('booking_requests', 'status', "status TEXT NOT NULL DEFAULT 'new'");
  addColumnIfMissing('booking_requests', 'assigned_to', 'assigned_to INTEGER');
  addColumnIfMissing('booking_requests', 'specialist_note', 'specialist_note TEXT');

  addColumnIfMissing('admin_users', 'role', "role TEXT NOT NULL DEFAULT 'admin'");
  addColumnIfMissing('admin_users', 'full_name', 'full_name TEXT');
}

function ensureAdminUser() {
  const desiredUsername = process.env.ADMIN_USERNAME || 'admin';
  const providedPassword = process.env.ADMIN_PASSWORD;

  // If user wants to change username, migrate default "admin" -> desiredUsername
  // (only when there isn't already a user with desiredUsername).
  if (desiredUsername !== 'admin') {
    const desired = db
      .prepare('SELECT id FROM admin_users WHERE username = ?')
      .get(desiredUsername);
    if (!desired) {
      const legacy = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
      if (legacy) {
        db.prepare('UPDATE admin_users SET username = ? WHERE id = ?').run(desiredUsername, legacy.id);
      }
    }
  }

  const existing = db
    .prepare('SELECT id FROM admin_users WHERE username = ?')
    .get(desiredUsername);

  // If admin exists and ADMIN_PASSWORD is provided, rotate password.
  if (existing) {
    if (providedPassword) {
      const password_hash = bcrypt.hashSync(String(providedPassword), 10);
      db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(password_hash, existing.id);
    }
    // Ensure the main account stays admin.
    db.prepare("UPDATE admin_users SET role = 'admin' WHERE id = ?").run(existing.id);
    return;
  }

  // Otherwise, create admin user.
  let password = providedPassword;
  if (!password) {
    password = crypto.randomBytes(12).toString('hex');
    console.log(`[ADMIN] ADMIN_PASSWORD auto-generated: ${password}`);
  }

  const password_hash = bcrypt.hashSync(String(password), 10);
  db.prepare('INSERT INTO admin_users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)').run(
    desiredUsername,
    password_hash,
    'admin',
    new Date().toISOString()
  );
}

initDb();
ensureAdminUser();

const platform = createPlatform(db, bcrypt);
platform.seedCourses();
platform.ensureDemoUsers();
platform.seedSampleSessions();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Allow static site (Reg.ru) to call API endpoints from another domain.
// Configure via env: CORS_ORIGINS="https://pointdiscovery.online,https://www.pointdiscovery.online"
const corsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests without Origin (curl/health checks)
      if (!origin) return cb(null, true);
      if (corsOrigins.length === 0) return cb(null, true);
      return cb(null, corsOrigins.includes(origin));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(16).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // На localhost cookies с secure=true не сохраняются (http).
      secure: isProduction && process.env.COOKIE_SECURE !== 'false',
    },
  })
);

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUser) return next();
  return res.redirect('/admin/login');
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.session || !req.session.adminUser) return res.redirect('/admin/login');
    if (allowed.includes(req.session.adminUser.role)) return next();
    return res.status(403).send('Недостаточно прав');
  };
}

function roleLabel(role) {
  if (role === 'admin') return 'Администратор';
  if (role === 'coordinator') return 'Координатор';
  if (role === 'specialist') return 'Специалист';
  return role;
}

function canManageContent(role) {
  return role === 'admin' || role === 'coordinator';
}

function adminRedirectAfterLogin(role) {
  return '/admin/home';
}

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/contact', (req, res) => {
  const { name, phone, email, topic, message, consent } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Поля name и phone обязательны' });
  }

  const record = {
    created_at: new Date().toISOString(),
    processed: 0,
    status: 'new',
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : null,
    topic: topic ? String(topic).trim() : null,
    message: message ? String(message).trim() : null,
    consent: consent ? 1 : 0,
    ip: req.ip || null,
    user_agent: req.get('user-agent') || null,
  };

  if (record.consent !== 1) {
    return res.status(400).json({ error: 'Нужно подтвердить согласие на обработку данных' });
  }

  const info = db
    .prepare(
      `INSERT INTO contact_requests
        (created_at, processed, status, name, phone, email, topic, message, consent, ip, user_agent)
      VALUES
        (@created_at, @processed, @status, @name, @phone, @email, @topic, @message, @consent, @ip, @user_agent)`
    )
    .run(record);

  res.json({ ok: true, id: info.lastInsertRowid });
});

const CHAT_SYSTEM = `Ты — дружелюбный помощник сайта АНО «Точка Открытий» (центр социальной поддержки, Оренбург).
Помогаешь с записью на диагностику, услугами, контактами, расписанием сеансов и подбором направления.
Отвечай кратко по-русски. Можешь предложить:
— страницу seansy.html (как проходят сеансы и расписание);
— podbor.html (мини-тест для подбора курса ребёнку);
— zap.html (запись на приём).
Телефон: 8 (987) 796-92-72. Email: ano.tochka56@mail.ru. Режим: Пн–Пт 9:00–20:00.
Не выдумывай цены — предложи оставить заявку или позвонить.`;

function chatLocalReply(text) {
  const t = String(text || '').toLowerCase();
  if (/запис|при[eё]м|диагност/.test(t)) {
    return 'Записаться можно на странице zap.html или пройти тест podbor.html для подбора направления. Телефон 8 (987) 796-92-72.';
  }
  if (/сеанс|занят|расписан|как проход/.test(t)) {
    return 'Расписание и памятка для родителей — на странице seansy.html.';
  }
  if (/тест|подбор|курс|направлен/.test(t)) {
    return 'Пройдите мини-тест на podbor.html — он подберёт подходящее направление для вашего ребёнка.';
  }
  if (/услуг|направлен|логопед|коррекц/.test(t)) {
    return 'У нас диагностика, коррекционные занятия, поддержка родителей. Подробнее на info.html.';
  }
  if (/контакт|телефон|адрес/.test(t)) {
    return 'Телефон 8 (987) 796-92-72, email ano.tochka56@mail.ru. Страница contact.html.';
  }
  return 'Спасибо за вопрос! Позвоните 8 (987) 796-92-72 или оставьте заявку на zap.html.';
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  const userText = String(message || '').trim();
  if (!userText) {
    return res.status(400).json({ error: 'Пустое сообщение' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  let reply;
  let source = 'local';

  if (!apiKey) {
    reply = chatLocalReply(userText);
  } else {
    try {
      const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
      const messages = [
        { role: 'system', content: CHAT_SYSTEM },
        ...history.map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: String(h.content || ''),
        })),
        { role: 'user', content: userText },
      ];

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          max_tokens: 400,
          temperature: 0.6,
        }),
      });

      if (!resp.ok) {
        reply = chatLocalReply(userText);
      } else {
        const data = await resp.json();
        reply = data?.choices?.[0]?.message?.content?.trim() || chatLocalReply(userText);
        source = 'openai';
      }
    } catch {
      reply = chatLocalReply(userText);
    }
  }

  try {
    db.prepare(
      'INSERT INTO chat_logs (created_at, message, reply, source, ip) VALUES (?, ?, ?, ?, ?)'
    ).run(new Date().toISOString(), userText, reply, source, req.ip || null);
  } catch {
    /* ignore log errors */
  }

  return res.json({ reply, source });
});

app.post('/api/booking', (req, res) => {
  const { name, phone, child_name, direction, desired_date, comment, consent } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Поля name и phone обязательны' });
  }

  const record = {
    created_at: new Date().toISOString(),
    processed: 0,
    status: 'new',
    name: String(name).trim(),
    phone: String(phone).trim(),
    child_name: child_name ? String(child_name).trim() : null,
    direction: direction ? String(direction).trim() : null,
    desired_date: desired_date ? String(desired_date).trim() : null,
    comment: comment ? String(comment).trim() : null,
    consent: consent ? 1 : 0,
    ip: req.ip || null,
    user_agent: req.get('user-agent') || null,
  };

  if (record.consent !== 1) {
    return res.status(400).json({ error: 'Нужно подтвердить согласие на обработку данных' });
  }

  const info = db
    .prepare(
      `INSERT INTO booking_requests
        (created_at, processed, status, name, phone, child_name, direction, desired_date, comment, consent, ip, user_agent)
      VALUES
        (@created_at, @processed, @status, @name, @phone, @child_name, @direction, @desired_date, @comment, @consent, @ip, @user_agent)`
    )
    .run(record);

  res.json({ ok: true, id: info.lastInsertRowid });
});

app.get('/admin/login', (req, res) => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  res.render('admin-login', { error: null, username });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const login = String(username || '');
  const row = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(login);

  if (!row) {
    return res.status(401).render('admin-login', {
      error: 'Неверные данные входа',
      username: login,
    });
  }

  const ok = bcrypt.compareSync(String(password || ''), row.password_hash);
  if (!ok) {
    return res.status(401).render('admin-login', {
      error: 'Неверные данные входа',
      username: login,
    });
  }

  req.session.adminUser = { id: row.id, username: row.username, role: row.role || 'admin', full_name: row.full_name || null };
  platform.auditLog(req.session.adminUser, 'login', 'session', row.id, row.role);
  return res.redirect(adminRedirectAfterLogin(row.role));
});

app.get('/api/content/news', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, body, category, created_at
       FROM site_news WHERE published = 1 ORDER BY created_at DESC LIMIT 20`
    )
    .all();
  res.json({ items: rows });
});

app.get('/api/content/events', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, body, event_date, event_time, place, tag, featured, created_at
       FROM site_events WHERE published = 1 ORDER BY event_date DESC, created_at DESC LIMIT 20`
    )
    .all();
  res.json({ items: rows });
});

app.get('/api/content/sessions', (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.id, s.title, s.description, s.session_date, s.session_time, s.duration_min,
              s.direction, s.place, s.max_slots, s.tips_for_parents,
              COALESCE(u.full_name, u.username) AS specialist_name
       FROM therapy_sessions s
       LEFT JOIN admin_users u ON u.id = s.specialist_id
       WHERE s.published = 1 AND s.status = 'scheduled' AND s.session_date >= date('now')
       ORDER BY s.session_date ASC, s.session_time ASC
       LIMIT 30`
    )
    .all();
  res.json({ items: rows });
});

app.get('/api/content/courses', (req, res) => {
  const rows = db
    .prepare('SELECT id, title, slug, description, age_min, age_max, tags, icon FROM courses WHERE published = 1 ORDER BY sort_order')
    .all();
  res.json({ items: rows });
});

app.get('/api/quiz/questions', (req, res) => {
  const { QUIZ_QUESTIONS } = require('./lib/platform');
  res.json({ questions: QUIZ_QUESTIONS });
});

app.post('/api/quiz/submit', (req, res) => {
  const { parent_name, child_age, answers, consent } = req.body || {};
  if (consent !== true && consent !== 1 && consent !== '1') {
    return res.status(400).json({ error: 'Нужно согласие на обработку данных' });
  }
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Ответьте на вопросы теста' });
  }

  const { course, scores, ranking } = platform.recommendCourse(answers);
  if (!course) {
    return res.status(500).json({ error: 'Не удалось подобрать направление' });
  }

  const info = db
    .prepare(
      `INSERT INTO parent_quiz_results
        (created_at, parent_name, child_age, answers_json, recommended_course_id, recommended_title, score_json, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      new Date().toISOString(),
      parent_name ? String(parent_name).trim() : null,
      child_age ? String(child_age).trim() : null,
      JSON.stringify(answers),
      course.id,
      course.title,
      JSON.stringify({ scores, ranking }),
      req.ip || null
    );

  res.json({
    ok: true,
    id: info.lastInsertRowid,
    recommendation: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      icon: course.icon,
    },
    scores,
  });
});

app.get('/admin/home', requireAdmin, (req, res) => {
  const me = req.session.adminUser;
  const stats = platform.getDashboardStats(me);
  const recentAudit = me.role === 'admin'
    ? db.prepare('SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 8').all()
    : [];
  const upcomingSessions =
    me.role === 'specialist'
      ? db
          .prepare(
            `SELECT id, title, session_date, session_time, direction FROM therapy_sessions
             WHERE specialist_id = ? AND status = 'scheduled' AND session_date >= date('now')
             ORDER BY session_date ASC LIMIT 5`
          )
          .all(me.id)
      : db
          .prepare(
            `SELECT id, title, session_date, session_time, direction FROM therapy_sessions
             WHERE status = 'scheduled' AND session_date >= date('now')
             ORDER BY session_date ASC LIMIT 5`
          )
          .all();
  res.render('admin-home', { admin: me, stats, roleLabel, recentAudit, upcomingSessions });
});

app.get('/admin/news', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const items = db
    .prepare(
      `SELECT n.*, u.username AS author_name
       FROM site_news n LEFT JOIN admin_users u ON u.id = n.author_id
       ORDER BY n.created_at DESC`
    )
    .all();
  res.render('admin-news', { admin: req.session.adminUser, items, error: null, roleLabel });
});

app.post('/admin/news', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const category = String(req.body.category || 'Новости').trim();
  const published = req.body.published ? 1 : 0;
  if (!title || !body) {
    const items = db.prepare('SELECT * FROM site_news ORDER BY created_at DESC').all();
    return res.status(400).render('admin-news', {
      admin: req.session.adminUser,
      items,
      error: 'Заполните заголовок и текст',
      roleLabel,
    });
  }
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO site_news (title, body, category, published, created_at, updated_at, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(title, body, category, published, now, now, req.session.adminUser.id);
  res.redirect('/admin/news');
});

app.post('/admin/news/:id/toggle', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT published FROM site_news WHERE id = ?').get(id);
  if (row) db.prepare('UPDATE site_news SET published = ?, updated_at = ? WHERE id = ?').run(row.published ? 0 : 1, new Date().toISOString(), id);
  res.redirect('/admin/news');
});

app.get('/admin/events', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const items = db
    .prepare(
      `SELECT e.*, u.username AS author_name
       FROM site_events e LEFT JOIN admin_users u ON u.id = e.author_id
       ORDER BY e.event_date DESC, e.created_at DESC`
    )
    .all();
  res.render('admin-events', { admin: req.session.adminUser, items, error: null, roleLabel });
});

app.post('/admin/events', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const event_date = String(req.body.event_date || '').trim();
  const event_time = String(req.body.event_time || '').trim();
  const place = String(req.body.place || '').trim();
  const tag = String(req.body.tag || 'Мероприятие').trim();
  const published = req.body.published ? 1 : 0;
  const featured = req.body.featured ? 1 : 0;
  if (!title) {
    const items = db.prepare('SELECT * FROM site_events ORDER BY created_at DESC').all();
    return res.status(400).render('admin-events', {
      admin: req.session.adminUser,
      items,
      error: 'Укажите название мероприятия',
      roleLabel,
    });
  }
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO site_events (title, body, event_date, event_time, place, tag, published, featured, created_at, updated_at, author_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, body, event_date, event_time, place, tag, published, featured, now, now, req.session.adminUser.id);
  res.redirect('/admin/events');
});

app.post('/admin/events/:id/toggle', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT published FROM site_events WHERE id = ?').get(id);
  if (row) db.prepare('UPDATE site_events SET published = ?, updated_at = ? WHERE id = ?').run(row.published ? 0 : 1, new Date().toISOString(), id);
  res.redirect('/admin/events');
});

app.get('/admin/reports', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const items = db
    .prepare(
      `SELECT r.*, u.username AS author_name
       FROM site_reports r LEFT JOIN admin_users u ON u.id = r.author_id
       ORDER BY r.created_at DESC`
    )
    .all();
  res.render('admin-reports', { admin: req.session.adminUser, items, error: null, roleLabel });
});

app.post('/admin/reports', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const published = req.body.published ? 1 : 0;
  if (!title || !body) {
    const items = db.prepare('SELECT * FROM site_reports ORDER BY created_at DESC').all();
    return res.status(400).render('admin-reports', {
      admin: req.session.adminUser,
      items,
      error: 'Заполните заголовок и текст отчёта',
      roleLabel,
    });
  }
  db.prepare('INSERT INTO site_reports (title, body, published, created_at, author_id) VALUES (?, ?, ?, ?, ?)').run(
    title,
    body,
    published,
    new Date().toISOString(),
    req.session.adminUser.id
  );
  res.redirect('/admin/reports');
});

app.post('/admin/reports/:id/toggle', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT published FROM site_reports WHERE id = ?').get(id);
  if (row) db.prepare('UPDATE site_reports SET published = ? WHERE id = ?').run(row.published ? 0 : 1, id);
  res.redirect('/admin/reports');
});

app.get('/admin/library', requireAdmin, (req, res) => {
  const me = req.session.adminUser;
  let items;
  if (me.role === 'specialist') {
    items = db
      .prepare('SELECT * FROM library_materials WHERE author_id = ? ORDER BY created_at DESC')
      .all(me.id);
  } else {
    items = db
      .prepare(
        `SELECT l.*, u.username AS author_name
         FROM library_materials l LEFT JOIN admin_users u ON u.id = l.author_id
         ORDER BY l.created_at DESC`
      )
      .all();
  }
  res.render('admin-library', { admin: me, items, error: null, roleLabel });
});

app.post('/admin/library', requireAdmin, (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const link = String(req.body.link || '').trim();
  if (!title) {
    return res.redirect('/admin/library?error=title');
  }
  const status = req.session.adminUser.role === 'specialist' ? 'pending' : 'published';
  db.prepare('INSERT INTO library_materials (title, description, link, status, created_at, author_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    title,
    description || null,
    link || null,
    status,
    new Date().toISOString(),
    req.session.adminUser.id
  );
  res.redirect('/admin/library');
});

app.post('/admin/library/:id/approve', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  db.prepare("UPDATE library_materials SET status = 'published' WHERE id = ?").run(Number(req.params.id));
  res.redirect('/admin/library');
});

app.post('/admin/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
});

app.get('/admin', requireAdmin, (req, res) => {
  const me = req.session.adminUser;
  const filterStatus = String(req.query.status || 'all');
  const filterKind = String(req.query.kind || 'all');

  const specialists = db
    .prepare("SELECT id, username, full_name, role FROM admin_users WHERE role = 'specialist' ORDER BY COALESCE(full_name, username)")
    .all();

  let contact = [];
  let booking = [];

  if (me.role === 'specialist') {
    booking = db
      .prepare(
        `SELECT b.id, b.created_at, b.processed, b.status, b.name, b.phone, b.child_name, b.direction, b.desired_date, b.comment,
                b.assigned_to, b.specialist_note,
                u.username AS assigned_username, u.full_name AS assigned_full_name
         FROM booking_requests b
         LEFT JOIN admin_users u ON u.id = b.assigned_to
         WHERE b.assigned_to = ?
         ORDER BY b.created_at DESC`
      )
      .all(me.id)
      .map((r) => ({ ...r, kind: 'booking' }));
  } else {
    contact = db
      .prepare(
        `SELECT c.id, c.created_at, c.processed, c.status, c.name, c.phone, c.email, c.topic, c.message,
                c.assigned_to, c.admin_note,
                u.username AS assigned_username, u.full_name AS assigned_full_name
         FROM contact_requests c
         LEFT JOIN admin_users u ON u.id = c.assigned_to
         ORDER BY c.created_at DESC`
      )
      .all()
      .map((r) => ({ ...r, kind: 'contact' }));

    booking = db
      .prepare(
        `SELECT b.id, b.created_at, b.processed, b.status, b.name, b.phone, b.child_name, b.direction, b.desired_date, b.comment,
                b.assigned_to, b.specialist_note,
                u.username AS assigned_username, u.full_name AS assigned_full_name
         FROM booking_requests b
         LEFT JOIN admin_users u ON u.id = b.assigned_to
         ORDER BY b.created_at DESC`
      )
      .all()
      .map((r) => ({ ...r, kind: 'booking' }));
  }

  let requests = [...contact, ...booking].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (filterKind !== 'all') {
    requests = requests.filter((r) => r.kind === filterKind);
  }
  if (filterStatus !== 'all') {
    requests = requests.filter((r) => {
      const st = r.status || (r.processed ? 'done' : 'new');
      return st === filterStatus;
    });
  }

  res.render('admin', {
    requests,
    admin: me,
    specialists,
    roleLabel,
    filterStatus,
    filterKind,
  });
});

function normalizeStatus(row) {
  if (row && typeof row.status === 'string' && row.status) return row.status;
  return row && row.processed ? 'done' : 'new';
}

function statusToProcessed(status) {
  return status === 'done' ? 1 : 0;
}

function nextStatus(status) {
  const s = status || 'new';
  if (s === 'new') return 'in_progress';
  if (s === 'in_progress') return 'done';
  return 'new';
}

app.post('/admin/requests/:kind/:id/status', requireAdmin, (req, res) => {
  const { kind, id } = req.params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) return res.status(400).json({ error: 'Некорректный id' });

  let table;
  if (kind === 'contact') table = 'contact_requests';
  else if (kind === 'booking') table = 'booking_requests';
  else return res.status(400).json({ error: 'Некорректный тип заявки' });

  const current = db.prepare(`SELECT processed, status FROM ${table} WHERE id = ?`).get(requestId);
  if (!current) return res.status(404).json({ error: 'Заявка не найдена' });

  const me = req.session.adminUser;
  if (me.role === 'specialist' && kind !== 'booking') return res.status(403).send('Недостаточно прав');

  const cur = normalizeStatus(current);
  const next = nextStatus(cur);
  db.prepare(`UPDATE ${table} SET status = ?, processed = ? WHERE id = ?`).run(next, statusToProcessed(next), requestId);
  platform.auditLog(me, 'status_change', kind, requestId, next);
  res.redirect('/admin');
});

app.post('/admin/requests/booking/:id/assign', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const requestId = Number(req.params.id);
  const assigned_to = Number(req.body.assigned_to);
  if (!Number.isFinite(requestId)) return res.status(400).json({ error: 'Некорректный id' });
  if (!Number.isFinite(assigned_to)) return res.status(400).json({ error: 'Некорректный специалист' });

  const user = db.prepare("SELECT id FROM admin_users WHERE id = ? AND role = 'specialist'").get(assigned_to);
  if (!user) return res.status(400).json({ error: 'Специалист не найден' });

  db.prepare('UPDATE booking_requests SET assigned_to = ? WHERE id = ?').run(assigned_to, requestId);
  platform.auditLog(req.session.adminUser, 'assign_specialist', 'booking', requestId, assigned_to);
  res.redirect('/admin');
});

app.post('/admin/requests/booking/:id/note', requireAdmin, (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isFinite(requestId)) return res.status(400).json({ error: 'Некорректный id' });

  const me = req.session.adminUser;
  const note = String(req.body.note || '').trim();

  if (me.role === 'specialist') {
    const row = db.prepare('SELECT assigned_to FROM booking_requests WHERE id = ?').get(requestId);
    if (!row) return res.status(404).json({ error: 'Заявка не найдена' });
    if (Number(row.assigned_to) !== Number(me.id)) return res.status(403).send('Недостаточно прав');
  }

  db.prepare('UPDATE booking_requests SET specialist_note = ? WHERE id = ?').run(note || null, requestId);
  platform.auditLog(me, 'specialist_note', 'booking', requestId, null);
  res.redirect('/admin');
});

app.post('/admin/requests/contact/:id/note', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const requestId = Number(req.params.id);
  const note = String(req.body.note || '').trim();
  if (!Number.isFinite(requestId)) return res.status(400).send('Некорректный id');
  db.prepare('UPDATE contact_requests SET admin_note = ? WHERE id = ?').run(note || null, requestId);
  platform.auditLog(req.session.adminUser, 'admin_note', 'contact', requestId, null);
  res.redirect('/admin');
});

app.post('/admin/requests/contact/:id/assign', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const requestId = Number(req.params.id);
  const assigned_to = Number(req.body.assigned_to);
  if (!Number.isFinite(requestId) || !Number.isFinite(assigned_to)) return res.status(400).send('Некорректные данные');
  const user = db.prepare('SELECT id FROM admin_users WHERE id = ?').get(assigned_to);
  if (!user) return res.status(400).send('Сотрудник не найден');
  db.prepare('UPDATE contact_requests SET assigned_to = ? WHERE id = ?').run(assigned_to, requestId);
  platform.auditLog(req.session.adminUser, 'assign_contact', 'contact', requestId, assigned_to);
  res.redirect('/admin');
});

app.get('/admin/users', requireAdmin, requireRole('admin'), (req, res) => {
  const users = db
    .prepare('SELECT id, username, role, full_name, created_at FROM admin_users ORDER BY id DESC')
    .all();
  res.render('admin-users', { admin: req.session.adminUser, users, error: null });
});

app.post('/admin/users', requireAdmin, requireRole('admin'), (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();
  const role = String(req.body.role || '').trim();
  const full_name = String(req.body.full_name || '').trim();

  const roles = new Set(['admin', 'coordinator', 'specialist']);
  if (!username || !password || !roles.has(role)) {
    const users = db
      .prepare('SELECT id, username, role, full_name, created_at FROM admin_users ORDER BY id DESC')
      .all();
    return res.status(400).render('admin-users', {
      admin: req.session.adminUser,
      users,
      error: 'Заполните логин, пароль и роль',
    });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO admin_users (username, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?)').run(
      username,
      password_hash,
      role,
      full_name || null,
      new Date().toISOString()
    );
    return res.redirect('/admin/users');
  } catch {
    const users = db
      .prepare('SELECT id, username, role, full_name, created_at FROM admin_users ORDER BY id DESC')
      .all();
    return res.status(400).render('admin-users', {
      admin: req.session.adminUser,
      users,
      error: 'Пользователь с таким логином уже существует',
    });
  }
});

app.get('/admin/sessions', requireAdmin, (req, res) => {
  const me = req.session.adminUser;
  let items;
  if (me.role === 'specialist') {
    items = db
      .prepare(
        `SELECT s.*, COALESCE(u.full_name, u.username) AS specialist_name
         FROM therapy_sessions s LEFT JOIN admin_users u ON u.id = s.specialist_id
         WHERE s.specialist_id = ? ORDER BY s.session_date DESC, s.session_time DESC`
      )
      .all(me.id);
  } else {
    items = db
      .prepare(
        `SELECT s.*, COALESCE(u.full_name, u.username) AS specialist_name
         FROM therapy_sessions s LEFT JOIN admin_users u ON u.id = s.specialist_id
         ORDER BY s.session_date DESC, s.session_time DESC`
      )
      .all();
  }
  const specialists = db
    .prepare("SELECT id, username, full_name FROM admin_users WHERE role = 'specialist' ORDER BY COALESCE(full_name, username)")
    .all();
  res.render('admin-sessions', { admin: me, items, specialists, error: req.query.error || null, roleLabel });
});

app.post('/admin/sessions', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const title = String(req.body.title || '').trim();
  const session_date = String(req.body.session_date || '').trim();
  if (!title || !session_date) return res.redirect('/admin/sessions?error=fill');

  db.prepare(
    `INSERT INTO therapy_sessions
      (title, description, session_date, session_time, duration_min, direction, place, specialist_id,
       max_slots, tips_for_parents, status, published, created_at, author_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)`
  ).run(
    title,
    String(req.body.description || '').trim() || null,
    session_date,
    String(req.body.session_time || '').trim() || null,
    Number(req.body.duration_min) || 45,
    String(req.body.direction || '').trim() || null,
    String(req.body.place || '').trim() || 'Кабинет «Точка Открытий»',
    Number(req.body.specialist_id) || null,
    Number(req.body.max_slots) || 1,
    String(req.body.tips_for_parents || '').trim() || null,
    req.body.published ? 1 : 0,
    new Date().toISOString(),
    req.session.adminUser.id
  );
  platform.auditLog(req.session.adminUser, 'create', 'session', null, title);
  res.redirect('/admin/sessions');
});

app.post('/admin/sessions/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || '').trim();
  const allowed = new Set(['scheduled', 'completed', 'cancelled']);
  if (!allowed.has(status)) return res.status(400).send('Некорректный статус');

  const row = db.prepare('SELECT specialist_id FROM therapy_sessions WHERE id = ?').get(id);
  if (!row) return res.status(404).send('Сеанс не найден');

  const me = req.session.adminUser;
  if (me.role === 'specialist' && Number(row.specialist_id) !== Number(me.id)) {
    return res.status(403).send('Недостаточно прав');
  }

  db.prepare('UPDATE therapy_sessions SET status = ? WHERE id = ?').run(status, id);
  platform.auditLog(me, 'session_status', 'session', id, status);
  res.redirect('/admin/sessions');
});

app.post('/admin/sessions/:id/toggle', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT published FROM therapy_sessions WHERE id = ?').get(id);
  if (row) db.prepare('UPDATE therapy_sessions SET published = ? WHERE id = ?').run(row.published ? 0 : 1, id);
  res.redirect('/admin/sessions');
});

app.get('/admin/analytics', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const me = req.session.adminUser;
  const data = platform.getAnalyticsData(me);
  const chatStats = {
    total: db.prepare('SELECT COUNT(*) AS c FROM chat_logs').get().c,
    week: db.prepare("SELECT COUNT(*) AS c FROM chat_logs WHERE created_at >= datetime('now', '-7 days')").get().c,
  };
  res.render('admin-analytics', { admin: me, data, chatStats, roleLabel });
});

app.get('/admin/quiz', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const items = db
    .prepare('SELECT * FROM parent_quiz_results ORDER BY created_at DESC LIMIT 100')
    .all();
  const summary = db
    .prepare(
      `SELECT recommended_title AS title, COUNT(*) AS c FROM parent_quiz_results
       WHERE recommended_title IS NOT NULL GROUP BY recommended_title ORDER BY c DESC`
    )
    .all();
  res.render('admin-quiz', { admin: req.session.adminUser, items, summary, roleLabel });
});

app.get('/admin/audit', requireAdmin, requireRole('admin'), (req, res) => {
  const items = db.prepare('SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 200').all();
  const chatLogs = db.prepare('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 50').all();
  res.render('admin-audit', { admin: req.session.adminUser, items, chatLogs, roleLabel });
});

app.get('/admin/export/requests', requireAdmin, requireRole(['admin', 'coordinator']), (req, res) => {
  const contacts = db.prepare('SELECT * FROM contact_requests ORDER BY created_at DESC').all();
  const bookings = db.prepare('SELECT * FROM booking_requests ORDER BY created_at DESC').all();
  const lines = ['type;id;created_at;status;name;phone;details'];
  contacts.forEach((r) => {
    lines.push(
      `contact;${r.id};${r.created_at};${r.status || 'new'};${r.name};${r.phone};${(r.topic || '')} ${(r.message || '')}`.replace(/\n/g, ' ')
    );
  });
  bookings.forEach((r) => {
    lines.push(
      `booking;${r.id};${r.created_at};${r.status || 'new'};${r.name};${r.phone};${r.direction || ''} ${r.child_name || ''}`.replace(/\n/g, ' ')
    );
  });
  platform.auditLog(req.session.adminUser, 'export', 'requests', null, `${contacts.length + bookings.length} rows`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="requests-export.csv"');
  res.send('\uFEFF' + lines.join('\n'));
});

app.post('/admin/users/:id/reset', requireAdmin, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const password = String(req.body.password || '').trim();
  if (!password || password.length < 6) return res.redirect('/admin/users?error=password');
  const row = db.prepare('SELECT id, username FROM admin_users WHERE id = ?').get(id);
  if (!row || row.username === req.session.adminUser.username) return res.redirect('/admin/users?error=self');
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, id);
  platform.auditLog(req.session.adminUser, 'reset_password', 'user', id, row.username);
  res.redirect('/admin/users?ok=1');
});

// Статика: CSS админки отдельно; папку admin/ (PHP) не раздаём — маршруты /admin/* обрабатывает Express выше.
app.use('/admin/assets', express.static(path.join(__dirname, 'admin', 'assets')));

app.use((req, res, next) => {
  const p = req.path || '';
  if (
    p.startsWith('/api') ||
    p.startsWith('/views') ||
    p.startsWith('/lib') ||
    p === '/data.sqlite' ||
    p === '/.env' ||
    p === '/server.js' ||
    p === '/package.json' ||
    p.startsWith('/node_modules') ||
    (p.startsWith('/admin') && !p.startsWith('/admin/assets'))
  ) {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started: http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://0.0.0.0:${PORT}/admin/login`);
  console.log(`DB: ${DB_PATH}`);
});

