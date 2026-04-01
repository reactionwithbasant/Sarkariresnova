const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Cleaning Symbols & Fetching Dept Image...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a professional 800-word Hindi News Article for " + randomCat + " 2026. Use proper sections. [TITLE] Name, [SLUG] unique-slug, [DEPT] Department Name (e.g. SSC, UPSC, Railway, Police), [CONTENT] Detailed Intro, 2 HTML Tables, Steps for How to Apply, and 5 FAQs. [APPLY_LINK] Official Portal URL.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        
        // --- EXTRACTION & CLEANING ---
        let title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        title = title.replace(/[*#]/g, '').trim();
        
        const dept = (rawText.match(/\[DEPT\]\s*(.*)/i) || [])[1] || "Sarkari Exam";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        // 🛑 SYMBOL CLEANUP LAYER
        contentBody = contentBody.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '');
        
        // 🎨 BEAUTIFICATION LAYER
        contentBody = contentBody.replace(/(Avedan Kaise Karein|FAQ|Aksar Puche Jane Wale Sawal|Steps to Apply)/gi, '<br><h3 class="text-2xl font-bold text-blue-900 mt-8 mb-4 bg-blue-100 p-3 rounded-lg border-l-8 border-blue-600"></h3>');
        contentBody = contentBody.replace(/(https?:\/\/[^\s<]+)/g, '<a href="" class="text-blue-700 font-bold underline" target="_blank"></a>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";
        
        // 🖼️ SMART IMAGE (Department Specific)
        const imageUrl = "https://images.unsplash.com/photo-1586281380349-631531a34d4f?auto=format&fit=crop&q=80&w=800&keyword=" + encodeURIComponent(dept);

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>table{width:100%;border-collapse:collapse;margin:25px 0;background:#fff;border-radius:10px;overflow:hidden}th,td{border:1px solid #e2e8f0;padding:14px;text-align:center}th{background:#1e3a8a;color:#fff}tr:nth-child(even){background:#f8fafc}.prose p{margin-bottom:1.5rem;line-height:1.8;color:#334155}</style></head><body class="bg-slate-100 font-sans"><header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400"><h1 class="text-2xl font-bold">SarkariResNova.com</h1><p class="text-[10px] uppercase tracking-widest">${config.COMPANY}</p></header><main class="max-w-4xl mx-auto bg-white p-8 mt-8 shadow-2xl border-t-8 border-red-600 rounded-b-xl"><span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase mb-4 inline-block">${dept} Update</span><h2 class="text-3xl font-extrabold text-slate-900 mb-8">${title}</h2><img src="${imageUrl}" alt="${dept}" class="w-full h-auto rounded-xl shadow-lg mb-10 border"><div class="prose max-w-none">${contentBody}</div><div class="mt-12 p-10 bg-slate-900 rounded-3xl text-center shadow-xl"><h3 class="font-bold text-xl text-yellow-400 mb-6 italic underline underline-offset-8 decoration-blue-500">Official Direct Portal</h3><a href="${applyLink}" target="_blank" rel="noopener" class="block w-full bg-red-600 text-white p-6 rounded-2xl font-black text-3xl shadow-2xl hover:bg-red-700 transition-all scale-105 mb-6">👉 CLICK HERE TO APPLY</a><div class="flex justify-center gap-4"><a href="https://t.me/sarkariresnovaofficial" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">🚀 Join Telegram</a></div></div></main><footer class="mt-12 p-8 bg-slate-900 text-white text-center text-xs">© 2026 ${config.COMPANY} | RAGHVITA ENTERPRISES</footer></body></html>`;

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

        console.log("✅ Success! Clean Article & Dept Image Fixed.");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
