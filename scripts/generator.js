const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function start() {
    console.log("🚀 Starting Real Job Alert...");
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write a 3-line Hindi job alert for: SSC CGL 2026 Notification. Add emojis." }] }]
        });
        const article = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { chat_id: CHAT_ID, text: "<b>🔔 NEW JOB ALERT</b>\n\n" + article, parse_mode: 'HTML' });
        console.log("✅ SUCCESS: Telegram Sent!");
    } catch (e) {
        console.log("❌ Error: " + e.message);
    }
}
start();
