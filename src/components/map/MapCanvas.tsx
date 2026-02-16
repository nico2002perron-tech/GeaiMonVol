'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { REGIONS, getRegionForCountry } from '@/lib/data/regions';
import { FLIGHTS } from '@/lib/data/flights';
import MapPin from './MapPin';

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

interface MapCanvasProps {
    deals?: any[]; // Added deals prop
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
    const [badgeRotation, setBadgeRotation] = useState(0);

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
        const interval = setInterval(() => {
            setBadgeRotation(prev => prev + 1);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const maxVisible = 4;
    const discountedDealsCount = pins.filter(p => p.deal.disc > 0).length;

    const isBadgeVisible = (index: number) => {
        if (discountedDealsCount === 0) return false;
        const start = badgeRotation % discountedDealsCount;
        for (let i = 0; i < maxVisible; i++) {
            if ((start + i) % discountedDealsCount === index) return true;
        }
        return false;
    };

    useEffect(() => {
        if (!svgRef.current || !projection) return;

        const w = svgRef.current.clientWidth || dimensions.width || 800;
        const h = svgRef.current.clientHeight || dimensions.height || 500;
        const svg = d3.select(svgRef.current);
        const pathGenerator = d3.geoPath().projection(projection);

        if (mapView === 'canada') {
            projection
                .center([-96, 56])
                .scale(w < 768 ? w * 1.2 : w * 0.8)
                .translate([w / 2, h / 2]);
        } else {
            projection
                .center([10, 20])
                .scale(w < 768 ? w / 4.5 : w / 5.5)
                .translate([w / 2, h / 2]);
        }

        // Re-render paths with transition
        svg.selectAll('path.land-path')
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('d', pathGenerator as any);

        // Re-render graticule
        svg.selectAll('path.graticule')
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('d', pathGenerator as any);

        // Visibility transition for pins, badges, and lines
        svg.selectAll('.deal-pin, .deal-pin-pulse, .discount-badge-container, .flight-arc-bg, .flight-arc-flow')
            .transition()
            .duration(400)
            .attr('opacity', (d: any) => {
                if (!d || !d.deal) return 0;
                const isCanadian = CANADA_CODES.includes(d.deal.code || d.deal.destination_code);
                if (mapView === 'canada') return isCanadian ? (d.isPulse ? 0.3 : 0.9) : 0;
                return isCanadian ? 0 : (d.isPulse ? 0.3 : 0.9);
            });

        // Final opacity for badges needs to consider isBadgeVisible too, 
        // but we handle that in the rotation effect or re-render.
        // For zoom transition, we just re-position everything.

        svg.selectAll('.deal-pin, .deal-pin-pulse')
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('cx', (d: any) => {
                const pos = projection([d.deal.lon || 0, d.deal.lat || 0]);
                return pos ? pos[0] : 0;
            })
            .attr('cy', (d: any) => {
                const pos = projection([d.deal.lon || 0, d.deal.lat || 0]);
                return pos ? pos[1] : 0;
            });

        svg.selectAll('.discount-badge-container')
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('transform', (d: any) => {
                const pos = projection([d.deal.lon || 0, d.deal.lat || 0]);
                return pos ? `translate(${pos[0]}, ${pos[1] - 20})` : 'translate(0,0)';
            });

        svg.selectAll('.flight-arc-bg, .flight-arc-flow')
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr('d', (d: any) => {
                const source = projection([-73.5674, 45.5019]);
                const target = projection([d.deal.lon || 0, d.deal.lat || 0]);
                if (!source || !target) return '';
                const midX = (source[0] + target[0]) / 2;
                const midY = (source[1] + target[1]) / 2 - Math.min(Math.sqrt(Math.pow(target[0] - source[0], 2) + Math.pow(target[1] - source[1], 2)) * 0.2, 80);
                return `M${source[0]},${source[1]} Q${midX},${midY} ${target[0]},${target[1]}`;
            });

    }, [mapView, projection, dimensions]);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('.discount-badge-container')
            .classed('visible', (d: any, i: number) => isBadgeVisible(i));
    }, [badgeRotation, pins]);

