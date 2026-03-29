const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');

const CONFIG = {
    GEMINI_KEY: "AIzaSyBpyk-_RQgNIC0Q2rmTszoksUSukGz7YwQ",
    TELE_TOKEN: "8629292559:AAFw3moKmNFtq1ruOLQhdXp2gqXHEG44Vgs",
    TELE_CHAT: "@sarkariresnovaofficial",
    SITE_URL: "https://sarkariresnova-a18dc.web.app",
    FEEDS: ['https://www.freejobalert.com/feed/', 'https://www.sarkariresult.com/rss/rss.xml']
};

const parser = new Parser();

async function generateAIContent(title) {
    // 🚀 NEW 2026 MODEL: gemini-2.0-flash (v1beta endpoint for latest features)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
    
    const payload = {
        contents: [{
            parts: [{ text: `Write a professional 1000-word Sarkari Result style HTML article for: ${title}. Include tables for vacancy, dates and fees. Branding: SarkariResNova. Use Hindi-English mix.` }]
        }]
    };

    try {
        const res = await axios.post(url, payload);
        if (res.data && res.data.candidates && res.data.candidates[0].content) {
            return res.data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("API Response structure changed.");
        }
    } catch (error) {
        // Agar 2.0-flash bhi na mile, toh hum generic 'gemini-pro' try karenge
        const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_KEY}`;
        const backupRes = await axios.post(backupUrl, payload);
        return backupRes.data.candidates[0].content.parts[0].text;
    }
}

async function sendAlert(title, slug) {
    const jobUrl = `${CONFIG.SITE_URL}/jobs/${slug}.html`;
    try {
        await axios.post(`https://api.telegram.org/bot${CONFIG.TELE_TOKEN}/sendMessage`, {
            chat_id: CONFIG.TELE_CHAT,
            text: `🚀 *New Job Alert!*\n📌 *${title}*\n🔗 [Details Here](${jobUrl})`,
            parse_mode: 'Markdown'
        });
        console.log("📢 Telegram Alert Sent!");
    } catch (e) { console.log("⚠️ Alert failed"); }
}

async function start() {
    console.log("🚀 SarkariResNova Engine: GEMINI 2.0 DEPLOYED...");
    const dataPath = './src/data/jobs.json';
    if (!fs.existsSync('./src/data')) fs.mkdirSync('./src/data', { recursive: true });
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '[]');
    
    let allJobs = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    for (const feedUrl of CONFIG.FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            for (const item of feed.items) {
                const slug = item.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
                if (!allJobs.find(j => j.guid === item.guid)) {
                    console.log(`✨ AI Generation started for: ${item.title}`);
                    try {
                        const content = await generateAIContent(item.title);
                        const jobDir = './public/jobs';
                        if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
                        fs.writeFileSync(`${jobDir}/${slug}.html`, `<html><body>${content}</body></html>`);
                        await sendAlert(item.title, slug);
                        allJobs.push({ guid: item.guid });
                        console.log(`✅ SUCCESS!`);
                    } catch (err) { 
                        console.log(`❌ FAILED: ${err.message}`);
                    }
                }
            }
        } catch (e) { console.log("⚠️ RSS Error"); }
    }
    fs.writeFileSync(dataPath, JSON.stringify(allJobs));
    console.log("🏁 Cycle Finished.");
}

start();

