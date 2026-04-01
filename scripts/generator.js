const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Generating Direct Apply Post...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Instruction for DIRECT APPLY LINK instead of just website
        const prompt = `Act as an SEO Expert for SarkariResNova. Write a 500-word Hindi post for ONE SPECIFIC ${randomCat} of 2026.
        Structure: 
        [TITLE] Specific Post Name
        [SLUG] short-slug
        [META] SEO Description
        [CONTENT] Intro, Dates/Fees Table, Eligibility, How to Apply, FAQ.
        [APPLY_LINK] Write the DIRECT URL to the registration or login page for this specific ${randomCat}. If unsure, use the most common registration path for that department.`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        let slug = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const content = (rawText.match(/\[CONTENT\]\s*([\s\S]*)/i) || [])[1] || "Details loading...";
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(.*)/i) || [])[1] || "https://www.google.com";

        slug = slug.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;

        // UI with High-Visibility DIRECT APPLY Button
        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 10px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-100 font-sans">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600">
                <div class="mb-4"><span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase">${randomCat}</span></div>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <div class="prose max-w-none text-gray-800">${content}</div>
                <div class="mt-10 space-y-6">
                    <div class="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-center">
                        <h3 class="font-bold text-lg text-blue-900 mb-3">महत्वपूर्ण लिंक (Important Links)</h3>
                        <a href="${applyLink}" target="_blank" class="block w-full bg-red-600 hover:bg-red-700 text-white text-center p-4 rounded-lg font-bold text-2xl shadow-xl transition-all">👉 CLICK HERE TO APPLY ONLINE</a>
                    </div>
                    <a href="https://t.me/sarkariresnovaofficial" class="block bg-blue-700 text-white text-center p-3 rounded-lg font-bold shadow-md">Join Telegram For Fast Updates</a>
                </div>
            </main>
            <footer class="mt-10 p-6 bg-gray-800 text-white text-center text-xs">© 2026 ${config.COMPANY} | Owner: ${config.OWNER}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // Update Homepage (index.html) - PURANA FEATURE PRESERVED
        const indexPath = "public/index.html";
        const newEntry = `<li><a href="${slug}.html" class="text-blue-700 font-medium">[${randomCat}] ${title}</a></li>`;
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        // Telegram Notification - PURANA FEATURE PRESERVED
        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL,
            text: `<b>🚀 [${randomCat}] ${title}</b>\n\n🔗 <b>Direct Apply Link:</b>\n${liveUrl}\n\nSabse Tez Update @sarkariresnovaofficial`,
            parse_mode: 'HTML'
        });

        console.log("✅ Direct Apply Post Created: " + title);
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
