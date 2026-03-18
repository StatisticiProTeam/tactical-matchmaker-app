// ============================================
// Email Notification Service
// ============================================

const nodemailer = require('nodemailer');

// Create transporter (Gmail SMTP)
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.warn('⚠️  Email not configured (EMAIL_USER / EMAIL_PASS missing)');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        auth: { user, pass },
    });

    return transporter;
}

// Send a styled email
async function sendEmail(to, subject, htmlContent) {
    const t = getTransporter();
    if (!t) {
        console.warn('📧 Email skipped (not configured):', subject);
        return false;
    }

    try {
        await t.sendMail({
            from: `"⚽ Tactical Match-Maker" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: wrapInTemplate(subject, htmlContent),
        });
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error('📧 Email error:', err.message);
        return false;
    }
}

// Beautiful HTML email template matching the app's dark/green branding
function wrapInTemplate(title, content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0a0e17;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:28px 32px;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;">⚽</div>
                <div style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">THE TACTICAL MATCH-MAKER</div>
            </div>
            
            <!-- Content -->
            <div style="padding:32px;color:#f1f5f9;line-height:1.7;">
                <h2 style="margin:0 0 20px 0;font-size:22px;color:#f1f5f9;">${title}</h2>
                ${content}
            </div>

            <!-- Footer -->
            <div style="padding:20px 32px;border-top:1px solid rgba(148,163,184,0.1);text-align:center;">
                <div style="color:#64748b;font-size:12px;">
                    Ai primit acest email pentru că ești înregistrat pe Tactical Match-Maker.<br>
                    <a href="https://tactical-matchmaker-app.onrender.com" style="color:#4ade80;text-decoration:none;">tactical-matchmaker-app.onrender.com</a>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

// ---- Notification Functions ----

// Notify all players in a city about a new match
async function notifyNewMatch(match, allPlayers) {
    const cityPlayers = allPlayers.filter(p =>
        p.email && p.city && p.city.toLowerCase() === match.city.toLowerCase()
    );

    if (cityPlayers.length === 0) return;

    const dateStr = new Date(match.date).toLocaleDateString('ro-RO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const content = `
        <p style="color:#94a3b8;margin-bottom:20px;">Un meci nou a fost creat în <strong style="color:#4ade80;">${match.city}</strong>! 🏟️</p>
        
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="font-size:18px;font-weight:700;color:#f1f5f9;margin-bottom:12px;">${match.title}</div>
            <div style="color:#94a3b8;font-size:14px;line-height:2;">
                📅 <strong>${dateStr}</strong><br>
                🕐 Ora: <strong>${match.time}</strong><br>
                📍 ${match.location}, ${match.city}<br>
                👥 Jucători: 0/${match.maxPlayers}<br>
                📊 ELO: ${match.eloMin} — ${match.eloMax}<br>
                ${match.fee > 0 ? `💰 Taxă: <strong>${match.fee} RON</strong>` : '🎉 <strong style="color:#4ade80;">GRATUIT</strong>'}
            </div>
        </div>

        <div style="text-align:center;">
            <a href="https://tactical-matchmaker-app.onrender.com/#matches" 
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">
                ⚽ Înscrie-te Acum!
            </a>
        </div>
    `;

    const subject = `⚽ Meci nou în ${match.city}: ${match.title}`;

    for (const player of cityPlayers) {
        await sendEmail(player.email, subject, content);
    }

    console.log(`📧 Notified ${cityPlayers.length} players in ${match.city} about new match`);
}

// Notify players in a match that it was cancelled
async function notifyMatchCancelled(match, allPlayers) {
    const enrolledPlayers = allPlayers.filter(p =>
        p.email && match.players && match.players.includes(p.id)
    );

    if (enrolledPlayers.length === 0) return;

    const content = `
        <p style="color:#94a3b8;margin-bottom:20px;">Din păcate, un meci la care erai înscris a fost <strong style="color:#f87171;">anulat</strong>. 😔</p>
        
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="font-size:18px;font-weight:700;color:#f1f5f9;margin-bottom:8px;">❌ ${match.title}</div>
            <div style="color:#94a3b8;font-size:14px;">
                📍 ${match.location}, ${match.city}<br>
                Meciul a fost anulat de organizator.
            </div>
        </div>

        <p style="color:#94a3b8;">Nu-ți face griji — verifică alte meciuri disponibile!</p>

        <div style="text-align:center;">
            <a href="https://tactical-matchmaker-app.onrender.com/#matches" 
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">
                🔍 Vezi Alte Meciuri
            </a>
        </div>
    `;

    const subject = `❌ Meci anulat: ${match.title}`;

    for (const player of enrolledPlayers) {
        await sendEmail(player.email, subject, content);
    }

    console.log(`📧 Notified ${enrolledPlayers.length} players about cancelled match`);
}

// Welcome email for new players
async function notifyWelcome(player) {
    if (!player.email) return;

    const content = `
        <p style="color:#94a3b8;margin-bottom:20px;">Bine ai venit pe <strong style="color:#4ade80;">Tactical Match-Maker</strong>, ${player.name}! 🎉</p>
        
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="color:#94a3b8;font-size:14px;line-height:2;">
                👤 Nume: <strong style="color:#f1f5f9;">${player.name}</strong><br>
                📍 Oraș: <strong style="color:#f1f5f9;">${player.city}</strong><br>
                ⚽ Poziție: <strong style="color:#f1f5f9;">${player.positionName || player.position}</strong><br>
                📊 ELO Inițial: <strong style="color:#4ade80;">${player.elo}</strong>
            </div>
        </div>

        <p style="color:#94a3b8;margin-bottom:20px;">Acum poți să te înscrii la meciuri din orașul tău și să primești notificări când apar meciuri noi!</p>
    `;

    await sendEmail(player.email, `Bine ai venit, ${player.name}! ⚽`, content);
}

module.exports = {
    sendEmail,
    notifyNewMatch,
    notifyMatchCancelled,
    notifyWelcome,
};
