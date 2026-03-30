const axios = require('axios');
async function start() {
    const token = process.env.TELEGRAM_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + geminiKey;

    try {
        // 1. AI Se Post Likhwana
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: "Create a recruitment alert in 2 lines for SSC/Banking. Mention 'Apply at sarkariresnova.in'" }] }]
        });
        const postContent = res.data.candidates[0].content.parts[0].text;

        // 2. Telegram par Link bhejna
        const teleUrl = "https://api.telegram.org/bot" + token + "/sendMessage";
        await axios.post(teleUrl, { 
            chat_id: '@sarkariresnovaofficial', 
            text: "<b>🔥 New Update On Portal</b>\n\n" + postContent + "\n\n🔗 Website: https://sarkariresnova.in", 
            parse_mode: 'HTML' 
        });
        console.log("✅ Website Updated & Telegram Sent!");
    } catch (e) { console.log("Error: " + e.message); }
}
start();
