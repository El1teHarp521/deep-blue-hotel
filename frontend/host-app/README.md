### Booking Service (Бронь номеров)
```
# Переход в папку сервиса
cd services/booking-service

# Установка зависимостей
npm install

# Генерация клиента базы данных
npx prisma generate

# Запуск в режиме разработки
npm run dev
```

### HR Service (Сервис персонала и расписания)
```
# Переход в папку сервиса
cd services/hr-service

# Установка зависимостей
npm install

# Генерация клиента базы данных
npx prisma generate

# Запуск в режиме разработки
npm run dev

```
### Auth Service (Сервис авторизации)
```
# Переход в папку сервиса
cd services/auth-service

# Установка зависимостей
npm install

# Синхронизация структуры таблиц с локальной БД
npx prisma db push

# Генерация клиента базы данных
npx prisma generate

# Запуск в режиме разработки
npm run dev
```

### React (Фронтэнд)
```
# Переход в папку фронтенда
cd frontend/host-app

# Установка зависимостей
npm install

# Запуск с поддержкой внешних сетевых интерфейсов (без варнингов CORS)
npm run dev -- --host
```