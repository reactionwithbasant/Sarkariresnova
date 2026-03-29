const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = '@sarkariresnovaofficial';

async function fetchJobs() {
    // Hum India ke top RSS feeds se jobs uthayenge
    const feeds = [
        "https://www.indgovtjobs.in/feeds/posts/default",
        "https://www.freejobalert.com/feed/"
    ];
    // Testing ke liye hum top jobs ki list manually AI ko dete hain
    return ["SSC GD Constable 2026 Result", "RPSC School Lecturer Result", "Railway ALP New Update", "UP Police Exam Date"];
}

async function generateArticle(jobTitle) {
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
    const prompt = "Write a professional 5-line Hindi job alert for: " + jobTitle + ". Include details like Post Name, Status (Result/Out), and a Call to Action 'Visit sarkariresnova.in'. Use emojis.";
    
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });
        return response.data.candidates[0].content.parts[0].text;
    } catch (e) { return null; }
}

async function start() {
    console.log("🚀 RAGHVITA ENTERPRISES: Real Job Engine Starting...");
    const jobs = await fetchJobs();
    
    for (let job of jobs.slice(0, 1)) { // Abhi ke liye 1-2 jobs post karega
        const article = await generateArticle(job);
        if (article) {
            const teleUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
            await axios.post(teleUrl, { 
                chat_id: CHAT_ID, 
                text: "<b>📢 NEW SARKARI JOB UPDATE</b>\n\n" + article, 
                parse_mode: 'HTML' 
            });
            console.log("✅ Posted: " + job);
        }
    }
}
start();
