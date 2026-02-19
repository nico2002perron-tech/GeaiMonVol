'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getRegionForCountry } from '@/lib/data/regions';
import { PRIORITY_DESTINATIONS } from '@/lib/services/flights';

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Toronto': { lat: 43.65, lng: -79.38 },
    'Ottawa': { lat: 45.42, lng: -75.69 },
    'Vancouver': { lat: 49.28, lng: -123.12 },
    'Calgary': { lat: 51.05, lng: -114.07 },
    'Edmonton': { lat: 53.55, lng: -113.49 },
    'Winnipeg': { lat: 49.90, lng: -97.14 },
    'Halifax': { lat: 44.65, lng: -63.57 },
    'Québec': { lat: 46.81, lng: -71.21 },
    'Paris': { lat: 48.86, lng: 2.35 },
    'Cancún': { lat: 21.16, lng: -86.85 },
    'Punta Cana': { lat: 18.58, lng: -68.37 },
    'Cuba (Varadero)': { lat: 23.15, lng: -81.25 },
    'La Havane': { lat: 23.11, lng: -82.37 },
    'Fort Lauderdale': { lat: 26.12, lng: -80.14 },
    'New York': { lat: 40.71, lng: -74.01 },
    'Barcelone': { lat: 41.39, lng: 2.17 },
    'Lisbonne': { lat: 38.72, lng: -9.14 },
    'Rome': { lat: 41.90, lng: 12.50 },
    'Londres': { lat: 51.51, lng: -0.13 },
    'Marrakech': { lat: 31.63, lng: -8.01 },
    'Bangkok': { lat: 13.76, lng: 100.50 },
    'Tokyo': { lat: 35.68, lng: 139.69 },
    'Bogota': { lat: 4.71, lng: -74.07 },
    'Lima': { lat: -12.05, lng: -77.04 },
    'São Paulo': { lat: -23.55, lng: -46.63 },
    'Bali': { lat: -8.34, lng: 115.09 },
    'Miami': { lat: 25.76, lng: -80.19 },
    'Los Angeles': { lat: 34.05, lng: -118.24 },
    'Reykjavik': { lat: 64.15, lng: -21.94 },
    'Athènes': { lat: 37.98, lng: 23.73 },
    'Dublin': { lat: 53.35, lng: -6.26 },
    'Amsterdam': { lat: 52.37, lng: 4.90 },
    'Porto': { lat: 41.16, lng: -8.63 },
    'Madrid': { lat: 40.42, lng: -3.70 },
    'Montego Bay': { lat: 18.47, lng: -77.89 },
    'San José': { lat: 9.93, lng: -84.08 },
    'Cartagena': { lat: 10.39, lng: -75.51 },
    'Buenos Aires': { lat: -34.60, lng: -58.38 },
    'Ho Chi Minh': { lat: 10.82, lng: 106.63 },
};

const COUNTRIES_WITH_DEALS = new Set([
    'France', 'Spain', 'Portugal', 'Italy', 'Cuba', 'Mexico',
    'Dominican Republic', 'United States of America', 'Thailand',
    'United Arab Emirates', 'Canada', 'Greece', 'Ireland',
    'Netherlands', 'United Kingdom', 'Morocco', 'Japan',
    'Colombia', 'Peru', 'Brazil', 'Indonesia', 'Costa Rica',
    'Jamaica', 'Vietnam',
]);

// Badge colors by deal level
const BADGE_COLORS: Record<string, string> = {
    lowest_ever: '#7C3AED',
    incredible: '#DC2626',
    great: '#EA580C',
    good: '#2E7DDB',
    slight: '#2E7DDB',
    normal: '#2E7DDB',
};

// Module-level cache for world atlas
let worldAtlasCache: any = null;
let worldAtlasPromise: Promise<any> | null = null;

function loadWorldAtlas(): Promise<any> {
    if (worldAtlasCache) return Promise.resolve(worldAtlasCache);
    if (worldAtlasPromise) return worldAtlasPromise;
    worldAtlasPromise = d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then((data) => {
            worldAtlasCache = data;
            return data;
        });
    return worldAtlasPromise;
}

interface DealPin {
    deal: any;
    x: number;
    y: number;
}

interface MapCanvasProps {
    deals?: any[];
    mapView?: 'world' | 'canada';
    isMobile?: boolean;
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void;
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
}

function getCoords(deal: any): { lat: number; lng: number } | null {
    if (!deal) return null;
    const name = deal.destination || deal.city || '';
    if (CITY_COORDINATES[name]) return CITY_COORDINATES[name];
    const codeMatch = PRIORITY_DESTINATIONS.find(
        (p: any) => p.code === deal.destination_code || p.city === name
    );
    if (codeMatch && CITY_COORDINATES[codeMatch.city]) return CITY_COORDINATES[codeMatch.city];
    const lat = deal.lat || 0;
    const lng = deal.lon || deal.lng || 0;
    return (lat !== 0 || lng !== 0) ? { lat, lng } : null;
}

