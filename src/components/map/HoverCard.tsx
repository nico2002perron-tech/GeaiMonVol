'use client';

import { Flight } from '@/lib/data/flights';

interface HoverCardProps {
    deal: Flight | null;
    x: number;
    y: number;
    visible: boolean;
}

export default function HoverCard({ deal, x, y, visible }: HoverCardProps) {
    if (!deal || !visible) return null;

    // Keep card within viewport
    const cardWidth = 264;
    const cardHeight = 220;
    const adjustedX = Math.min(x + 16, window.innerWidth - cardWidth - 20);
    const adjustedY = y + cardHeight > window.innerHeight
        ? y - cardHeight - 10
        : y + 16;

    return (
        <div
            className={`hcard ${visible ? 'show' : ''}`}
            style={{
                left: adjustedX,
                top: adjustedY,
            }}
        >
            <div className="hcard-inner">
                <img className="hcard-img" src={deal.img} alt={deal.city} />
                <div className="hcard-body">
                    <div className="hcard-top">
                        <div>
                            <div className="hcard-city">{deal.city}</div>
                            <div className="hcard-country">{deal.country}</div>
                        </div>
                        <div className="hcard-price-col">
                            <div className="hcard-price">{deal.price} $</div>
                            <div className="hcard-old">{deal.oldPrice} $</div>
                        </div>
                    </div>
                    <div className="hcard-meta">
                        <span>{deal.route}</span>
                        <span>{deal.dates}</span>
                    </div>
                    <div className="hcard-tags">
                        {deal.tags.map((tag, i) => (
                            <span
                                key={i}
                                className={`hcard-tag ${tag === 'Hot' ? 't-hot' :
                                        tag === 'Direct' ? 't-direct' :
                                            tag === 'Eco' ? 't-eco' : ''
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                        <span className="hcard-tag t-hot">-{deal.disc}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
