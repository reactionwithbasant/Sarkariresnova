const axios = require('axios');
const fs = require('fs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function start() {
    console.log("🚀 RAGHVITA ENTERPRISES: Engine Starting...");
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    
    try {
        // AI Content Generation
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write 3 lines in Hindi about: SSC GD Constable Result 2026. Visit sarkariresnova.in for details." }] }]
        });
        const article = response.data.candidates[0].content.parts[0].text;

        // Save index.html for Website
        const html = "<html><body><h1>SarkariResNova Updates</h1><p>" + article + "</p></body></html>";
        fs.writeFileSync('index.html', html);
        console.log("✅ index.html Saved");

        // Send to Telegram
        const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: CHAT_ID, 
            text: "<b>🔔 NEW JOB ALERT</b>\n\n" + article, 
            parse_mode: 'HTML' 
        });
        console.log("✅ Telegram Sent!");

    } catch (e) {
        console.log("❌ Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
