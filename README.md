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

#SWAGGER
http://localhost:3001/api/docs/
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

#SWAGGER
http://localhost:3002/api/docs/
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

#SWAGGER
http://localhost:3003/api/docs/
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