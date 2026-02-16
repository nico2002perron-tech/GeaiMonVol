import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDealAlert(to: string, userName: string, deals: any[]) {
    if (!process.env.RESEND_API_KEY) return null;

    return await resend.emails.send({
        from: 'GeaiMonVol <onboarding@resend.dev>',
        to,
        subject: `🔥 Deal Alert: ${deals.length} nouveaux vols trouvés !`,
        html: `<h1>Bonjour ${userName}</h1><p>Nous avons trouvé des deals pour vous !</p>`
    });
}

export async function sendWeeklyDigest(to: string, userName: string, deals: any[]) {
    // Placeholder
    return null;
}
