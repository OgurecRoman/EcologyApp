import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Загружаем .env из корневой директории
dotenv.config();

console.log('=== ПРОВЕРКА ПЕРЕМЕННЫХ СРЕДЫ ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Загружена' : '✗ Отсутствует');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не найдена!');
    process.exit(1);
}

try {
    console.log('🚀 Генерация Prisma клиента...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('✅ Prisma клиент сгенерирован!');

    console.log('🚀 Применение схемы к базе данных...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('✅ База данных готова к работе!');

} catch (error) {
    console.error('❌ Ошибка:', error);
}