const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Generating Topic-Specific Images & Content...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCatFinal = cats[Math.floor(Math.random() * cats.length)];

        const prompt = `Act as a Professional Sarkari Blogger. Write a 800-word Hindi update for ${randomCatFinal} 2026.
        STRICT RULES: 
        1. NO symbols like ****, ####, or ----.
        2. VERY DETAILED 'How to Apply' steps.
        3. 5-Question FAQ.
        [TITLE] Post Name
        [SLUG] unique-slug-2026
        [IMG_KEYWORD] Give 1 English keyword related to the post (e.g. 'police' for UP Police, 'office' for Clerk, 'result' for marks).
        [CONTENT] Full details in Hindi with HTML Tables.
        [APPLY_LINK] Official registration URL.`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        
        // --- EXTRACTION & CLEANUP ---
        let title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "Sarkari Update";
        title = title.replace(/[*#]/g, '').trim();

        const slugMatch = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const imgKeyword = (rawText.match(/\[IMG_KEYWORD\]\s*(\w+)/i) || [])[1] || "government";
        
        let contentBody = (rawText.split(/\[CONTENT\]/i)[1] || "").split(/\[APPLY_LINK\]/i)[0].trim();
        contentBody = contentBody.replace(/\*\*/g, '').replace(/###/g, '').replace(/---/g, '').replace(/[*#]/g, '');
        
        // Clickable Links (Blue)
        contentBody = contentBody.replace(/(https?:\/\/[^\s<]+)/g, '<a href="" class="text-blue-700 font-bold underline" target="_blank"></a>');

        const applyLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com";
        const slug = slugMatch.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;
        
        // --- DYNAMIC IMAGE LOGIC (Topic Wise) ---
        const imageUrl = `https://images.unsplash.com/photo-1586281380349-631531a34d4f?auto=format&fit=crop&q=80&w=800&q=${encodeURIComponent(imgKeyword)}`;

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 12px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-50 font-sans">
            <header class="bg-blue-900 text-white p-6 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase font-bold tracking-widest">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-6 shadow-2xl border-t-8 border-red-600 rounded-b-lg">
                <span class="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs uppercase mb-4 inline-block">${randomCatFinal}</span>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <img src="${imageUrl}" alt="${title}" class="w-full h-64 object-cover rounded-lg mb-8 shadow-md border">
                <div class="prose max-w-none text-gray-800 leading-relaxed">${contentBody}</div>
                <div class="mt-12 p-8 bg-blue-50 border-2 border-blue-100 rounded-xl text-center">
                    <h3 class="font-bold text-xl text-blue-900 mb-4 italic underline">Official Direct Portal</h3>
                    <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="block w-full bg-red-600 text-white p-5 rounded-lg font-bold text-2xl shadow-xl hover:bg-red-700 transition-all">👉 CLICK HERE TO APPLY</a>
                </div>
            </main>
            <footer class="mt-10 p-8 bg-gray-900 text-white text-center text-xs">© 2026 ${config.COMPANY}</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // INDEX & SITEMAP (SAFE - NO CHANGES)
        const indexPath = "public/index.html";
        const newEntry = `<li><a href="${slug}.html" class="text-blue-700 font-medium">[${randomCatFinal}] ${title}</a></li>`;
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL, text: `<b>🚀 [${randomCatFinal}] ${title}</b>\n\n🔗 ${liveUrl}`, parse_mode: 'HTML'
        });

        console.log("✅ Success: Topic-Related Image & Clean Content Ready!");
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
