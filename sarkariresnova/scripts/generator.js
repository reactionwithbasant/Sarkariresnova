const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    // Test Message
    const text = "<b>🚀 RAGHVITA ENTERPRISES Live!</b>\nEngine is running successfully.";

    try {
        // Step 1: Gemini AI se content mangwayein
        const aiRes = await axios.post("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + geminiKey, {
            contents: [{ parts: [{ text: "Write 2 lines: SSC 2026 Update." }] }]
        });
        const aiText = aiRes.data.candidates[0].content.parts[0].text;

        // Step 2: Telegram par bhejein
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>🔔 ALERT:</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Post Sent to Telegram!");
    } catch (e) {
        console.log("❌ ERROR DETAILS: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
