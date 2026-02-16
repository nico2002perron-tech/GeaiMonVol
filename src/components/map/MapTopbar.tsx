'use client';

export default function MapTopbar() {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'linear-gradient(180deg, rgba(244,248,251,0.95) 60%, rgba(244,248,251,0))',
            pointerEvents: 'none',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                pointerEvents: 'auto',
            }}>
                <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M3.64 14.26c-.24-.24-.24-.63 0-.87l6.36-6.36c.48-.48 1.12-.74 1.8-.74s1.32.26 1.8.74l3.06 3.06.18-2.04c.08-.72.64-1.28 1.36-1.36.72-.08 1.38.32 1.6 1l2.2 6.8c.16.48.06 1-.24 1.38-.3.38-.76.58-1.24.52l-7.08-1.08c-.72-.1-1.28-.66-1.36-1.38-.08-.72.32-1.38 1-1.6l2.14-.74-2.42-2.42c-.24-.24-.56-.36-.88-.36s-.64.12-.88.36L4.68 14.53c-.24.24-.63.24-.87 0l-.17-.27z" />
                    </svg>
                </div>
                <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 19,
                    fontWeight: 700,
                    color: '#1A2B42',
                    letterSpacing: -0.3,
                }}>
                    Geai<span style={{ color: '#2E7DDB' }}>Mon</span>Vol
                </span>
            </div>

            {/* Center — subtle status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#8FA3B8',
                fontWeight: 500,
                fontFamily: "'Outfit', sans-serif",
                pointerEvents: 'auto',
            }}>
                <span style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#16A34A',
                    display: 'inline-block',
                }} />
                Deals en direct depuis YUL
            </div>

            {/* Right */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'auto',
            }}>
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '7px 14px',
                        borderRadius: 100,
                        background: 'rgba(255,255,255,0.85)',
                        border: '1px solid rgba(26,43,66,0.06)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#5A7089',
                        cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif",
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(46,125,219,0.2)';
                        e.currentTarget.style.color = '#2E7DDB';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(26,43,66,0.06)';
                        e.currentTarget.style.color = '#5A7089';
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Comment ça marche?
                </button>
            </div>
        </div>
    );
}
