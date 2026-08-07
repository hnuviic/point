
CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    processed INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    topic TEXT,
    message TEXT,
    consent INTEGER NOT NULL DEFAULT 0,
    ip TEXT,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS booking_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    processed INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    child_name TEXT,
    direction TEXT,
    desired_date TEXT,
    comment TEXT,
    consent INTEGER NOT NULL DEFAULT 0,
    ip TEXT,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- ========== 2. Отчёты по заявкам с сайта ==========

-- Все обращения с формы «Контакты»
SELECT
    id AS номер,
    datetime(created_at) AS дата,
    CASE processed WHEN 1 THEN 'Обработана' ELSE 'Новая' END AS статус,
    name AS имя,
    phone AS телефон,
    email,
    topic AS тема,
    message AS сообщение
FROM contact_requests
ORDER BY created_at DESC;

-- Все записи на приём (zap.html)
SELECT
    id AS номер,
    datetime(created_at) AS дата,
    CASE processed WHEN 1 THEN 'Обработана' ELSE 'Новая' END AS статус,
    name AS имя_родителя,
    phone AS телефон,
    child_name AS ребенок,
    direction AS направление,
    desired_date AS желаемая_дата,
    comment AS комментарий
FROM booking_requests
ORDER BY created_at DESC;

-- Объединённый список всех заявок
SELECT 'Контакт' AS тип, id, created_at, processed, name, phone, topic AS детали
FROM contact_requests
UNION ALL
SELECT 'Запись' AS тип, id, created_at, processed, name, phone, direction AS детали
FROM booking_requests
ORDER BY created_at DESC;

-- Количество заявок по типам
SELECT 'Контакты' AS форма, COUNT(*) AS всего,
       SUM(CASE WHEN processed = 0 THEN 1 ELSE 0 END) AS необработано
FROM contact_requests
UNION ALL
SELECT 'Запись на приём', COUNT(*),
       SUM(CASE WHEN processed = 0 THEN 1 ELSE 0 END)
FROM booking_requests;

-- Заявки за текущий месяц
SELECT * FROM contact_requests
WHERE created_at >= date('now', 'start of month')
ORDER BY created_at DESC;

SELECT * FROM booking_requests
WHERE created_at >= date('now', 'start of month')
ORDER BY created_at DESC;

-- Отметить заявку обработанной (пример)
-- UPDATE contact_requests SET processed = 1 WHERE id = 1;
-- UPDATE booking_requests SET processed = 1 WHERE id = 1;
