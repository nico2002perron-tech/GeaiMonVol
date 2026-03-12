import { Resend } from 'resend';

function getResendClient() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

export async function sendDealAlert(to: string, userName: string, deals: any[], isPremium = false) {
    const resend = getResendClient();
    if (!resend) return null;

    const subject = isPremium
        ? `⚡ [PRIORITAIRE] Deal Alert: ${deals.length} nouveaux vols trouvés !`
        : `🔥 Deal Alert: ${deals.length} nouveaux vols trouvés !`;

    return await resend.emails.send({
        from: 'GeaiMonVol <onboarding@resend.dev>',
        to,
        subject,
        html: `<h1>Bonjour ${userName}</h1><p>Nous avons trouvé des deals pour vous !</p>`
    });
}

export async function sendWeeklyDigest(to: string, userName: string, deals: any[]) {
    // Placeholder
    return null;
}
