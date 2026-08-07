const COURSES = [
  {
    slug: 'speech',
    title: 'Логопед / дефектолог',
    description: 'Коррекция речи, альтернативная коммуникация (PECS, АВА), занятия с дефектологом.',
    age_min: 2,
    age_max: 18,
    tags: 'речь,логопед,PECS,АВА',
    icon: '🗣️',
    sort_order: 1,
  },
  {
    slug: 'psychology',
    title: 'Психологическая поддержка',
    description: 'Работа с эмоциями, адаптация, арт-терапия, групповые и индивидуальные консультации.',
    age_min: 3,
    age_max: 18,
    tags: 'психолог,эмоции,арт-терапия',
    icon: '🧠',
    sort_order: 2,
  },
  {
    slug: 'early',
    title: 'Раннее развитие',
    description: 'Занятия для малышей до 3 лет: моторика, коммуникация, сенсорная интеграция.',
    age_min: 0,
    age_max: 3,
    tags: 'раннее развитие,малыши',
    icon: '🌱',
    sort_order: 3,
  },
  {
    slug: 'family',
    title: 'Поддержка родителей',
    description: 'Семейное консультирование, супервизия, мастер-классы для родителей.',
    age_min: 0,
    age_max: 18,
    tags: 'семья,родители,консультация',
    icon: '👨‍👩‍👧',
    sort_order: 4,
  },
  {
    slug: 'diagnostics',
    title: 'Комплексная диагностика',
    description: 'Первичное обследование, составление индивидуального маршрута помощи ребёнку.',
    age_min: 0,
    age_max: 18,
    tags: 'диагностика,маршрут',
    icon: '📋',
    sort_order: 5,
  },
];

const QUIZ_QUESTIONS = [
  {
    id: 'age',
    question: 'Сколько лет вашему ребёнку?',
    type: 'single',
    options: [
      { value: '0-2', label: 'До 2 лет', scores: { early: 3, diagnostics: 2 } },
      { value: '2-3', label: '2–3 года', scores: { early: 4, speech: 2, diagnostics: 2 } },
      { value: '3-6', label: '3–6 лет', scores: { speech: 3, psychology: 2, early: 1 } },
      { value: '7-12', label: '7–12 лет', scores: { speech: 2, psychology: 3 } },
      { value: '13+', label: '13 лет и старше', scores: { psychology: 3, family: 2 } },
    ],
  },
  {
    id: 'concerns',
    question: 'Что беспокоит вас больше всего? (можно несколько)',
    type: 'multi',
    options: [
      { value: 'speech', label: 'Речь и коммуникация', scores: { speech: 4 } },
      { value: 'behavior', label: 'Поведение и эмоции', scores: { psychology: 4 } },
      { value: 'social', label: 'Общение со сверстниками', scores: { psychology: 3, family: 1 } },
      { value: 'motor', label: 'Моторика и координация', scores: { early: 3, diagnostics: 2 } },
      { value: 'learning', label: 'Обучение и внимание', scores: { speech: 2, psychology: 2, diagnostics: 2 } },
    ],
  },
  {
    id: 'diagnosis',
    question: 'Есть ли заключение специалистов (ПМПК, невролог и т.д.)?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Да, есть заключение', scores: { speech: 1, psychology: 1 } },
      { value: 'process', label: 'В процессе обследования', scores: { diagnostics: 4 } },
      { value: 'no', label: 'Пока нет', scores: { diagnostics: 5 } },
    ],
  },
  {
    id: 'experience',
    question: 'Был ли уже опыт занятий или коррекции?',
    type: 'single',
    options: [
      { value: 'none', label: 'Нет, мы только начинаем', scores: { diagnostics: 3, family: 2 } },
      { value: 'some', label: 'Был, но нужно продолжить', scores: { speech: 2, psychology: 2 } },
      { value: 'regular', label: 'Регулярно занимаемся', scores: { family: 2, psychology: 1 } },
    ],
  },
  {
    id: 'priority',
    question: 'Что для вас сейчас важнее всего?',
    type: 'single',
    options: [
      { value: 'diag', label: 'Понять, с чего начать (диагностика)', scores: { diagnostics: 5 } },
      { value: 'classes', label: 'Регулярные занятия со специалистом', scores: { speech: 3, psychology: 3 } },
      { value: 'parents', label: 'Поддержка и советы для родителей', scores: { family: 5 } },
      { value: 'group', label: 'Групповые мероприятия и общение', scores: { psychology: 2, family: 3 } },
    ],
  },
];

