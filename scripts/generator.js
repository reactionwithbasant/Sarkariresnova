const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Cleaning Markdown & Fixing Content...");
        
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a 800-word professional Hindi News Article for " + randomCat + " 2026. Structure: [TITLE] Name, [SLUG] unique-slug, [CONTENT] Introduction, HTML Tables for dates/fees, Step-by-Step How to Apply, and 5 FAQs. [APPLY_LINK] Official Portal URL.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        
        // --- HARD CLEANING LOGIC (Markdown to Clean HTML) ---
        rawText = rawText.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/`/g, '');
        
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";

        // Convert new lines to <br> for clean look
        contentBody = contentBody.replace(/\n/g, '<br>');
        contentBody = contentBody.replace(/(Avedan Kaise Karein|FAQ|FAQs|Aksar Puche Jane Wale Sawal)/gi, '<h3 style="color:#1e3a8a; font-size:22px; font-weight:bold; margin-top:20px; border-bottom:2px solid #ddd;"></h3>');

        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";
        
        // --- 🖼️ IMAGE FIX (Direct Static Link for AdSense) ---
        const imageUrl = "https://images.unsplash.com/photo-1586281380349-631531a34d4f?auto=format&fit=crop&q=80&w=800";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; } th, td { border: 1px solid #1e3a8a; padding: 12px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-50 font-sans">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase font-bold">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600 rounded-b-lg">
                <span class="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs uppercase mb-4 inline-block">${randomCat}</span>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <img src="${imageUrl}" alt="Update" class="w-full h-auto rounded-lg mb-8 shadow-md border">
                <div class="prose max-w-none text-gray-800 leading-relaxed">${contentBody}</div>
                <div class="mt-12 p-8 bg-blue-50 border-2 border-blue-100 rounded-xl text-center">
                    <h3 class="font-bold text-xl text-blue-900 mb-4">Official Links</h3>
                    <a href="${applyLink}" target="_blank" rel="noopener" class="block w-full bg-red-600 text-white p-5 rounded-lg font-bold text-2xl shadow-xl hover:bg-red-700 transition-all mb-4">👉 CLICK HERE TO APPLY ONLINE</a>
                    <a href="https://t.me/sarkariresnovaofficial" class="block w-full bg-blue-700 text-white p-3 rounded-lg font-bold">Join Telegram Group</a>
                </div>
            </main>
            <footer class="mt-10 p-8 bg-gray-900 text-white text-center text-xs">© 2026 ${config.COMPANY}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html" class="text-blue-700 font-medium">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, text: '<b>🚀 [' + randomCat + '] ' + title + '</b>\n🔗 ' + liveUrl, parse_mode: 'HTML'
        });

        console.log("✅ Fixed! Content is now clean and Image is visible.");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
