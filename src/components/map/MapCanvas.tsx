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
    onSelectDeal?: (deal: any) => void;
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
                .scale(w < 768 ? w / 5.5 : w / 5.2)
                .translate([w / 2, h / 2.1]);
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
            const countries = topojson.feature(world, world.objects.countries).features;

            const graticule = d3.geoGraticule().step([20, 20]);
            g.append("path")
                .datum(graticule())
                .attr("class", "graticule")
                .attr("d", path);

            g.selectAll(".land-path")
                .data(countries)
                .enter().append("path")
                .attr("class", "land-path")
                .attr("d", path)
                // .attr("data-region", d => getRegionForCountry(d.properties.name)) // Need real getRegion impl
                .on("click", (event, d: any) => {
                    const region = getRegionForCountry(d.properties.name);
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
        });

    }, [projection]); // Re-run when projection changes (resize)

    // Update pins calculation to include transform
    // Actually, in the React way, we should update the 'style' of Pins based on transform
    // The previous implementation calculated 'x' and 'y' once based on projection.
    // Now 'left' should be x * k + tx, 'top' should be y * k + ty.

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const newScale = Math.min(4, Math.max(1, transform.k + delta));

        if (newScale !== transform.k) {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const ratio = newScale / transform.k;

            setTransform({
                k: newScale,
                x: mx - ratio * (mx - transform.x),
                y: my - ratio * (my - transform.y)
            });
        }
    };

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

    return (
        <>
            <div
                id="map-container"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: lastPos.current ? 'grabbing' : 'grab' }}
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
                            onMouseEnter={onHoverDeal}
                            onMouseLeave={onLeaveDeal}
                            onClick={onRegionSelect}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}
