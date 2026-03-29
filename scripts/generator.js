const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function start() {
    console.log("🚀 Engine Starting for 2026...");
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write a short 3-line job alert for: SSC GD Constable Result 2026" }] }]
        });
        const article = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { chat_id: CHAT_ID, text: "<b>🔔 NEW JOB ALERT</b>\n\n" + article, parse_mode: 'HTML' });
        console.log("✅ SUCCESS: Telegram Message Sent!");
    } catch (e) {
        console.log("❌ Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
