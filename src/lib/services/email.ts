import { Resend } from 'resend';

function getResendClient() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

interface DealData {
    destination: string;
    price: number;
    oldPrice?: number;
    discount?: number;
    dealLevel?: string;
    airline?: string;
    route?: string;
    departureDate?: string;
    returnDate?: string;
    bookingLink?: string;
}

function buildDealRow(deal: DealData) {
    const savings = deal.oldPrice ? Math.round(deal.oldPrice - deal.price) : 0;
    const dates = deal.departureDate && deal.returnDate
        ? `${new Date(deal.departureDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} — ${new Date(deal.returnDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`
        : '';

    return `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;">
        <div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px;">${deal.destination}</div>
        <div style="font-size:12px;color:#94A3B8;">${deal.route || ''} ${dates ? `· ${dates}` : ''} ${deal.airline ? `· ${deal.airline}` : ''}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid #F1F5F9;text-align:right;white-space:nowrap;">
        <div style="font-size:22px;font-weight:800;color:#059669;font-family:Fredoka,sans-serif;">${Math.round(deal.price)}$</div>
        ${deal.oldPrice ? `<div style="font-size:12px;color:#94A3B8;text-decoration:line-through;">${Math.round(deal.oldPrice)}$</div>` : ''}
        ${savings > 0 ? `<div style="font-size:11px;font-weight:700;color:#059669;background:#ECFDF5;padding:2px 8px;border-radius:100px;display:inline-block;margin-top:4px;">-${savings}$</div>` : ''}
      </td>
    </tr>`;
}

function buildEmailHtml(userName: string, deals: DealData[], isPremium: boolean) {
    const dealRows = deals.map(buildDealRow).join('');
    const premiumBadge = isPremium
        ? '<div style="background:linear-gradient(135deg,#FFB800,#FFD700);color:#5C4A00;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px;display:inline-block;margin-bottom:16px;letter-spacing:0.5px;">&#9733; PREMIUM · PRIORITAIRE</div>'
        : '';

    const upgradeBlock = !isPremium ? `
    <div style="background:#FFFDF5;border:1px solid rgba(255,190,60,0.2);border-radius:12px;padding:20px;margin-top:24px;text-align:center;">
      <div style="font-size:15px;font-weight:700;color:#8B6914;margin-bottom:6px;">&#9733; Passe Premium</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:12px;">Reçois les deals en premier avec des seuils plus bas.</div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com'}/pricing" style="background:#0F172A;color:#FFD700;padding:10px 24px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;display:inline-block;">Passer Premium — 4,99$/mois</a>
    </div>` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:24px;font-weight:800;color:#0F172A;font-family:Fredoka,sans-serif;margin-bottom:8px;">
            Geai<span style="color:#0EA5E9;">MonVol</span>
          </div>
          ${premiumBadge}
        </div>

        <!-- Card -->
        <div style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.04);">
          <!-- Title bar -->
          <div style="padding:24px 20px 16px;border-bottom:1px solid #F1F5F9;">
            <div style="font-size:20px;font-weight:700;color:#0F172A;">
              Bonjour ${userName} ${isPremium ? '&#9889;' : '&#128075;'}
            </div>
            <div style="font-size:14px;color:#64748B;margin-top:4px;">
              ${deals.length} deal${deals.length > 1 ? 's' : ''} trouvé${deals.length > 1 ? 's' : ''} pour toi !
            </div>
          </div>

          <!-- Deals table -->
          <table style="width:100%;border-collapse:collapse;">
            ${dealRows}
          </table>

          <!-- CTA -->
          <div style="padding:20px;text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com'}/explore" style="background:#0F172A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;">
              Voir les deals sur la carte
            </a>
          </div>
        </div>

        ${upgradeBlock}

        <!-- Footer -->
        <div style="text-align:center;margin-top:32px;font-size:11px;color:#94A3B8;">
          <p>Tu reçois cet email car tu as activé les alertes sur GeaiMonVol.</p>
          <p>GeaiMonVol — Les meilleurs deals aériens du Québec</p>
        </div>
      </div>
    </body>
    </html>`;
}

export async function sendDealAlert(to: string, userName: string, deals: DealData[], isPremium = false) {
    const resend = getResendClient();
    if (!resend) return null;

    const subject = isPremium
        ? `⚡ [PRIORITAIRE] ${deals.length} deal${deals.length > 1 ? 's' : ''} trouvé${deals.length > 1 ? 's' : ''} !`
        : `🔥 ${deals.length} deal${deals.length > 1 ? 's' : ''} aérien${deals.length > 1 ? 's' : ''} trouvé${deals.length > 1 ? 's' : ''} !`;

    return await resend.emails.send({
        from: 'GeaiMonVol <onboarding@resend.dev>',
        to,
        subject,
        html: buildEmailHtml(userName, deals, isPremium),
    });
}

export async function sendWeeklyDigest(to: string, userName: string, deals: DealData[]) {
    const resend = getResendClient();
    if (!resend) return null;

    return await resend.emails.send({
        from: 'GeaiMonVol <onboarding@resend.dev>',
        to,
        subject: `📬 Résumé hebdo : ${deals.length} deal${deals.length > 1 ? 's' : ''} cette semaine`,
        html: buildEmailHtml(userName, deals, false),
    });
}
