# ---------- ЭТАП 1: СБОРКА ----------
  FROM node:22.17.0-alpine AS build

  # Рабочая директория в контейнере
  WORKDIR /app
  
  # Копируем package.json и lock-файлы
  COPY package*.json ./
  
  # Устанавливаем зависимости
  RUN npm ci
  
  # Копируем остальной исходный код
  COPY . .
  
  # Сборка проекта (vite build)
  RUN npm run build
  
  
  # ---------- ЭТАП 2: ПРОДАКШЕН (NGINX) ----------
  FROM nginx:alpine
  
  # Удаляем дефолтный конфиг и добавляем свой
  RUN rm /etc/nginx/conf.d/default.conf
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  
  # Копируем собранные файлы из первого этапа
  COPY --from=build /app/dist /usr/share/nginx/html
  
  # Открываем порт
  EXPOSE 80
  
  # Запуск Nginx
  CMD ["nginx", "-g", "daemon off;"]
  