const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Generating Sarkari-Result Format...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Prompt modified for Patna High Court type Professional Tables
        const prompt = "Write a professional Hindi Job post for " + randomCat + " 2026 like SarkariResult.com. Pick a specific topic (e.g., Patna High Court, SSC, Railway). [TITLE] Post Name, [SLUG] slug, [CONTENT] Intro, 3 Styled HTML Tables (1. Dates & Fees, 2. Age Limit, 3. Vacancy & Eligibility), How to Fill Form steps, and Important Links section. [APPLY_URL] Real Portal Link. NO Markdown symbols.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/[\*#\-]/g, '').trim();

        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update 2026";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";

        contentBody = contentBody.replace(/\n/g, '<br>');
        
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; border: 2px solid #ff00ff; }
            th, td { border: 1px solid #ff00ff; padding: 10px; text-align: left; }
            .header-table { background: #ff00ff; color: #fff; text-align: center; font-weight: bold; font-size: 18px; }
            .green-text { color: #008000; font-weight: bold; }
            .pink-text { color: #ff00ff; font-weight: bold; }
            .link-btn { color: #0000ff; font-weight: bold; text-decoration: underline; }
        </style></head><body class="bg-white text-gray-900"><header class="bg-[#1e3a8a] text-white p-4 text-center border-b-4 border-yellow-400">
            <h1 class="text-2xl font-bold">SarkariResNova.com</h1><p class="text-xs uppercase">${config.COMPANY}</p></header>
            <main class="max-w-4xl mx-auto p-4 border-2 border-gray-200 mt-2">
                <h2 class="text-xl font-bold text-blue-800 text-center mb-4">${title}</h2>
                <div class="prose max-w-none">${contentBody}</div>
                <table class="mt-8">
                    <tr class="header-table"><td colspan="2">Some Useful Important Links</td></tr>
                    <tr><td class="pink-text">Apply Online</td><td><a href="${applyLink}" class="link-btn">Click Here</a></td></tr>
                    <tr><td class="pink-text">Download Notification</td><td><a href="${applyLink}" class="link-btn">Click Here</a></td></tr>
                    <tr><td class="pink-text">Official Website</td><td><a href="${applyLink}" class="link-btn">Click Here</a></td></tr>
                    <tr><td class="pink-text">Join Telegram Channel</td><td><a href="https://t.me/sarkariresnovaofficial" class="link-btn">Click Here</a></td></tr>
                </table>
            </main><footer class="text-center p-6 text-xs text-gray-500">© 2026 ${config.COMPANY}</footer></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, text: '<b>🚀 ' + title + '</b>\n🔗 ' + liveUrl, parse_mode: 'HTML'
        });

        console.log("✅ Professional Sarkari Result Format Active!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
