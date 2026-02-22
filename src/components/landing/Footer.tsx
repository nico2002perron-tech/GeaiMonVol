import Image from 'next/image';

export default function Footer() {
    return (
        <div style={{
            background: '#0F1A2A',
            padding: '30px 24px',
            textAlign: 'center',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginBottom: 8,
            }}>
                <div style={{ position: 'relative', width: 22, height: 22 }}>
                    <Image
                        src="/logo_geai.png"
                        alt="Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </div>
                <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700, fontSize: 15,
                    color: 'rgba(255,255,255,0.6)',
                }}>
                    Geai<span style={{ color: '#2E7DDB' }}>MonVol</span>
                </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                © {new Date().getFullYear()} GeaiMonVol · Fait avec ❤️ à Rimouski
            </p>
        </div>
    );
}
