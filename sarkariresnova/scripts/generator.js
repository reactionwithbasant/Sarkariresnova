const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const chat_id = '@sarkariresnovaofficial';

    console.log("🚀 RAGHVITA ENTERPRISES Engine: Connecting...");

    try {
        // AI Content Generation
        const aiRes = await axios.post("https://generativelanguage.googleapis.com/v1/models/gemini-1.6-flash:generateContent?key=" + geminiKey, {
            contents: [{ parts: [{ text: "Write 2 lines in Hindi: SSC CGL 2026 Notification. Visit sarkariresnova.in" }] }]
        });
        const aiText = aiRes.data.candidates[0].content.parts[0].text;

        // Telegram Send
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: chat_id, 
            text: "<b>📢 SARKARI JOB ALERT</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ VICTORY: Message Sent!");
    } catch (e) {
        console.log("❌ ERROR: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
