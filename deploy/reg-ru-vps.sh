#!/bin/bash
# Развёртывание ИС «Точка Открытий» на VPS REG.RU (Ubuntu/Debian).
# Запуск на сервере: bash reg-ru-vps.sh /var/www/point

set -e
APP_DIR="${1:-/var/www/point}"

echo "==> Каталог приложения: $APP_DIR"
cd "$APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "==> Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential
fi

echo "==> npm install..."
npm install --production

if [ ! -f .env ]; then
  echo "==> Создайте .env из .env.example и задайте ADMIN_PASSWORD, SESSION_SECRET"
  cp .env.example .env
fi

echo "==> PM2..."
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash || true

echo "==> Проверка API..."
sleep 2
curl -sf http://127.0.0.1:3000/api/health && echo " OK" || echo " ОШИБКА: сервер не отвечает"

echo ""
echo "Дальше:"
echo "1. Настройте nginx (deploy/nginx-point.conf) и SSL: certbot --nginx -d pointdiscovery.online"
echo "2. Откройте https://pointdiscovery.online/api/health — должно быть {\"ok\":true}"
echo "3. Админка: https://pointdiscovery.online/admin/login (admin / пароль из .env)"
