'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getRegionForCountry } from '@/lib/data/regions';
import { PRIORITY_DESTINATIONS } from '@/lib/services/flights';

/* ═══════════════════════════════════════════════════════════════
   GLOBE 3D TRADE — Dot-Matrix Premium Trading Terminal
   Dark space, cyan dot-matrix continents, cyan+violet atmosphere
   ═══════════════════════════════════════════════════════════════ */

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];
const QUEBEC_CODES = ['YQB', 'YUL'];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Toronto': { lat: 43.65, lng: -79.38 },
    'Ottawa': { lat: 45.42, lng: -75.69 },
    'Vancouver': { lat: 49.28, lng: -123.12 },
    'Calgary': { lat: 51.05, lng: -114.07 },
    'Edmonton': { lat: 53.55, lng: -113.49 },
    'Winnipeg': { lat: 49.90, lng: -97.14 },
    'Halifax': { lat: 44.65, lng: -63.57 },
    'Qu\u00e9bec': { lat: 46.81, lng: -71.21 },
    'Paris': { lat: 48.86, lng: 2.35 },
    'Canc\u00fan': { lat: 21.16, lng: -86.85 },
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
    'S\u00e3o Paulo': { lat: -23.55, lng: -46.63 },
    'Bali': { lat: -8.34, lng: 115.09 },
    'Miami': { lat: 25.76, lng: -80.19 },
    'Los Angeles': { lat: 34.05, lng: -118.24 },
    'Reykjavik': { lat: 64.15, lng: -21.94 },
    'Ath\u00e8nes': { lat: 37.98, lng: 23.73 },
    'Dublin': { lat: 53.35, lng: -6.26 },
    'Amsterdam': { lat: 52.37, lng: 4.90 },
    'Porto': { lat: 41.16, lng: -8.63 },
    'Madrid': { lat: 40.42, lng: -3.70 },
    'Montego Bay': { lat: 18.47, lng: -77.89 },
    'San Jos\u00e9': { lat: 9.93, lng: -84.08 },
    'Cartagena': { lat: 10.39, lng: -75.51 },
    'Buenos Aires': { lat: -34.60, lng: -58.38 },
    'Ho Chi Minh': { lat: 10.82, lng: 106.63 },
};

// Map deal city names → topojson country names
const CITY_TO_COUNTRY: Record<string, string> = {
    'Toronto': 'Canada', 'Ottawa': 'Canada', 'Vancouver': 'Canada',
    'Calgary': 'Canada', 'Edmonton': 'Canada', 'Winnipeg': 'Canada',
    'Halifax': 'Canada', 'Québec': 'Canada',
    'Paris': 'France', 'Barcelone': 'Spain', 'Madrid': 'Spain',
    'Lisbonne': 'Portugal', 'Porto': 'Portugal',
    'Rome': 'Italy', 'Athènes': 'Greece',
    'Cancún': 'Mexico', 'Punta Cana': 'Dominican Republic',
    'Cuba (Varadero)': 'Cuba', 'La Havane': 'Cuba',
    'Fort Lauderdale': 'United States of America', 'Miami': 'United States of America',
    'New York': 'United States of America', 'Los Angeles': 'United States of America',
    'Londres': 'United Kingdom', 'Dublin': 'Ireland',
    'Amsterdam': 'Netherlands', 'Marrakech': 'Morocco',
    'Bangkok': 'Thailand', 'Tokyo': 'Japan',
    'Bogota': 'Colombia', 'Cartagena': 'Colombia',
    'Lima': 'Peru', 'São Paulo': 'Brazil', 'Buenos Aires': 'Argentina',
    'Bali': 'Indonesia', 'Ho Chi Minh': 'Vietnam',
    'Reykjavik': 'Iceland', 'Montego Bay': 'Jamaica',
    'San José': 'Costa Rica',
};

// Badge colors by deal level
const BADGE_COLORS: Record<string, string> = {
    lowest_ever: '#7C3AED',
    incredible: '#DC2626',
    great: '#EA580C',
    good: '#00D4FF',
    slight: '#00D4FF',
    normal: '#00D4FF',
};

// Continent color palette — soft pastel cartoon
const CONTINENT_COLORS: Record<string, { base: string; deal: string; stroke: string; dealStroke: string; hover: string; hoverDeal: string }> = {
    amerique_nord: { base: '#A8E6CF', deal: '#6DD8A0', stroke: '#7EC8A8', dealStroke: '#55C88E', hover: '#C2F0DD', hoverDeal: '#88E8B5' },
    amerique_sud:  { base: '#FFD3B6', deal: '#FFB088', stroke: '#E0B8A0', dealStroke: '#E8A078', hover: '#FFE4D0', hoverDeal: '#FFC4A0' },
    caraibes:      { base: '#A8E6CF', deal: '#6DD8A0', stroke: '#7EC8A8', dealStroke: '#55C88E', hover: '#C2F0DD', hoverDeal: '#88E8B5' },
    europe:        { base: '#C9B1FF', deal: '#A888F0', stroke: '#A898D8', dealStroke: '#9070E0', hover: '#DDD0FF', hoverDeal: '#BCA0F8' },
    asie:          { base: '#FFEAA7', deal: '#FFD56B', stroke: '#E0D098', dealStroke: '#E0C060', hover: '#FFF2C8', hoverDeal: '#FFE088' },
    afrique:       { base: '#FFB5A7', deal: '#FF9A8A', stroke: '#E0A098', dealStroke: '#E08878', hover: '#FFD0C8', hoverDeal: '#FFB0A0' },
    oceanie:       { base: '#FFC2D1', deal: '#FF9AB5', stroke: '#E0A8B8', dealStroke: '#E088A0', hover: '#FFD8E0', hoverDeal: '#FFB0C8' },
};
const DEFAULT_CONTINENT = { base: '#A8E6CF', deal: '#6DD8A0', stroke: '#7EC8A8', dealStroke: '#55C88E', hover: '#C2F0DD', hoverDeal: '#88E8B5' };

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

