const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

async function start() {
    console.log("🚀 Powering up RAGHVITA ENTERPRISES Engine...");
    
    // Telegram API URL
    const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    
    // Test Message
    const text = "<b>🔥 SarkariResNova Live!</b>\n\nEngine is now connected to Telegram.\n\nVerified by: <b>RAGHVITA ENTERPRISES</b>";

    try {
        // Hum do tariko se try karenge taaki koi chuk na ho
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: text, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Message Sent!");
    } catch (e) {
        console.log("❌ ERROR: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
