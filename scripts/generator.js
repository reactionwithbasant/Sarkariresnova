const axios = require('axios');
const fs = require('fs');
const config = require('./config');

async function start() {
    const apiKey = process.env.GEMINI_API_KEY;
    const teleToken = process.env.TELEGRAM_TOKEN;

    try {
        console.log("🚀 RAGHVITA ENGINE: Finding REAL Apply Links...");
        
        const listRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const selectedModel = listRes.data.models.find(m => m.name.includes('gemini-2.5-flash'))?.name || "models/gemini-1.5-flash";

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme", "Syllabus"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // AI ko sakht instruction: Asli link dhoondho, man-ghadant nahi
        const prompt = `Act as a Sarkari Exam Expert. Research and write a 500-word Hindi post for ONE SPECIFIC ${randomCat} of 2026.
        IMPORTANT: Find the REAL OFFICIAL registration or login URL for this post. 
        Format: 
        [TITLE] Specific Name
        [SLUG] short-slug
        [META] Description
        [CONTENT] Intro, Dates Table, Fees, Eligibility, How to Apply, FAQ.
        [APPLY_LINK] Put the ACTUAL OFFICIAL URL (e.g., https://ssc.nic.in or https://uppbpb.gov.in). Do not make up a fake link.`;

        const genRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = genRes.data.candidates[0].content.parts[0].text;
        const title = (rawText.match(/\[TITLE\]\s*(.*)/i) || [])[1] || "New Update";
        let slug = (rawText.match(/\[SLUG\]\s*([a-zA-Z0-9-]*)/i) || [])[1] || "update-" + Date.now();
        const content = (rawText.match(/\[CONTENT\]\s*([\s\S]*)/i) || [])[1] || "Loading...";
        
        // Link cleaner logic
        let rawLink = (rawText.match(/\[APPLY_LINK\]\s*(https?:\/\/[^\s*]+)/i) || [])[1] || "https://www.google.com/search?q=official+apply+link";
        const applyLink = rawLink.trim();

        slug = slug.substring(0, 45).toLowerCase();
        const liveUrl = `${config.SITE_URL}/${slug}.html`;

        const html = `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
        <style> table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #1e3a8a; padding: 10px; text-align:center; } th { background: #1e3a8a; color: white; } </style>
        </head><body class="bg-gray-100 font-sans">
            <header class="bg-blue-900 text-white p-5 text-center shadow-lg border-b-4 border-yellow-400">
                <h1 class="text-2xl font-bold italic">SarkariResNova.com</h1>
                <p class="text-[10px] uppercase">${config.COMPANY}</p>
            </header>
            <main class="max-w-4xl mx-auto bg-white p-6 mt-4 shadow-2xl border-t-8 border-red-600">
                <div class="mb-4"><span class="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase">${randomCat}</span></div>
                <h2 class="text-3xl font-extrabold text-blue-900 mb-6">${title}</h2>
                <div class="prose max-w-none text-gray-800 mb-8">${content}</div>
                <div class="mt-10 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
                    <h3 class="font-bold text-xl text-blue-900 mb-4 italic underline">महत्वपूर्ण लिंक (Important Links)</h3>
                    <a href="${applyLink}" target="_blank" rel="noopener noreferrer" class="block w-full bg-red-600 hover:bg-red-700 text-white text-center p-5 rounded-lg font-bold text-2xl shadow-2xl transition-all scale-105">👉 CLICK HERE TO APPLY ONLINE (REAL LINK)</a>
                    <p class="mt-4 text-xs text-gray-500">Note: Ye link aapko seedha vibhag ki official website par le jayega.</p>
                </div>
                <div class="mt-6">
                    <a href="https://t.me/sarkariresnovaofficial" class="block bg-blue-700 text-white text-center p-3 rounded-lg font-bold shadow-md hover:bg-blue-800">Join Our Telegram (Sabse Tez Update)</a>
                </div>
            </main>
            <footer class="mt-10 p-6 bg-gray-800 text-white text-center text-xs">© 2026 ${config.COMPANY} | Honesty & Hard Work</footer>
        </body></html>`;

        if (!fs.existsSync('public')) fs.mkdirSync('public');
        fs.writeFileSync("public/" + slug + ".html", html);

        // Homepage update (Index.html) - NO CHANGES TO PREVIOUS LOGIC
        const indexPath = "public/index.html";
        const newEntry = `<li><a href="${slug}.html" class="text-blue-700 font-medium">[${randomCat}] ${title}</a></li>`;
        if (fs.existsSync(indexPath)) {
            let indexData = fs.readFileSync(indexPath, 'utf8');
            fs.writeFileSync(indexPath, indexData.replace("<ul>", "<ul>" + newEntry));
        }

        await axios.post(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
            chat_id: config.TELEGRAM_CHANNEL,
            text: `<b>🚀 [${randomCat}] ${title}</b>\n\n🔗 <b>Check Real Apply Link:</b>\n${liveUrl}`,
            parse_mode: 'HTML'
        });

        console.log("✅ Success! Real Link Extracted: " + applyLink);
    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