    useEffect(() => {
        if (!svgRef.current || !projection) return;

        const svg = d3.select(svgRef.current);
        let g = svg.select<SVGGElement>('g.map-content');
        if (g.empty()) {
            g = svg.append('g').attr('class', 'map-content');
        }

        const path = d3.geoPath().projection(projection);

        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
            const countries = (topojson.feature(world, world.objects.countries) as any).features.filter(
                (f: any) => f.properties?.name !== 'Antarctica'
            );

            // 1. Graticule
            const graticule = d3.geoGraticule().step([20, 20]);
            const gratPath = g.selectAll(".graticule").data([graticule()]);
            gratPath.enter().append("path").attr("class", "graticule").merge(gratPath as any).attr("d", path);

            // 2. Land paths
            const land = g.selectAll(".land-path").data(countries);
            land.enter()
                .append("path")
                .attr("class", "land-path")
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
                })
                .merge(land as any)
                .attr("d", path as any)
                .attr("data-name", (d: any) => d.properties?.name || '')
                .attr("data-region", (d: any) => getRegionForCountry(d.properties?.name || '') || '');

            // 3. Process pin data
            const newPins: any[] = [];
            if (deals && deals.length > 0) {
                deals.forEach((deal: any, idx: number) => {
                    const staticFlight = FLIGHTS.find(f => f.city === deal.destination);
                    const lon = deal.lon || staticFlight?.lon || 0;
                    const lat = deal.lat || staticFlight?.lat || 0;
                    const pos = projection([lon, lat]);
                    if (!pos) return;
                    newPins.push({
                        deal: { ...deal, disc: deal.disc || 0, lon, lat },
                        x: pos[0],
                        y: pos[1],
                        index: idx
                    });
                });
            } else {
                let idx = 0;
                Object.entries(REGIONS).forEach(([regionKey, regionData]: [string, any]) => {
                    if (!regionData.deals) return;
                    regionData.deals.forEach((deal: any) => {
                        const pos = projection([deal.lon, deal.lat]);
                        if (!pos) return;
                        newPins.push({ deal, x: pos[0], y: pos[1], index: idx });
                        idx++;
                    });
                });
            }
            setPins(newPins);

            // 4. YUL Marker
            const montrealCoords: [number, number] = [-73.5674, 45.5019];
            const montrealPos = projection(montrealCoords);
            if (montrealPos) {
                const yul = g.selectAll(".yul-marker").data([montrealPos]);
                const yulEnter = yul.enter().append("g").attr("class", "yul-marker");
                yulEnter.append("circle").attr("r", 4).attr("fill", "#2E7DDB").attr("stroke", "#fff").attr("stroke-width", 2);
                yulEnter.append("text").attr("y", -10).attr("text-anchor", "middle").attr("font-size", "9px").attr("font-weight", "700").attr("fill", "#2E7DDB").attr("font-family", "'DM Sans', sans-serif").text("YUL");
                yulEnter.merge(yul as any).attr("transform", d => `translate(${d[0]}, ${d[1]})`);
            }

