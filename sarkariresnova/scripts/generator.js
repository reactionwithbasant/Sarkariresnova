const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const chat_id = '@sarkariresnovaofficial';

    console.log("🚀 FINAL ATTEMPT: Connecting to Google v1 Stable...");

    // 2026 OFFICIAL STABLE URL
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + geminiKey;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write 1 line in Hindi: SSC CGL 2026 Update. Visit sarkariresnova.in" }] }]
        });
        
        const aiText = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        
        await axios.post(teleUrl, { 
            chat_id: chat_id, 
            text: "<b>📢 UPDATE</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Sent!");
    } catch (e) {
        // Agar ab bhi 404 aata hai, toh hum details print karenge
        console.log("❌ ERROR STATUS: " + (e.response ? e.response.status : "No Response"));
        console.log("❌ MSG: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
