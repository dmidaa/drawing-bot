// api/drawing.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ VERCEL
export default async function handler(req, res) {
    // Разрешаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Только POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не разрешен' });
    }

    // 🔥 ТВОИ ДАННЫЕ
    const BOT_TOKEN = '8459723955:AAGboGE1z2RZhXl9EjR5HVLIHY_UYyZfAnU';
    const CHAT_ID = '5595487101';

    try {
        // ⚡ ВАЖНО: получаем multipart/form-data через промис
        const formData = await new Promise((resolve, reject) => {
            const busboy = require('busboy')({ 
                headers: req.headers,
                limits: { fileSize: 10 * 1024 * 1024 } // 10MB максимум
            });
            
            const fields = {};
            let fileBuffer = null;
            let filename = '';

            busboy.on('file', (fieldname, file, info) => {
                const chunks = [];
                file.on('data', chunk => chunks.push(chunk));
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    filename = info.filename;
                });
            });

            busboy.on('field', (fieldname, val) => {
                fields[fieldname] = val;
            });

            busboy.on('finish', () => {
                resolve({
                    file: fileBuffer,
                    filename,
                    username: fields.username || 'Аноним',
                    message: fields.message || ''
                });
            });

            busboy.on('error', reject);
            
            // Включаем режим rawBody для Vercel
            req.pipe(busboy);
        });

        if (!formData.file) {
            return res.status(400).json({ error: 'Нет рисунка' });
        }

        // Отправляем в Telegram
        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', CHAT_ID);
        
        // Добавляем фото
        const blob = new Blob([formData.file], { type: 'image/png' });
        telegramFormData.append('photo', blob, 'drawing.png');
        
        telegramFormData.append('caption', 
            `🎨 НОВЫЙ РИСУНОК!\n\n` +
            `👤 От: ${formData.username}\n` +
            `💬 Сообщение: ${formData.message}\n` +
            `📅 Время: ${new Date().toLocaleString('ru-RU')}`
        );

        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: telegramFormData
        });

        const result = await tgResponse.json();

        if (result.ok) {
            return res.status(200).json({ success: true });
        } else {
            console.error('Telegram API error:', result);
            return res.status(500).json({ 
                error: 'Ошибка отправки в Telegram', 
                details: result.description 
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера', 
            details: error.message 
        });
    }
}
