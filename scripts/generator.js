const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Adding Images for AdSense Approval...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = `Act as a Sarkari Exam Expert. Write a 500-word Hindi post for ONE SPECIFIC ${randomCat} 2026.
        [TITLE] Exact Name of Post
        [SLUG] unique-slug
        [META] SEO Description
        [CONTENT] Detailed Info with Tables, Dates, Eligibility, How to Apply, FAQ.
        [DIRECT_APPLY_LINK] Provide the ACTUAL direct registration URL.`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "New Update";
        let slug = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const content = (rawText.match(/\[CONTENT\]\s*([\s\S]*)/i) || [])[1] || "Loading...";
        let applyLink = (rawText.match(/\[DIRECT_APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com";

        slug = slug.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;
        
        // --- DYNAMIC IMAGE LOGIC ---
        const imageUrl = "https://images.unsplash.com/photo-1606326666490-457574d5888e?auto=format&fit=crop&q=80&w=800"; // Professional Exam Theme Image

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 10px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-100 font-sans">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600">
                <div class="mb-4 flex justify-between items-center">
                    <span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase">${randomCat}</span>
                    <span class="text-xs text-gray-500">Update: 2026</span>
                </div>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                
                <div class="w-full mb-8">
                    <img src="${imageUrl}" alt="${title}" class="w-full h-64 object-cover rounded-lg shadow-md border-2 border-gray-200">
                </div>

                <div class="prose max-w-none text-gray-800 mb-8">${content}</div>
                
                <div class="mt-10 p-6 bg-blue-50 border-2 border-blue-100 rounded-xl text-center">
                    <h3 class="font-bold text-xl text-blue-900 mb-4 italic">Direct Registration / Apply Online</h3>
                    <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="block w-full bg-red-600 hover:bg-red-700 text-white text-center p-5 rounded-lg font-bold text-2xl shadow-2xl transition-all scale-105">👉 CLICK HERE TO APPLY ONLINE</a>
                </div>
                
                <div class="mt-6">
                    <a href="https://t.me/sarkariresnovaofficial" class="block bg-blue-700 text-white text-center p-3 rounded font-bold">Join Our Telegram (Sabse Tez Update)</a>
                </div>
            </main>
            <footer class="mt-10 p-6 bg-gray-800 text-white text-center text-xs">© 2026 ${config.COMPANY} | Owner: ${config.OWNER}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // Pre-existing features (Homepage & Telegram) - 100% SAFE
        const indexPath = "public/index.html";
        const newEntry = `<li><a href="${slug}.html" class="text-blue-700 font-medium">[${randomCat}] ${title}</a></li>`;
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL,
            text: `<b>🚀 [${randomCat}] ${title}</b>\n\n🔗 <b>Check Full Details:</b>\n${liveUrl}`,
            parse_mode: 'HTML'
        });

        console.log("✅ AdSense Ready Article with Image Created!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
