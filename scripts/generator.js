const axios = require('axios');
const fs = require('fs');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;
    const SITE_URL = "https://sarkariresnova-a18dc.web.app";

    try {
        console.log("🚀 RAGHVITA ENGINE: Generating Auto-Post...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus", "Answer Key"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = `Act as an SEO Expert. Write a 500-word Hindi update for ${randomCat} 2026. 
        Strict Structure:
        [TITLE] Title Here
        [SLUG] short-english-slug
        [META] SEO Description
        [CONTENT] 
        - Intro
        - Important Dates & Fees (HTML Table)
        - Eligibility & Age Limit
        - How to Apply (Step-by-Step)
        - FAQ Section (3 Q&A)
        - DIRECT_APPLY_LINK: https://sarkariresnova-a18dc.web.app/apply`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "New Update";
        let slug = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const content = (rawText.match(/\[CONTENT\]\s*([\s\S]*)/i) || [])[1] || "Details loading...";
        
        slug = slug.substring(0, 45).toLowerCase();

        // Professional UI with Join Telegram & Apply Buttons
        const html = `<!DOCTYPE html><html lang="hi"><head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; } th, td { border: 1px solid #1e3a8a; padding: 10px; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-100">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-xs uppercase">Powered by RAGHVITA ENTERPRISES</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600">
                <div class="flex justify-between mb-4"><span class="bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold text-sm">${randomCat}</span></div>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <div class="prose max-w-none text-gray-800">${content}</div>
                <div class="mt-8 flex flex-col gap-4">
                    <a href="https://t.me/sarkariresnovaofficial" class="bg-blue-600 text-white text-center p-3 rounded-lg font-bold shadow-md">Join Our Telegram (Sabse Tez Update)</a>
                    <a href="#" class="bg-red-600 text-white text-center p-4 rounded-lg font-bold text-xl shadow-lg">DIRECT APPLY ONLINE HERE</a>
                </div>
            </main>
            <footer class="mt-10 p-6 bg-gray-800 text-white text-center text-xs">© 2026 RAGHVITA ENTERPRISES | Honesty, Values, Hard Work.</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // Telegram link logic
        const teleMessage = `<b>🚀 [${randomCat}] NEW UPDATE LIVE</b>\n\n<b>${title}</b>\n\n🔗 <b>Direct Link to Apply:</b>\n${SITE_URL}/${slug}.html\n\n⚡ <b>Sabse Tez Update ke liye Join Karein:</b>\n@sarkariresnovaofficial`;

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: '@sarkariresnovaofficial', text: teleMessage, parse_mode: 'HTML'
        });

        console.log("✅ Engine Success! " + randomCat);
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
