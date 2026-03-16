'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import DestinationHero from '@/components/destination/DestinationHero';
import PriceHistoryChart from '@/components/ui/PriceHistoryChart';
import PriceCalendar from '@/components/destination/PriceCalendar';
import BestMonths from '@/components/destination/BestMonths';
import { CITY_IMAGES, DEFAULT_CITY_IMAGE } from '@/lib/constants/deals';

interface DestinationClientProps {
    code: string;
    city: string;
    country: string;
}

export default function DestinationClient({ code, city, country }: DestinationClientProps) {
    // Deal data
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [dealLevel, setDealLevel] = useState('normal');
    const [discount, setDiscount] = useState(0);
    const [cheapestAirline, setCheapestAirline] = useState('');

    // History chart
    const [historyPoints, setHistoryPoints] = useState<Array<{ date: string; price: number }>>([]);
    const [historyAvg, setHistoryAvg] = useState(0);
    const [historyMin, setHistoryMin] = useState(0);
    const [historyMax, setHistoryMax] = useState(0);
    const [historyDays, setHistoryDays] = useState(30);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Calendar
    const [calendarDates, setCalendarDates] = useState<Record<string, any>>({});
    const [cheapestMonth, setCheapestMonth] = useState('');
    const [calendarLoading, setCalendarLoading] = useState(true);

    const imageUrl = CITY_IMAGES[city] || DEFAULT_CITY_IMAGE;

    // Fetch deal data (by IATA code for reliability)
    useEffect(() => {
        fetch(`/api/prices/destination?code=${code}`)
            .then(r => r.json())
            .then(data => {
                if (data.deals && data.deals.length > 0) {
                    const best = data.deals[0];
                    setCurrentPrice(Math.round(best.price));
                    setDealLevel(best.dealLevel || 'normal');
                    setDiscount(best.discount || 0);
                    setCheapestAirline(best.airline || '');
                }
            })
            .catch(() => {});
    }, [code]);

    // Fetch history (by IATA code)
    useEffect(() => {
        setHistoryLoading(true);
        fetch(`/api/prices/history?code=${code}&days=${historyDays}`)
            .then(r => r.json())
            .then(data => {
                setHistoryPoints(data.points || []);
                setHistoryAvg(data.avg || 0);
                setHistoryMin(data.min || 0);
                setHistoryMax(data.max || 0);
            })
            .catch(() => {})
            .finally(() => setHistoryLoading(false));
    }, [code, historyDays]);

    // Fetch calendar
    useEffect(() => {
        setCalendarLoading(true);
        fetch(`/api/prices/calendar?code=${code}&months=6`)
            .then(r => r.json())
            .then(data => {
                setCalendarDates(data.dates || {});
                setCheapestMonth(data.cheapestMonth || '');
            })
            .catch(() => {})
            .finally(() => setCalendarLoading(false));
    }, [code]);

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <Navbar dark />

            <main style={{
                maxWidth: 800,
                margin: '0 auto',
                padding: '90px 16px 40px',
            }}>
                {/* Back link */}
                <a
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: '#64748B',
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 500,
                        marginBottom: 16,
                    }}
                >
                    &larr; Retour au palmarès
                </a>

                {/* Hero */}
                <DestinationHero
                    destination={city}
                    destinationCode={code}
                    country={country}
                    currentPrice={currentPrice}
                    dealLevel={dealLevel}
                    discount={discount}
                    imageUrl={imageUrl}
                    cheapestAirline={cheapestAirline}
                />

                {/* Stats summary */}
                {historyAvg > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 12,
                        marginBottom: 24,
                    }}>
                        {[
                            { label: 'Prix actuel', value: currentPrice ? `${currentPrice} $` : '—', color: '#0EA5E9' },
                            { label: 'Moyenne 30j', value: `${historyAvg} $`, color: '#F59E0B' },
                            { label: 'Plus bas 30j', value: `${historyMin} $`, color: '#10B981' },
                            { label: 'Plus haut 30j', value: `${historyMax} $`, color: '#EF4444' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: '#fff',
                                borderRadius: 14,
                                border: '1px solid #E2E8F0',
                                padding: '14px 16px',
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    fontSize: 11,
                                    color: '#94A3B8',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 500,
                                    marginBottom: 4,
                                }}>
                                    {stat.label}
                                </div>
                                <div style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: stat.color,
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cheapest month callout */}
                {cheapestMonth && (
                    <div style={{
                        background: 'linear-gradient(135deg, #ECFDF5, #F0FDFA)',
                        border: '1px solid #A7F3D0',
                        borderRadius: 14,
                        padding: '12px 18px',
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <span style={{ fontSize: 20 }}>💡</span>
                        <span style={{
                            fontSize: 13,
                            color: '#065F46',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                        }}>
                            Le mois le moins cher pour partir à {city} est <strong>{cheapestMonth}</strong>
                        </span>
                    </div>
                )}

                {/* Price History Chart */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    padding: 20,
                    marginBottom: 24,
                }}>
                    <PriceHistoryChart
                        points={historyPoints}
                        avg={historyAvg}
                        min={historyMin}
                        max={historyMax}
                        days={historyDays}
                        onDaysChange={setHistoryDays}
                        loading={historyLoading}
                    />
                </div>

                {/* Price Calendar */}
                {!calendarLoading && Object.keys(calendarDates).length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <PriceCalendar dates={calendarDates} destinationCode={code} />
                    </div>
                )}

                {/* Best Months */}
                {!calendarLoading && Object.keys(calendarDates).length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <BestMonths dates={calendarDates} />
                    </div>
                )}

                {/* JSON-LD structured data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Product',
                            name: `Vol Montréal → ${city}`,
                            description: `Meilleur prix pour un vol aller-retour Montréal (YUL) → ${city} (${code})`,
                            offers: currentPrice ? {
                                '@type': 'Offer',
                                priceCurrency: 'CAD',
                                price: currentPrice,
                                availability: 'https://schema.org/InStock',
                            } : undefined,
                        }),
                    }}
                />
            </main>

            {/* Simple footer */}
            <footer style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderTop: '1px solid #E2E8F0',
                marginTop: 40,
            }}>
                <span style={{
                    fontSize: 12,
                    color: '#94A3B8',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    GeaiMonVol — Deals de vols depuis Montréal
                </span>
            </footer>
        </div>
    );
}
