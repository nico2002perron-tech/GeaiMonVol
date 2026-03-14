'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import '../../landing.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function DayCard({ day, isPremium }: { day: any; isPremium: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`gd-day${open ? ' gd-day-open' : ''}`}>
      <button className="gd-day-header" onClick={() => setOpen(!open)}>
        <div>
          <span className="gd-day-num">Jour {day.day}</span>
          <span className="gd-day-title">{day.title}</span>
          {day.theme && <span className="gd-day-theme">{day.theme}</span>}
        </div>
        <div className="gd-day-right">
          {day.total_cost != null && <span className="gd-day-cost">{Math.round(day.total_cost)}$</span>}
          <span className={`gd-chevron${open ? ' open' : ''}`}>&#9660;</span>
        </div>
      </button>

      {open && (
        <div className="gd-day-body">
          {/* Morning */}
          {day.morning && (
            <Activity label="Matin" icon="&#9728;" data={day.morning} />
          )}
          {day.getting_to_lunch && <Direction data={day.getting_to_lunch} />}

          {/* Lunch */}
          {day.lunch && (
            <Restaurant label="Dîner" icon="&#127860;" data={day.lunch} />
          )}
          {day.getting_to_afternoon && <Direction data={day.getting_to_afternoon} />}

          {/* Afternoon */}
          {day.afternoon && (
            <Activity label="Après-midi" icon="&#9728;" data={day.afternoon} />
          )}
          {day.getting_to_dinner && <Direction data={day.getting_to_dinner} />}

          {/* Dinner */}
          {day.dinner && (
            <Restaurant label="Souper" icon="&#127869;" data={day.dinner} />
          )}

          {/* Evening */}
          {day.evening && (
            <Activity label="Soirée" icon="&#127769;" data={day.evening} />
          )}
          {day.getting_back_hotel && <Direction data={day.getting_back_hotel} />}

          {/* PREMIUM — Plan B pluie */}
          {isPremium && day.rainy_plan && (
            <div className="gd-premium-block gd-rain">
              <div className="gd-premium-label">&#127783; Plan B pluie</div>
              <p><strong>{day.rainy_plan.activity}</strong> — {day.rainy_plan.location}</p>
              <p>{day.rainy_plan.description}</p>
              {day.rainy_plan.cost != null && <span className="gd-cost">{day.rainy_plan.cost}$</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Activity({ label, icon, data }: { label: string; icon: string; data: any }) {
  return (
    <div className="gd-slot">
      <div className="gd-slot-label"><span>{icon}</span> {label}</div>
      <h4>{data.activity}</h4>
      {data.location && <p className="gd-loc">{data.location}</p>}
      <p>{data.description}</p>
      <div className="gd-slot-meta">
        {data.duration && <span>&#9201; {data.duration}</span>}
        {data.cost != null && <span>&#128176; {data.cost}$</span>}
        {data.rating && <span>&#11088; {data.rating}</span>}
      </div>
      {data.tip && <p className="gd-tip">&#128161; {data.tip}</p>}
    </div>
  );
}

function Restaurant({ label, icon, data }: { label: string; icon: string; data: any }) {
  return (
    <div className="gd-slot gd-slot-resto">
      <div className="gd-slot-label"><span>{icon}</span> {label}</div>
      <h4>{data.name}</h4>
      {data.type && <span className="gd-resto-type">{data.type}</span>}
      {data.location && <p className="gd-loc">{data.location}</p>}
      <div className="gd-slot-meta">
        {data.cost != null && <span>&#128176; {data.cost}$</span>}
        {data.rating && <span>&#11088; {data.rating}</span>}
      </div>
      {data.must_try && <p className="gd-tip">&#127861; À essayer : {data.must_try}</p>}
    </div>
  );
}

function Direction({ data }: { data: any }) {
  if (!data || !data.mode) return null;
  return (
    <div className="gd-direction">
      <span>&#128694; {data.mode} — {data.duration}{data.distance ? ` (${data.distance})` : ''}</span>
    </div>
  );
}

export default function GuideDetailPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const params = useParams();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPremium = profile?.plan === 'premium';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch(`/api/guide/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setGuide(data))
      .catch(() => setError('Guide introuvable.'))
      .finally(() => setLoading(false));
  }, [user, authLoading, params.id]);

  if (loading || authLoading) {
    return (
      <div className="lp">
        <LandingHeader />
        <section className="gd-page">
          <div className="lb-loading"><div className="lb-spinner" /><p>Chargement...</p></div>
        </section>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="lp">
        <LandingHeader />
        <section className="gd-page">
          <div className="lb-empty">
            <p>{error || 'Guide introuvable.'}</p>
            <Link href="/library" className="lb-cta">Retour à la bibliothèque</Link>
          </div>
        </section>
      </div>
    );
  }

  const gd = guide.guide_data;
  const days = gd?.days || [];

  return (
    <div className="lp">
      <LandingHeader />

      <section className="gd-page">
        {/* Back link */}
        <Link href="/library" className="gd-back">&#8592; Mes guides</Link>

        {/* Header */}
        <div className="gd-header">
          <h1 className="gd-title">{gd?.title || guide.destination}</h1>
          <p className="gd-summary">{gd?.summary}</p>
          <div className="gd-meta-row">
            <span>&#128205; {guide.destination}{guide.country ? `, ${guide.country}` : ''}</span>
            <span>&#128197; {formatDate(guide.departure_date)} — {formatDate(guide.return_date)}</span>
            <span>&#128197; {days.length} jour{days.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Budget + Accommodation */}
        <div className="gd-info-grid">
          {/* Budget */}
          {gd?.budget_summary && (
            <div className="gd-info-card">
              <h3>&#128176; Budget estimé</h3>
              <div className="gd-budget-lines">
                {gd.budget_summary.flight != null && <div><span>Vol</span><strong>{Math.round(gd.budget_summary.flight)}$</strong></div>}
                {gd.budget_summary.accommodation_total != null && <div><span>Hébergement</span><strong>{Math.round(gd.budget_summary.accommodation_total)}$</strong></div>}
                {gd.budget_summary.food_total != null && <div><span>Nourriture</span><strong>{Math.round(gd.budget_summary.food_total)}$</strong></div>}
                {gd.budget_summary.activities_total != null && <div><span>Activités</span><strong>{Math.round(gd.budget_summary.activities_total)}$</strong></div>}
                {gd.budget_summary.transport_local_total != null && <div><span>Transport local</span><strong>{Math.round(gd.budget_summary.transport_local_total)}$</strong></div>}
              </div>
              {gd.budget_summary.total_per_person != null && (
                <div className="gd-budget-total">
                  <span>Total/personne</span>
                  <strong>{Math.round(gd.budget_summary.total_per_person)}$</strong>
                </div>
              )}
            </div>
          )}

          {/* Accommodation */}
          {gd?.accommodation && (
            <div className="gd-info-card">
              <h3>&#127968; Hébergement</h3>
              <p className="gd-accom-name">{gd.accommodation.name}</p>
              {gd.accommodation.neighborhood && <p className="gd-accom-detail">&#128205; {gd.accommodation.neighborhood}</p>}
              {gd.accommodation.type && <p className="gd-accom-detail">{gd.accommodation.type}</p>}
              {gd.accommodation.price_per_night != null && <p className="gd-accom-detail">&#128176; {gd.accommodation.price_per_night}$/nuit</p>}
              {gd.accommodation.rating && <p className="gd-accom-detail">&#11088; {gd.accommodation.rating}</p>}
              {gd.accommodation.tip && <p className="gd-tip">&#128161; {gd.accommodation.tip}</p>}
            </div>
          )}
        </div>

        {/* Highlights */}
        {gd?.highlights && gd.highlights.length > 0 && (
          <div className="gd-highlights">
            <h3>&#10024; Points forts</h3>
            <div className="gd-highlights-list">
              {gd.highlights.map((h: string, i: number) => (
                <span key={i} className="gd-highlight-chip">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* PREMIUM SECTIONS */}
        {isPremium && (gd?.insider_tips || gd?.hidden_gems || gd?.promo_codes) && (
          <div className="gd-premium-sections">
            {gd.insider_tips && gd.insider_tips.length > 0 && (
              <div className="gd-premium-card">
                <h3>&#128373; Tips d&apos;initiés</h3>
                <ul>
                  {gd.insider_tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {gd.hidden_gems && gd.hidden_gems.length > 0 && (
              <div className="gd-premium-card">
                <h3>&#128142; Expériences cachées locales</h3>
                <ul>
                  {gd.hidden_gems.map((gem: string, i: number) => (
                    <li key={i}>{gem}</li>
                  ))}
                </ul>
              </div>
            )}

            {gd.promo_codes && gd.promo_codes.length > 0 && (
              <div className="gd-premium-card">
                <h3>&#127915; Codes promo &amp; rabais</h3>
                <ul>
                  {gd.promo_codes.map((code: string, i: number) => (
                    <li key={i}>{code}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upsell for free users */}
        {!isPremium && (
          <div className="gd-upsell">
            <h3>&#9733; Débloquer plus avec Premium</h3>
            <p>Plan B pluie, tips d&apos;initiés, codes promo et expériences cachées locales.</p>
            <Link href="/pricing" className="lb-cta">Passer Premium</Link>
          </div>
        )}

        {/* Day-by-day itinerary */}
        <div className="gd-days">
          <h2 className="gd-days-title">Itinéraire jour par jour</h2>
          {days.map((day: any, i: number) => (
            <DayCard key={i} day={day} isPremium={isPremium} />
          ))}
        </div>

        {/* Packing list */}
        {gd?.packing_list && gd.packing_list.length > 0 && (
          <div className="gd-packing">
            <h3>&#127890; Quoi apporter</h3>
            <div className="gd-packing-list">
              {gd.packing_list.map((item: string, i: number) => (
                <span key={i} className="gd-packing-item">&#10003; {item}</span>
              ))}
            </div>
          </div>
        )}

        {/* Region tips */}
        {gd?.region_tips && (
          <div className="gd-region-tips">
            <h3>&#128161; Conseils pour la région</h3>
            <p>{gd.region_tips}</p>
          </div>
        )}
      </section>
    </div>
  );
}
