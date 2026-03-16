'use client';

interface CompareDeal {
    destination: string;
    destination_code: string;
    price: number;
    totalPackPrice?: number;
    airline?: string;
    stops?: number;
    dealLevel?: string;
    discount?: number;
    hotelPrice?: number;
    hotelName?: string;
    hotelStars?: number;
    hotelRating?: number;
    departure_date?: string;
    return_date?: string;
}

interface DestinationComparatorProps {
    isOpen: boolean;
    onClose: () => void;
    deals: CompareDeal[];
    onRemove: (destination: string) => void;
}

export default function DestinationComparator({ isOpen, onClose, deals, onRemove }: DestinationComparatorProps) {
    if (!isOpen || deals.length === 0) return null;

    const maxPrice = Math.max(...deals.map(d => d.totalPackPrice || d.price));
    const minPrice = Math.min(...deals.map(d => d.totalPackPrice || d.price));

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 600,
                background: 'rgba(2, 8, 16, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
                animation: 'compareFadeIn 0.25s ease-out',
            }}
        >
            <div style={{
                background: '#fff', borderRadius: 24,
                boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
                width: '100%', maxWidth: 700,
                maxHeight: 'calc(100vh - 64px)',
                overflow: 'auto',
                animation: 'compareSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <h3 style={{
                            margin: 0, fontSize: 18, fontWeight: 700,
                            fontFamily: "'Fredoka', sans-serif", color: '#0F172A',
                        }}>
                            Comparateur
                        </h3>
                        <p style={{
                            margin: '4px 0 0', fontSize: 12, color: '#64748B',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            {deals.length} destination{deals.length > 1 ? 's' : ''} selectionnee{deals.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: '#F1F5F9', cursor: 'pointer', fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>&times;</button>
                </div>

                {/* Comparison grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(deals.length, 3)}, 1fr)`,
                    gap: 0,
                }}>
                    {deals.map((deal, i) => {
                        const price = deal.totalPackPrice || deal.price;
                        const isCheapest = price === minPrice;

                        return (
                            <div key={deal.destination} style={{
                                padding: '20px 16px',
                                borderRight: i < deals.length - 1 ? '1px solid #E2E8F0' : 'none',
                                background: isCheapest ? 'rgba(16,185,129,0.03)' : 'transparent',
                                position: 'relative',
                            }}>
                                {/* Remove button */}
                                <button onClick={() => onRemove(deal.destination)} style={{
                                    position: 'absolute', top: 8, right: 8,
                                    width: 20, height: 20, borderRadius: '50%', border: 'none',
                                    background: '#F1F5F9', cursor: 'pointer', fontSize: 12,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#94A3B8',
                                }}>&times;</button>

                                {/* Cheapest badge */}
                                {isCheapest && deals.length > 1 && (
                                    <div style={{
                                        fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                                        background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                                        fontFamily: "'Fredoka', sans-serif", display: 'inline-block',
                                        marginBottom: 8,
                                    }}>
                                        MEILLEUR PRIX
                                    </div>
                                )}

                                {/* Destination name */}
                                <div style={{
                                    fontSize: 16, fontWeight: 700, color: '#0F172A',
                                    fontFamily: "'Fredoka', sans-serif", marginBottom: 4,
                                }}>
                                    {deal.destination}
                                </div>
                                <div style={{
                                    fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                                    marginBottom: 16,
                                }}>
                                    {deal.destination_code}
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{
                                        fontSize: 28, fontWeight: 700, color: isCheapest ? '#059669' : '#0F172A',
                                        fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                    }}>
                                        {Math.round(price)} $
                                    </div>
                                    <div style={{
                                        fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 2,
                                    }}>
                                        {deal.totalPackPrice ? 'vol + hotel' : 'vol A/R'}
                                    </div>
                                    {deal.discount != null && deal.discount > 0 && (
                                        <span style={{
                                            display: 'inline-block', marginTop: 4,
                                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                            background: '#10B981', color: '#fff',
                                        }}>
                                            -{deal.discount}%
                                        </span>
                                    )}
                                </div>

                                {/* Details rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                    {/* Flight */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                        <span>Vol</span>
                                        <span style={{ fontWeight: 600 }}>{Math.round(deal.price)} $</span>
                                    </div>
                                    {deal.airline && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                            <span>Compagnie</span>
                                            <span style={{ fontWeight: 600 }}>{deal.airline}</span>
                                        </div>
                                    )}
                                    {deal.stops != null && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                            <span>Escales</span>
                                            <span style={{ fontWeight: 600 }}>{deal.stops === 0 ? 'Direct' : deal.stops}</span>
                                        </div>
                                    )}
                                    {/* Hotel */}
                                    {deal.hotelPrice != null && (
                                        <>
                                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8 }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                                <span>Hotel/nuit</span>
                                                <span style={{ fontWeight: 600 }}>{Math.round(deal.hotelPrice)} $</span>
                                            </div>
                                            {deal.hotelName && (
                                                <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {deal.hotelName}
                                                </div>
                                            )}
                                            {deal.hotelStars != null && deal.hotelStars > 0 && (
                                                <div style={{ color: '#F59E0B', letterSpacing: -1, fontSize: 13 }}>
                                                    {'★'.repeat(Math.min(deal.hotelStars, 5))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Price bar visual */}
                                <div style={{ marginTop: 16 }}>
                                    <div style={{
                                        height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            width: `${maxPrice > 0 ? (price / maxPrice) * 100 : 100}%`,
                                            background: isCheapest
                                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                : 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
                                            transition: 'width 0.5s',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes compareFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes compareSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
