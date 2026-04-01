const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Fixing Telegram & AdSense Layout...");
        
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a professional Hindi News article for " + randomCat + " 2026. Use SarkariResult style tables. [TITLE] Name, [SLUG] unique-slug, [CONTENT] Intro, 3 HTML Tables, Steps. [APPLY_LINK] Official Link. NO Markdown stars.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        
        // 🛑 Hard Clean for AdSense (No symbols allowed)
        let cleanText = rawText.replace(/[\*#\-]/g, '').trim();

        const title = (cleanText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update 2026";
        const slugMatch = (cleanText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        let contentBody = (cleanText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        contentBody = contentBody.replace(/\n/g, '<br>');
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        
        // 🔗 SITE LINK
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>
            table { width: 100%; border-collapse: collapse; margin: 25px 0; border: 2px solid #ff00ff; }
            th, td { border: 1px solid #ff00ff; padding: 12px; text-align: center; }
            .header-bg { background: #ff00ff; color: #fff; font-weight: bold; font-size: 1.2rem; }
            .p-text { color: #ff00ff; font-weight: bold; }
            .b-link { color: #0000ff; font-weight: bold; text-decoration: underline; }
        </style></head><body class="bg-gray-50"><header class="bg-[#1e3a8a] text-white p-6 text-center"><h1 class="text-3xl font-bold">SarkariResNova.com</h1></header>
            <main class="max-w-4xl mx-auto p-6 bg-white border mt-4 shadow-2xl">
                <h2 class="text-2xl font-bold text-red-600 text-center mb-8">${title}</h2>
                <div class="prose max-w-none text-gray-800 mb-12">${contentBody}</div>
                <table>
                    <tr class="header-bg"><td colspan="2">Useful Important Links</td></tr>
                    <tr><td class="p-text">Registration / Apply</td><td><a href="${applyLink}" class="b-link">Click Here</a></td></tr>
                    <tr><td class="p-text">Official Website</td><td><a href="${applyLink}" class="b-link">Click Here</a></td></tr>
                    <tr><td class="p-text">Join Telegram Channel</td><td><a href="https://t.me/sarkariresnovaofficial" class="b-link">Join Now</a></td></tr>
                </table>
            </main></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // --- PRESERVED FUTURE LOGIC ---
        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        // 🚀 TELEGRAM: Link explicitly set for users
        const teleMessage = "🚀 *NEW UPDATE* 🚀\n\n" + title + "\n\n🔗 *Full Details & Link:*\n" + liveUrl;
        
        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, 
            text: teleMessage,
            parse_mode: 'Markdown'
        }).catch(err => {
            // Backup send without Markdown if it fails
            return axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
                chat_id: config.TELEGRAM_CHANNEL, 
                text: "🚀 " + title + "\n\nCheck Here: " + liveUrl
            });
        });

        console.log("✅ AdSense Ready, Table Fixed & Telegram Link Sent!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
