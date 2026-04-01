const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Fixing Image Display...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Act as a Sarkari Expert. Write a professional 800-word Hindi News Article for " + randomCat + " 2026. [TITLE] Name, [SLUG] unique-slug, [DEPT] Department Name (e.g. SSC, UPSC, Railway), [CONTENT] Intro, Tables, Steps, FAQs. [APPLY_LINK] Official URL.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        let title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        title = title.replace(/[*#]/g, '').trim();
        const dept = (rawText.match(/\[DEPT\]\s*(.*)/i) || [])[1] || "Government";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        // --- CLEANUP ---
        contentBody = contentBody.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '');
        contentBody = contentBody.replace(/(Avedan Kaise Karein|FAQ|Aksar Puche Jane Wale Sawal)/gi, '<h3 class="text-2xl font-bold text-blue-900 mt-10 mb-4 bg-blue-50 p-3 border-l-4 border-blue-600"></h3>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        // 🖼️ DIRECT STABLE IMAGE SOURCE (Fixed for 2026)
        const imageUrl = "https://img.freepik.com/free-vector/office-workers-analyzing-data-business-report_74855-10493.jpg";

        const html = '<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + title + '</title><script src="https://cdn.tailwindcss.com"></script><style>table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #cbd5e1;padding:12px;text-align:center}th{background:#1e3a8a;color:#fff}.prose p{line-height:1.8;margin-bottom:15px}</style></head><body class="bg-slate-50"><header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400"><h1 class="text-2xl font-bold italic">SarkariResNova.com</h1><p class="text-[10px] uppercase font-bold">' + config.COMPANY + '</p></header><main class="max-w-4xl mx-auto bg-white p-8 mt-8 shadow-2xl border-t-8 border-red-600 rounded-b-xl"><span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs mb-4 inline-block">' + dept + ' - ' + randomCat + '</span><h2 class="text-3xl font-extrabold text-slate-900 mb-8">' + title + '</h2><div class="text-center"><img src="' + imageUrl + '" alt="' + dept + '" class="w-full h-auto rounded-xl shadow-lg mb-10 border-2 border-gray-100"></div><div class="prose max-w-none">' + contentBody + '</div><div class="mt-14 p-10 bg-slate-900 rounded-3xl text-center"><a href="' + applyLink + '" target="_blank" class="block w-full bg-red-600 text-white p-6 rounded-2xl font-black text-3xl shadow-xl hover:bg-red-700 transition-all mb-6">👉 CLICK HERE TO APPLY</a><a href="https://t.me/sarkariresnovaofficial" class="text-blue-400 font-bold underline">Join Telegram for Fast Updates</a></div></main><footer class="mt-12 p-8 bg-slate-900 text-white text-center text-xs">© 2026 ' + config.COMPANY + '</footer></body></html>';

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);
        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html" class="text-blue-700 font-medium">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }
        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, text: '<b>🚀 ' + title + '</b>\n🔗 ' + liveUrl, parse_mode: 'HTML'
        });
        console.log("✅ Image Display Fixed!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
