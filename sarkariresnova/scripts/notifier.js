const axios = require('axios');
require('dotenv').config();

async function sendNotifications(title, slug) {
    const url = `${process.env.SITE_URL}/jobs/${slug}.html`;
    try {
        // Telegram
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚀 *New Job Alert!*\n📌 *${title}*\n🔗 [Apply Here](${url})`,
            parse_mode: 'Markdown'
        });
        console.log("📢 Telegram Sent!");
        
        // OneSignal
        await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: process.env.ONESIGNAL_APP_ID,
            included_segments: ["All"],
            contents: { "en": title },
            url: url
        }, { headers: { 'Authorization': `Basic ${process.env.ONESIGNAL_REST_KEY}` } });
        console.log("🔔 OneSignal Sent!");
    } catch (e) { console.log("Notification Error (Check Keys)"); }
}
module.exports = { sendNotifications };

