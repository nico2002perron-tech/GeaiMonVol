'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { REGIONS, getRegionForCountry } from '@/lib/data/regions'; // Assuming these will be populated
import { FLIGHTS } from '@/lib/data/flights'; // Assuming these will be populated
import MapPin from './MapPin';

interface MapCanvasProps {
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void; // Using any for deal temporarily
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
}

export default function MapCanvas({ onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal }: MapCanvasProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [projection, setProjection] = useState<d3.GeoProjection | null>(null);
    // Zoom and Pan State
    const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const [pins, setPins] = useState<any[]>([]); // Array of positioned pins
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateDimensions = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setDimensions({ width: w, height: h });

            const proj = d3.geoNaturalEarth1()
                .scale(w < 768 ? w / 3.5 : Math.min(w, h) / 3.2)
                .translate([w < 768 ? w * 0.35 : w / 2, h / 2])
                .center([0, w < 768 ? 25 : 15]);
            setProjection(() => proj);
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Apply transform to SVG group
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = svg.select('g.map-content'); // Assume we wrap everything in a g
        if (g.empty()) return;

        g.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);

        // Reposition pins
        // Since pins are HTML divs on top, we need to calculate their projected position + transform
        // This effectively means we need to re-render pins with new style
    }, [transform]);

    useEffect(() => {
        if (!svgRef.current || !projection) return;

        const svg = d3.select(svgRef.current);
        // Ensure the group exists
        let g = svg.select<SVGGElement>('g.map-content');
        if (g.empty()) {
            g = svg.append('g').attr('class', 'map-content');
        }

        // Clear previous content in group
        g.selectAll('*').remove();

        const path = d3.geoPath().projection(projection);

        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
            const countries = (topojson.feature(world, world.objects.countries) as any).features;

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
                        const elRegion = el.attr("data-region");
                        if (elRegion === region) {
                            el.classed("region-hover", true);
                        } else {
                            el.classed("region-dimmed", true);
                        }
                    });
                })
                .on("mouseleave", function () {
                    // Remove all highlights
                    g.selectAll(".land-path")
                        .classed("region-hover", false)
                        .classed("region-dimmed", false);
                })
                .on("click", (event: any, d: any) => {
                    const countryName = d.properties?.name || '';
                    const region = getRegionForCountry(countryName);
                    if (region) onRegionSelect(region);
                });

            // Calculate pins
            // NOTE: This depends on FLIGHTS/REGIONS being populated. 
            // Currently they are empty, so no pins will show.
            const newPins: any[] = [];
            let idx = 0;

            // Logic adapted from buildPins to React state
            // Once REGIONS is populated with deals, this will work.
            Object.entries(REGIONS).forEach(([regionKey, regionData]: [string, any]) => {
                if (!regionData.deals) return;
                regionData.deals.forEach((deal: any, di: number) => {
                    if (di > 2) return;
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
            setPins(newPins);

            // Draw flight arcs from Montreal
            const montrealCoords: [number, number] = [-73.5674, 45.5019];
            const montrealPos = projection(montrealCoords);

            if (montrealPos) {
                // Draw Montreal marker
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

                // Draw arcs to each destination
                newPins.forEach((p: any) => {
                    const destPos = projection([p.deal.lon, p.deal.lat]);
                    if (!destPos || !montrealPos) return;

                    // Calculate a curved path (quadratic bezier)
                    const midX = (montrealPos[0] + destPos[0]) / 2;
                    const midY = (montrealPos[1] + destPos[1]) / 2;
                    // Curve upward — the offset creates the arc effect
                    const dx = destPos[0] - montrealPos[0];
                    const dy = destPos[1] - montrealPos[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const curveOffset = Math.min(dist * 0.2, 80);
                    const controlX = midX;
                    const controlY = midY - curveOffset;

                    const pathData = `M${montrealPos[0]},${montrealPos[1]} Q${controlX},${controlY} ${destPos[0]},${destPos[1]}`;

                    // Background arc (thicker, very subtle)
                    g.append("path")
                        .attr("d", pathData)
                        .attr("fill", "none")
                        .attr("stroke", "rgba(46, 125, 219, 0.06)")
                        .attr("stroke-width", 2);

                    // Main arc (dashed, animated)
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

    }, [projection]); // Re-run when projection changes (resize)

    // Update pins calculation to include transform
    // Actually, in the React way, we should update the 'style' of Pins based on transform
    // The previous implementation calculated 'x' and 'y' once based on projection.
    // Now 'left' should be x * k + tx, 'top' should be y * k + ty.

    // Native wheel listener to allow preventDefault
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
        // checks if target is not pin/sidebar etc handled by CSS pointer-events or stopPropagation
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

    // Touch events would be similar... skipped for brevity but should be added

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
        // Pinch zoom with 2 fingers
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
                        pointerEvents: 'auto' // Re-enable for pins
                    }}>
                        <MapPin
                            deal={p.deal}
                            regionKey={p.regionKey}
                            x={0} // Position handled by parent div for transform
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
