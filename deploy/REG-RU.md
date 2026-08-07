# Развёртывание на REG.RU

Сайт состоит из **статики** (HTML, CSS, картинки) и **сервера Node.js** (тест с сохранением, формы, админка, чат).

Если залить только HTML через файловый менеджер REG.RU — страницы откроются, но **админка и формы не заработают**. Тест после обновления `js/quiz-data.js` может показывать результат локально, но без сервера результаты не попадут в базу.

## Что нужно для полной работы

| Функция | Нужен Node.js? |
|---------|----------------|
| Страницы, фото, стили | Нет |
| Тест (результат на экране) | Нет (fallback в `js/quiz-data.js`) |
| Сохранение результатов теста | Да |
| Запись на приём, контакты | Да |
| Админка `/admin/login` | Да |
| Чат-помощник | Да |

**Вывод:** нужен **VPS REG.RU** (или другой сервер с Node.js), а не обычный виртуальный хостинг только для HTML.

---

## Быстрая проверка

Откройте в браузере:

```
https://pointdiscovery.online/api/health
```

- **`{"ok":true}`** — сервер работает, проблема скорее в пароле или cookies.
- **404 / ошибка / скачивается HTML** — Node.js **не запущен** или nginx не проксирует на порт 3000.

---

## Шаги на VPS REG.RU

### 1. Загрузить весь проект

Через SFTP залейте **всю папку** `point` (не только HTML):

- `server.js`, `package.json`, `lib/`, `views/`, `data.sqlite`
- `.env` (см. `.env.example`)
- все HTML, CSS, JS, `images/`, `docs/`

**Не заливайте** `node_modules` с Windows — на сервере выполните `npm install`.

### 2. Файл `.env` на сервере

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=длинная-случайная-строка
DB_PATH=./data.sqlite
ADMIN_USERNAME=admin
ADMIN_PASSWORD=12345
```

После смены пароля перезапустите приложение.

### 3. Установка и запуск

```bash
cd /var/www/point
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Или скрипт: `bash deploy/reg-ru-vps.sh /var/www/point`

### 4. Nginx + SSL

Скопируйте `deploy/nginx-point.conf` в `/etc/nginx/sites-available/point`, включите сайт, получите сертификат:

```bash
sudo certbot --nginx -d pointdiscovery.online -d www.pointdiscovery.online
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Вход в админку

```
https://pointdiscovery.online/admin/login
```

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | 12345 | Администратор |
| coordinator1 | 12345 | Координатор |
| specialist1 | 12345 | Специалист |

---

## Если админка не пускает при работающем `/api/health`

1. Проверьте пароль в `.env` на **сервере** (не только на компьютере).
2. Перезапустите: `pm2 restart point`
3. Смотрите логи: `pm2 logs point`
4. Открывайте сайт только по **https://** (в production cookies с флагом secure).

---

## Обновление только статики (без перезапуска Node)

Можно заливать через FTP: HTML, CSS, JS, `images/`, `docs/`.

После изменения вопросов теста на компьютере:

```bash
node scripts/export-quiz-data.js
```

и залейте обновлённый `js/quiz-data.js`.

---

## Контакты REG.RU

Если у вас **только виртуальный хостинг** без SSH — закажите **VPS** в панели REG.RU или перенесите домен на сервер, где можно запустить `node server.js`.
