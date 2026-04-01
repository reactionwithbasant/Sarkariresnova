const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Beautifying Article & Fixing Image...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a highly professional 800-word Hindi News Article for " + randomCat + " 2026. USE PROPER HTML TAGS. Format: [TITLE] Name, [SLUG] unique-slug, [CONTENT] Intro, 2 separate HTML Tables, Detailed 'How to Apply' steps, and a clear FAQ section with 5 questions. [APPLY_LINK] Official registration portal.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        let title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        title = title.replace(/[*#]/g, '').trim();
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        // --- CONTENT BEAUTIFICATION ---
        contentBody = contentBody.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '');
        // Adding extra line breaks for better look
        contentBody = contentBody.replace(/(Avedan Kaise Karein|FAQ|Aksar Puche Jane Wale Sawal)/gi, '<br><h3 class="text-xl font-bold text-blue-800 mt-6 mb-2 border-b-2 border-blue-200 inline-block"></h3>');
        // Clickable Links
        contentBody = contentBody.replace(/(https?:\/\/[^\s<]+)/g, '<a href="" class="text-blue-700 font-bold underline" target="_blank"></a>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";
        
        // Fixed Official Featured Image
        const imageUrl = "https://images.unsplash.com/photo-1586281380349-631531a34d4f?auto=format&fit=crop&w=800&q=80";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>table{width:100%;border-collapse:collapse;margin:25px 0;background:#fff;box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);}th,td{border:1px solid #1e3a8a;padding:14px;text-align:center}th{background:#1e3a8a;color:#fff;font-weight:bold}tr:nth-child(even){background:#f8fafc}.prose p{margin-bottom: 1.5rem; line-height: 1.8;}</style></head><body class="bg-gray-100"><header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400"><h1 class="text-2xl font-bold italic">SarkariResNova.com</h1><p class="text-[10px] uppercase font-bold tracking-widest">${config.COMPANY}</p></header><main class="max-w-4xl mx-auto bg-white p-8 mt-8 shadow-2xl border-t-8 border-red-600 rounded-lg"><div class="flex justify-between items-center mb-6"><span class="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-xs uppercase shadow-sm">${randomCat}</span><span class="text-gray-500 text-sm italic">Updated: 2026</span></div><h2 class="text-3xl font-extrabold text-blue-900 mb-8 leading-tight">${title}</h2><div class="mb-10 text-center"><img src="${imageUrl}" alt="Official Notification" class="w-full h-auto rounded-xl shadow-lg border-2 border-gray-200"></div><div class="prose max-w-none text-gray-800">${contentBody}</div><div class="mt-14 p-10 bg-blue-50 border-4 border-dashed border-blue-200 rounded-3xl text-center"><h3 class="font-bold text-2xl text-blue-900 mb-6 italic">📌 Important Official Links</h3><a href="${applyLink}" target="_blank" rel="noopener" class="block w-full bg-red-600 text-white p-5 rounded-2xl font-bold text-3xl shadow-2xl hover:bg-red-700 transition-all transform hover:scale-105 mb-6 leading-tight">👉 CLICK HERE TO APPLY / REGISTER</a><a href="https://t.me/sarkariresnovaofficial" class="block w-full bg-blue-800 text-white p-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-900">🚀 Join Telegram For Fast Updates</a></div></main><footer class="mt-12 p-10 bg-gray-900 text-white text-center text-xs border-t-4 border-yellow-500">© 2026 ${config.COMPANY} | RAGHVITA ENTERPRISES<br><p class="mt-2 text-gray-400 font-medium italic">Honesty, Values, and Hard Work</p></footer></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html" class="text-blue-700 font-medium">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL,
            text: '<b>🚀 New Job Update: ' + title + '</b>\n\n✅ <b>Full Details Here:</b> ' + liveUrl,
            parse_mode: 'HTML'
        });

        console.log("✅ AdSense Saja Hua Content Fixed!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
