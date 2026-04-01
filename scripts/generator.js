const axios = require('axios');
const fs = require('fs');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    if (!apiKey) { console.log("❌ API Key Missing!"); return; }

    try {
        console.log("🚀 RAGHVITA ENGINE: Finding Best Model for You...");
        
        // 1. Pehle available models ki list check karte hain
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await axios.get(listUrl);
        
        // Sabse best model dhoondhna (1.5 Flash -> 1.5 Pro -> 1.0 Pro)
        const models = listRes.data.models.map(m => m.name);
        let selectedModel = models.find(m => m.includes('gemini-1.5-flash')) 
                          || models.find(m => m.includes('gemini-1.5-pro'))
                          || models.find(m => m.includes('gemini-1.0-pro'))
                          || models[0];

        console.log("✅ Selected Model: " + selectedModel);

        // 2. Ab Article Generate karte hain
        const genUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;
        
        const genRes = await axios.post(genUrl, {
            contents: [{ parts: [{ text: "Write a 300-word SEO Hindi job update for 'Latest Govt Job 2026'. Format: TITLE | SLUG | META | CONTENT" }] }]
        });

        const text = genRes.data.candidates[0].content.parts[0].text;
        const [title, slug, meta, content] = text.split('|').map(s => s.trim());

        // 3. File Creation
        if (!fs.existsSync('public')) fs.mkdirSync('public');
        const html = `<!DOCTYPE html><html><head><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-100"><div class="max-w-4xl mx-auto bg-white p-8 mt-10 shadow-lg border-t-8 border-blue-900">
        <h1 class="text-3xl font-bold text-red-600">${title}</h1><div class="prose mt-6">${content}</div>
        <p class="mt-10 text-center">© 2026 RAGHVITA ENTERPRISES</p></div></body></html>`;

        fs.writeFileSync("public/" + slug + ".html", html);
        console.log("✅ Success! Article Created.");

        // 4. Telegram Alert
        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: '@sarkariresnovaofficial',
            text: "<b>🚀 RAGHVITA ENGINE SUCCESS</b>\n\n<b>Model:</b> " + selectedModel + "\n<b>Post:</b> " + title,
            parse_mode: 'HTML'
        });
        console.log("✅ Telegram Sent!");

    } catch (e) {
        console.log("❌ Error: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
}
start();
