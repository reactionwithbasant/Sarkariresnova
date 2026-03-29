const axios = require('axios');
const fs = require('fs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function start() {
    console.log("🚀 RAGHVITA ENTERPRISES: AdSense-Ready Engine Starting...");
    
    // Stable Gemini URL
    const geminiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    
    // Real Job Topic for AdSense Quality
    const jobTitle = "SSC CGL 2026 Recruitment Notification";
    
    try {
        // 1. AI Content Generation (AdSense Friendly)
        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: "Write a professional 200-word job alert in Hindi for " + jobTitle + ". Include Eligibility, Dates, and Preparation Tips. Use HTML tags like <b> and <i>." }] }]
        });
        
        const fullArticle = response.data.candidates[0].content.parts[0].text;
        
        // 2. index.html Update (Website ke liye)
        const htmlTemplate = "<html><body style='font-family:sans-serif;padding:20px;'><h1>" + jobTitle + "</h1><div>" + fullArticle + "</div><p>Verified by RAGHVITA ENTERPRISES</p></body></html>";
        fs.writeFileSync('index.html', htmlTemplate);
        console.log("✅ index.html updated for AdSense.");

        // 3. Telegram Message (Short and Sweet for API)
        const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
        const teleText = "<b>📢 NEW JOB UPDATE: " + jobTitle + "</b>\n\nFull details have been updated on our website.\n\n🔗 <b>Visit: sarkariresnova.in</b>\n\n<i>Powered by RAGHVITA ENTERPRISES</i>";
        
        await axios.post(teleUrl, { 
            chat_id: CHAT_ID, 
            text: teleText, 
            parse_mode: 'HTML' 
        });
        
        console.log("✅ SUCCESS: Telegram Sent!");

    } catch (e) {
        console.log("❌ ERROR DETAILS: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
