'use client';

import { useState, useRef, useCallback } from 'react';

interface PricePoint {
    date: string;
    price: number;
}

interface PriceHistoryChartProps {
    points: PricePoint[];
    avg: number;
    min: number;
    max: number;
    days: number;
    onDaysChange: (days: number) => void;
    loading?: boolean;
}

const MONTH_NAMES = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export default function PriceHistoryChart({
    points,
    avg,
    min,
    max,
    days,
    onDaysChange,
    loading,
}: PriceHistoryChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Chart dimensions
    const width = 460;
    const height = 160;
    const padTop = 20;
    const padBottom = 28;
    const padLeft = 48;
    const padRight = 16;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const prices = points.map((p) => p.price);
    const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
    const priceMax = prices.length > 0 ? Math.max(...prices) : 1;
    const range = priceMax - priceMin || 1;
    // Add 10% padding to Y range
    const yMin = priceMin - range * 0.1;
    const yMax = priceMax + range * 0.1;
    const yRange = yMax - yMin || 1;

    // Convert data point to SVG coordinates
    const toX = (i: number) => padLeft + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2);
    const toY = (price: number) => padTop + chartH - ((price - yMin) / yRange) * chartH;

    // SVG path for the line
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`).join(' ');

    // Area fill path
    const areaPath = points.length > 0
        ? `${linePath} L${toX(points.length - 1).toFixed(1)},${(padTop + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(padTop + chartH).toFixed(1)} Z`
        : '';

    // Average line Y position
    const avgY = toY(avg);

    // Y-axis labels (3 ticks: min, mid, max)
    const yTicks = [
        { value: priceMin, y: toY(priceMin) },
        { value: Math.round((priceMin + priceMax) / 2), y: toY((priceMin + priceMax) / 2) },
        { value: priceMax, y: toY(priceMax) },
    ];

    // X-axis labels (show ~4-5 evenly spaced dates)
    const xLabelCount = Math.min(points.length, 5);
    const xLabels = [];
    for (let i = 0; i < xLabelCount; i++) {
        const idx = xLabelCount <= 1 ? 0 : Math.round((i / (xLabelCount - 1)) * (points.length - 1));
        xLabels.push({ idx, label: formatDateLabel(points[idx].date), x: toX(idx) });
    }

    // Mouse hover
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (!svgRef.current || points.length === 0) return;
            const rect = svgRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const relX = mouseX - padLeft;
            const idx = Math.round((relX / chartW) * (points.length - 1));
            setHoveredIdx(Math.max(0, Math.min(points.length - 1, idx)));
        },
        [points.length, chartW]
    );

    const dayOptions = [30, 60, 90] as const;

    const hasData = points.length >= 2;

    return (
        <div>
            {/* Header with title + day toggle */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
            }}>
                <div style={{
                    fontSize: 13, fontWeight: 600, color: '#0F172A',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Historique des prix
                </div>

                {/* Day toggle */}
                <div style={{
                    display: 'flex', gap: 2,
                    background: '#F1F5F9', borderRadius: 8, padding: 2,
                }}>
                    {dayOptions.map((d) => (
                        <button
                            key={d}
                            onClick={() => onDaysChange(d)}
                            style={{
                                padding: '4px 10px', borderRadius: 6,
                                border: 'none', cursor: 'pointer',
                                fontSize: 11, fontWeight: 600,
                                fontFamily: "'Outfit', sans-serif",
                                background: days === d ? '#fff' : 'transparent',
                                color: days === d ? '#0F172A' : '#94A3B8',
                                boxShadow: days === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {d}j
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart container */}
            <div style={{
                padding: '12px 12px 8px',
                borderRadius: 16,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                position: 'relative',
            }}>
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 16,
                        background: 'rgba(248,250,252,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2,
                    }}>
                        <div style={{
                            fontSize: 12, color: '#94A3B8',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Chargement...
                        </div>
                    </div>
                )}

                {!hasData && !loading && (
                    <div style={{
                        height: height, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94A3B8', fontSize: 13,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Pas assez de donnees pour afficher le graphique
                    </div>
                )}

                {hasData && (
                    <>
                        <svg
                            ref={svgRef}
                            width="100%"
                            height={height}
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ display: 'block', cursor: 'crosshair' }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            {/* Grid lines */}
                            {yTicks.map((tick, i) => (
                                <line
                                    key={i}
                                    x1={padLeft}
                                    y1={tick.y}
                                    x2={width - padRight}
                                    y2={tick.y}
                                    stroke="#E2E8F0"
                                    strokeWidth={0.5}
                                />
                            ))}

                            {/* Area fill */}
                            <path d={areaPath} fill="url(#areaGrad)" />

                            {/* Price line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#0EA5E9"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Average line (dashed) */}
                            <line
                                x1={padLeft}
                                y1={avgY}
                                x2={width - padRight}
                                y2={avgY}
                                stroke="#F59E0B"
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                                opacity={0.8}
                            />

                            {/* Average label */}
                            <text
                                x={width - padRight + 2}
                                y={avgY + 3}
                                fontSize="9"
                                fill="#F59E0B"
                                fontWeight="600"
                                fontFamily="'Outfit', sans-serif"
                            >
                                moy
                            </text>

                            {/* Y-axis labels */}
                            {yTicks.map((tick, i) => (
                                <text
                                    key={i}
                                    x={padLeft - 6}
                                    y={tick.y + 3}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#94A3B8"
                                    fontFamily="'Fredoka', sans-serif"
                                >
                                    {tick.value}$
                                </text>
                            ))}

                            {/* X-axis labels */}
                            {xLabels.map((label, i) => (
                                <text
                                    key={i}
                                    x={label.x}
                                    y={height - 6}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="#94A3B8"
                                    fontFamily="'Outfit', sans-serif"
                                >
                                    {label.label}
                                </text>
                            ))}

                            {/* Data point dots */}
                            {points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={toX(i)}
                                    cy={toY(p.price)}
                                    r={hoveredIdx === i ? 4 : 2}
                                    fill={hoveredIdx === i ? '#0284C7' : '#0EA5E9'}
                                    stroke="#fff"
                                    strokeWidth={hoveredIdx === i ? 2 : 0}
                                    style={{ transition: 'r 0.15s, fill 0.15s' }}
                                />
                            ))}

                            {/* Hover vertical line */}
                            {hoveredIdx !== null && (
                                <line
                                    x1={toX(hoveredIdx)}
                                    y1={padTop}
                                    x2={toX(hoveredIdx)}
                                    y2={padTop + chartH}
                                    stroke="#0EA5E9"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                    opacity={0.5}
                                />
                            )}

                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Hover tooltip */}
                        {hoveredIdx !== null && points[hoveredIdx] && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `calc(${((toX(hoveredIdx) / width) * 100).toFixed(1)}% - 40px)`,
                                    top: 4,
                                    background: '#0F172A',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: "'Fredoka', sans-serif",
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 3,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                }}
                            >
                                {Math.round(points[hoveredIdx].price)} $ — {formatDateLabel(points[hoveredIdx].date)}
                            </div>
                        )}

                        {/* Stats bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-around',
                            marginTop: 8, padding: '8px 0 4px',
                            borderTop: '1px solid #E2E8F0',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 10, color: '#94A3B8',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 500,
                                }}>
                                    Min
                                </div>
                                <div style={{
                                    fontSize: 15, fontWeight: 700, color: '#16A34A',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {min} $
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 10, color: '#94A3B8',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 500,
                                }}>
                                    Moyenne
                                </div>
                                <div style={{
                                    fontSize: 15, fontWeight: 700, color: '#F59E0B',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {avg} $
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 10, color: '#94A3B8',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 500,
                                }}>
                                    Max
                                </div>
                                <div style={{
                                    fontSize: 15, fontWeight: 700, color: '#DC2626',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {max} $
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
