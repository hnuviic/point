# Исправление ошибки Render: package.json not found

## Причина

На GitHub **нет главных файлов сервера**. Render ищет `package.json` в корне репозитория, а его там нет (загрузили не все файлы).

Проверка: откройте https://github.com/hnuviic/point — в списке файлов **должны быть** `package.json` и `server.js` в корне (не в подпапке).

---

## Быстрое исправление (через сайт GitHub)

1. Откройте https://github.com/hnuviic/point
2. Нажмите **Add file → Upload files**
3. Перетащите с компьютера из папки `C:\Users\adm\Desktop\point` **эти файлы в корень** (обязательно):

| Файл | Зачем |
|------|--------|
| `package.json` | список зависимостей Node.js |
| `package-lock.json` | версии пакетов для сборки |
| `server.js` | главный файл сервера |
| `render.yaml` | настройки Render (необязательно) |

4. Внизу: **Commit changes** → «Add server files»
5. В Render: **Manual Deploy → Deploy latest commit** (или подождите автодеплой 1–2 мин)

---

## Дополнительно залить (если чего-то не хватает на сайте)

Страницы и скрипты, которых может не быть в репозитории:

- `podbor.html`, `seansy.html`, `news.html`, `proect.html`, `proect-konsult.html`
- `podbor.css`, `seansy.css`, `news.css`, `style.css`
- `js/site-config.js`, `js/parent-quiz.js`, `js/quiz-data.js`
- `js/news-dynamic.js`, `js/sessions-dynamic.js`, `js/ai-chat.js`, `js/site-footer.js`
- папка `docs/` (если есть Ustav.pdf)

---

## После успешного деплоя на Render

1. Откройте `https://ВАШ-СЕРВИС.onrender.com/api/health` → `{"ok":true}`
2. В `js/site-config.js` на REG.RU укажите URL Render
3. В Environment на Render проверьте переменные из `deploy/RENDER.md`

---

## Как не ошибиться снова

При загрузке через GitHub файлы должны лежать **сразу в корне** репозитория:

```
point/          ← репозиторий на GitHub
  package.json  ← здесь
  server.js     ← здесь
  index.html
  js/
  lib/
  views/
```

**Неправильно:** вложенная папка `point/point/package.json`.
