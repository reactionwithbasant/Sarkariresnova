const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    try {
        console.log("🚀 RAGHVITA ENTERPRISES: Engine Starting...");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("SSC CGL 2026 update 2 lines in Hindi. Visit sarkariresnova.in");
        const aiText = result.response.text();

        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>🔔 JOB ALERT</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Sent!");
    } catch (e) {
        console.log("❌ Error: " + e.message);
    }
}
start();