export default function MapCanvas({
    deals = [],
    mapView = 'world',
    isMobile = false,
    onRegionSelect,
    onHoverDeal,
    onLeaveDeal,
    onSelectDeal,
}: MapCanvasProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomInitializedRef = useRef(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [worldData, setWorldData] = useState<any>(null);

    useEffect(() => {
        loadWorldAtlas().then(setWorldData).catch(() => { });
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (!svgRef.current) return;
            const w = svgRef.current.clientWidth || window.innerWidth;
            const h = svgRef.current.clientHeight || window.innerHeight;
            setDimensions({ width: w, height: h });
        };
        window.addEventListener('resize', updateDimensions);
        const timer = setTimeout(updateDimensions, 50);
        return () => {
            window.removeEventListener('resize', updateDimensions);
            clearTimeout(timer);
        };
    }, []);

    const projection = useMemo(() => {
        if (dimensions.width === 0) return null;
        const proj = d3.geoNaturalEarth1();

        // Collect coordinates of visible deals to compute bounds
        const coords: [number, number][] = [];
        const filteredDeals = (deals || []).filter((deal) => {
            const code = deal.destination_code || deal.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            return mapView === 'canada' ? isCanadian : !isCanadian;
        });

        for (const deal of filteredDeals) {
            const c = getCoords(deal);
            if (c) coords.push([c.lng, c.lat]);
        }

        // Always include YUL (Montreal) as departure
        coords.push([-73.74, 45.47]);

        if (coords.length > 1) {
            // Compute bounding box
            const lngs = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            const padding = isMobile ? 40 : 60;

            // Use fitExtent to auto-fit all deal points
            const geojsonBounds: GeoJSON.Feature = {
                type: 'Feature',
                geometry: {
                    type: 'MultiPoint',
                    coordinates: coords,
                },
                properties: {},
            };

            proj.fitExtent(
                [[padding, padding], [dimensions.width - padding, dimensions.height - padding]],
                geojsonBounds
            );
        } else {
            // Fallback: default world view
            if (isMobile) {
                proj.center([10, 20]).scale(dimensions.width / 3.5).translate([dimensions.width / 2, dimensions.height / 2]);
            } else {
                proj.center([15, 20]).scale(dimensions.width / 4.5).translate([dimensions.width / 2, dimensions.height / 2]);
            }
        }

        return proj;
    }, [dimensions.width, dimensions.height, isMobile, mapView, deals]);

    const visibleDeals = useMemo(() => {
        return (deals || []).filter((deal) => {
            const code = deal.destination_code || deal.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            return mapView === 'canada' ? isCanadian : !isCanadian;
        });
    }, [deals, mapView]);

    const pins: DealPin[] = useMemo(() => {
        if (!projection) return [];
        const result: DealPin[] = [];
        for (const deal of visibleDeals) {
            const coords = getCoords(deal);
            if (!coords) continue;
            const projected = projection([coords.lng, coords.lat]);
            if (!projected) continue;
            result.push({ deal, x: projected[0], y: projected[1] });
        }
        return result;
    }, [visibleDeals, projection]);

    const yulPos = useMemo(() => {
        if (!projection) return null;
        return projection([-73.74, 45.47]);
    }, [projection]);

    const onRegionSelectRef = useRef(onRegionSelect);
    onRegionSelectRef.current = onRegionSelect;

    useEffect(() => {
        if (!svgRef.current || !projection || !worldData?.objects) return;

        const svg = d3.select(svgRef.current);
        let g = svg.select<SVGGElement>('g.d3-land');
        if (g.empty()) {
            g = svg.insert('g', ':first-child').attr('class', 'd3-land');
        }

        const path = d3.geoPath().projection(projection);

        if (!zoomInitializedRef.current) {
            // No user zoom/drag — the map auto-fits to deals
            // Remove any existing zoom behavior
            svg.on('.zoom', null);
            zoomInitializedRef.current = true;
        }

        g.selectAll('.land-path').remove();

        try {
            const countries = (topojson.feature(worldData, worldData.objects.countries) as any)
                .features.filter((f: any) => f?.properties?.name !== 'Antarctica');

            g.selectAll('.land-path')
                .data(countries)
                .enter()
                .append('path')
                .attr('class', (d: any) => {
                    const name = d.properties?.name || '';
                    return `land-path${COUNTRIES_WITH_DEALS.has(name) ? ' has-deal' : ''}`;
                })
                .attr('d', path as any)
                .attr('data-name', (d: any) => d.properties?.name || '')
                .attr('data-region', (d: any) => getRegionForCountry(d.properties?.name || '') || '')
                .on('mouseenter', function () {
                    const region = d3.select(this).attr('data-region');
                    if (!region) return;
                    g.selectAll('.land-path').each(function () {
                        const p = d3.select(this);
                        p.classed('region-hover', p.attr('data-region') === region);
                        p.classed('region-dimmed', p.attr('data-region') !== region);
                    });
                })
                .on('mouseleave', () => {
                    g.selectAll('.land-path')
                        .classed('region-hover', false)
                        .classed('region-dimmed', false);
                })
                .on('click', (_event: any, d: any) => {
                    const region = getRegionForCountry(d.properties?.name || '');
                    if (region) onRegionSelectRef.current(region);
                });
        } catch {
            // Silently fail
        }
    }, [projection, worldData]);

    const getArcPath = useCallback((toX: number, toY: number) => {
        if (!yulPos) return '';
        const midX = (yulPos[0] + toX) / 2;
        const midY = Math.min(yulPos[1], toY) - 50;
        return `M${yulPos[0]},${yulPos[1]} Q${midX},${midY} ${toX},${toY}`;
    }, [yulPos]);

    return (
        <div id="map-container" style={{ width: '100%', height: '100%', margin: 0, padding: 0, touchAction: 'none', overflow: 'hidden' }}>
            <svg
                id="map-svg"
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ display: 'block', transition: 'all 0.6s ease-in-out' }}
            >
                {/* SVG Defs for animated arc gradient + glow */}
                <defs>
                    <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.9} />
                        <stop offset="50%" stopColor="#38BDF8" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.3} />
                    </linearGradient>
                    <filter id="arcGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="pinGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* D3 inserts g.d3-land here via useEffect */}

                {/* React-managed overlay: arcs + pins + badges */}
                <g className="react-overlay">
                    {/* Flight arcs — animated dash with glow */}
                    {yulPos && pins.map((pin, i) => (
                        <path
                            key={`arc-${pin.deal.destination_code || i}`}
                            d={getArcPath(pin.x, pin.y)}
                            stroke="url(#arcGradient)"
                            strokeWidth={1.8}
                            fill="none"
                            opacity={0.6}
                            strokeDasharray="8,4"
                            className="flight-arc-animated"
                            filter="url(#arcGlow)"
                        />
                    ))}

                    {/* YUL departure pin — special */}
                    {yulPos && (
                        <g>
                            {/* Outer pulse ring */}
                            <circle
                                cx={yulPos[0]}
                                cy={yulPos[1]}
                                r={16}
                                fill="none"
                                stroke="#60A5FA"
                                strokeWidth={1.5}
                                opacity={0.3}
                                className="pin-glow-halo"
                            />
                            {/* Inner glow */}
                            <circle
                                cx={yulPos[0]}
                                cy={yulPos[1]}
                                r={8}
                                fill="#2E7DDB"
                                opacity={0.15}
                            />
                            {/* Pin dot */}
                            <circle
                                cx={yulPos[0]}
                                cy={yulPos[1]}
                                r={5}
                                fill="white"
                                stroke="#2E7DDB"
                                strokeWidth={2}
                                filter="url(#pinGlow)"
                            />
                            {/* YUL label */}
                            <text
                                x={yulPos[0]}
                                y={yulPos[1] - 12}
                                textAnchor="middle"
                                fontSize="9px"
                                fontWeight="800"
                                fill="white"
                                fontFamily="'Outfit', sans-serif"
                                opacity={0.9}
                                style={{ pointerEvents: 'none' }}
                            >
                                YUL
                            </text>
                        </g>
                    )}

                    {/* Deal pins with pulse/glow and colored badges — NO city names */}
                    {pins.map((pin, i) => {
                        const discount = pin.deal.discount || pin.deal.disc || 0;
                        const level = pin.deal.dealLevel || (discount >= 40 ? 'incredible' : discount >= 25 ? 'great' : 'good');
                        const pinColor = BADGE_COLORS[level] || '#2E7DDB';

                        return (
                            <g key={`pin-${pin.deal.destination_code || i}`}>
                                {/* Glow halo — pulse animation */}
                                <circle
                                    cx={pin.x}
                                    cy={pin.y}
                                    r={12}
                                    fill="none"
                                    stroke={pinColor}
                                    strokeWidth={2}
                                    opacity={0.4}
                                    className="pin-glow-halo"
                                />

                                {/* Pin circle */}
                                <circle
                                    cx={pin.x}
                                    cy={pin.y}
                                    r={5}
                                    fill={pinColor}
                                    stroke="rgba(255,255,255,0.9)"
                                    strokeWidth={1.5}
                                    style={{ cursor: 'pointer' }}
                                    className="pin-dot-pulse"
                                    filter="url(#pinGlow)"
                                    onMouseEnter={(e) => onHoverDeal(pin.deal, e)}
                                    onMouseLeave={onLeaveDeal}
                                    onClick={(e) => onSelectDeal?.(pin.deal, e)}
                                />

                                {/* Discount badge — colored by deal level */}
                                {discount > 0 && (
                                    <g
                                        transform={`translate(${pin.x}, ${pin.y - 18})`}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => onHoverDeal(pin.deal, e)}
                                        onMouseLeave={onLeaveDeal}
                                        onClick={(e) => onSelectDeal?.(pin.deal, e)}
                                    >
                                        <rect x={-22} y={-9} width={44} height={18} rx={9}
                                            fill={pinColor} opacity={0.95} />
                                        <text x={0} y={3} textAnchor="middle"
                                            fontSize="9.5px" fontWeight="800"
                                            fontFamily="'Outfit', sans-serif"
                                            fill="white">
                                            -{Math.abs(Math.round(discount))}%
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
