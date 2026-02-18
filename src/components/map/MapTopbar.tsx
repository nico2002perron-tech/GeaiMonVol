import Link from 'next/link';

export default function MapTopbar({ prices = [] }: { prices?: any[] }) {
    return (
        <>
            {/* Header dark compact */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 28px',
                background: '#0F1A2A',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                zIndex: 100,
                flexShrink: 0,
            }}>
                {/* Left: Logo + Montreal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 20 }}>🐦</span>
                        <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'white',
                        }}>
                            Geai<span style={{ color: '#60A5FA' }}>MonVol</span>
                        </span>
                    </div>
                    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        Meilleurs prix depuis <span style={{ color: '#60A5FA', fontWeight: 700 }}>Montréal</span> ✈️
                    </span>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        padding: '4px 12px', borderRadius: 100,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                        display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    }}>
                        <span style={{ fontSize: 10 }}>⚡</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Premium 5$/mois</span>
                    </div>
                    <Link href="/recits" style={{
                        padding: '5px 14px', borderRadius: 100, textDecoration: 'none',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                        ✍️ Partagez votre voyage
                    </Link>
                    <button style={{
                        padding: '5px 14px', borderRadius: 100, border: 'none',
                        background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                        color: 'white', fontWeight: 700, fontSize: 10, cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif",
                    }}>S'inscrire</button>
                </div>
            </div>

            {/* Bande bleue accent */}
            <div style={{
                height: 2,
                background: 'linear-gradient(90deg, #2E7DDB 0%, #06B6D4 50%, #7C3AED 100%)',
                opacity: 0.6,
                flexShrink: 0,
            }} />
        </>
    );
}
