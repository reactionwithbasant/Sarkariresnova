const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Generating Full Article & Stamping...");
        
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Updated Prompt: Explicitly asking for full content, not just links
        const prompt = "Write a detailed 800-word Hindi article for " + randomCat + " 2026. Include Department Name, Eligibility, Age Limit, and Selection Process. FORMAT: [TITLE] Title Name, [SLUG] unique-slug, [CONTENT] Full detailed Hindi text with HTML tables for dates and fees. [APPLY_LINK] https://www.google.com. NO stars or hashes.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/[\*#]/g, '').trim();

        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update 2026";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim().replace(/\n/g, '<br>');
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = config.SITE_URL + "/" + slug + ".html";

        // HTML Page for Article (Sarkari Style)
        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>table{width:100%;border-collapse:collapse;margin:20px 0;border:2px solid #ff00ff}td{border:1px solid #ff00ff;padding:10px;text-align:center}</style></head><body class="bg-gray-50"><header class="bg-blue-900 text-white p-5 text-center"><h1 class="text-2xl font-bold">SARKARI RES NOVA</h1></header><main class="max-w-4xl mx-auto p-6 bg-white shadow-lg mt-4"><h2 class="text-2xl font-bold text-red-600 text-center mb-6">${title}</h2><div class="prose max-w-none text-gray-800 mb-10">${contentBody}</div><div class="bg-pink-100 p-4 text-center rounded"><strong>Apply Link:</strong> <a href="${applyLink}" class="text-blue-700 underline font-bold">Click Here to Apply</a></div></main></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // --- 🎯 NEW STAMPING LOGIC (Using Markers) ---
        const indexPath = "public/index.html";
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            
            let listId = "job-list"; 
            if (randomCat === "Result") listId = "result-list";
            if (randomCat === "Admit Card") listId = "admit-list";

            const newEntry = `<li><a href="${slug}.html">${title}</a></li>\n`;
            
            // Search for the ID and inject right after it
            const marker = `id="${listId}" class="link-list">`;
            if (indexData.includes(marker)) {
                indexData = indexData.replace(marker, marker + "\n" + newEntry);
                fs.writeFileSync(indexPath, indexData);
                console.log("✅ Successfully added link to " + listId);
            }
        }

        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, text: "🚀 " + title + "\n🔗 " + liveUrl
        });

    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
