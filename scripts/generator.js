const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function generateWithAI(jobTitle) {
    // 2026 Latest Gemini API URL
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Write a short 5-line sarkari job alert for: " + jobTitle }] }]
        });
        return response.data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.log("❌ AI Error: Check if GEMINI_API_KEY is correct in GitHub Secrets");
        return null;
    }
}

async function start() {
    console.log("🚀 SarkariResNova Engine: GEMINI 2.0 DEPLOYED...");
    const job = "RPSC School Lecturer Result 2026 Out"; 
    const article = await generateWithAI(job);
    
    if(article) {
        const teleUrl = "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage";
        await axios.post(teleUrl, { chat_id: CHAT_ID, text: "<b>🔔 NEW JOB ALERT</b>\n\n" + article, parse_mode: 'HTML' });
        console.log("✅ SUCCESS: Telegram Post Sent!");
    }
}
start();
