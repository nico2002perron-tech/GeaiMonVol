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
    isMobile?: boolean;
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void;
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
}

export default function MapCanvas({ deals = [], mapView = 'world', isMobile = false, onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal }: MapCanvasProps) {
    console.log('[MapCanvas] deals:', deals?.length, deals);
    const svgRef = useRef<SVGSVGElement>(null);
    const [projection, setProjection] = useState<d3.GeoProjection | null>(null);
    const [pins, setPins] = useState<any[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateDimensions = () => {
            if (!svgRef.current) return;
            const w = svgRef.current.clientWidth || window.innerWidth;
            const h = svgRef.current.clientHeight || window.innerHeight;
            setDimensions({ width: w, height: h });

            const proj = d3.geoNaturalEarth1();

            if (isMobile) {
                proj
                    .center([10, 20])
                    .scale(w / 3.5)
                    .translate([w / 2, h / 2]);
            } else {
                proj
                    .center([15, 20])
                    .scale(w / 4.5)
                    .translate([w / 2, h / 2]);
            }
            setProjection(() => proj);
        };

        window.addEventListener('resize', updateDimensions);
        // Small timeout to ensure container is rendered
        const timer = setTimeout(updateDimensions, 50);
        return () => {
            window.removeEventListener('resize', updateDimensions);
            clearTimeout(timer);
        };
    }, [isMobile]);

    // Stable key for deals to avoid re-rendering pins if data hasn't changed
    const dealsKey = JSON.stringify((deals || []).map(d => (d.destination_code || d.code || '') + (d.price || 0)));

    // Filter deals based on mapView
    const visibleDeals = (deals || []).filter(deal => {
        const code = deal.destination_code || deal.code || '';
        const isCanadian = CANADA_CODES.includes(code);
        if (mapView === 'canada') return isCanadian;
        return !isCanadian;
    });

    // Main SVG Render
    useEffect(() => {
        try {
            if (!svgRef.current || !projection) return;

            const svg = d3.select(svgRef.current);
            let g = svg.select<SVGGElement>('g.map-content');
            if (g.empty()) {
                g = svg.append('g').attr('class', 'map-content');
            }

            // Reactivate Zoom & Pan
            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 8])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform.toString());
                });
            svg.call(zoom);

            const path = d3.geoPath().projection(projection);

            // Update existing land paths if they exist
            g.selectAll(".land-path").attr("d", path as any);

            // Clear pins, arcs, and badges before re-render to avoid flashing/duplicates
            g.selectAll('.deal-pin, .discount-badge, path.flight-arc, .deal-pin-halo').remove();

            // Check if land is already rendered
            const landPaths = g.selectAll(".land-path");
            if (landPaths.empty()) {
                d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
                    try {
                        if (!world || !world.objects) return;

                        const countries = (topojson.feature(world, world.objects.countries) as any).features.filter(
                            (f: any) => f?.properties?.name !== 'Antarctica'
                        );

                        // Land paths
                        g.selectAll(".land-path")
                            .data(countries)
                            .enter().append("path")
                            .attr("class", (d: any) => {
                                const countryName = d.properties?.name || '';
                                // Marquer les pays avec des deals
                                const CountriesWithDeals = [
                                    'France', 'Spain', 'Portugal', 'Italy', 'Cuba', 'Mexico',
                                    'Dominican Republic', 'United States of America', 'Thailand',
                                    'United Arab Emirates', 'Canada', 'Greece', 'Ireland',
                                    'Netherlands', 'United Kingdom', 'Morocco', 'Japan',
                                    'Colombia', 'Peru', 'Brazil', 'Indonesia', 'Costa Rica',
                                    'Jamaica', 'Vietnam'
                                ];
                                const hasDeal = CountriesWithDeals.includes(countryName);
                                return `land-path${hasDeal ? ' has-deal' : ''}`;
                            })
                            .attr("d", path as any)
                            .attr("data-name", (d: any) => d.properties?.name || '')
                            .attr("data-region", (d: any) => getRegionForCountry(d.properties?.name || '') || '')
                            // ... (on mouse events as before)
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

                        // Initial pin render
                        renderPins(g, visibleDeals, projection);
                    } catch (innerError) {
                        console.error('[MapCanvas] Error in topojson processing:', innerError);
                    }
                }).catch(fetchError => {
                    console.error('[MapCanvas] Error fetching world atlas:', fetchError);
                });
            } else {
                // Land is already there, just render pins
                renderPins(g, visibleDeals, projection);
            }
        } catch (error) {
            console.error('[MapCanvas] Error rendering pins:', error);
        }
    }, [projection, dealsKey, mapView]); // Stable dependencies

    // Refactored helper to render pins and arcs
    const renderPins = (g: any, dealsToRender: any[], proj: d3.GeoProjection) => {
        console.log('[MapCanvas] renderPins called with:', dealsToRender.length, 'deals');
        try {
            const yulCoords = proj([-73.74, 45.47]); // Montréal-Trudeau (YUL)

            // Helper for precise coordinates
            const getCoords = (deal: any): { lat: number; lng: number } | null => {
                if (!deal) return null;
                const name = deal.destination || deal.city || '';
                if (CITY_COORDINATES[name]) return CITY_COORDINATES[name];
                const codeMatch = PRIORITY_DESTINATIONS.find((p: any) => p.code === deal.destination_code || p.city === name);
                if (codeMatch && CITY_COORDINATES[codeMatch.city]) return CITY_COORDINATES[codeMatch.city];
                const lat = deal.lat || 0;
                const lng = deal.lon || deal.lng || 0;
                return (lat !== 0 || lng !== 0) ? { lat, lng } : null;
            };

            const newPins: any[] = [];

            dealsToRender.forEach((deal: any, idx: number) => {
                const coords = getCoords(deal);
                if (!coords) return;
                const projected = proj([coords.lng, coords.lat]);
                if (!projected) return;
                const [x, y] = projected;

                // Flight Arcs
                if (yulCoords) {
                    const midX = (yulCoords[0] + x) / 2;
                    const midY = Math.min(yulCoords[1], y) - 50;
                    g.append('path')
                        .attr('d', `M${yulCoords[0]},${yulCoords[1]} Q${midX},${midY} ${x},${y}`)
                        .attr('stroke', '#2E7DDB')
                        .attr('stroke-width', 1)
                        .attr('fill', 'none')
                        .attr('opacity', 0.3)
                        .attr('stroke-dasharray', '4,4')
                        .attr('class', 'flight-arc');
                }

                // Pins Group
                const pinG = g.append('g').attr('class', 'deal-pin-group');

                // Pins point
                pinG.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 5)
                    .attr('fill', '#2E7DDB').attr('stroke', 'white').attr('stroke-width', 1.5)
                    .attr('class', 'deal-pin')
                    .style('cursor', 'pointer')
                    .on("mouseenter", (e: any) => onHoverDeal(deal, e))
                    .on("mouseleave", onLeaveDeal)
                    .on("click", (e: any) => onSelectDeal?.(deal, e));

                // City Name (Desktop only)
                if (!isMobile) {
                    pinG.append('text')
                        .attr('x', x).attr('y', y + 15)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '8.5px')
                        .attr('font-weight', '700')
                        .attr('fill', '#1A2B42')
                        .attr('font-family', "'Outfit', sans-serif")
                        .style('text-shadow', '0 0 6px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)')
                        .style('pointer-events', 'none')
                        .text(deal.city || deal.destination || '');
                }

                // Badges
                const discount = deal.discount || deal.disc || 0;
                if (discount > 0) {
                    const badgeG = pinG.append('g')
                        .attr('transform', `translate(${x}, ${y - 20})`)
                        .attr('class', 'discount-badge')
                        .style('cursor', 'pointer')
                        .on("mouseenter", (e: any) => onHoverDeal(deal, e))
                        .on("mouseleave", onLeaveDeal)
                        .on("click", (e: any) => onSelectDeal?.(deal, e));

                    badgeG.append('rect').attr('x', -28).attr('y', -12).attr('width', 56).attr('height', 24).attr('rx', 12)
                        .attr('fill', 'white').attr('stroke', '#FF4D6A').attr('stroke-width', 1.5);
                    badgeG.append('circle').attr('cx', -18).attr('cy', 0).attr('r', 4).attr('fill', '#FF4D6A');
                    badgeG.append('text').attr('x', 4).attr('y', 4).attr('text-anchor', 'middle')
                        .attr('font-size', '11px').attr('font-weight', '700').attr('font-family', "'Outfit', sans-serif")
                        .attr('fill', '#FF4D6A').text(`-${Math.abs(Math.round(deal.discount || deal.percentage || deal.disc || 0))}%`);
                    badgeG.append('path').attr('d', 'M-4,12 L0,18 L4,12').attr('fill', 'white').attr('stroke', '#FF4D6A').attr('stroke-width', 1.5);
                }

                newPins.push({ deal, x, y, index: idx });
            });
            setPins(newPins);
        } catch (err) {
            console.error('[MapCanvas] renderPins error:', err);
        }
    };

    return (
        <div id="map-container" style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
            <svg id="map-svg" ref={svgRef} width={dimensions.width} height={dimensions.height} style={{ display: 'block' }}>
                <g className="map-content" />
            </svg>
        </div>
    );
}
