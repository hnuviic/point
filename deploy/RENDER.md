# Деплой: REG.RU (статика) + Render (Node.js API и админка)

Сайт открывается с **pointdiscovery.online** (файлы на REG.RU).  
Сервер, формы, тест с сохранением и админка — на **Render** (бесплатно).

---

## Часть 1. GitHub (нужен для Render)

Render разворачивает проект из GitHub. Без SSH на REG.RU это самый простой путь.

### 1.1 Создайте репозиторий

1. Зайдите на [github.com](https://github.com) и войдите (или зарегистрируйтесь).
2. **New repository** → имя, например `point-tochka` → **Create**.

### 1.2 Загрузите проект

**Вариант А — GitHub Desktop** (проще):

1. Скачайте [GitHub Desktop](https://desktop.github.com).
2. **File → Add local repository** → папка `C:\Users\adm\Desktop\point`.
3. **Publish repository** → выберите созданный репозиторий.

**Вариант Б — через сайт GitHub:**

1. В репозитории: **Add file → Upload files**.
2. Перетащите **все файлы проекта**, кроме папки `node_modules`.
3. **Commit changes**.

> Не загружайте файл `.env` — в нём секреты. На Render переменные задаются в панели.

---

## Часть 2. Render — сервер Node.js

### 2.1 Регистрация

1. [render.com](https://render.com) → **Get Started** → войдите через GitHub.

### 2.2 Новый Web Service

1. **Dashboard → New + → Web Service**.
2. **Connect** ваш репозиторий `point-tochka`.
3. Настройки:

| Поле | Значение |
|------|----------|
| Name | `point-api` (или любое) |
| Region | Frankfurt (ближе к России) |
| Branch | `main` |
| Runtime | **Node** |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | **Free** |

### 2.3 Переменные окружения (Environment)

В разделе **Environment** добавьте:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://pointdiscovery.online,https://www.pointdiscovery.online` |
| `SESSION_SECRET` | любая длинная случайная строка (например `mySecretKey2024Point`) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `12345` (потом смените) |
| `DB_PATH` | `/opt/render/project/src/data.sqlite` |

Нажмите **Create Web Service**. Подождите 5–10 минут (первый деплой).

### 2.4 Проверка

Когда статус **Live**, откройте в браузере:

```
https://ВАШ-СЕРВИС.onrender.com/api/health
```

Должно быть: `{"ok":true}`

Админка:

```
https://ВАШ-СЕРВИС.onrender.com/admin/login
```

Логин: `admin`, пароль: `12345`.

> **Первый запуск** после простоя может занять 30–60 секунд (бесплатный тариф «просыпается»).

---

## Часть 3. Настройка сайта на REG.RU

### 3.1 Укажите адрес Render в `js/site-config.js`

На компьютере откройте `js/site-config.js` и вставьте ваш URL Render:

```javascript
const API_BASE = 'https://point-api.onrender.com';  // ваш реальный URL
```

Сохраните файл.

### 3.2 Залейте на REG.RU через FTP / файловый менеджер

Обязательно обновите:

- `js/site-config.js` — с вашим URL Render
- `js/parent-quiz.js`, `js/quiz-data.js`
- `js/news-dynamic.js`, `js/sessions-dynamic.js`, `js/ai-chat.js`
- `js/site-footer.js`
- `zap.html`, `contact.html`, `podbor.html`

Остальные HTML/CSS/картинки — как обычно.

### 3.3 Проверка с сайта

1. **https://pointdiscovery.online** — страницы открываются.
2. **Подбор курса** — тест проходит, в конце есть рекомендация.
3. **Записаться** — форма отправляется без ошибки.
4. В подвале **«Вход для сотрудников»** ведёт на Render → админка.

---

## Важно про базу данных

На бесплатном Render файл `data.sqlite` **сохраняется между перезапусками**, но **может сброситься при новом деплое** (обновлении кода с GitHub).

- Заявки и настройки админки живут на сервере Render, не на REG.RU.
- Для учёбы и демо этого обычно достаточно.
- Для постоянного хранения позже можно подключить платный **Persistent Disk** на Render или VPS.

Чтобы перенести текущую базу с компьютера: положите `data.sqlite` в корень репозитория и сделайте commit (только если в базе нет лишних секретов).

---

## Обновление после изменений в коде

1. Изменили файлы на компьютере → загрузите в GitHub (push / upload).
2. Render **сам пересоберёт** сервер (1–5 мин).
3. Статику (HTML/CSS/JS) снова залейте на REG.RU через FTP, если меняли фронтенд.

---

## Если что-то не работает

| Проблема | Решение |
|----------|---------|
| Форма: «Не удалось отправить» | Проверьте `API_BASE` в `site-config.js` и `CORS_ORIGINS` на Render |
| Админка не входит | Пароль в Environment на Render = `ADMIN_PASSWORD` |
| Долго грузится API | Бесплатный Render «спит» — подождите минуту и обновите |
| CORS error в консоли браузера (F12) | В `CORS_ORIGINS` должен быть точный адрес: `https://pointdiscovery.online` без слэша в конце |

Логи сервера: Render → ваш сервис → **Logs**.
