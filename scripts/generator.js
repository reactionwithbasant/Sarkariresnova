const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Fixing Image & Content Depth...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // Strict Prompt to prevent lazy responses
        const prompt = `Write a PROFESSIONAL 800-word Hindi News Article for ${randomCat} 2026. 
        DO NOT give short summaries. Give full details.
        STRICT FORMAT:
        [TITLE] Clear Post Name
        [SLUG] unique-url-slug
        [IMG_KEY] One English keyword (e.g. Exam, Police, Office, Result)
        [CONTENT] 
        - Detailed Introduction
        - Full HTML Table for Dates & Fees
        - Full HTML Table for Eligibility
        - Step-by-Step 'How to Apply' (Avedan Kaise Karein) in 5-6 points.
        - 5 FAQs with Answers.
        [APPLY_LINK] Provide the actual official website registration link (not google.com).`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        
        let title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const imgKey = (rawText.match(/\[IMG_KEY\]\s*(\w+)/i) || [])[1] || "Job";
        
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        
        // --- POWERFUL CLEANUP ---
        title = title.replace(/[*#]/g, '').trim();
        contentBody = contentBody.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '');
        contentBody = contentBody.replace(/(https?:\/\/[^\s<]+)/g, '<a href="" class="text-blue-700 font-bold underline" target="_blank"></a>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.sarkariresult.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;
        
        // --- DYNAMIC IMAGE FIX ---
        const imageUrl = `https://loremflickr.com/800/450/${imgKey}`;

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 12px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-50">
            <header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase font-bold">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-6 shadow-2xl border-t-8 border-red-600 rounded-b-lg">
                <span class="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs uppercase mb-4 inline-block">${randomCat}</span>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <img src="${imageUrl}" alt="Official Notification" class="w-full h-auto rounded-lg mb-8 shadow-md border">
                <div class="prose max-w-none text-gray-800 leading-relaxed">${contentBody}</div>
                <div class="mt-12 p-8 bg-blue-50 border-2 border-blue-100 rounded-xl text-center">
                    <h3 class="font-bold text-xl text-blue-900 mb-4 italic underline">Direct Official Apply Link</h3>
                    <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="block w-full bg-red-600 text-white p-5 rounded-lg font-bold text-2xl shadow-xl hover:bg-red-700">👉 CLICK HERE TO APPLY / REGISTER</a>
                </div>
            </main>
            <footer class="mt-10 p-8 bg-gray-900 text-white text-center text-xs">© 2026 ${config.COMPANY}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // --- SITEMAP & INDEX (SAFE - NO CHANGES) ---
        const indexPath = "public/index.html";
        const newEntry = `<li><a href="${slug}.html" class="text-blue-700 font-medium">[${randomCat}] ${title}</a></li>`;
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL, text: `<b>🚀 [${randomCat}] ${title}</b>\n\n🔗 ${liveUrl}`, parse_mode: 'HTML'
        });

        console.log("✅ Success! Fixed Image, Detailed Content & Apply Link.");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
