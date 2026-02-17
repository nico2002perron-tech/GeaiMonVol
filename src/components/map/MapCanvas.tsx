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

// Countries with deals — Set for O(1) lookup
const COUNTRIES_WITH_DEALS = new Set([
    'France', 'Spain', 'Portugal', 'Italy', 'Cuba', 'Mexico',
    'Dominican Republic', 'United States of America', 'Thailand',
    'United Arab Emirates', 'Canada', 'Greece', 'Ireland',
    'Netherlands', 'United Kingdom', 'Morocco', 'Japan',
    'Colombia', 'Peru', 'Brazil', 'Indonesia', 'Costa Rica',
    'Jamaica', 'Vietnam',
]);

// Module-level cache for world atlas (persists across remounts)
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

    // Load world atlas once (cached at module level)
    useEffect(() => {
        loadWorldAtlas().then(setWorldData).catch(() => { });
    }, []);

    // Resize handler
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

    // Projection — memoized on dimensions + mobile
    const projection = useMemo(() => {
        if (dimensions.width === 0) return null;
        const proj = d3.geoNaturalEarth1();
        if (isMobile) {
            proj.center([10, 20]).scale(dimensions.width / 3.5).translate([dimensions.width / 2, dimensions.height / 2]);
        } else {
            proj.center([15, 20]).scale(dimensions.width / 4.5).translate([dimensions.width / 2, dimensions.height / 2]);
        }
        return proj;
    }, [dimensions.width, dimensions.height, isMobile]);

    // Filter deals by mapView
    const visibleDeals = useMemo(() => {
        return (deals || []).filter((deal) => {
            const code = deal.destination_code || deal.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            return mapView === 'canada' ? isCanadian : !isCanadian;
        });
    }, [deals, mapView]);

    // Calculate pin positions — no more JSON.stringify, uses useMemo
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

    // YUL (Montréal) position for arcs
    const yulPos = useMemo(() => {
        if (!projection) return null;
        return projection([-73.74, 45.47]);
    }, [projection]);

    // Stable ref for onRegionSelect to avoid re-rendering land paths
    const onRegionSelectRef = useRef(onRegionSelect);
    onRegionSelectRef.current = onRegionSelect;

    // D3: render ONLY land paths (geography). Pins are 100% React.
    useEffect(() => {
        if (!svgRef.current || !projection || !worldData?.objects) return;

        const svg = d3.select(svgRef.current);
        let g = svg.select<SVGGElement>('g.d3-land');
        if (g.empty()) {
            // Insert the D3 layer BEFORE the React layer so pins render on top
            g = svg.insert('g', ':first-child').attr('class', 'd3-land');
        }

        const path = d3.geoPath().projection(projection);

        // Setup zoom (once)
        if (!zoomInitializedRef.current) {
            const reactG = svg.select<SVGGElement>('g.react-overlay');
            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 8])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform.toString());
                    reactG.attr('transform', event.transform.toString());
                });
            svg.call(zoom);
            zoomInitializedRef.current = true;
        }

        // Clear and re-render land (needed when projection changes)
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
            // Silently fail — land will just not render
        }
    }, [projection, worldData]);

    // Arc path helper
    const getArcPath = useCallback((toX: number, toY: number) => {
        if (!yulPos) return '';
        const midX = (yulPos[0] + toX) / 2;
        const midY = Math.min(yulPos[1], toY) - 50;
        return `M${yulPos[0]},${yulPos[1]} Q${midX},${midY} ${toX},${toY}`;
    }, [yulPos]);

    return (
        <div id="map-container" style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
            <svg
                id="map-svg"
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ display: 'block' }}
            >
                {/* D3 inserts g.d3-land here via useEffect */}

                {/* React-managed overlay: arcs + pins + badges */}
                <g className="react-overlay">
                    {/* Flight arcs */}
                    {yulPos && pins.map((pin, i) => (
                        <path
                            key={`arc-${pin.deal.destination_code || i}`}
                            d={getArcPath(pin.x, pin.y)}
                            stroke="#2E7DDB"
                            strokeWidth={1}
                            fill="none"
                            opacity={0.3}
                            strokeDasharray="4,4"
                        />
                    ))}

                    {/* Deal pins */}
                    {pins.map((pin, i) => {
                        const discount = pin.deal.discount || pin.deal.disc || 0;
                        const cityName = pin.deal.city || pin.deal.destination || '';

                        return (
                            <g key={`pin-${pin.deal.destination_code || i}`}>
                                {/* Pin circle */}
                                <circle
                                    cx={pin.x}
                                    cy={pin.y}
                                    r={5}
                                    fill="#2E7DDB"
                                    stroke="white"
                                    strokeWidth={1.5}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => onHoverDeal(pin.deal, e)}
                                    onMouseLeave={onLeaveDeal}
                                    onClick={(e) => onSelectDeal?.(pin.deal, e)}
                                />

                                {/* City name — desktop only */}
                                {!isMobile && (
                                    <text
                                        x={pin.x}
                                        y={pin.y + 15}
                                        textAnchor="middle"
                                        fontSize="8.5px"
                                        fontWeight="700"
                                        fill="#1A2B42"
                                        fontFamily="'Outfit', sans-serif"
                                        style={{
                                            textShadow: '0 0 6px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {cityName}
                                    </text>
                                )}

                                {/* Discount badge */}
                                {discount > 0 && (
                                    <g
                                        transform={`translate(${pin.x}, ${pin.y - 20})`}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => onHoverDeal(pin.deal, e)}
                                        onMouseLeave={onLeaveDeal}
                                        onClick={(e) => onSelectDeal?.(pin.deal, e)}
                                    >
                                        <rect x={-28} y={-12} width={56} height={24} rx={12}
                                            fill="white" stroke="#FF4D6A" strokeWidth={1.5} />
                                        <circle cx={-18} cy={0} r={4} fill="#FF4D6A" />
                                        <text x={4} y={4} textAnchor="middle"
                                            fontSize="11px" fontWeight="700"
                                            fontFamily="'Outfit', sans-serif"
                                            fill="#FF4D6A">
                                            -{Math.abs(Math.round(discount))}%
                                        </text>
                                        <path d="M-4,12 L0,18 L4,12" fill="white" stroke="#FF4D6A" strokeWidth={1.5} />
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
