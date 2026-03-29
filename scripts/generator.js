const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '-1002245678901'; // Aapke channel ki numeric ID agar pata ho, nahi toh username hi rehne dein

async function start() {
    console.log("🚀 Testing Telegram Connection...");
    const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    try {
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>🔥 SUCCESS!</b>\nSarkariResNova Engine Live and Connected.\n\nPowered by <b>RAGHVITA ENTERPRISES</b>", 
            parse_mode: 'HTML' 
        });
        console.log("✅ Message Sent Successfully!");
    } catch (e) {
        console.log("❌ ERROR DETAILS: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
