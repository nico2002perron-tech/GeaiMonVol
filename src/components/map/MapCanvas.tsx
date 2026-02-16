'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { REGIONS, getRegionForCountry } from '@/lib/data/regions';
import { FLIGHTS } from '@/lib/data/flights';
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
        if (!svgRef.current || !projection) return;

        const svg = d3.select(svgRef.current);
        let g = svg.select<SVGGElement>('g.map-content');
        if (g.empty()) {
            g = svg.append('g').attr('class', 'map-content');
        }

        g.selectAll('*').remove();
        const path = d3.geoPath().projection(projection);

        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
            const countries = (topojson.feature(world, world.objects.countries) as any).features.filter(
                (f: any) => f.properties?.name !== 'Antarctica'
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
            const activeDeals = deals && deals.length > 0 ? deals : [];

            if (activeDeals.length > 0) {
                activeDeals.forEach((deal: any, idx: number) => {
                    // Precise Mapping or Fallback
                    const coords = CITY_COORDINATES[deal.city] || {
                        lat: deal.lat || 0,
                        lng: deal.lon || deal.lng || 0
                    };

                    const pos = projection([coords.lng, coords.lat]);
                    if (!pos) return;

                    newPins.push({
                        deal: { ...deal, disc: deal.disc || 0, lon: coords.lng, lat: coords.lat },
                        x: pos[0],
                        y: pos[1],
                        index: idx
                    });
                });
            } else {
                // Secondary fallback to static regions
                Object.entries(REGIONS).forEach(([regionKey, regionData]: [string, any]) => {
                    if (!regionData.deals) return;
                    regionData.deals.forEach((deal: any, idx: number) => {
                        const pos = projection([deal.lon, deal.lat]);
                        if (!pos) return;
                        newPins.push({ deal, x: pos[0], y: pos[1], index: idx });
                    });
                });
            }
            setPins(newPins);

            // 4. YUL Marker
            const montrealCoords: [number, number] = [-73.5674, 45.5019];
            const montrealPos = projection(montrealCoords);
            if (montrealPos) {
                const yul = g.append("g").attr("class", "yul-marker")
                    .attr("transform", `translate(${montrealPos[0]}, ${montrealPos[1]})`);
                yul.append("circle").attr("r", 4).attr("fill", "#2E7DDB").attr("stroke", "#fff").attr("stroke-width", 2);
                yul.append("text").attr("y", -10).attr("text-anchor", "middle").attr("font-size", "9px").attr("font-weight", "700").attr("fill", "#2E7DDB").attr("font-family", "'DM Sans', sans-serif").text("YUL");
            }

            // 5. Flight Arcs
            if (montrealPos) {
                newPins.forEach(p => {
                    const midX = (montrealPos[0] + p.x) / 2;
                    const midY = (montrealPos[1] + p.y) / 2 - Math.min(Math.sqrt(Math.pow(p.x - montrealPos[0], 2) + Math.pow(p.y - montrealPos[1], 2)) * 0.2, 80);
                    const pathData = `M${montrealPos[0]},${montrealPos[1]} Q${midX},${midY} ${p.x},${p.y}`;

                    g.append("path").attr("d", pathData).attr("fill", "none").attr("stroke", "rgba(46, 125, 219, 0.06)").attr("stroke-width", 2);
                    g.append("path")
                        .attr("d", pathData)
                        .attr("fill", "none")
                        .attr("stroke", p.deal.disc >= 52 ? "rgba(232, 70, 106, 0.25)" : "rgba(46, 125, 219, 0.2)")
                        .attr("stroke-width", 1)
                        .attr("stroke-dasharray", "4 6")
                        .style("animation", "arcFlow 2s linear infinite");
                });
            }

            // 6. Pins & Badges
            newPins.forEach(p => {
                // Pin
                g.append("circle")
                    .attr("cx", p.x)
                    .attr("cy", p.y)
                    .attr("r", 4)
                    .attr("fill", "#2E7DDB")
                    .attr("opacity", 0.9)
                    .style("cursor", "pointer")
                    .on("mouseenter", (e) => onHoverDeal(p.deal, e))
                    .on("mouseleave", onLeaveDeal)
                    .on("click", (e) => onSelectDeal?.(p.deal, e));

                // Discount Badge (Permanent)
                if (p.deal.disc > 0) {
                    const badge = g.append("g")
                        .attr("transform", `translate(${p.x}, ${p.y - 20})`)
                        .style("cursor", "pointer")
                        .on("mouseenter", (e) => onHoverDeal(p.deal, e))
                        .on("mouseleave", onLeaveDeal)
                        .on("click", (e) => onSelectDeal?.(p.deal, e));

                    badge.append("rect")
                        .attr("x", -15)
                        .attr("y", -10)
                        .attr("width", 30)
                        .attr("height", 16)
                        .attr("rx", 8)
                        .attr("fill", p.deal.disc >= 52 ? "#E8466A" : "#2E7DDB");

                    badge.append("text")
                        .attr("text-anchor", "middle")
                        .attr("alignment-baseline", "middle")
                        .attr("font-size", "9px")
                        .attr("font-weight", "bold")
                        .attr("fill", "#fff")
                        .text(`-${p.deal.disc}%`);
                }
            });
        });

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
