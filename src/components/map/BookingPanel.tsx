'use client';

interface BookingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFlight: any;
}

export default function BookingPanel({ isOpen, onClose, selectedFlight }: BookingPanelProps) {
    return (
        <div className={`book-panel ${isOpen ? 'open' : ''}`}>
            <div className="book-header">
                <button className="book-back" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Retour
                </button>
                <div className="book-title">
                    {selectedFlight?.city || 'Réservation'}
                </div>
                <div className="book-subtitle">
                    {selectedFlight?.route} · {selectedFlight?.dates}
                </div>
            </div>
            <div className="book-content">
                {selectedFlight && (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                            {selectedFlight.price} $
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                            Aller-retour · {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} escale(s)`}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
