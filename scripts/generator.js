const axios = require('axios');
const fs = require('fs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function start() {
    console.log("🚀 RAGHVITA ENTERPRISES: Professional Engine Starting...");
    
    const geminiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    
    // AdSense ke liye asli aur fresh topic
    const jobTitle = "SSC GD Constable Result 2026 Live Updates";

    try {
        console.log("✨ Generating AdSense-Quality Content for: " + jobTitle);
        
        const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: "Write a 200-word informative Hindi article for a job portal about " + jobTitle + ". Include Cut-off analysis and How to Check. Format with HTML <b> and <p> tags." }] }]
        });

        const articleContent = response.data.candidates[0].content.parts[0].text;

        // 1. Save for Website (AdSense Approval ke liye)
        const htmlBody = "<html><head><title>SarkariResNova</title></head><body style='font-family:sans-serif;line-height:1.6;padding:20px;'><h1>" + jobTitle + "</h1><div>" + articleContent + "</div><hr><p>Published by RAGHVITA ENTERPRISES</p></body></html>";
        fs.writeFileSync('index.html', htmlBody);
        console.log("✅ index.html created successfully!");

        // 2. Send to Telegram (Bot Alert)
        const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
        const teleText = "<b>🔔 NEW JOB ALERT: " + jobTitle + "</b>\n\nFull details and Cut-off analysis updated on our website.\n\n🔗 <b>sarkariresnova.in</b>";
        
        await axios.post(teleUrl, { 
            chat_id: CHAT_ID, 
            text: teleText, 
            parse_mode: 'HTML' 
        });
        
        console.log("✅ Telegram Alert Sent!");

    } catch (e) {
        console.error("❌ ERROR: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
