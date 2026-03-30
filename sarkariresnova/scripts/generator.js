const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const chat_id = '@sarkariresnovaofficial';

    console.log("🚀 RAGHVITA ENTERPRISES: Connecting to Stable AI...");

    // STABLE 2026 URL (Fixed 404 issue)
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + geminiKey;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write 2 lines in Hindi: SSC CGL 2026 Notification Out. Visit sarkariresnova.in" }] }]
        });
        
        const aiText = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        
        await axios.post(teleUrl, { 
            chat_id: chat_id, 
            text: "<b>📢 JOB UPDATE</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: 404 Fixed & Message Sent!");
    } catch (e) {
        console.log("❌ Error Details: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
