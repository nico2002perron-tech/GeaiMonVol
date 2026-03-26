import { Resend } from 'resend';

function getResendClient() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'GeaiMonVol <onboarding@resend.dev>';

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
        from: EMAIL_FROM,
        to,
        subject,
        html: buildEmailHtml(userName, deals, isPremium),
    });
}

function buildWeeklyDigestHtml(userName: string, deals: DealData[]) {
    const dealRows = deals.map((deal, i) => {
        const savings = deal.oldPrice ? Math.round(deal.oldPrice - deal.price) : 0;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #F1F5F9;width:36px;text-align:center;font-size:18px;">${medal}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #F1F5F9;">
            <div style="font-size:15px;font-weight:700;color:#0F172A;">${deal.destination}</div>
            <div style="font-size:11px;color:#94A3B8;margin-top:2px;">${deal.route || ''} ${deal.airline ? `· ${deal.airline}` : ''}</div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #F1F5F9;text-align:right;white-space:nowrap;">
            <div style="font-size:20px;font-weight:800;color:#059669;font-family:Fredoka,sans-serif;">${Math.round(deal.price)}$</div>
            ${savings > 0 ? `<div style="font-size:10px;font-weight:700;color:#DC2626;margin-top:2px;">-${deal.discount}%</div>` : ''}
          </td>
        </tr>`;
    }).join('');

    const bestDeal = deals[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com';

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:24px;font-weight:800;color:#0F172A;font-family:Fredoka,sans-serif;margin-bottom:4px;">
            Geai<span style="color:#0EA5E9;">MonVol</span>
          </div>
          <div style="font-size:12px;color:#94A3B8;font-weight:500;">Résumé hebdomadaire</div>
        </div>

        <!-- Hero -->
        <div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:20px;">
          <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:8px;">Meilleur deal de la semaine</div>
          <div style="font-size:28px;font-weight:800;color:#fff;font-family:Fredoka,sans-serif;">${bestDeal ? bestDeal.destination : ''}</div>
          <div style="font-size:36px;font-weight:800;color:#10B981;font-family:Fredoka,sans-serif;margin:4px 0;">${bestDeal ? Math.round(bestDeal.price) + '$' : ''}</div>
          ${bestDeal?.discount ? `<div style="display:inline-block;background:rgba(16,185,129,0.15);color:#10B981;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:700;">-${bestDeal.discount}% vs prix habituel</div>` : ''}
        </div>

        <!-- Deals Card -->
        <div style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.04);">
          <div style="padding:20px 20px 12px;">
            <div style="font-size:18px;font-weight:700;color:#0F172A;">
              Salut ${userName} 👋
            </div>
            <div style="font-size:13px;color:#64748B;margin-top:4px;">
              Voici les ${deals.length} meilleurs deals depuis Montréal cette semaine.
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            ${dealRows}
          </table>

          <div style="padding:20px;text-align:center;">
            <a href="${appUrl}/#deals" style="background:linear-gradient(135deg,#0EA5E9,#0077B6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(14,165,233,0.25);">
              Voir tous les deals
            </a>
          </div>
        </div>

        <!-- Upgrade CTA -->
        <div style="background:#FFFDF5;border:1px solid rgba(255,190,60,0.2);border-radius:12px;padding:20px;margin-top:16px;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:#8B6914;margin-bottom:4px;">&#9733; Passe au Premium</div>
          <div style="font-size:12px;color:#64748B;margin-bottom:10px;">Alertes prioritaires + Pack Builder + Intelligence Voyage</div>
          <a href="${appUrl}/pricing" style="background:#0F172A;color:#FFD700;padding:9px 20px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700;display:inline-block;">4,99$/mois</a>
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:28px;font-size:11px;color:#94A3B8;">
          <p>Tu reçois cet email car tu as activé les alertes sur GeaiMonVol.</p>
          <p>GeaiMonVol — Les meilleurs deals aériens depuis Montréal</p>
        </div>
      </div>
    </body>
    </html>`;
}

export async function sendWeeklyDigest(to: string, userName: string, deals: DealData[]) {
    const resend = getResendClient();
    if (!resend) return null;

    const bestDeal = deals[0];
    const highlight = bestDeal ? `${bestDeal.destination} à ${Math.round(bestDeal.price)}$` : `${deals.length} deals`;

    return await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `📬 Top deals de la semaine — ${highlight}`,
        html: buildWeeklyDigestHtml(userName, deals),
    });
}
