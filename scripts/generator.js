const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

async function start() {
    // GitHub Secrets se Nayi Key lega
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2026 Latest Stable Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("🚀 Engine Starting with New API Key...");
        const result = await model.generateContent("Write 2 lines in Hindi: SSC CGL 2026 Notification. Visit sarkariresnova.in");
        const aiText = result.response.text();

        // Telegram Send
        const teleUrl = "https://api.telegram.org/bot" + process.env.TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>🔔 SARKARI ALERT (New Key)</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Message Sent!");
    } catch (e) {
        console.log("❌ Error Detail: " + e.message);
    }
}
start();
