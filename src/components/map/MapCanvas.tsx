'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { REGIONS, getRegionForCountry } from '@/lib/data/regions';
import { FLIGHTS } from '@/lib/data/flights';
import MapPin from './MapPin';

interface MapCanvasProps {
    deals?: any[]; // Added deals prop
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void;
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
}

export default function MapCanvas({ deals = [], onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal }: MapCanvasProps) {
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

            // Updated projection to center on Atlantic and cut Antarctica
            const proj = d3.geoNaturalEarth1()
                .scale(w < 768 ? w / 4 : w / 5.5)
                .translate([w / 2, w < 768 ? h * 0.42 : h * 0.44])
                .center([10, 20]); // Center on longitude 10 (Atlantic) and latitude 20
            setProjection(() => proj);
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = svg.select('g.map-content');
        if (g.empty()) return;

        g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
    }, [transform]);

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
            // Filter out Antarctica
            const countries = (topojson.feature(world, world.objects.countries) as any).features.filter(
                (f: any) => f.properties?.name !== 'Antarctica'
            );

            const graticule = d3.geoGraticule().step([20, 20]);
            g.append("path")
                .datum(graticule())
                .attr("class", "graticule")
                .attr("d", path);

            g.selectAll(".land-path")
                .data(countries)
                .enter().append("path")
                .attr("class", "land-path")
                .attr("d", path as any)
                .attr("data-name", (d: any) => d.properties?.name || '')
                .attr("data-region", (d: any) => {
                    const name = d.properties?.name || '';
                    return getRegionForCountry(name) || '';
                })
                .on("mouseenter", function (event: any, d: any) {
                    const countryName = d.properties?.name || '';
                    const region = getRegionForCountry(countryName);
                    if (!region) return;

                    // Highlight ALL countries in the same region
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
                    if (region) {
                        onRegionSelect(region);
                    }
                });

            // Calculate pins with correct mapping
            const newPins: any[] = [];
            let idx = 0;

            // Use live deals if available, otherwise fallback to regions
            if (deals && deals.length > 0) {
                deals.forEach((deal: any) => {
                    // Try to find coordinates from static FLIGHTS if not in deal
                    const staticFlight = FLIGHTS.find(f => f.city === deal.destination);
                    const lon = deal.lon || staticFlight?.lon || 0;
                    const lat = deal.lat || staticFlight?.lat || 0;

                    const pos = projection([lon, lat]);
                    if (!pos) return;

                    // Merge deal data
                    const fullDeal = {
                        ...deal,
                        city: deal.destination,
                        country: staticFlight?.country || '',
                        img: staticFlight?.img || '',
                        // Calculate discount if not present
                        disc: deal.disc || 0
                    };

                    newPins.push({
                        deal: fullDeal,
                        regionKey: 'all', // Simplify for now
                        x: pos[0],
                        y: pos[1],
                        index: idx
                    });
                    idx++;
                });
            } else {
                Object.entries(REGIONS).forEach(([regionKey, regionData]: [string, any]) => {
                    if (!regionData.deals) return;
                    regionData.deals.forEach((deal: any, di: number) => {
                        const pos = projection([deal.lon, deal.lat]);
                        if (!pos) return;

                        newPins.push({
                            deal,
                            regionKey,
                            x: pos[0],
                            y: pos[1],
                            index: idx
                        });
                        idx++;
                    });
                });
            }
            setPins(newPins);

            // Draw flight arcs
            const montrealCoords: [number, number] = [-73.5674, 45.5019];
            const montrealPos = projection(montrealCoords);

            if (montrealPos) {
                // YUL Marker
                g.append("circle")
                    .attr("cx", montrealPos[0])
                    .attr("cy", montrealPos[1])
                    .attr("r", 4)
                    .attr("fill", "#2E7DDB")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2);

                g.append("text")
                    .attr("x", montrealPos[0])
                    .attr("y", montrealPos[1] - 10)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "9px")
                    .attr("font-weight", "700")
                    .attr("fill", "#2E7DDB")
                    .attr("font-family", "'DM Sans', sans-serif")
                    .text("YUL");

                // Flight Arcs
                newPins.forEach((p: any) => {
                    const destPos = projection([p.deal.lon || p.deal.destination_code === p.deal.code ? 0 : 0, p.deal.lat || 0]);
                    // Re-project using p.x/p.y is safer since we already calculated it
                    // But we need formatted source for arcs.
                    // Actually we can just use p.x and p.y directly!

                    if (!montrealPos) return;
                    const destX = p.x;
                    const destY = p.y;

                    const midX = (montrealPos[0] + destX) / 2;
                    const midY = (montrealPos[1] + destY) / 2;
                    const dx = destX - montrealPos[0];
                    const dy = destY - montrealPos[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const curveOffset = Math.min(dist * 0.2, 80);
                    const controlX = midX;
                    const controlY = midY - curveOffset;

                    const pathData = `M${montrealPos[0]},${montrealPos[1]} Q${controlX},${controlY} ${destX},${destY}`;

                    // Subtle background arc
                    g.append("path")
                        .attr("d", pathData)
                        .attr("fill", "none")
                        .attr("stroke", "rgba(46, 125, 219, 0.06)")
                        .attr("stroke-width", 2);

                    // Animated dashed arc
                    g.append("path")
                        .attr("d", pathData)
                        .attr("fill", "none")
                        .attr("stroke", p.deal.disc >= 52 ? "rgba(232, 70, 106, 0.25)" : "rgba(46, 125, 219, 0.2)")
                        .attr("stroke-width", 1)
                        .attr("stroke-dasharray", "4 6")
                        .style("animation", "arcFlow 2s linear infinite");
                });
            }
        });

    }, [projection]);

    // Pan/Zoom Handlers
    useEffect(() => {
        const container = document.getElementById('map-container');
        if (!container) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setTransform(prev => ({
                ...prev,
                k: Math.min(6, Math.max(1, prev.k + delta))
            }));
        };

        container.addEventListener('wheel', wheelHandler, { passive: false });
        return () => container.removeEventListener('wheel', wheelHandler);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!lastPos.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        lastPos.current = null;
    };

    const lastPinchDist = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            lastPos.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && lastPos.current) {
            const touch = e.touches[0];
            const dx = touch.clientX - lastPos.current.x;
            const dy = touch.clientY - lastPos.current.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPos.current = { x: touch.clientX, y: touch.clientY };
        }
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (lastPinchDist.current) {
                const delta = (dist - lastPinchDist.current) * 0.005;
                const newScale = Math.min(4, Math.max(1, transform.k + delta));
                setTransform(prev => ({ ...prev, k: newScale }));
            }
            lastPinchDist.current = dist;
        }
    };

    const handleTouchEnd = () => {
        lastPos.current = null;
        lastPinchDist.current = null;
    };

    return (
        <>
            <div
                id="map-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: lastPos.current ? 'grabbing' : 'grab', touchAction: 'none' }}
            >
                <svg id="map-svg" ref={svgRef} width={dimensions.width} height={dimensions.height}>
                    <g className="map-content">
                        {/* D3 content will be appended here */}
                    </g>
                </svg>
            </div>
            <div className="pin-layer" id="pinLayer" style={{ pointerEvents: 'none' }}>
                {pins.map((p, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: p.x * transform.k + transform.x,
                        top: p.y * transform.k + transform.y,
                        pointerEvents: 'auto'
                    }}>
                        <MapPin
                            deal={p.deal}
                            regionKey={p.regionKey}
                            x={0}
                            y={0}
                            index={p.index}
                            onMouseEnter={(e: any, d: any) => onHoverDeal(d || p.deal, e)}
                            onMouseLeave={onLeaveDeal}
                            onClick={onSelectDeal}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}