            // 5. Flight Arcs
            if (montrealPos) {
                const arcs = g.selectAll(".flight-arc-group").data(newPins, (d: any) => d.deal.city || d.index);
                const arcsEnter = arcs.enter().append("g").attr("class", "flight-arc-group");

                arcsEnter.append("path").attr("class", "flight-arc-bg").attr("fill", "none").attr("stroke", "rgba(46, 125, 219, 0.06)").attr("stroke-width", 2);
                arcsEnter.append("path").attr("class", "flight-arc-flow").attr("fill", "none").attr("stroke-width", 1).attr("stroke-dasharray", "4 6").style("animation", "arcFlow 2s linear infinite");

                const allArcs = arcsEnter.merge(arcs as any);
                allArcs.select(".flight-arc-bg").attr("d", d => {
                    const midX = (montrealPos[0] + d.x) / 2;
                    const midY = (montrealPos[1] + d.y) / 2 - Math.min(Math.sqrt(Math.pow(d.x - montrealPos[0], 2) + Math.pow(d.y - montrealPos[1], 2)) * 0.2, 80);
                    return `M${montrealPos[0]},${montrealPos[1]} Q${midX},${midY} ${d.x},${d.y}`;
                });
                allArcs.select(".flight-arc-flow")
                    .attr("stroke", d => d.deal.disc >= 52 ? "rgba(232, 70, 106, 0.25)" : "rgba(46, 125, 219, 0.2)")
                    .attr("d", d => {
                        const midX = (montrealPos[0] + d.x) / 2;
                        const midY = (montrealPos[1] + d.y) / 2 - Math.min(Math.sqrt(Math.pow(d.x - montrealPos[0], 2) + Math.pow(d.y - montrealPos[1], 2)) * 0.2, 80);
                        return `M${montrealPos[0]},${montrealPos[1]} Q${midX},${midY} ${d.x},${d.y}`;
                    });
                arcs.exit().remove();
            }

            // 6. Halos (Pulse)
            const halos = g.selectAll(".deal-pin-pulse").data(newPins, (d: any) => d.deal.city || d.index);
            halos.enter()
                .append("circle")
                .attr("class", "deal-pin-pulse")
                .attr("r", 8)
                .attr("fill", "#2E7DDB")
                .merge(halos as any)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("opacity", d => {
                    const isCanadian = CANADA_CODES.includes(d.deal.code || d.deal.destination_code);
                    if (mapView === 'canada') return isCanadian ? 0.3 : 0;
                    return isCanadian ? 0 : 0.3;
                })
                .property("isPulse", true);
            halos.exit().remove();

            // 7. Pins
            const pinCircles = g.selectAll(".deal-pin").data(newPins, (d: any) => d.deal.city || d.index);
            pinCircles.enter()
                .append("circle")
                .attr("class", "deal-pin")
                .attr("r", 4)
                .attr("fill", "#2E7DDB")
                .on("mouseenter", (e, d) => onHoverDeal(d.deal, e))
                .on("mouseleave", onLeaveDeal)
                .on("click", (e, d) => onSelectDeal?.(d.deal, e))
                .merge(pinCircles as any)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("opacity", d => {
                    const isCanadian = CANADA_CODES.includes(d.deal.code || d.deal.destination_code);
                    if (mapView === 'canada') return isCanadian ? 0.9 : 0;
                    return isCanadian ? 0 : 0.9;
                });
            pinCircles.exit().remove();

            // 8. Badges
            const badges = g.selectAll(".discount-badge-container").data(newPins.filter(p => p.deal.disc > 0), (d: any) => d.deal.city || d.index);
            const badgesEnter = badges.enter()
                .append("g")
                .attr("class", (d, i) => `discount-badge-container ${isBadgeVisible(i) ? 'visible' : ''}`)
                .on("mouseenter", (e, d) => onHoverDeal(d.deal, e))
                .on("mouseleave", onLeaveDeal)
                .on("click", (e, d) => onSelectDeal?.(d.deal, e));

            badgesEnter.append("rect")
                .attr("x", -15)
                .attr("y", -10)
                .attr("width", 30)
                .attr("height", 16)
                .attr("rx", 8)
                .attr("fill", d => d.deal.disc >= 52 ? "#E8466A" : "#2E7DDB");

            badgesEnter.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("font-size", "9px")
                .attr("font-weight", "bold")
                .attr("fill", "#fff")
                .text(d => `-${d.deal.disc}%`);

            badgesEnter.merge(badges as any)
                .attr("transform", d => `translate(${d.x}, ${d.y - 20})`)
                .attr("opacity", d => {
                    const isCanadian = CANADA_CODES.includes(d.deal.code || d.deal.destination_code);
                    if (mapView === 'canada') return isCanadian ? 1 : 0;
                    return isCanadian ? 0 : 1;
                });
            badges.exit().remove();
        });

    }, [projection, deals]);

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
    );
}
