'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LandingHeader from '@/components/LandingHeader';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremium } from '@/lib/hooks/usePremium';
import '../../app/landing.css';

const VIBES = [
  { id: 'culture', icon: '🏛️', label: 'Culture & histoire' },
  { id: 'plage', icon: '🏖️', label: 'Plage & relaxation' },
  { id: 'aventure', icon: '🧗', label: 'Aventure & nature' },
  { id: 'gastronomie', icon: '🍽️', label: 'Gastronomie' },
  { id: 'nightlife', icon: '🎶', label: 'Nightlife & ambiance' },
  { id: 'famille', icon: '👨‍👩‍👧', label: 'En famille' },
];

const GROUPS = [
  { id: 'solo', icon: '🧳', label: 'Solo' },
  { id: 'couple', icon: '❤️', label: 'En couple' },
  { id: 'amis', icon: '👯', label: 'Entre amis' },
  { id: 'famille', icon: '👨‍👩‍👧', label: 'En famille' },
];

export default function PlanifierPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [group, setGroup] = useState('couple');
  const [vibe, setVibe] = useState('culture');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!destination || !departureDate || !returnDate) {
      setError('Remplis la destination et les dates.');
      return;
    }
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          departureDate,
          returnDate,
          quiz: { group, vibe, energy: 'moderate', food: 'local', accommodation: 'hotel', transport: 'mixed' },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setError(data.error || 'Passe Premium pour generer des guides hors Quebec.');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Erreur lors de la generation');
      }

      const data = await res.json();
      if (data.id) {
        router.push(`/library/${data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const chipStyle = (isActive: boolean) => ({
    padding: '10px 16px', borderRadius: 12, border: 'none',
    background: isActive ? '#0EA5E9' : 'rgba(14,165,233,0.06)',
    color: isActive ? '#fff' : '#334155',
    fontSize: 13, fontWeight: 600 as const,
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    display: 'flex' as const, alignItems: 'center' as const, gap: 6,
    minHeight: 44,
  });

  return (
    <div className="lp">
      <LandingHeader />

      <section style={{
        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        padding: '120px 24px 96px',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 100,
              background: 'rgba(14,165,233,0.1)', marginBottom: 16,
              fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: '#0EA5E9',
            }}>
              🗺️ Planificateur de voyage
            </div>
            <h1 style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700, color: '#fff',
              margin: '0 0 10px', lineHeight: 1.15,
            }}>
              Planifie ton voyage en 30 secondes
            </h1>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16, color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}>
              Dis-nous ou, quand et comment. GeaiAI fait le reste.
            </p>
          </div>

          {/* Form */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '32px 28px',
          }}>
            {/* Destination */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Ou veux-tu aller?
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Lisbonne, Cancun, Tokyo..."
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff',
                  fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  outline: 'none', minHeight: 48,
                }}
              />
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Depart
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: '#fff',
                    fontSize: 14, fontFamily: "'Outfit', sans-serif",
                    outline: 'none', minHeight: 48,
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Retour
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: '#fff',
                    fontSize: 14, fontFamily: "'Outfit', sans-serif",
                    outline: 'none', minHeight: 48,
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {/* Group */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Tu voyages...
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GROUPS.map(g => (
                  <button key={g.id} onClick={() => setGroup(g.id)} style={chipStyle(group === g.id)}>
                    <span>{g.icon}</span> {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Ton vibe
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {VIBES.map(v => (
                  <button key={v.id} onClick={() => setVibe(v.id)} style={chipStyle(vibe === v.id)}>
                    <span>{v.icon}</span> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#EF4444', fontSize: 13, fontFamily: "'Outfit', sans-serif",
                marginBottom: 16,
              }}>
                {error}
                {error.includes('Premium') && (
                  <Link href="/pricing" style={{ display: 'block', marginTop: 8, color: '#0EA5E9', fontWeight: 700, textDecoration: 'underline' }}>
                    Voir les plans Premium →
                  </Link>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 14,
                border: 'none',
                background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(14,165,233,0.3)',
                minHeight: 56,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  GeaiAI planifie ton voyage...
                </>
              ) : (
                <>
                  🗺️ Generer mon itineraire
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
                </>
              )}
            </button>

            {!isPremium && (
              <p style={{
                textAlign: 'center', marginTop: 12,
                fontFamily: "'Outfit', sans-serif", fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
              }}>
                Gratuit pour le Quebec · <Link href="/pricing" style={{ color: '#0EA5E9', textDecoration: 'underline' }}>Premium</Link> pour le monde entier
              </p>
            )}
          </div>
        </div>
      </section>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <FooterWithNewsletter />
    </div>
  );
}
