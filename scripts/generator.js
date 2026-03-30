const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

async function start() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // STRICTLY USING THE MODEL FROM YOUR DOCUMENTATION
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    try {
        console.log("🚀 RAGHVITA ENTERPRISES: Engine Online with Gemini 3...");
        
        const result = await model.generateContent("SSC CGL 2026 update 2 lines in Hindi. Visit sarkariresnova.in");
        const aiText = result.response.text();

        const teleUrl = "https://api.telegram.org/bot" + process.env.TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>📢 SARKARI ALERT</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Telegram Sent using Gemini 3!");
    } catch (e) {
        console.log("❌ Error: " + e.message);
    }
}
start();
