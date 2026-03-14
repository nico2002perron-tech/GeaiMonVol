'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import '../../landing.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function DayCard({ day }: { day: any }) {
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
          {day.morning && <Slot label="Matin" icon="&#9728;" data={day.morning} />}
          {day.getting_to_lunch && <Dir data={day.getting_to_lunch} />}
          {day.lunch && <Resto label="Dîner" icon="&#127860;" data={day.lunch} />}
          {day.getting_to_afternoon && <Dir data={day.getting_to_afternoon} />}
          {day.afternoon && <Slot label="Après-midi" icon="&#9728;" data={day.afternoon} />}
          {day.getting_to_dinner && <Dir data={day.getting_to_dinner} />}
          {day.dinner && <Resto label="Souper" icon="&#127869;" data={day.dinner} />}
          {day.evening && <Slot label="Soirée" icon="&#127769;" data={day.evening} />}
          {day.getting_back_hotel && <Dir data={day.getting_back_hotel} />}
        </div>
      )}
    </div>
  );
}

function Slot({ label, icon, data }: { label: string; icon: string; data: any }) {
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

function Resto({ label, icon, data }: { label: string; icon: string; data: any }) {
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

function Dir({ data }: { data: any }) {
  if (!data?.mode) return null;
  return (
    <div className="gd-direction">
      <span>&#128694; {data.mode} — {data.duration}{data.distance ? ` (${data.distance})` : ''}</span>
    </div>
  );
}

export default function SharedGuidePage() {
  const params = useParams();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setGuide(data))
      .catch(() => setError('Ce guide n\'est plus disponible ou le lien est invalide.'))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="lp">
        <SharedHeader />
        <section className="gd-page">
          <div className="lb-loading"><div className="lb-spinner" /><p>Chargement...</p></div>
        </section>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="lp">
        <SharedHeader />
        <section className="gd-page">
          <div className="lb-empty">
            <p>{error || 'Guide introuvable.'}</p>
            <Link href="/" className="lb-cta">Découvrir GeaiMonVol</Link>
          </div>
        </section>
      </div>
    );
  }

  const gd = guide.guide_data;
  const days = gd?.days || [];

  return (
    <div className="lp">
      <SharedHeader />

      <section className="gd-page">
        {/* Shared badge */}
        <div className="share-badge">
          <span>&#128279;</span> Guide partagé via GeaiMonVol
        </div>

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
          {gd?.accommodation && (
            <div className="gd-info-card">
              <h3>&#127968; Hébergement</h3>
              <p className="gd-accom-name">{gd.accommodation.name}</p>
              {gd.accommodation.neighborhood && <p className="gd-accom-detail">&#128205; {gd.accommodation.neighborhood}</p>}
              {gd.accommodation.type && <p className="gd-accom-detail">{gd.accommodation.type}</p>}
              {gd.accommodation.price_per_night != null && <p className="gd-accom-detail">&#128176; {gd.accommodation.price_per_night}$/nuit</p>}
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

        {/* Premium upsell for shared view */}
        <div className="gd-upsell share-upsell">
          <h3>&#9733; Ce guide a été créé avec GeaiMonVol</h3>
          <p>Crée tes propres itinéraires IA personnalisés gratuitement !</p>
          <Link href="/auth" className="lb-cta">Créer mon guide gratuit</Link>
        </div>

        {/* Day-by-day */}
        <div className="gd-days">
          <h2 className="gd-days-title">Itinéraire jour par jour</h2>
          {days.map((day: any, i: number) => (
            <DayCard key={i} day={day} />
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

        {/* CTA footer */}
        <div className="share-footer-cta">
          <Link href="/" className="share-footer-logo">
            <Image src="/logo_geai.png" alt="GeaiMonVol" width={24} height={24} />
            <span>Geai<strong>MonVol</strong></span>
          </Link>
          <p>Les meilleurs deals aériens du Québec + guides IA personnalisés</p>
          <Link href="/auth" className="lb-cta">Commencer gratuitement</Link>
        </div>
      </section>
    </div>
  );
}

function SharedHeader() {
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link href="/" className="lp-logo">
          <Image src="/logo_geai.png" alt="GeaiMonVol" width={30} height={30} className="lp-logo-img" />
          <span className="lp-logo-text">Geai<strong>MonVol</strong></span>
        </Link>
        <div className="lp-header-right">
          <Link href="/auth" className="lp-h-login">Se connecter</Link>
          <Link href="/auth" className="lp-h-signup">Commencer</Link>
        </div>
      </div>
    </header>
  );
}
