# Деплой на Timeweb Cloud — пошагово

Сайт **целиком** (страницы + тест + админка + формы) на Timeweb.  
Домен `pointdiscovery.online` можно оставить на REG.RU — DNS направить на Timeweb.

Поддержка Timeweb: **8 800 700-32-92**, чат в панели [timeweb.cloud](https://timeweb.cloud)

---

## Что понадобится

- Аккаунт Timeweb Cloud (~200–400 ₽/мес, часто есть бонус новым)
- Аккаунт GitHub (бесплатно)
- Папка проекта на компьютере: `C:\Users\adm\Desktop\point`

---

## ШАГ 1. GitHub (обязательно)

Timeweb App Platform деплоит **из Git**, не через FTP.

### 1.1 Создайте репозиторий

1. [github.com](https://github.com) → **New repository**
2. Имя: `point-tochka` → **Create**

### 1.2 Загрузите файлы

**GitHub Desktop** (проще всего):

1. Скачать: [desktop.github.com](https://desktop.github.com)
2. **File → Add local repository** → `C:\Users\adm\Desktop\point`
3. **Publish repository** → выбрать `point-tochka`

**Или через сайт:**

1. Репозиторий → **Add file → Upload files**
2. Перетащить **все файлы и папки**, кроме `node_modules`
3. **Обязательно в корне:** `package.json`, `server.js`, `data.sqlite`, `lib/`, `views/`
4. **Commit changes**

> Файл `.env` **не загружайте** — пароли зададите в панели Timeweb.

---

## ШАГ 2. Timeweb Cloud

### 2.1 Регистрация

1. [timeweb.cloud](https://timeweb.cloud) → **Регистрация**
2. Пополнить баланс (минимум для App Platform — смотрите в панели)

### 2.2 Создать приложение

1. Панель → **App Platform** (или **Облачные приложения**)
2. **Создать приложение**
3. **Backend** → **Express** → runtime **Node.js 20**
4. **Подключить GitHub** → выбрать репозиторий `point-tochka`
5. Ветка: `main`
6. Путь к проекту: `/` (корень)
7. Команда сборки: `npm install` (по умолчанию)
8. Команда запуска: `npm start` или оставить авто (`server.js`)
9. Тариф: минимальный (1 vCPU / 1 GB RAM достаточно)
10. **Запустить деплой**

### 2.3 Переменные окружения

В настройках приложения → **Переменные окружения**:

| Ключ | Значение |
|------|----------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (или порт из подсказки Timeweb) |
| `SESSION_SECRET` | `pointTochka2024_xK9mP2vL7nQ4wR8sT6uY1zA` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `12345` |
| `DB_PATH` | `/tmp/point-data.sqlite` |
| `COOKIE_SECURE` | `false` |

Сохранить → **перезапустить** приложение.

### 2.4 Проверка

Timeweb выдаст ссылку вида: `https://ваше-приложение.timeweb.cloud`

Откройте:

```
https://ваше-приложение.timeweb.cloud/api/health
```

Должно быть: `{"ok":true}`

Админка:

```
https://ваше-приложение.timeweb.cloud/admin/login
```

Логин: `admin` · Пароль: `12345`

---

## ШАГ 3. Привязать домен pointdiscovery.online

1. Timeweb → приложение → **Домены** → **Добавить домен**
2. Ввести: `pointdiscovery.online` и `www.pointdiscovery.online`
3. Timeweb покажет **DNS-записи** (A или CNAME)

4. **REG.RU** → ваш домен → **DNS-серверы / Ресурсные записи**:
   - Удалить старые записи на старый хостинг (если мешают)
   - Добавить записи **как указал Timeweb**

5. Подождать 15 мин – 24 ч (обычно 1–2 часа)

6. Проверить:
   - `https://pointdiscovery.online/api/health`
   - `https://pointdiscovery.online/admin/login`
   - `https://pointdiscovery.online/podbor.html`

---

## ШАГ 4. REG.RU — что делать дальше

После привязки домена к Timeweb **FTP на REG.RU больше не нужен** — весь сайт отдаёт Timeweb.

Старые файлы на REG.RU можно не трогать: DNS поведёт на Timeweb.

---

## Если деплой упал

| Ошибка | Решение |
|--------|---------|
| Нет `package.json` | Загрузите файл в **корень** GitHub |
| Ошибка `better-sqlite3` | В репозитории есть `Dockerfile` — в Timeweb выберите деплой **через Dockerfile** |
| Админка не пускает | `COOKIE_SECURE=false`, перезапуск |
| 502 / не открывается | Смотрите **Логи** в панели Timeweb |

---

## Обновление сайта

1. Изменили файлы на компьютере
2. GitHub Desktop → **Commit** → **Push**
3. Timeweb сам пересоберёт приложение (1–3 мин)

---

## Контакты поддержки Timeweb

- Телефон: **8 800 700-32-92**
- Чат в личном кабинете
- Документация Express: [timeweb.cloud/docs/apps/.../express](https://timeweb.cloud/docs/apps/deploying-backend-applications/express)

Можно написать: *«Нужно развернуть Node.js Express приложение с SQLite из GitHub»* — подскажут по панели.
