const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Fixing Telegram & Table Format...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Prompt for Sarkari-Result style tables as per your screenshots
        const prompt = "Write a professional Hindi Job post for " + randomCat + " 2026. Use Patna High Court or SSC as example. [TITLE] Name, [SLUG] slug, [CONTENT] Intro, 3 Styled HTML Tables (Dates/Fees, Age, Vacancy), and Links. [APPLY_LINK] Official Link. NO Markdown stars.";

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

        // 🖼️ Professional Table Styling (Pink/Blue Theme)
        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #ff00ff; }
            th, td { border: 1px solid #ff00ff; padding: 12px; text-align: center; }
            .header-row { background: #ff00ff; color: #fff; font-weight: bold; font-size: 18px; }
            .blue-bold { color: #0000ff; font-weight: bold; }
            .green-bold { color: #008000; font-weight: bold; }
        </style></head><body class="bg-white"><header class="bg-[#1e3a8a] text-white p-5 text-center"><h1 class="text-2xl font-bold">SarkariResNova.com</h1></header>
            <main class="max-w-4xl mx-auto p-4 border mt-2">
                <h2 class="text-xl font-bold text-red-600 text-center mb-6">${title}</h2>
                <div class="prose max-w-none text-sm">${contentBody}</div>
                <table>
                    <tr class="header-row"><td colspan="2">Important Links</td></tr>
                    <tr><td class="font-bold text-pink-600">Apply Online</td><td><a href="${applyLink}" class="blue-bold underline">Click Here</a></td></tr>
                    <tr><td class="font-bold text-pink-600">Official Website</td><td><a href="${applyLink}" class="blue-bold underline">Click Here</a></td></tr>
                    <tr><td class="font-bold text-pink-600">Telegram Group</td><td><a href="https://t.me/sarkariresnovaofficial" class="blue-bold underline">Join Now</a></td></tr>
                </table>
            </main></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        const indexPath = "public/index.html";
        const newEntry = '<li><a href="' + slug + '.html">[' + randomCat + '] ' + title + '</a></li>';
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        // 🚀 TELEGRAM FIX: Sending as plain text to avoid parse errors
        const teleMessage = "🚀 " + title + "\n\n🔗 Check Here: " + liveUrl;
        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, 
            text: teleMessage
        });

        console.log("✅ Telegram Sent & Table Format Fixed!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
