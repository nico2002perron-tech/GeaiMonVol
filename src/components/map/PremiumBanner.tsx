export default function PremiumBanner() {
    return (
        <div style={{
            position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, background: 'linear-gradient(135deg, #1E40AF, #2E7DDB)',
            borderRadius: 12, padding: '10px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            color: 'white', fontSize: 13, fontWeight: 500,
            boxShadow: '0 4px 20px rgba(46,125,219,0.3)', pointerEvents: 'auto',
        }}>
            <span style={{ fontWeight: 700 }}>Voyageur Premium</span>
            <span style={{ opacity: 0.8 }}>Alertes perso, packs Vol + Hôtel, Guide IA gratuit</span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>5$/mois</span>
            <button style={{
                background: 'white', color: '#1E40AF', border: 'none',
                borderRadius: 8, padding: '6px 16px', fontWeight: 700,
                fontSize: 12, cursor: 'pointer',
            }}>
                Découvrir
            </button>
        </div>
    );
}
