const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    console.log("🚀 RAGHVITA ENTERPRISES: Connecting to 2026 Stable AI...");

    // 2026 Latest Stable API Endpoint
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey;

    try {
        const response = await axios.post(url, {
            contents: [{ 
                parts: [{ text: "Write 2 lines in Hindi: SSC CGL 2026 Notification Out. Visit sarkariresnova.in" }] 
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const aiText = response.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>📢 JOB ALERT</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: 404 FIXED!");
    } catch (e) {
        // Detailed Logging to find the exact issue
        if (e.response && e.response.status === 404) {
            console.log("❌ 404 ERROR: Model not found or API Key issue.");
        } else {
            console.log("❌ Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
        }
    }
}
start();