function createPlatform(db, bcrypt) {
  function auditLog(user, action, entityType, entityId, details) {
    db.prepare(
      `INSERT INTO admin_audit_log (created_at, user_id, username, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      new Date().toISOString(),
      user?.id || null,
      user?.username || 'system',
      action,
      entityType || null,
      entityId || null,
      details ? String(details).slice(0, 500) : null
    );
  }

  function seedCourses() {
    const count = db.prepare('SELECT COUNT(*) AS c FROM courses').get().c;
    if (count > 0) return;
    const stmt = db.prepare(
      `INSERT INTO courses (title, slug, description, age_min, age_max, tags, icon, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    );
    COURSES.forEach((c) => {
      stmt.run(c.title, c.slug, c.description, c.age_min, c.age_max, c.tags, c.icon, c.sort_order);
    });
  }

  function seedSampleSessions() {
    const count = db.prepare('SELECT COUNT(*) AS c FROM therapy_sessions').get().c;
    if (count > 0) return;
    const specialists = db
      .prepare("SELECT id FROM admin_users WHERE role = 'specialist' ORDER BY id LIMIT 1")
      .all();
    const specId = specialists[0]?.id || null;
    const now = new Date();
    const samples = [
      {
        title: 'Первичная консультация психолога',
        description: 'Знакомство со специалистом, сбор анамнеза, рекомендации для семьи.',
        direction: 'Психолог',
        tips: 'Возьмите медицинские документы ребёнка. Приходите за 10 минут до начала.',
        days: 3,
      },
      {
        title: 'Логопедическое занятие (индивидуальное)',
        description: 'Коррекция звукопроизношения, развитие речи и альтернативной коммуникации.',
        direction: 'Логопед / дефектолог',
        tips: 'Не кормите ребёнка сладким перед занятием. Возьмите любимую игрушку для контакта.',
        days: 5,
      },
      {
        title: 'Диагностика раннего развития',
        description: 'Комплексная оценка навыков ребёнка до 3 лет с составлением маршрута помощи.',
        direction: 'Диагностика',
        tips: 'Ребёнок должен быть в привычном режиме сна и питания. Запишите вопросы заранее.',
        days: 7,
      },
    ];
    const stmt = db.prepare(
      `INSERT INTO therapy_sessions
        (title, description, session_date, session_time, duration_min, direction, place, specialist_id,
         max_slots, tips_for_parents, status, published, created_at, author_id)
       VALUES (?, ?, ?, ?, 45, ?, 'Кабинет «Точка Открытий»', ?, 3, ?, 'scheduled', 1, ?, NULL)`
    );
    samples.forEach((s, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + s.days);
      const dateStr = d.toISOString().slice(0, 10);
      stmt.run(s.title, s.description, dateStr, `${10 + i}:00`, s.direction, specId, s.tips, now.toISOString());
    });
  }

  function ensureDemoUsers() {
    const demoPassword = process.env.DEMO_USER_PASSWORD || '12345';
    const demo = [
      {
        username: 'coordinator1',
        password: demoPassword,
        role: 'coordinator',
        full_name: 'Координатор центра',
      },
      {
        username: 'specialist1',
        password: demoPassword,
        role: 'specialist',
        full_name: 'Специалист (демо)',
      },
    ];
    demo.forEach((u) => {
      const hash = bcrypt.hashSync(u.password, 10);
      const exists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(u.username);
      if (exists) {
        db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, exists.id);
        return;
      }
      db.prepare(
        'INSERT INTO admin_users (username, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(u.username, hash, u.role, u.full_name, new Date().toISOString());
      console.log(`[ADMIN] Demo user created: ${u.username} / ${u.password}`);
    });
  }

  function recommendCourse(answers) {
    const scores = { speech: 0, psychology: 0, early: 0, family: 0, diagnostics: 0 };
    QUIZ_QUESTIONS.forEach((q) => {
      const raw = answers[q.id];
      const selected = Array.isArray(raw) ? raw : raw ? [raw] : [];
      selected.forEach((val) => {
        const opt = q.options.find((o) => o.value === val);
        if (!opt || !opt.scores) return;
        Object.entries(opt.scores).forEach(([k, v]) => {
          scores[k] = (scores[k] || 0) + v;
        });
      });
    });

    const slugOrder = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topSlug = slugOrder[0]?.[0] || 'diagnostics';
    const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(topSlug);
    return {
      course: course || db.prepare('SELECT * FROM courses WHERE slug = ?').get('diagnostics'),
      scores,
      ranking: slugOrder,
    };
  }

  function getDashboardStats(user) {
    const me = user;
    const base = {
      news: db.prepare('SELECT COUNT(*) AS c FROM site_news').get().c,
      events: db.prepare('SELECT COUNT(*) AS c FROM site_events').get().c,
      reports: db.prepare('SELECT COUNT(*) AS c FROM site_reports').get().c,
      pendingLib: db.prepare("SELECT COUNT(*) AS c FROM library_materials WHERE status = 'pending'").get().c,
      sessions: db.prepare("SELECT COUNT(*) AS c FROM therapy_sessions WHERE status = 'scheduled'").get().c,
      quizTotal: db.prepare('SELECT COUNT(*) AS c FROM parent_quiz_results').get().c,
      quizWeek: db
        .prepare("SELECT COUNT(*) AS c FROM parent_quiz_results WHERE created_at >= datetime('now', '-7 days')")
        .get().c,
    };

    if (me.role === 'specialist') {
      base.newRequests = db
        .prepare(
          "SELECT COUNT(*) AS c FROM booking_requests WHERE assigned_to = ? AND (status = 'new' OR (status IS NULL AND processed = 0))"
        )
        .get(me.id).c;
      base.mySessions = db
        .prepare(
          "SELECT COUNT(*) AS c FROM therapy_sessions WHERE specialist_id = ? AND status = 'scheduled' AND session_date >= date('now')"
        )
        .get(me.id).c;
    } else {
      base.newRequests =
        db.prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'new' OR (status IS NULL AND processed = 0)").get()
          .c +
        db.prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'new' OR (status IS NULL AND processed = 0)").get()
          .c;
      base.newContacts = db
        .prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'new' OR (status IS NULL AND processed = 0)")
        .get().c;
      base.newBookings = db
        .prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'new' OR (status IS NULL AND processed = 0)")
        .get().c;
      base.inProgress =
        db.prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'in_progress'").get().c +
        db.prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'in_progress'").get().c;
    }

    return base;
  }

  function getAnalyticsData(user) {
    const days = 14;
    const requestsByDay = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = db
        .prepare(
          `SELECT date(created_at) AS d FROM contact_requests WHERE date(created_at) = date('now', ?)
           UNION ALL SELECT date(created_at) FROM booking_requests WHERE date(created_at) = date('now', ?)`
        )
        .all(`-${i} days`, `-${i} days`);
      const labelRow = db.prepare("SELECT date('now', ?) AS d").get(`-${i} days`);
      const d = labelRow.d;
      const contacts = db
        .prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE date(created_at) = ?")
        .get(d).c;
      const bookings = db
        .prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE date(created_at) = ?")
        .get(d).c;
      requestsByDay.push({ date: d, contacts, bookings, total: contacts + bookings });
    }

    const statusBreakdown = {
      new:
        db.prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'new'").get().c +
        db.prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'new'").get().c,
      in_progress:
        db.prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'in_progress'").get().c +
        db.prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'in_progress'").get().c,
      done:
        db.prepare("SELECT COUNT(*) AS c FROM contact_requests WHERE status = 'done'").get().c +
        db.prepare("SELECT COUNT(*) AS c FROM booking_requests WHERE status = 'done'").get().c,
    };

    const quizByCourse = db
      .prepare(
        `SELECT recommended_title AS title, COUNT(*) AS c
         FROM parent_quiz_results WHERE recommended_title IS NOT NULL
         GROUP BY recommended_title ORDER BY c DESC LIMIT 8`
      )
      .all();

    const topDirections = db
      .prepare(
        `SELECT direction AS title, COUNT(*) AS c FROM booking_requests
         WHERE direction IS NOT NULL AND direction != '' GROUP BY direction ORDER BY c DESC LIMIT 6`
      )
      .all();

    let specialistLoad = [];
    if (user.role !== 'specialist') {
      specialistLoad = db
        .prepare(
          `SELECT COALESCE(u.full_name, u.username) AS name, COUNT(b.id) AS c
           FROM admin_users u
           LEFT JOIN booking_requests b ON b.assigned_to = u.id AND b.status != 'done'
           WHERE u.role = 'specialist'
           GROUP BY u.id ORDER BY c DESC`
        )
        .all();
    }

    return { requestsByDay, statusBreakdown, quizByCourse, topDirections, specialistLoad };
  }

  return {
    COURSES,
    QUIZ_QUESTIONS,
    auditLog,
    seedCourses,
    seedSampleSessions,
    ensureDemoUsers,
    recommendCourse,
    getDashboardStats,
    getAnalyticsData,
  };
}

module.exports = { createPlatform, QUIZ_QUESTIONS, COURSES };