interface CartoonGlobeProps {
    deals?: any[];
    mapView?: 'world' | 'canada' | 'quebec';
    isMobile?: boolean;
    onRegionSelect: (region: string) => void;
    onHoverDeal: (deal: any, e: React.MouseEvent) => void;
    onLeaveDeal: () => void;
    onSelectDeal?: (deal: any, e: React.MouseEvent) => void;
    flyToDeal?: any;
    onHoloComplete?: () => void;
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

// ═══ ZOOM & INERTIA CONSTANTS ═══
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_DEFAULT = 1.0;
const ZOOM_STEP = 0.15;
const ZOOM_SMOOTHING = 0.12;
const INERTIA_FRICTION = 0.95;
const INERTIA_THRESHOLD = 0.01;
const CITY_LABEL_ZOOM_THRESHOLD = 1.2;
// ═══ HOLOGRAPHIC TRAJECTORY ═══
const HOLO_ROTATE_FRAMES = 90;
const HOLO_ARC_FRAMES = 120;
const HOLO_SUSTAIN_FRAMES = 180;
const HOLO_FADEOUT_FRAMES = 50;
const HOLO_PARTICLE_COUNT = 18;
const HOLO_COLORS = {
    primary: '#00D4FF',
    secondary: '#A78BFA',
    glow: 'rgba(0, 212, 255, 0.6)',
    particle: ['#00D4FF', '#A78BFA', '#FFFFFF', '#7DF9FF'],
};

interface HoloParticle {
    t: number;
    offset: number;
    size: number;
    speed: number;
    alpha: number;
    color: string;
    phase: number;
}

interface HoloTrajectory {
    active: boolean;
    phase: 'rotate' | 'arc' | 'sustain' | 'fadeOut';
    frame: number;
    deal: any;
    originCoords: [number, number];
    destCoords: [number, number];
    startRotation: [number, number, number];
    targetRotation: [number, number, number];
    startScale: number;
    particles: HoloParticle[];
    arcProgress: number;
    glowIntensity: number;
    trailPoints: { x: number; y: number; alpha: number }[];
    ripples: { radius: number; alpha: number }[];
    dimFactor: number;
}

// ═══ DOT-MATRIX LAND POINT ═══
interface LandDot {
    lng: number;
    lat: number;
    brightness: number;
}

interface Star {
    x: number;
    y: number;
    size: number;
    baseOpacity: number;
    twinkleSpeed: number;
    phase: number;
    color: string;
}

interface ShootingStar {
    x: number;
    y: number;
    length: number;
    angle: number;
    speed: number;
    opacity: number;
    life: number;
    maxLife: number;
}


function generateStars(width: number, height: number): Star[] {
    const stars: Star[] = [];
    const starColors = ['#E0F8FF', '#D4F0FF', '#FFE8F0', '#E8E0FF', '#D4FFE8', '#FFF0D4', '#FFFFFF'];
    for (let i = 0; i < 160; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.3 + Math.random() * 1.8,
            baseOpacity: 0.25 + Math.random() * 0.65,
            twinkleSpeed: 0.008 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)],
        });
    }
    return stars;
}

function createShootingStar(width: number, height: number): ShootingStar {
    const edge = Math.random();
    let x: number, y: number;
    if (edge < 0.5) {
        x = Math.random() * width;
        y = -10;
    } else {
        x = width + 10;
        y = Math.random() * height * 0.5;
    }
    return {
        x, y,
        length: 50 + Math.random() * 100,
        angle: Math.PI * 0.6 + Math.random() * 0.4,
        speed: 4 + Math.random() * 5,
        opacity: 0.5 + Math.random() * 0.5,
        life: 0,
        maxLife: 30 + Math.random() * 40,
    };
}

// Precompute dot-matrix grid of land points (chunked to avoid blocking UI)
function precomputeLandDots(countries: any[], step: number): Promise<LandDot[]> {
    return new Promise((resolve) => {
        const dots: LandDot[] = [];
        const lats: number[] = [];
        for (let lat = -85; lat <= 85; lat += step) lats.push(lat);
        let latIdx = 0;

        function processChunk() {
            const end = Math.min(latIdx + 8, lats.length);
            for (; latIdx < end; latIdx++) {
                const lat = lats[latIdx];
                for (let lng = -180; lng < 180; lng += step) {
                    for (const country of countries) {
                        if (d3.geoContains(country, [lng, lat])) {
                            dots.push({
                                lng,
                                lat,
                                brightness: 0.4 + Math.random() * 0.6,
                            });
                            break;
                        }
                    }
                }
            }
            if (latIdx < lats.length) {
                setTimeout(processChunk, 0);
            } else {
                resolve(dots);
            }
        }
        processChunk();
    });
}

// Fast manual orthographic projection (avoids d3 overhead per-point)
function projectOrtho(
    lng: number, lat: number,
    rotLng: number, rotLat: number,
    cx: number, cy: number, scale: number
): [number, number] | null {
    const DEG = Math.PI / 180;
    const lambda = (lng - rotLng) * DEG;
    const phi = lat * DEG;
    const phi0 = rotLat * DEG;
    const cosC = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
    if (cosC < 0) return null; // back hemisphere
    const x = cx + scale * Math.cos(phi) * Math.sin(lambda);
    const y = cy - scale * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda));
    return [x, y];
}

