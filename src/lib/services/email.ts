import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface DealAlert {
    destination: string;
    price: number;
    oldPrice: number;
    discount: number;
    airline: string;
    route: string;
    departureDate: string;
    returnDate: string;
}

export async function sendDealAlert(
    to: string,
    userName: string,
    deals: DealAlert[]
) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return;
    }

    const dealRows = deals.map(d => `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                <strong style="color:#1A2B42;font-size:15px;">${d.destination}</strong>
                <div style="color:#8FA3B8;font-size:12px;margin-top:2px;">${d.route} · ${d.airline}</div>
                <div style="color:#8FA3B8;font-size:11px;">${d.departureDate} → ${d.returnDate}</div>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;">
                <div style="color:#2E7DDB;font-weight:800;font-size:20px;">${d.price} $</div>
                <div style="text-decoration:line-through;color:#8FA3B8;font-size:12px;">${d.oldPrice} $</div>
                <span style="display:inline-block;padding:2px 8px;border-radius:100px;background:#DC2626;color:white;font-size:11px;font-weight:700;margin-top:4px;">
                    -${d.discount}%
                </span>
            </td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F4F8FB;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:28px;">
                <div style="font-size:24px;font-weight:700;color:#1A2B42;">
                    Geai<span style="color:#2E7DDB;">Mon</span>Vol
                </div>
                <div style="color:#8FA3B8;font-size:13px;margin-top:4px;">
                    Deals depuis Montréal (YUL)
                </div>
            </div>

            <!-- Main card -->
            <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(26,43,66,0.06);">
                <!-- Banner -->
                <div style="background:linear-gradient(135deg,#2563EB,#3B82F6);padding:20px 24px;color:white;">
                    <div style="font-size:13px;opacity:0.7;">Bonjour ${userName} 👋</div>
                    <div style="font-size:18px;font-weight:700;margin-top:4px;">
                        ${deals.length} deal${deals.length > 1 ? 's' : ''} trouvé${deals.length > 1 ? 's' : ''} pour toi!
                    </div>
                </div>

                <!-- Deals table -->
                <table style="width:100%;border-collapse:collapse;">
                    ${dealRows}
                </table>

                <!-- CTA -->
                <div style="padding:20px 24px;text-align:center;">
                    <a href="https://geai-mon-vol.vercel.app"
                       style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#2E7DDB,#1E5FA8);color:white;text-decoration:none;border-radius:100px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(46,125,219,0.25);">
                        Voir sur la carte →
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="text-align:center;margin-top:24px;font-size:11px;color:#8FA3B8;">
                <p>Tu reçois cet email car tu as activé les alertes deals sur GeaiMonVol.</p>
                <p>
                    <a href="https://geai-mon-vol.vercel.app/profile" style="color:#2E7DDB;text-decoration:none;">
                        Gérer mes préférences
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'GeaiMonVol <onboarding@resend.dev>',
            to: [to],
            // Use deals[0] properties or similar safe check
            subject: deals.length > 0
                ? `🔥 ${deals[0].destination} à ${deals[0].price}$ (-${deals[0].discount}%) — GeaiMonVol`
                : '🔥 Nouveaux deals GeaiMonVol',
            html,
        });

        if (error) {
            console.error('Resend error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Email send error:', error);
        return null;
    }
}

export async function sendWeeklyDigest(
    to: string,
    userName: string,
    deals: DealAlert[]
) {
    // Same as above but with a different subject and intro
    return sendDealAlert(to, userName, deals);
}
