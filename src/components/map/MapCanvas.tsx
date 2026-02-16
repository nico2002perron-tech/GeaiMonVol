'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { REGIONS, getRegionForCountry } from '@/lib/data/regions';
import { FLIGHTS } from '@/lib/data/flights';
import { PRIORITY_DESTINATIONS } from '@/lib/services/flights';
import MapPin from './MapPin';

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    // Canada
    'Toronto': { lat: 43.65, lng: -79.38 },
    'Ottawa': { lat: 45.42, lng: -75.69 },
    'Vancouver': { lat: 49.28, lng: -123.12 },
    'Calgary': { lat: 51.05, lng: -114.07 },
    'Edmonton': { lat: 53.55, lng: -113.49 },
    'Winnipeg': { lat: 49.90, lng: -97.14 },
    'Halifax': { lat: 44.65, lng: -63.57 },
    'Québec': { lat: 46.81, lng: -71.21 },
    // International
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

interface MapCanvasProps {
    deals?: any[];
    mapView?: 'world' | 'canada';
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void;
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
}

export default function MapCanvas({ deals = [], mapView = 'world', onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal }: MapCanvasProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [projection, setProjection] = useState<d3.GeoProjection | null>(null);
    const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const [pins, setPins] = useState<any[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateDimensions = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setDimensions({ width: w, height: h });

            const proj = d3.geoNaturalEarth1()
                .scale(w < 768 ? w / 4 : w / 5.5)
                .translate([w / 2, w < 768 ? h * 0.42 : h * 0.44])
                .center([10, 20]);
            setProjection(() => proj);
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Main SVG Render
    useEffect(() => {
        try {
            if (!svgRef.current || !projection) return;

            // Validation: Ensure deals exist before proceeding
            if (!deals || deals.length === 0) {
                console.log('[MapCanvas] No deals to render');
                return;
            }

            const svg = d3.select(svgRef.current);
            let g = svg.select<SVGGElement>('g.map-content');
            if (g.empty()) {
                g = svg.append('g').attr('class', 'map-content');
            }

            g.selectAll('*').remove();
            const path = d3.geoPath().projection(projection);

            d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
                try {
                    if (!world || !world.objects) return;

                    const countries = (topojson.feature(world, world.objects.countries) as any).features.filter(
                        (f: any) => f?.properties?.name !== 'Antarctica'
                    );

                    // 1. Graticule
                    const graticule = d3.geoGraticule().step([20, 20]);
                    g.append("path")
                        .datum(graticule())
                        .attr("class", "graticule")
                        .attr("d", path);

                    // 2. Land paths
                    g.selectAll(".land-path")
                        .data(countries)
                        .enter().append("path")
                        .attr("class", "land-path")
                        .attr("d", path as any)
                        .attr("data-name", (d: any) => d.properties?.name || '')
                        .attr("data-region", (d: any) => getRegionForCountry(d.properties?.name || '') || '')
                        .on("mouseenter", function (event: any, d: any) {
                            const countryName = d.properties?.name || '';
                            const region = getRegionForCountry(countryName);
                            if (!region) return;
                            g.selectAll(".land-path").each(function () {
                                const el = d3.select(this);
                                if (el.attr("data-region") === region) {
                                    el.classed("region-hover", true);
                                } else {
                                    el.classed("region-dimmed", true);
                                }
                            });
                        })
                        .on("mouseleave", function () {
                            g.selectAll(".land-path")
                                .classed("region-hover", false)
                                .classed("region-dimmed", false);
                        })
                        .on("click", (event: any, d: any) => {
                            const countryName = d.properties?.name || '';
                            const region = getRegionForCountry(countryName);
                            if (region) onRegionSelect(region);
                        });

                    // 3. Process pin data (With fixed coordinates)
                    const newPins: any[] = [];

                    // Helper for precise coordinates
                    const getCoords = (deal: any): { lat: number; lng: number } | null => {
                        if (!deal) return null;
                        const name = deal.destination || deal.city || '';
                        if (CITY_COORDINATES[name]) return CITY_COORDINATES[name];

                        const codeMatch = PRIORITY_DESTINATIONS.find((p: any) => p.code === deal.destination_code || p.city === name);
                        if (codeMatch && CITY_COORDINATES[codeMatch.city]) {
                            return CITY_COORDINATES[codeMatch.city];
                        }

                        const lat = deal.lat || 0;
                        const lng = deal.lon || deal.lng || 0;
                        if (lat !== 0 || lng !== 0) return { lat, lng };

                        return null;
                    };

                    const yulCoords = projection([-73.74, 45.47]); // Montréal-Trudeau (YUL)

                    (deals || []).forEach((deal: any, idx: number) => {
                        if (!deal) return;
                        const coords = getCoords(deal);
                        if (!coords) return;

                        const projected = projection([coords.lng, coords.lat]);
                        if (!projected) return;

                        const [x, y] = projected;

                        // A. Flight Arcs (From YUL)
                        if (yulCoords) {
                            const midX = (yulCoords[0] + x) / 2;
                            const midY = Math.min(yulCoords[1], y) - 50;
                            const pathData = `M${yulCoords[0]},${yulCoords[1]} Q${midX},${midY} ${x},${y}`;

                            g.append('path')
                                .attr('d', pathData)
                                .attr('stroke', '#2E7DDB')
                                .attr('stroke-width', 1)
                                .attr('fill', 'none')
                                .attr('opacity', 0.3)
                                .attr('stroke-dasharray', '4,4');
                        }

                        // B. Pin
                        g.append('circle')
                            .attr('cx', x)
                            .attr('cy', y)
                            .attr('r', 5)
                            .attr('fill', '#2E7DDB')
                            .attr('stroke', 'white')
                            .attr('stroke-width', 1.5)
                            .attr('class', 'deal-pin')
                            .style('cursor', 'pointer')
                            .on("mouseenter", (e) => onHoverDeal(deal, e))
                            .on("mouseleave", onLeaveDeal)
                            .on("click", (e) => onSelectDeal?.(deal, e));

                        // C. Discount Badge (Permanent)
                        const discount = deal.discount || deal.disc || 0;
                        if (discount > 0) {
                            const badgeG = g.append('g')
                                .attr('transform', `translate(${x}, ${y - 20})`)
                                .attr('class', 'discount-badge')
                                .style('cursor', 'pointer')
                                .on("mouseenter", (e) => onHoverDeal(deal, e))
                                .on("mouseleave", onLeaveDeal)
                                .on("click", (e) => onSelectDeal?.(deal, e));

                            badgeG.append('rect')
                                .attr('x', -28)
                                .attr('y', -12)
                                .attr('width', 56)
                                .attr('height', 24)
                                .attr('rx', 12)
                                .attr('fill', 'white')
                                .attr('stroke', '#FF4D6A')
                                .attr('stroke-width', 1.5);

                            badgeG.append('circle')
                                .attr('cx', -18)
                                .attr('cy', 0)
                                .attr('r', 4)
                                .attr('fill', '#FF4D6A');

                            badgeG.append('text')
                                .attr('x', 4)
                                .attr('y', 4)
                                .attr('text-anchor', 'middle')
                                .attr('font-size', '11px')
                                .attr('font-weight', '700')
                                .attr('font-family', "'Outfit', sans-serif")
                                .attr('fill', '#FF4D6A')
                                .text(`-${discount}%`);

                            badgeG.append('path')
                                .attr('d', 'M-4,12 L0,18 L4,12')
                                .attr('fill', 'white')
                                .attr('stroke', '#FF4D6A')
                                .attr('stroke-width', 1.5);
                        }

                        newPins.push({ deal, x, y, index: idx });
                    });
                    setPins(newPins);
                } catch (innerError) {
                    console.error('[MapCanvas] Error in topojson processing:', innerError);
                }
            }).catch(fetchError => {
                console.error('[MapCanvas] Error fetching world atlas:', fetchError);
            });
        } catch (error) {
            console.error('[MapCanvas] Error rendering pins:', error);
        }
    }, [projection, deals]);

    // Pan/Zoom Handlers (Simple)
    useEffect(() => {
        const container = document.getElementById('map-container');
        if (!container) return;
        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setTransform(prev => ({ ...prev, k: Math.min(6, Math.max(1, prev.k + delta)) }));
        };
        container.addEventListener('wheel', wheelHandler, { passive: false });
        return () => container.removeEventListener('wheel', wheelHandler);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => { lastPos.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!lastPos.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { lastPos.current = null; };

    return (
        <div
            id="map-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: lastPos.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
            <div className="map-transform-wrapper" style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                transformOrigin: '0 0',
                transition: 'transform 0.1s ease-out'
            }}>
                <svg id="map-svg" ref={svgRef} width={dimensions.width} height={dimensions.height}>
                    <g className="map-content" />
                </svg>
            </div>
        </div>
    );
}
