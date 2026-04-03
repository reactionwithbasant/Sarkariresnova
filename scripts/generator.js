const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Forcing Article Stamping...");
        const listRes = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        const prompt = "Write a professional 800-word Hindi News Article for " + randomCat + " 2026. [TITLE] Name, [SLUG] unique-slug, [CONTENT] Intro, Tables, Steps. [APPLY_LINK] URL. No stars.";

        const genRes = await axios.post('https://generativelanguage.googleapis.com/v1beta/' + selectedModel + ':generateContent?key=' + apiKey, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let rawText = genRes.data.candidates[0].content.parts[0].text.replace(/[\*#\-]/g, '').trim();
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Update 2026";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "job-" + Date.now();
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim().replace(/\n/g, '<br>');
        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();

        // Article Page Creation
        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white"><header class="bg-blue-900 text-white p-5 text-center"><h1 class="text-2xl font-bold italic">SARKARI RES NOVA</h1></header><main class="max-w-4xl mx-auto p-4 border mt-2"><h2 class="text-xl font-bold text-red-600 text-center mb-6">${title}</h2><div class="prose text-sm mb-10">${contentBody}</div></main></body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // --- 🎯 FIX: STAMPING LOGIC FOR BOXES ---
        const indexPath = "public/index.html";
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            
            // Identifying the correct list based on Category
            let targetId = "job-list"; 
            if (randomCat === "Result") targetId = "result-list";
            if (randomCat === "Admit Card") targetId = "admit-list";

            const newEntry = `<li><a href="${slug}.html">${title}</a></li>`;
            
            // Injects link right after the <ul> tag of that category
            const regex = new RegExp(`(id="${targetId}"[^>]*>)`, 'g');
            indexData = indexData.replace(regex, `${newEntry}`);
            
            fs.writeFileSync(indexPath, indexData);
            console.log("✅ Stamped link into: " + targetId);
        }

        await axios.post('https://api.telegram.org/bot' + teleToken + '/sendMessage', {
            chat_id: config.TELEGRAM_CHANNEL, text: "🚀 " + title + "\n🔗 " + config.SITE_URL + "/" + slug + ".html"
        });

    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
