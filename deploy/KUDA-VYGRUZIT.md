# Куда выгрузить сайт, чтобы всё работало

## Почему на REG.RU «не работает»

| Тариф REG.RU | Что есть | Админка и тест |
|--------------|----------|----------------|
| **Виртуальный хостинг** (FTP, файловый менеджер) | Только HTML/CSS | **Нет** — Node.js не запускается |
| **VPS / VDS** (есть SSH) | Полный сервер | **Да** — можно запустить `npm start` |

Если у вас **нет SSH** — это обычный хостинг. Туда можно залить только «картинку» сайта.  
**Админка и API на таком тарифе никогда не заработают** — это не поломка, а ограничение тарифа.

---

## Три понятных варианта (от простого к сложному)

### Вариант 1 — Render + домен с REG.RU (рекомендуем)

**Суть:** весь сайт на Render, домен `pointdiscovery.online` остаётся на REG.RU, DNS указывает на Render.

**Плюсы:** бесплатно, одна ссылка для всего (`/admin/login`, тест, формы).  
**Минусы:** после простоя первый заход 30–60 сек; нужен GitHub.

**Шаги:**

1. Загрузить проект на GitHub (обязательно `package.json`, `server.js`, `lib/`, `views/`, `data.sqlite`).
2. [render.com](https://render.com) → Web Service → подключить репозиторий.
3. Build: `npm install` · Start: `npm start` · Plan: Free.
4. Environment:
   ```
   NODE_ENV=production
   SESSION_SECRET=pointTochka2024_xK9mP2vL7nQ4wR8s
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=12345
   DB_PATH=/opt/render/project/src/data.sqlite
   CORS_ORIGINS=https://pointdiscovery.online,https://www.pointdiscovery.online
   COOKIE_SECURE=false
   ```
5. Render → **Settings → Custom Domains** → добавить `pointdiscovery.online`.
6. REG.RU → DNS домена → записи, которые покажет Render (обычно CNAME).

**Проверка:** `https://pointdiscovery.online/api/health` → `{"ok":true}`  
**Админка:** `https://pointdiscovery.online/admin/login`

> `COOKIE_SECURE=false` — если админка не пускает после входа на Render.

---

### Вариант 2 — Timeweb Cloud (русский интерфейс)

**Суть:** облачный хостинг с Node.js в панели, поддержка на русском.

1. [timeweb.cloud](https://timeweb.cloud) → регистрация.
2. **App Platform** или **Cloud Server** → Node.js.
3. Загрузить проект или подключить Git.
4. Привязать домен в панели.

**Плюсы:** понятная панель, оплата в рублях, поддержка на русском.  
**Минусы:** от ~200–400 ₽/мес (есть trial).

---

### Вариант 3 — VPS на REG.RU (всё у одного провайдера)

**Суть:** купить **VPS** в REG.RU (не виртуальный хостинг), по SSH установить Node.

1. REG.RU → заказ **VPS** (минимальный тариф).
2. Появится **SSH** и IP.
3. Инструкция: `deploy/REG-RU.md` и `deploy/reg-ru-vps.sh`.

**Плюсы:** домен и сервер в одном месте.  
**Минусы:** нужен SSH и базовые команды Linux (~500 ₽/мес).

---

## Что НЕ подходит

| Способ | Почему |
|--------|--------|
| Только FTP на REG.RU | Нет Node.js |
| Туннель с ноутбука | Работает только пока включён ПК |
| Только localhost | Не для постоянной работы сайта |

---

## Что выбрать вам

| Ситуация | Выбор |
|----------|--------|
| Нужно **бесплатно** и **одна ссылка** | **Render + DNS** (вариант 1) |
| Нужна **русская поддержка** | **Timeweb** (вариант 2) |
| Хотите **всё на REG.RU** | **VPS REG.RU** (вариант 3) |

---

## Минимум для деплоя (любой Node-хостинг)

Залить **весь проект**, не только HTML:

```
package.json
package-lock.json
server.js
lib/
views/
data.sqlite
.env (или переменные в панели хостинга)
index.html, info.html, … (все страницы)
js/, css/, images/
```

**Не заливать** `node_modules` — на сервере выполняется `npm install`.

---

## GitHub сейчас пустой

Репозиторий `hnuviic/point` **пустой** — Render не соберёт проект, пока файлы не загружены.

1. GitHub → репозиторий → **Upload files**.
2. Перетащить папку проекта (без `node_modules`).
3. Commit → снова деплой на Render.

Или GitHub Desktop: Add local repository → `C:\Users\adm\Desktop\point` → Publish.
