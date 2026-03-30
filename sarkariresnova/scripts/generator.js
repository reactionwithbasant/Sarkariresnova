const axios = require('axios');
async function start() {
    console.log("🚀 RAGHVITA ENTERPRISES Engine Starting...");
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write 2 lines in Hindi: SSC CGL 2026 Notification Out. Check now at sarkariresnova.in" }] }]
        });
        const article = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + process.env.TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>📢 NEW ALERT</b>\n\n" + article, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Sent!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
