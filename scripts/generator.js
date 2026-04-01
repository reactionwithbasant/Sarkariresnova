const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Full Content Cleanup & Image Fix...");
        
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Strict Prompt to avoid Markdown & ensure dynamic content
        const prompt = "Act as a Sarkari Expert Blogger. Write a detailed professional 800-word Hindi update for " + randomCat + " 2026. STRUCTURE STRICTLY: [TITLE] Name, [SLUG] unique-slug, [DEPT] Department Name (e.g. SSC, UPSC, Police, Railway), [CONTENT] Detailed Introduction, 2 HTML Tables, Steps to Apply, and 5 FAQs. [APPLY_LINK] Official Portal URL. NO MARKDOWN SYMBOLS (**, ###, ---). Clean text only.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        
        // --- 1. POWERFUL CLEANUP (Symbols & Markdown) ---
        rawText = rawText.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '').replace(/`/g, '');
        rawText = rawText.replace(/\s+/g, ' ').trim(); // Clear excessive spaces

        const titleMatch = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1];
        const title = titleMatch ? titleMatch.trim() : "Sarkari Update 2026";
        
        const dept = (rawText.match(/\[DEPT\]\s*(.*)/i) || [])[1] || "Government";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        contentBody = contentBody.replace(/\n/g, '<br>'); // Newlines to Breaks
        
        // --- 2. SMART IMAGE LOGIC (Department Specific) ---
        // Using dynamic Unsplash query for related images
        const imageUrl = "https://source.unsplash.com/800x450/?" + encodeURIComponent(dept + ",india,office");

        // Beautify sections with Tailwind
        contentBody = contentBody.replace(/(Avedan Kaise Karein|FAQ|FAQs|Aksar Puche Jane Wale Sawal)/gi, '<br><h3 class="text-2xl font-bold text-blue-900 mt-10 mb-4 bg-gray-100 p-3 rounded border-l-8 border-blue-600"></h3>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>table{width:100%;border-collapse:collapse;margin:25px 0}th,td{border:1px solid #1e3a8a;padding:12px;text-align:center}th{background:#1e3a8a;color:#fff}.prose p{line-height:1.8;margin-bottom:15px;color:#333}</style></head><body class="bg-slate-50 font-sans"><header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400"><h1 class="text-2xl font-bold italic">SarkariResNova.com</h1><p class="text-[10px] uppercase font-bold tracking-widest">${config.COMPANY}</p></header><main class="max-w-4xl mx-auto bg-white p-8 mt-6 shadow-2xl border-t-8 border-red-600 rounded-b-xl"><span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase mb-4 inline-block">${dept} Update</span><h2 class="text-3xl font-extrabold text-slate-900 mb-8 leading-tight">${title}</h2><img src="${imageUrl}" alt="${dept} Official News" class="w-full h-auto rounded-xl shadow-lg mb-10 border-2 border-gray-100"><div class="prose max-w-none text-slate-800">${contentBody}</div><div class="mt-14 p-10 bg-slate-900 rounded-3xl text-center shadow-inner"><h3 class="font-bold text-xl text-yellow-400 mb-6 italic underline underline-offset-8">Official Links</h3><a href="${applyLink}" target="_blank" rel="noopener" class="block w-full bg-red-600 text-white p-6 rounded-2xl font-black text-3xl shadow-xl hover:bg-red-700 transition-all mb-4">👉 CLICK HERE TO APPLY</a></div></main><footer class="mt-10 p-8 bg-slate-900 text-white text-center text-xs">© 2026 ${config.COMPANY}</footer></body></html>`;

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

        console.log("✅ AdSense Ready! Clean Text, Image, and SEO safe.");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