export default function CartoonGlobe({
    deals = [],
    mapView = 'world',
    isMobile = false,
    onRegionSelect,
    onHoverDeal,
    onLeaveDeal,
    onSelectDeal,
    flyToDeal,
    onHoloComplete,
}: CartoonGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [worldData, setWorldData] = useState<any>(null);
    const rotationRef = useRef<[number, number, number]>([-73, -35, 0]);
    const isDraggingRef = useRef(false);
    const lastMouseRef = useRef<[number, number]>([0, 0]);
    const animFrameRef = useRef<number>(0);
    const starsRef = useRef<Star[]>([]);
    const shootingStarsRef = useRef<ShootingStar[]>([]);
    const landDotsRef = useRef<LandDot[]>([]);
    const timeRef = useRef(0);
    const hoveredCountryRef = useRef<string | null>(null);
    const isMouseOnGlobeRef = useRef(false);
    const zoomTargetRef = useRef(ZOOM_DEFAULT);
    const zoomCurrentRef = useRef(ZOOM_DEFAULT);
    const velocityRef = useRef<[number, number]>([0, 0]);
    const lastDragTimeRef = useRef(0);

    // Tooltip state
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        countryName: string;
        bestDeal: any | null;
    }>({ visible: false, x: 0, y: 0, countryName: '', bestDeal: null });

    // Fly-to animation state
    const flyToRef = useRef<{
        active: boolean;
        startRotation: [number, number, number];
        targetRotation: [number, number, number];
        startScale: number;
        targetScale: number;
        progress: number;
        duration: number;
        phase: 'zoomIn' | 'zoomOut';
        deal: any | null;
    }>({
        active: false,
        startRotation: [0, 0, 0],
        targetRotation: [0, 0, 0],
        startScale: 1,
        targetScale: 1,
        progress: 0,
        duration: 60,
        phase: 'zoomIn',
        deal: null,
    });

    // Holographic trajectory state
    const holoRef = useRef<HoloTrajectory>({
        active: false,
        phase: 'rotate',
        frame: 0,
        deal: null,
        originCoords: [-73.74, 45.47],
        destCoords: [0, 0],
        startRotation: [0, 0, 0],
        targetRotation: [0, 0, 0],
        startScale: 1,
        particles: [],
        arcProgress: 0,
        glowIntensity: 0,
        trailPoints: [],
        ripples: [],
        dimFactor: 1,
    });
    const holoIdRef = useRef<number>(0);

    useEffect(() => {
        loadWorldAtlas().then(setWorldData).catch(() => { });
    }, []);

    // Preload wonder icon images
    const wonderImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    useEffect(() => {
        const wonderFiles: { key: string; src: string }[] = [
            { key: 'eiffel', src: '/wonders/eiffel.png' },
            { key: 'colosseum', src: '/wonders/colosseum.png' },
            { key: 'cristo', src: '/wonders/cristo.png' },
            { key: 'tajmahal', src: '/wonders/tajmahal.png' },
            { key: 'greatwall', src: '/wonders/greatwall.png' },
            { key: 'liberty', src: '/wonders/liberty.png' },
            { key: 'pyramids', src: '/wonders/pyramids.png' },
            { key: 'machupicchu', src: '/wonders/machupicchu.png' },
        ];
        for (const { key, src } of wonderFiles) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                wonderImagesRef.current.set(key, img);
            };
        }
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (!containerRef.current) return;
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        };
        window.addEventListener('resize', updateDimensions);
        const timer = setTimeout(updateDimensions, 50);
        return () => { window.removeEventListener('resize', updateDimensions); clearTimeout(timer); };
    }, []);

    // Precompute land dots when world data loads (async chunked)
    useEffect(() => {
        if (!worldData?.objects) return;
        let cancelled = false;
        let countries: any[] = [];
        try {
            countries = (topojson.feature(worldData, worldData.objects.countries) as any)
                .features.filter((f: any) => f?.properties?.name !== 'Antarctica');
        } catch { return; }
        const step = isMobile ? 2.2 : 1.8;
        precomputeLandDots(countries, step).then((dots) => {
            if (!cancelled) landDotsRef.current = dots;
        });
        return () => { cancelled = true; };
    }, [worldData, isMobile]);

    useEffect(() => {
        if (dimensions.width === 0) return;
        starsRef.current = generateStars(dimensions.width, dimensions.height);
        shootingStarsRef.current = [];
    }, [dimensions, isMobile]);

    const visibleDeals = useMemo(() => {
        return (deals || []).filter((deal) => {
            const code = deal.destination_code || deal.code || '';
            const isCanadian = CANADA_CODES.includes(code);
            const isQuebec = QUEBEC_CODES.includes(code);
            if (mapView === 'quebec') return isQuebec;
            if (mapView === 'canada') return isCanadian;
            return !isCanadian;
        });
    }, [deals, mapView]);

    const countryBestDeal = useMemo(() => {
        const map = new Map<string, any>();
        for (const deal of visibleDeals) {
            const dest = deal.destination || deal.city || '';
            const coords = getCoords(deal);
            if (!coords) continue;
            const existing = map.get(dest);
            if (!existing || (deal.discount || 0) > (existing.discount || 0)) {
                map.set(dest, deal);
            }
        }
        return map;
    }, [visibleDeals]);

    // Dynamic set of countries with active deals (changes per tab)
    const activeCountriesRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const countries = new Set<string>();
        for (const deal of visibleDeals) {
            const dest = deal.destination || deal.city || '';
            const country = CITY_TO_COUNTRY[dest];
            if (country) countries.add(country);
        }
        activeCountriesRef.current = countries;
    }, [visibleDeals]);

    const startFlyTo = useCallback((lng: number, lat: number, deal: any) => {
        const fly = flyToRef.current;
        fly.active = true;
        fly.startRotation = [...rotationRef.current] as [number, number, number];
        fly.targetRotation = [-lng, -lat, 0];
        fly.startScale = 1;
        fly.targetScale = 1.6;
        fly.progress = 0;
        fly.duration = 70;
        fly.phase = 'zoomIn';
        fly.deal = deal;
    }, []);

    const startHoloFlyTo = useCallback((deal: any) => {
        const coords = getCoords(deal);
        if (!coords) return;
        flyToRef.current.active = false;
        const holo = holoRef.current;
        holo.active = true;
        holo.phase = 'rotate';
        holo.frame = 0;
        holo.deal = deal;
        holo.originCoords = [-73.74, 45.47];
        holo.destCoords = [coords.lng, coords.lat];
        holo.startRotation = [...rotationRef.current] as [number, number, number];
        holo.targetRotation = [-coords.lng, -coords.lat, 0];
        holo.startScale = zoomCurrentRef.current;
        holo.arcProgress = 0;
        holo.glowIntensity = 0;
        holo.trailPoints = [];
        holo.ripples = [];
        holo.dimFactor = 1;
        holo.particles = [];
        for (let i = 0; i < HOLO_PARTICLE_COUNT; i++) {
            holo.particles.push({
                t: Math.random(),
                offset: (Math.random() - 0.5) * 2,
                size: 1.5 + Math.random() * 2.5,
                speed: 0.003 + Math.random() * 0.007,
                alpha: 0.4 + Math.random() * 0.6,
                color: HOLO_COLORS.particle[Math.floor(Math.random() * HOLO_COLORS.particle.length)],
                phase: Math.random() * Math.PI * 2,
            });
        }
        holoIdRef.current += 1;
    }, []);

    useEffect(() => {
        if (flyToDeal) {
            startHoloFlyTo(flyToDeal);
        }
    }, [flyToDeal, startHoloFlyTo]);

    // Main render loop
    useEffect(() => {
        if (!canvasRef.current || !worldData?.objects || dimensions.width === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        ctx.scale(dpr, dpr);

        const width = dimensions.width;
        const height = dimensions.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * (isMobile ? 0.38 : 0.40);

        let countries: any[] = [];
        try {
            countries = (topojson.feature(worldData, worldData.objects.countries) as any)
                .features.filter((f: any) => f?.properties?.name !== 'Antarctica');
        } catch { return; }

        const graticule = d3.geoGraticule10();

        // ═══ EVENT HANDLERS ═══
        const onMouseDown = (e: MouseEvent) => {
            isDraggingRef.current = true;
            lastMouseRef.current = [e.clientX, e.clientY];
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = e.clientX - lastMouseRef.current[0];
            const dy = e.clientY - lastMouseRef.current[1];
            lastMouseRef.current = [e.clientX, e.clientY];
            const rotDx = dx * 0.3;
            const rotDy = -dy * 0.3;
            rotationRef.current = [
                rotationRef.current[0] + rotDx,
                Math.max(-80, Math.min(80, rotationRef.current[1] + rotDy)),
                0,
            ];
            velocityRef.current = [rotDx, rotDy];
            lastDragTimeRef.current = performance.now();
        };
        const onMouseUp = () => {
            isDraggingRef.current = false;
            if (performance.now() - lastDragTimeRef.current > 100) {
                velocityRef.current = [0, 0];
            }
        };

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                isDraggingRef.current = true;
                lastMouseRef.current = [e.touches[0].clientX, e.touches[0].clientY];
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current || e.touches.length !== 1) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - lastMouseRef.current[0];
            const dy = e.touches[0].clientY - lastMouseRef.current[1];
            lastMouseRef.current = [e.touches[0].clientX, e.touches[0].clientY];
            const rotDx = dx * 0.3;
            const rotDy = -dy * 0.3;
            rotationRef.current = [
                rotationRef.current[0] + rotDx,
                Math.max(-80, Math.min(80, rotationRef.current[1] + rotDy)),
                0,
            ];
            velocityRef.current = [rotDx, rotDy];
            lastDragTimeRef.current = performance.now();
        };
        const onTouchEnd = () => {
            isDraggingRef.current = false;
            if (performance.now() - lastDragTimeRef.current > 100) {
                velocityRef.current = [0, 0];
            }
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
            zoomTargetRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTargetRef.current + delta));
        };
        const onDblClick = (e: MouseEvent) => {
            e.preventDefault();
            zoomTargetRef.current = ZOOM_DEFAULT;
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('dblclick', onDblClick);
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        // Click
        const onClick = (e: MouseEvent) => {
            if (flyToRef.current.active || holoRef.current.active) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projection = d3.geoOrthographic().scale(radius * zoomCurrentRef.current).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);

            for (const deal of visibleDeals) {
                const coords = getCoords(deal);
                if (!coords) continue;
                const projected = projection([coords.lng, coords.lat]);
                if (!projected) continue;
                if (Math.sqrt((mx - projected[0]) ** 2 + (my - projected[1]) ** 2) < 14) {
                    startFlyTo(coords.lng, coords.lat, deal);
                    return;
                }
            }

            const inverted = projection.invert?.([mx, my]);
            if (inverted) {
                for (const country of countries) {
                    if (d3.geoContains(country, inverted)) {
                        const region = getRegionForCountry(country.properties?.name || '');
                        if (region) onRegionSelect(region);
                        return;
                    }
                }
            }
        };
        canvas.addEventListener('click', onClick);

        // Hover
        const onCanvasMouseMove = (e: MouseEvent) => {
            if (isDraggingRef.current) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projection = d3.geoOrthographic().scale(radius * zoomCurrentRef.current).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);

            let found = false;
            for (const deal of visibleDeals) {
                const coords = getCoords(deal);
                if (!coords) continue;
                const projected = projection([coords.lng, coords.lat]);
                if (!projected) continue;
                if (Math.sqrt((mx - projected[0]) ** 2 + (my - projected[1]) ** 2) < 14) {
                    onHoverDeal(deal, e as any);
                    canvas.style.cursor = 'pointer';
                    found = true;
                    break;
                }
            }

            if (!found) {
                let countryFound = false;
                const invertedHover = projection.invert?.([mx, my]);
                if (invertedHover) {
                    for (const country of countries) {
                        if (d3.geoContains(country, invertedHover)) {
                            const countryName = country.properties?.name || '';
                            const region = getRegionForCountry(countryName);
                            if (region) { canvas.style.cursor = 'pointer'; countryFound = true; }
                            hoveredCountryRef.current = countryName;

                            const hasDeal = activeCountriesRef.current.has(countryName);
                            let bestDeal: any = null;
                            for (const deal of visibleDeals) {
                                const coords = getCoords(deal);
                                if (!coords) continue;
                                if (
                                    (deal.destination || '').toLowerCase().includes(countryName.toLowerCase().slice(0, 4)) ||
                                    countryName.toLowerCase().includes((deal.destination || '').toLowerCase().slice(0, 4))
                                ) {
                                    if (!bestDeal || (deal.discount || 0) > (bestDeal.discount || 0)) {
                                        bestDeal = deal;
                                    }
                                }
                            }

                            if (hasDeal || bestDeal) {
                                setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    countryName,
                                    bestDeal,
                                });
                            } else {
                                setTooltip(prev => ({ ...prev, visible: false }));
                            }
                            break;
                        }
                    }
                }
                if (!countryFound) {
                    canvas.style.cursor = 'grab';
                    hoveredCountryRef.current = null;
                    setTooltip(prev => ({ ...prev, visible: false }));
                }
                onLeaveDeal();
            }
        };
        canvas.addEventListener('mousemove', onCanvasMouseMove);

        const onCanvasEnter = () => { isMouseOnGlobeRef.current = true; };
        const onCanvasLeave = () => {
            isMouseOnGlobeRef.current = false;
            hoveredCountryRef.current = null;
            setTooltip(prev => ({ ...prev, visible: false }));
            onLeaveDeal();
        };
        canvas.addEventListener('mouseenter', onCanvasEnter);
        canvas.addEventListener('mouseleave', onCanvasLeave);

        // ═══════════════════════════════════════
        // ═══ MAIN ANIMATION LOOP ═══
        // ═══════════════════════════════════════
        const animate = () => {
            timeRef.current += 1;

            // ─── FLY-TO ANIMATION ───
            const fly = flyToRef.current;
            let currentScale = 1;
            if (fly.active) {
                fly.progress += 1;
                const t = Math.min(fly.progress / fly.duration, 1);
                const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                if (fly.phase === 'zoomIn') {
                    rotationRef.current = [
                        fly.startRotation[0] + (fly.targetRotation[0] - fly.startRotation[0]) * ease,
                        fly.startRotation[1] + (fly.targetRotation[1] - fly.startRotation[1]) * ease,
                        0,
                    ];
                    currentScale = fly.startScale + (fly.targetScale - fly.startScale) * ease;

                    if (t >= 1) {
                        if (fly.deal && onSelectDeal) {
                            onSelectDeal(fly.deal, { clientX: cx, clientY: cy } as any);
                        }
                        fly.phase = 'zoomOut';
                        fly.progress = 0;
                        fly.duration = 50;
                        fly.startScale = fly.targetScale;
                        fly.targetScale = 1;
                    }
                } else {
                    currentScale = fly.startScale + (fly.targetScale - fly.startScale) * ease;
                    if (t >= 1) {
                        fly.active = false;
                        currentScale = 1;
                    }
                }
            } else if (!holoRef.current.active) {
                const [vx, vy] = velocityRef.current;
                if (Math.abs(vx) > INERTIA_THRESHOLD || Math.abs(vy) > INERTIA_THRESHOLD) {
                    rotationRef.current = [
                        rotationRef.current[0] + vx,
                        Math.max(-80, Math.min(80, rotationRef.current[1] + vy)),
                        0,
                    ];
                    velocityRef.current = [vx * INERTIA_FRICTION, vy * INERTIA_FRICTION];
                } else {
                    velocityRef.current = [0, 0];
                    if (!isDraggingRef.current && !isMouseOnGlobeRef.current) {
                        rotationRef.current = [rotationRef.current[0] + 0.03, rotationRef.current[1], 0];
                    }
                }
            }

            // ═══ HOLOGRAPHIC TRAJECTORY ANIMATION ═══
            const holo = holoRef.current;
            if (holo.active) {
                holo.frame += 1;
                if (isDraggingRef.current && holo.phase !== 'fadeOut') {
                    holo.phase = 'fadeOut';
                    holo.frame = 0;
                }

                if (holo.phase === 'rotate') {
                    const t = Math.min(holo.frame / HOLO_ROTATE_FRAMES, 1);
                    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    rotationRef.current = [
                        holo.startRotation[0] + (holo.targetRotation[0] - holo.startRotation[0]) * ease,
                        holo.startRotation[1] + (holo.targetRotation[1] - holo.startRotation[1]) * ease,
                        0,
                    ];
                    const targetZoom = Math.min(2.0, holo.startScale + 0.8);
                    zoomTargetRef.current = holo.startScale + (targetZoom - holo.startScale) * ease;
                    holo.dimFactor = 1 - ease * 0.85;
                    holo.glowIntensity = ease * 0.3;
                    if (t >= 1) { holo.phase = 'arc'; holo.frame = 0; }
                } else if (holo.phase === 'arc') {
                    const t = Math.min(holo.frame / HOLO_ARC_FRAMES, 1);
                    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    holo.arcProgress = ease;
                    holo.glowIntensity = 0.3 + ease * 0.7;
                    holo.dimFactor = 0.15;
                    for (const p of holo.particles) {
                        p.t = (p.t + p.speed) % 1;
                        if (p.t > holo.arcProgress) p.alpha *= 0.5;
                    }
                    if (t >= 1) {
                        holo.phase = 'sustain';
                        holo.frame = 0;
                        if (holo.deal && onSelectDeal) {
                            onSelectDeal(holo.deal, { clientX: cx, clientY: cy } as any);
                        }
                    }
                } else if (holo.phase === 'sustain') {
                    const t = Math.min(holo.frame / HOLO_SUSTAIN_FRAMES, 1);
                    holo.arcProgress = 1;
                    zoomTargetRef.current = Math.min(2.0, holo.startScale + 0.8);
                    holo.glowIntensity = 0.7 + Math.sin(holo.frame * 0.15) * 0.3;
                    holo.dimFactor = 0.15;
                    for (const p of holo.particles) {
                        p.t = (p.t + p.speed) % 1;
                        p.alpha = 0.4 + Math.sin(holo.frame * 0.1 + p.phase) * 0.3;
                    }
                    if (holo.frame % 14 === 0) {
                        holo.ripples.push({ radius: 0, alpha: 0.7 });
                    }
                    for (let i = holo.ripples.length - 1; i >= 0; i--) {
                        holo.ripples[i].radius += 1.2;
                        holo.ripples[i].alpha *= 0.96;
                        if (holo.ripples[i].alpha < 0.02) holo.ripples.splice(i, 1);
                    }
                    if (t >= 1) { holo.phase = 'fadeOut'; holo.frame = 0; }
                } else if (holo.phase === 'fadeOut') {
                    const t = Math.min(holo.frame / HOLO_FADEOUT_FRAMES, 1);
                    const ease = t * t;
                    holo.glowIntensity = Math.max(0, (1 - ease));
                    holo.dimFactor = 0.15 + ease * 0.85;
                    holo.arcProgress = Math.max(0, 1 - ease);
                    zoomTargetRef.current = 1.0;
                    for (const p of holo.particles) { p.alpha *= 0.92; }
                    for (const r of holo.ripples) { r.alpha *= 0.85; }
                    if (t >= 1) {
                        holo.active = false;
                        holo.dimFactor = 1;
                        holo.glowIntensity = 0;
                        holo.particles = [];
                        holo.trailPoints = [];
                        holo.ripples = [];
                        if (onHoloComplete) onHoloComplete();
                    }
                }
            }

            // Smooth zoom
            zoomCurrentRef.current += (zoomTargetRef.current - zoomCurrentRef.current) * ZOOM_SMOOTHING;
            if (Math.abs(zoomCurrentRef.current - zoomTargetRef.current) < 0.001) {
                zoomCurrentRef.current = zoomTargetRef.current;
            }

            const visibleRadius = radius * currentScale * zoomCurrentRef.current;
            const projection = d3.geoOrthographic()
                .scale(visibleRadius).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);
            const path = d3.geoPath().projection(projection).context(ctx);

            // ─── INTERSTELLAR DEEP SPACE ───
            const bgBase = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.8);
            bgBase.addColorStop(0, '#0a1628');     // deep space navy
            bgBase.addColorStop(0.4, '#060d1a');   // darker void
            bgBase.addColorStop(0.7, '#030810');   // near-black
            bgBase.addColorStop(1, '#010204');      // absolute void
            ctx.fillStyle = bgBase;
            ctx.fillRect(0, 0, width, height);

            // Nebula layer 1: warm amber accretion glow (top-right, Gargantua-style)
            ctx.globalCompositeOperation = 'screen';
            const nebula1 = ctx.createRadialGradient(
                width * 0.78, height * 0.25, 0,
                width * 0.78, height * 0.25, Math.max(width, height) * 0.45
            );
            nebula1.addColorStop(0, 'rgba(217, 149, 51, 0.07)');
            nebula1.addColorStop(0.3, 'rgba(180, 100, 30, 0.04)');
            nebula1.addColorStop(0.6, 'rgba(140, 70, 20, 0.02)');
            nebula1.addColorStop(1, 'rgba(100, 50, 10, 0)');
            ctx.fillStyle = nebula1;
            ctx.fillRect(0, 0, width, height);

            // Nebula layer 2: deep violet dust (left)
            const nebula2 = ctx.createRadialGradient(
                width * 0.15, height * 0.55, 0,
                width * 0.15, height * 0.55, Math.max(width, height) * 0.5
            );
            nebula2.addColorStop(0, 'rgba(88, 40, 150, 0.05)');
            nebula2.addColorStop(0.3, 'rgba(60, 25, 110, 0.03)');
            nebula2.addColorStop(0.6, 'rgba(40, 15, 80, 0.015)');
            nebula2.addColorStop(1, 'rgba(20, 8, 50, 0)');
            ctx.fillStyle = nebula2;
            ctx.fillRect(0, 0, width, height);

            // Nebula layer 3: subtle cyan haze behind globe
            const nebula3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, visibleRadius * 2.2);
            nebula3.addColorStop(0, 'rgba(0, 180, 220, 0.04)');
            nebula3.addColorStop(0.5, 'rgba(0, 120, 160, 0.02)');
            nebula3.addColorStop(1, 'rgba(0, 80, 120, 0)');
            ctx.fillStyle = nebula3;
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = 'source-over';

            // ─── STARS (cool tones, subtle) ───
            const stars = starsRef.current;
            for (const star of stars) {
                const twinkle = (Math.sin(timeRef.current * star.twinkleSpeed + star.phase) + 1) / 2;
                const opacity = star.baseOpacity * (0.3 + twinkle * 0.7);
                ctx.globalAlpha = opacity;
                ctx.fillStyle = star.color;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // ─── SHOOTING STARS ───
            const shootingStars = shootingStarsRef.current;
            if (Math.random() < 0.012 && shootingStars.length < 5) {
                shootingStars.push(createShootingStar(width, height));
            }
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.life++;
                ss.x += Math.cos(ss.angle) * ss.speed;
                ss.y += Math.sin(ss.angle) * ss.speed;
                const progress = ss.life / ss.maxLife;
                const alpha = ss.opacity * (1 - progress);
                if (alpha <= 0 || ss.life >= ss.maxLife) {
                    shootingStars.splice(i, 1);
                    continue;
                }
                ctx.save();
                const tailX = ss.x - Math.cos(ss.angle) * ss.length;
                const tailY = ss.y - Math.sin(ss.angle) * ss.length;
                const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
                grad.addColorStop(0, 'rgba(255,220,180,0)');
                grad.addColorStop(0.7, `rgba(255,230,200,${alpha * 0.3})`);
                grad.addColorStop(1, `rgba(255,240,220,${alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(ss.x, ss.y);
                ctx.stroke();
                ctx.restore();
            }

            // ═══ ATMOSPHERE — THICK CARTOON GLOW ═══
            const atmoPulse = 1.0 + Math.sin(timeRef.current * 0.012) * 0.06;

            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            // Outer glow — soft cyan atmosphere, dimmer for deep space
            const outerGlow = ctx.createRadialGradient(cx, cy, visibleRadius * 0.9, cx, cy, visibleRadius * 1.5 * atmoPulse);
            outerGlow.addColorStop(0, 'rgba(0, 180, 220, 0.0)');
            outerGlow.addColorStop(0.3, 'rgba(0, 180, 220, 0.05)');
            outerGlow.addColorStop(0.5, 'rgba(0, 200, 240, 0.08)');
            outerGlow.addColorStop(0.7, 'rgba(0, 180, 220, 0.04)');
            outerGlow.addColorStop(1, 'rgba(0, 160, 200, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Cyan rim (lit side — top-right, like sunlight hitting atmosphere)
            const cyanGrad = ctx.createRadialGradient(
                cx + visibleRadius * 0.25, cy - visibleRadius * 0.2, visibleRadius * 0.88,
                cx + visibleRadius * 0.25, cy - visibleRadius * 0.2, visibleRadius * 1.15 * atmoPulse
            );
            cyanGrad.addColorStop(0, 'rgba(0, 200, 240, 0.0)');
            cyanGrad.addColorStop(0.4, 'rgba(0, 200, 240, 0.10)');
            cyanGrad.addColorStop(0.7, 'rgba(0, 180, 220, 0.05)');
            cyanGrad.addColorStop(1, 'rgba(0, 180, 220, 0)');
            ctx.fillStyle = cyanGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.25, 0, Math.PI * 2);
            ctx.fill();

            // Warm amber rim (left side — like a distant star behind)
            const warmGrad = ctx.createRadialGradient(
                cx - visibleRadius * 0.35, cy + visibleRadius * 0.1, visibleRadius * 0.88,
                cx - visibleRadius * 0.35, cy + visibleRadius * 0.1, visibleRadius * 1.12
            );
            warmGrad.addColorStop(0, 'rgba(217, 149, 51, 0.0)');
            warmGrad.addColorStop(0.4, 'rgba(217, 149, 51, 0.04)');
            warmGrad.addColorStop(0.7, 'rgba(180, 120, 40, 0.02)');
            warmGrad.addColorStop(1, 'rgba(180, 120, 40, 0)');
            ctx.fillStyle = warmGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Crisp edge rim — thin atmosphere line
            const rimGrad = ctx.createRadialGradient(cx, cy, visibleRadius * 0.95, cx, cy, visibleRadius * 1.06);
            rimGrad.addColorStop(0, 'rgba(0, 200, 240, 0)');
            rimGrad.addColorStop(0.5, 'rgba(0, 200, 240, 0.08)');
            rimGrad.addColorStop(0.8, 'rgba(0, 200, 240, 0.16)');
            rimGrad.addColorStop(0.95, 'rgba(0, 200, 240, 0.10)');
            rimGrad.addColorStop(1, 'rgba(0, 200, 240, 0.03)');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.06, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();

            // ─── OCEAN (deep cinematic blue) ───
            const oceanGrad = ctx.createRadialGradient(
                cx - visibleRadius * 0.3, cy - visibleRadius * 0.3, 0, cx, cy, visibleRadius
            );
            oceanGrad.addColorStop(0, '#0E7A90');
            oceanGrad.addColorStop(0.3, '#0A6880');
            oceanGrad.addColorStop(0.6, '#085870');
            oceanGrad.addColorStop(1, '#054560');
            ctx.fillStyle = oceanGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.fill();

            // ─── GRATICULE (subtle cartoon grid) ───
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.strokeStyle = '#40C0D0';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            path(graticule);
            ctx.stroke();
            ctx.restore();

            // ═══ FILLED CARTOON CONTINENTS ═══
            const hoveredName = hoveredCountryRef.current;
            const activeCountries = activeCountriesRef.current;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.clip();

            for (const country of countries) {
                const name = country.properties?.name || '';
                const isHovered = name === hoveredName;
                const hasDeal = activeCountries.has(name);
                const regionKey = getRegionForCountry(name);
                const cc = (regionKey && CONTINENT_COLORS[regionKey]) || DEFAULT_CONTINENT;

                ctx.beginPath();
                path(country);

                // Region-colored cartoon fill
                if (isHovered && hasDeal) {
                    ctx.fillStyle = cc.hoverDeal;
                } else if (hasDeal) {
                    const dealPulse = 0.85 + 0.15 * Math.sin(timeRef.current * 0.03);
                    ctx.globalAlpha = dealPulse;
                    ctx.fillStyle = cc.deal;
                } else if (isHovered) {
                    ctx.fillStyle = cc.hover;
                } else {
                    ctx.fillStyle = cc.base;
                }
                ctx.fill();
                ctx.globalAlpha = 1;

                // Cartoon-style outline matching region
                if (hasDeal) {
                    ctx.strokeStyle = isHovered ? cc.hoverDeal : cc.dealStroke;
                } else {
                    ctx.strokeStyle = isHovered ? cc.hover : cc.stroke;
                }
                ctx.lineWidth = isHovered ? 1.8 : 0.8;
                ctx.stroke();

                // Glow effect on hovered deal countries
                if (isHovered && hasDeal) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.shadowColor = cc.deal;
                    ctx.shadowBlur = 24;
                    ctx.beginPath();
                    path(country);
                    ctx.fill();
                    ctx.restore();
                }
            }
            ctx.restore();

            // ═══ CARTOON SOLAR LIGHTING (warm top-left highlight) ═══
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.clip();
            const solarGrad = ctx.createRadialGradient(
                cx - visibleRadius * 0.4, cy - visibleRadius * 0.4, 0,
                cx + visibleRadius * 0.2, cy + visibleRadius * 0.2, visibleRadius * 1.2
            );
            solarGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            solarGrad.addColorStop(0.2, 'rgba(200, 240, 255, 0.04)');
            solarGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            solarGrad.addColorStop(0.8, 'rgba(0, 0, 20, 0.08)');
            solarGrad.addColorStop(1, 'rgba(0, 0, 20, 0.18)');
            ctx.fillStyle = solarGrad;
            ctx.fillRect(cx - visibleRadius, cy - visibleRadius, visibleRadius * 2, visibleRadius * 2);
            ctx.restore();



            // ═══ TINY CARTOON WORLD WONDERS (generated icons) ═══
            const wonderDefs: { key: string; lat: number; lng: number; label: string }[] = [
                { key: 'eiffel', lat: 48.8584, lng: 2.2945, label: 'Tour Eiffel' },
                { key: 'colosseum', lat: 41.8902, lng: 12.4922, label: 'Colisée' },
                { key: 'cristo', lat: -22.9519, lng: -43.2105, label: 'Cristo' },
                { key: 'machupicchu', lat: -13.1631, lng: -72.5450, label: 'Machu Picchu' },
                { key: 'tajmahal', lat: 27.1751, lng: 78.0421, label: 'Taj Mahal' },
                { key: 'greatwall', lat: 40.4319, lng: 116.5704, label: 'Grande Muraille' },
                { key: 'liberty', lat: 40.6892, lng: -74.0445, label: 'Liberté' },
                { key: 'pyramids', lat: 29.9792, lng: 31.1342, label: 'Pyramides' },
            ];
            const wonderImages = wonderImagesRef.current;
            const pinR = isMobile ? 22 : 28; // circle radius
            const imgSize = pinR * 2.2; // image fills entire circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.clip();
            for (const w of wonderDefs) {
                const img = wonderImages.get(w.key);
                if (!img) continue;

                // Hemisphere check — only show pins on the VISIBLE side of the globe
                const rot = rotationRef.current;
                const centerLng = -rot[0]; // projection center longitude
                const centerLat = -rot[1]; // projection center latitude
                const toRad = Math.PI / 180;
                const dLng = (w.lng - centerLng) * toRad;
                const lat1 = centerLat * toRad;
                const lat2 = w.lat * toRad;
                const cosAngle = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng);
                if (cosAngle < Math.cos(80 * toRad)) continue; // behind the globe (>80°)

                const proj = projection([w.lng, w.lat]);
                if (!proj) continue;
                const distFromCenter = Math.sqrt((proj[0] - cx) ** 2 + (proj[1] - cy) ** 2);
                if (distFromCenter > visibleRadius * 0.88) continue;

                const px = proj[0];
                const py = proj[1] - 10; // float above surface

                // Drop shadow
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.35;
                ctx.beginPath();
                ctx.ellipse(px + 2, py + pinR + 4, pinR * 0.6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fill();

                // White pin circle background
                ctx.globalAlpha = 0.95;
                ctx.beginPath();
                ctx.arc(px, py, pinR, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                // Colored border
                ctx.strokeStyle = '#4A9A78';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Pin pointer triangle
                ctx.beginPath();
                ctx.moveTo(px - 6, py + pinR - 2);
                ctx.lineTo(px, py + pinR + 10);
                ctx.lineTo(px + 6, py + pinR - 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = '#4A9A78';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(px - 6, py + pinR - 1);
                ctx.lineTo(px, py + pinR + 10);
                ctx.lineTo(px + 6, py + pinR - 1);
                ctx.stroke();

                // Icon image inside the circle (clipped)
                ctx.save();
                ctx.globalAlpha = 1.0;
                ctx.beginPath();
                ctx.arc(px, py, pinR - 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, px - imgSize / 2, py - imgSize / 2, imgSize, imgSize);
                ctx.restore();

                // Label below pin
                ctx.globalAlpha = 0.85;
                ctx.font = `700 ${isMobile ? 7 : 8}px 'Outfit', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillText(w.label, px + 0.5, py + pinR + 13.5);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(w.label, px, py + pinR + 13);
            }
            ctx.restore();

            // ═══ FLIGHT ARCS — only during holo fly-to (removed constant arcs/airplanes) ═══
            const yulCoord: [number, number] = [-73.74, 45.47];
            const yulProjected = projection(yulCoord);
            const holoDim = holo.active ? holo.dimFactor : 1;

            // ═══ HOLOGRAPHIC ARC RENDERING ═══
            if (holo.active && yulProjected) {
                const originProj = yulProjected;
                const destProj = projection(holo.destCoords);

                if (originProj && destProj) {
                    const hMidX = (originProj[0] + destProj[0]) / 2;
                    const hDist = Math.sqrt(
                        (destProj[0] - originProj[0]) ** 2 +
                        (destProj[1] - originProj[1]) ** 2
                    );
                    const hMidY = Math.min(originProj[1], destProj[1]) - hDist * 0.3;
                    const intensity = holo.glowIntensity;

                    const bezierPt = (bt: number): [number, number] => {
                        const omt2 = 1 - bt;
                        return [
                            omt2 * omt2 * originProj[0] + 2 * omt2 * bt * hMidX + bt * bt * destProj[0],
                            omt2 * omt2 * originProj[1] + 2 * omt2 * bt * hMidY + bt * bt * destProj[1],
                        ];
                    };
                    const bezierTangent = (bt: number): [number, number] => {
                        const omt2 = 1 - bt;
                        return [
                            2 * omt2 * (hMidX - originProj[0]) + 2 * bt * (destProj[0] - hMidX),
                            2 * omt2 * (hMidY - originProj[1]) + 2 * bt * (destProj[1] - hMidY),
                        ];
                    };
                    const bezierNormal = (bt: number): [number, number] => {
                        const [tgx, tgy] = bezierTangent(bt);
                        const len = Math.sqrt(tgx * tgx + tgy * tgy) || 1;
                        return [-tgy / len, tgx / len];
                    };

                    // Main arc
                    if (holo.arcProgress > 0.01) {
                        const steps = 60;
                        const maxStep = Math.floor(holo.arcProgress * steps);
                        const [startPt0, startPt1] = bezierPt(0);

                        const arcGrad = ctx.createLinearGradient(originProj[0], originProj[1], destProj[0], destProj[1]);
                        arcGrad.addColorStop(0, HOLO_COLORS.primary);
                        arcGrad.addColorStop(0.5, HOLO_COLORS.secondary);
                        arcGrad.addColorStop(1, HOLO_COLORS.primary);

                        ctx.save();
                        ctx.shadowColor = HOLO_COLORS.glow;
                        ctx.shadowBlur = 16 * intensity;
                        ctx.beginPath();
                        ctx.moveTo(startPt0, startPt1);
                        for (let i = 1; i <= maxStep; i++) {
                            const [bpx, bpy] = bezierPt(i / steps);
                            ctx.lineTo(bpx, bpy);
                        }
                        ctx.strokeStyle = arcGrad;
                        ctx.lineWidth = 4;
                        ctx.globalAlpha = 0.5 * intensity;
                        ctx.stroke();

                        ctx.shadowBlur = 6 * intensity;
                        ctx.beginPath();
                        ctx.moveTo(startPt0, startPt1);
                        for (let i = 1; i <= maxStep; i++) {
                            const [bpx, bpy] = bezierPt(i / steps);
                            ctx.lineTo(bpx, bpy);
                        }
                        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                        ctx.lineWidth = 1.5;
                        ctx.globalAlpha = 0.8 * intensity;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        ctx.restore();

                        // Arc head
                        if (holo.arcProgress < 1) {
                            const [headX, headY] = bezierPt(holo.arcProgress);
                            ctx.save();
                            ctx.globalAlpha = intensity;
                            const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, 14);
                            headGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
                            headGrad.addColorStop(0.3, HOLO_COLORS.primary);
                            headGrad.addColorStop(1, 'rgba(0,212,255,0)');
                            ctx.fillStyle = headGrad;
                            ctx.shadowColor = HOLO_COLORS.glow;
                            ctx.shadowBlur = 12;
                            ctx.beginPath();
                            ctx.arc(headX, headY, 14, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                            ctx.restore();
                        }
                    }

                    // Particles
                    if (holo.arcProgress > 0) {
                        ctx.save();
                        for (const p of holo.particles) {
                            if (p.t > holo.arcProgress) continue;
                            const [ptx, pty] = bezierPt(p.t);
                            const [nx, ny] = bezierNormal(p.t);
                            const wobble = Math.sin(timeRef.current * 0.06 + p.phase) * 10 * p.offset;
                            const fx = ptx + nx * wobble;
                            const fy = pty + ny * wobble;
                            ctx.globalAlpha = p.alpha * intensity * 0.7;
                            ctx.fillStyle = p.color;
                            ctx.shadowColor = p.color;
                            ctx.shadowBlur = 4;
                            ctx.beginPath();
                            ctx.arc(fx, fy, p.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.shadowBlur = 0;
                        ctx.restore();
                    }

                    // Ripples at destination
                    if (holo.ripples.length > 0) {
                        ctx.save();
                        for (const r of holo.ripples) {
                            ctx.globalAlpha = r.alpha * intensity;
                            ctx.strokeStyle = HOLO_COLORS.primary;
                            ctx.lineWidth = 1.5;
                            ctx.shadowColor = HOLO_COLORS.glow;
                            ctx.shadowBlur = 6;
                            ctx.beginPath();
                            ctx.arc(destProj[0], destProj[1], r.radius, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                        ctx.shadowBlur = 0;
                        ctx.restore();
                    }

                    // Destination label + price
                    if (holo.phase === 'sustain' || (holo.phase === 'arc' && holo.arcProgress > 0.8)) {
                        const labelAlpha = holo.phase === 'sustain' ? intensity : (holo.arcProgress - 0.8) * 5 * intensity;
                        const destName = holo.deal?.destination || holo.deal?.city || '';
                        const destPrice = holo.deal?.price || '';
                        if (destName) {
                            ctx.save();
                            ctx.globalAlpha = labelAlpha;
                            ctx.textAlign = 'center';
                            ctx.font = `800 ${isMobile ? 12 : 15}px 'Outfit', sans-serif`;
                            ctx.textBaseline = 'bottom';
                            ctx.shadowColor = HOLO_COLORS.glow;
                            ctx.shadowBlur = 14;
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillText(destName, destProj[0], destProj[1] - 22);
                            if (destPrice) {
                                ctx.font = `800 ${isMobile ? 10 : 12}px 'Fredoka', sans-serif`;
                                ctx.textBaseline = 'top';
                                ctx.fillStyle = HOLO_COLORS.primary;
                                ctx.fillText(`${destPrice}$`, destProj[0], destProj[1] + 14);
                            }
                            ctx.shadowBlur = 0;
                            ctx.restore();
                        }
                    }
                }
            }

            // ═══ YUL PIN (simplified cyan) ═══
            if (yulProjected) {
                const pulse = Math.sin(timeRef.current * 0.06);

                // Single subtle pulse ring
                const pulseRadius = 12 + pulse * 4;
                ctx.save();
                ctx.globalAlpha = 0.12 + pulse * 0.06;
                ctx.strokeStyle = '#00D4FF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], pulseRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Main dot (smaller, cyan)
                ctx.save();
                ctx.shadowColor = 'rgba(0, 212, 255, 0.7)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#00D4FF';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();

                // Pill label (more discreet)
                ctx.save();
                const yulLabel = 'YUL Montr\u00e9al';
                ctx.font = `700 ${isMobile ? 8 : 9}px 'Outfit', sans-serif`;
                const labelWidth = ctx.measureText(yulLabel).width;
                const pillW = labelWidth + 14;
                const pillH = isMobile ? 14 : 16;
                const pillX = yulProjected[0] - pillW / 2;
                const pillY = yulProjected[1] - 20;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.beginPath();
                ctx.roundRect(pillX, pillY - pillH / 2, pillW, pillH, pillH / 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(yulLabel, yulProjected[0], pillY);
                ctx.restore();
            }

            // (Deal pins removed — countries colored in red instead)

            // ═══ CITY LABELS (visible when zoomed in) ═══
            const currentZoom = zoomCurrentRef.current;
            if (currentZoom > CITY_LABEL_ZOOM_THRESHOLD) {
                const labelAlpha = Math.min(1, (currentZoom - CITY_LABEL_ZOOM_THRESHOLD) / 0.3);
                ctx.save();
                ctx.globalAlpha = labelAlpha;
                ctx.font = `700 ${isMobile ? 8 : 9}px 'Outfit', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                for (const deal of visibleDeals) {
                    const coords = getCoords(deal);
                    if (!coords) continue;
                    const projected = projection([coords.lng, coords.lat]);
                    if (!projected) continue;
                    const cityName = deal.destination || deal.city || '';
                    if (!cityName) continue;
                    const labelY = projected[1] + 10;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
                        ctx.fillText(cityName, projected[0] + ox, labelY + oy);
                    }
                    ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
                    ctx.fillText(cityName, projected[0], labelY);
                }
                ctx.restore();
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('click', onClick);
            canvas.removeEventListener('mousemove', onCanvasMouseMove);
            canvas.removeEventListener('mouseenter', onCanvasEnter);
            canvas.removeEventListener('mouseleave', onCanvasLeave);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('dblclick', onDblClick);
        };
    }, [worldData, dimensions, isMobile, visibleDeals, onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal, onHoloComplete, mapView]);

    return (
        <div
            ref={containerRef}
            id="map-container"
            style={{
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                touchAction: 'none',
                overflow: 'hidden',
                cursor: 'grab',
                position: 'relative',
            }}
        >
            <canvas
                ref={canvasRef}
                id="cartoon-globe-canvas"
                style={{ display: 'block', width: '100%', height: '100%' }}
            />
            {/* ─── TOOLTIP OVERLAY ─── */}
            {tooltip.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x + 16,
                        top: tooltip.y - 10,
                        zIndex: 100,
                        pointerEvents: 'none',
                        background: 'rgba(2, 2, 5, 0.92)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: 14,
                        padding: '12px 16px',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.08)',
                        minWidth: 160,
                        maxWidth: 240,
                        fontFamily: "'Outfit', sans-serif",
                        animation: 'fadeIn 0.15s ease-out',
                    }}
                >
                    <div style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}>
                        <span style={{ fontSize: 14 }}>🌍</span>
                        {tooltip.countryName}
                    </div>
                    {tooltip.bestDeal ? (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                            }}>
                                <span style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.6)',
                                }}>
                                    ✈️ {tooltip.bestDeal.destination || tooltip.bestDeal.city}
                                </span>
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: '#4ADE80',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    {tooltip.bestDeal.price}$
                                </span>
                            </div>
                            {(tooltip.bestDeal.discount || 0) > 0 && (
                                <div style={{
                                    display: 'inline-block',
                                    background: BADGE_COLORS[tooltip.bestDeal.dealLevel || 'good'] || '#00D4FF',
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '2px 10px',
                                    borderRadius: 100,
                                    marginBottom: 6,
                                }}>
                                    -{Math.round(tooltip.bestDeal.discount)}% vs normal
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            Deals disponibles
                        </div>
                    )}
                    <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#00D4FF',
                        marginTop: 4,
                    }}>
                        Cliquer pour explorer →
                    </div>
                </div>
            )}
        </div>
    );
}
