const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');
const OneSignal = require('onesignal-node');

async function start() {
    const ONESIGNAL_APP_ID = "7bed1933-dcbd-468c-9d94-7183ea7f059c";
    const ONESIGNAL_REST_KEY = "os_v2_app_ppwrsm64xvdizhmuogb6u7yfttr7vlhngo7utwmbnwztijcnkid3ovwzbxv3qjdh67smu22jejw4wn4cdqqu26i74s4rrn5ruth5hfq";
    const SITE_URL = "https://sarkariresnova-a18dc.web.app";
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const osClient = new OneSignal.Client(ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY);

    try {
        console.log("🚀 RAGHVITA ENTERPRISES: SEO & Sitemap Engine Online...");

        const cats = ["Latest Job", "Admit Card", "Result", "Govt Scheme"];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];

        // 1. AI SEO Content Generation
        const prompt = "Act as an SEO Expert. Write a 400-word Hindi post for '" + randomCat + " 2026'. High Ranking Keywords. Format: TITLE | SLUG | META_DESC | CONTENT";
        const result = await model.generateContent(prompt);
        const [title, slug, metaDesc, content] = result.response.text().split('|').map(s => s.trim());

        // 2. HTML Article Creation
        const articleHtml = `<!DOCTYPE html><html lang="hi"><head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${metaDesc}"><title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-100"><article class="max-w-4xl mx-auto bg-white p-8 mt-10 shadow-2xl">
        <h1 class="text-4xl font-bold text-blue-900 mb-6">${title}</h1>
        <div class="prose max-w-none text-lg">${content}</div>
        </article></body></html>`;

        fs.writeFileSync("public/" + slug + ".html", articleHtml);
        const liveUrl = SITE_URL + "/" + slug + ".html";

        // 3. 🛡️ AUTO-SITEMAP SYSTEM (Zaroori)
        const sitemapPath = "public/sitemap.xml";
        let sitemapContent = "";
        const today = new Date().toISOString().split('T')[0];

        if (fs.existsSync(sitemapPath)) {
            // Purane sitemap mein naya link jodhna
            let existing = fs.readFileSync(sitemapPath, 'utf8');
            const newEntry = `<url><loc>${liveUrl}</loc><lastmod>${today}</lastmod><priority>0.80</priority></url>\n</urlset>`;
            sitemapContent = existing.replace("</urlset>", newEntry);
        } else {
            // Naya sitemap banana agar nahi hai
            sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE_URL}/index.html</loc><lastmod>${today}</lastmod><priority>1.00</priority></url>
<url><loc>${liveUrl}</loc><lastmod>${today}</lastmod><priority>0.80</priority></url>
</urlset>`;
        }
        fs.writeFileSync(sitemapPath, sitemapContent);
        console.log("✅ Sitemap Updated!");

        // 4. Notifications
        await osClient.createNotification({ contents: { 'en': "🚀 SEO Update: " + title }, included_segments: ['Subscribed Users'], url: liveUrl });
        await axios.post("https://api.telegram.org/bot" + process.env.TELEGRAM_TOKEN + "/sendMessage", {
            chat_id: '@sarkariresnovaofficial',
            text: "<b>📢 NEW UPDATE</b>\n\n" + title + "\n\n<b>Details:</b> " + liveUrl,
            parse_mode: 'HTML'
        });

    } catch (e) { console.log("❌ Error: " + e.message); }
}
start();
