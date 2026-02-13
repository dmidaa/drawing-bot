// api/drawing.js - Обработчик рисунков на Vercel
export default async function handler(req, res) {
    // Разрешаем запросы с GitHub Pages
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка OPTIONS запроса (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не разрешен' });
    }

    try {
        // Получаем данные из FormData
        const formData = await req.formData();
        const file = formData.get('drawing');
        const username = formData.get('username') || 'Аноним';
        const message = formData.get('message') || '';

        if (!file) {
            return res.status(400).json({ error: 'Нет рисунка' });
        }

        // 🔥 ВСТАВЬ СВОИ ДАННЫЕ!
        const BOT_TOKEN = '8459723955:AAGboGE1z2RZhXl9EjR5HVLIHY_UYyZfAnU';
        const CHAT_ID = '5595487101';  // твой Telegram ID

        // Конвертируем файл в Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Отправляем в Telegram
        const formDataToTelegram = new FormData();
        formDataToTelegram.append('chat_id', CHAT_ID);
        formDataToTelegram.append('photo', new Blob([buffer], { type: 'image/png' }), 'drawing.png');
        formDataToTelegram.append('caption', 
            `🎨 НОВЫЙ РИСУНОК!\n\n` +
            `👤 От: ${username}\n` +
            `💬 Сообщение: ${message || '—'}\n` +
            `📅 Время: ${new Date().toLocaleString('ru-RU')}`
        );

        const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formDataToTelegram
        });

        const result = await telegramResponse.json();

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
