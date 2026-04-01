const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Running Auto-Pilot...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus", "Answer Key"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = `Act as an SEO Expert for SarkariResNova. Write a 500-word Hindi update for ${randomCat} 2026. 
        Structure: [TITLE] Title [SLUG] short-slug [META] Description [CONTENT] HTML with Table, How to Apply, FAQ.`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "New Update";
        let slug = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        const content = (rawText.match(/\[CONTENT\]\s*([\s\S]*)/i) || [])[1] || "Loading...";
        
        slug = slug.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;

        // 1. Professional HTML Layout
        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 10px; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-100 font-sans">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold text-sm">${randomCat}</span>
                <h2 class="text-3xl font-extrabold text-blue-900 my-4">${title}</h2>
                <div class="prose max-w-none text-gray-800 mb-8">${content}</div>
                <div class="space-y-4">
                    <a href="https://t.me/sarkariresnovaofficial" class="block bg-blue-600 text-white text-center p-3 rounded font-bold">Join Telegram for Fast Updates</a>
                    <a href="#" class="block bg-red-600 text-white text-center p-4 rounded-lg font-bold text-xl shadow-lg">DIRECT APPLY ONLINE HERE</a>
                </div>
            </main>
            <footer class="mt-10 p-6 bg-gray-800 text-white text-center text-xs">© 2026 ${config.COMPANY} | Owner: ${config.OWNER}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // 2. AUTO SITEMAP UPDATE (For Google Indexing)
        const sitemapPath = "public/sitemap.xml";
        const today = new Date().toISOString().split('T')[0];
        const newEntry = `<url><loc>${liveUrl}</loc><lastmod>${today}</lastmod><priority>0.80</priority></url>`;
        
        if (fs.existsSync(sitemapPath)) {
            let sitemap = fs.readFileSync(sitemapPath, 'utf8');
            if(!sitemap.includes(slug)) {
                fs.writeFileSync(sitemapPath, sitemap.replace("</urlset>", newEntry + "\n</urlset>"));
            }
        }

        // 3. Telegram Link (Custom Domain Ready)
        const teleMessage = `<b>🚀 [${randomCat}] NEW LIVE</b>\n\n<b>${title}</b>\n\n🔗 <b>Check Full Details:</b>\n${liveUrl}\n\n Sabse Tez Update @sarkariresnovaofficial`;

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL, text: teleMessage, parse_mode: 'HTML'
        });

        console.log("✅ Success! Article & Sitemap updated with Domain: " + config.SITE_URL);

    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
