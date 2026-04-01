const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Running Final Optimized Version...");
        
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a professional Hindi Job post for " + randomCat + " 2026 like SarkariResult. [TITLE] Name, [SLUG] slug, [CONTENT] Intro, 3 HTML Tables, Steps. [APPLY_LINK] Official Link. NO Markdown stars.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        let cleanText = rawText.replace(/[\*#\-]/g, '').trim();

        const title = (cleanText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update 2026";
        const slugMatch = (cleanText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (cleanText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        contentBody = contentBody.replace(/\n/g, '<br>');
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #ff00ff; }
            th, td { border: 1px solid #ff00ff; padding: 12px; text-align: center; }
            .header-cell { background: #ff00ff; color: #fff; font-weight: bold; }
        </style></head><body class="bg-white"><header class="bg-[#1e3a8a] text-white p-5 text-center shadow-lg"><h1 class="text-2xl font-bold">SarkariResNova.com</h1></header>
            <main class="max-w-4xl mx-auto p-4 border mt-4">
                <h2 class="text-xl font-bold text-red-600 text-center mb-6">${title}</h2>
                <div class="prose max-w-none text-sm mb-10">${contentBody}</div>
                <table>
                    <tr class="header-cell"><td colspan="2">Useful Important Links</td></tr>
                    <tr><td class="font-bold text-pink-600 text-pink-600" style="color:#ff00ff;">Apply Online</td><td><a href="${applyLink}" style="color:blue;font-weight:bold;text-decoration:underline;">Click Here</a></td></tr>
                    <tr><td class="font-bold text-pink-600 text-pink-600" style="color:#ff00ff;">Join Telegram</td><td><a href="https://t.me/sarkariresnovaofficial" style="color:blue;font-weight:bold;text-decoration:underline;">Click Here</a></td></tr>
                </table>
            </main></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // --- PRESERVED SEO LOGIC ---
        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        // 🚀 TELEGRAM: Link explicitly sent
        const teleMessage = "🚀 " + title + "\n\n🔗 Full Post Link:\n" + liveUrl;
        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, 
            text: teleMessage
        });

        console.log("✅ Everything Fixed! Telegram Link Sent Successfully.");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
