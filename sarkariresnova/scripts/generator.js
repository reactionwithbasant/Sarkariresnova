const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey;
    try {
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: "Write 2 lines in Hindi: SSC CGL 2026 Recruitment Out. Visit sarkariresnova.in" }] }]
        });
        const aiText = res.data.candidates[0].content.parts[0].text;
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>📢 JOB ALERT</b>\n\n" + aiText, 
            parse_mode: 'HTML' 
        });
        console.log("✅ SUCCESS: Workflow Restored & Message Sent!");
    } catch (e) {
        console.log("❌ Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
