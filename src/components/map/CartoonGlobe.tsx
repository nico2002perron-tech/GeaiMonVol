'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getRegionForCountry } from '@/lib/data/regions';
import { PRIORITY_DESTINATIONS } from '@/lib/services/flights';

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   CARTOON SPACE GLOBE ÔÇö 3D Interactive Globe
   Style: Space immersion + Cartoon aesthetic
   Dark space background, stars, uniform mint countries
   ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */

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
    'Qu├®bec': { lat: 46.81, lng: -71.21 },
    'Paris': { lat: 48.86, lng: 2.35 },
    'Canc├║n': { lat: 21.16, lng: -86.85 },
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
    'S├úo Paulo': { lat: -23.55, lng: -46.63 },
    'Bali': { lat: -8.34, lng: 115.09 },
    'Miami': { lat: 25.76, lng: -80.19 },
    'Los Angeles': { lat: 34.05, lng: -118.24 },
    'Reykjavik': { lat: 64.15, lng: -21.94 },
    'Ath├¿nes': { lat: 37.98, lng: 23.73 },
    'Dublin': { lat: 53.35, lng: -6.26 },
    'Amsterdam': { lat: 52.37, lng: 4.90 },
    'Porto': { lat: 41.16, lng: -8.63 },
    'Madrid': { lat: 40.42, lng: -3.70 },
    'Montego Bay': { lat: 18.47, lng: -77.89 },
    'San Jos├®': { lat: 9.93, lng: -84.08 },
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

// Continent-based colors ÔÇö one pleasant color per continent
const CONTINENT_COLORS: Record<string, string> = {
    'Africa': '#E8C170',         // warm sand
    'Asia': '#7ECFB3',           // soft mint
    'Europe': '#A8B8D8',         // slate lavender
    'North America': '#8FBC8F',  // sage green
    'South America': '#C5A3D9',  // soft purple
    'Oceania': '#F0A68C',        // coral peach
};
const CONTINENT_COLORS_HOVER: Record<string, string> = {
    'Africa': '#F2D690',
    'Asia': '#A0E8D0',
    'Europe': '#C0CFEA',
    'North America': '#A8D4A8',
    'South America': '#D8BDE8',
    'Oceania': '#F8BFA8',
};
const DEFAULT_LAND = '#8FBC8F';
const DEFAULT_LAND_HOVER = '#A8D4A8';

// Country ÔåÆ Continent mapping
const COUNTRY_CONTINENT: Record<string, string> = {
    // Africa
    'Algeria': 'Africa', 'Angola': 'Africa', 'Benin': 'Africa', 'Botswana': 'Africa',
    'Burkina Faso': 'Africa', 'Burundi': 'Africa', 'Cameroon': 'Africa', 'Cape Verde': 'Africa',
    'Central African Rep.': 'Africa', 'Chad': 'Africa', 'Comoros': 'Africa',
    'Congo': 'Africa', 'Dem. Rep. Congo': 'Africa', "C├┤te d'Ivoire": 'Africa',
    'Djibouti': 'Africa', 'Egypt': 'Africa', 'Eq. Guinea': 'Africa', 'Eritrea': 'Africa',
    'eSwatini': 'Africa', 'Ethiopia': 'Africa', 'Gabon': 'Africa', 'Gambia': 'Africa',
    'Ghana': 'Africa', 'Guinea': 'Africa', 'Guinea-Bissau': 'Africa', 'Kenya': 'Africa',
    'Lesotho': 'Africa', 'Liberia': 'Africa', 'Libya': 'Africa', 'Madagascar': 'Africa',
    'Malawi': 'Africa', 'Mali': 'Africa', 'Mauritania': 'Africa', 'Mauritius': 'Africa',
    'Morocco': 'Africa', 'Mozambique': 'Africa', 'Namibia': 'Africa', 'Niger': 'Africa',
    'Nigeria': 'Africa', 'Rwanda': 'Africa', 'S├úo Tom├® and Pr├¡ncipe': 'Africa',
    'Senegal': 'Africa', 'Seychelles': 'Africa', 'Sierra Leone': 'Africa',
    'Somalia': 'Africa', 'Somaliland': 'Africa', 'South Africa': 'Africa', 'S. Sudan': 'Africa',
    'Sudan': 'Africa', 'Tanzania': 'Africa', 'Togo': 'Africa', 'Tunisia': 'Africa',
    'Uganda': 'Africa', 'Zambia': 'Africa', 'Zimbabwe': 'Africa', 'W. Sahara': 'Africa',
    // Asia
    'Afghanistan': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia', 'Bahrain': 'Asia',
    'Bangladesh': 'Asia', 'Bhutan': 'Asia', 'Brunei': 'Asia', 'Myanmar': 'Asia',
    'Cambodia': 'Asia', 'China': 'Asia', 'Cyprus': 'Asia', 'Georgia': 'Asia',
    'India': 'Asia', 'Indonesia': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia',
    'Israel': 'Asia', 'Japan': 'Asia', 'Jordan': 'Asia', 'Kazakhstan': 'Asia',
    'Kuwait': 'Asia', 'Kyrgyzstan': 'Asia', 'Laos': 'Asia', 'Lebanon': 'Asia',
    'Malaysia': 'Asia', 'Maldives': 'Asia', 'Mongolia': 'Asia', 'Nepal': 'Asia',
    'North Korea': 'Asia', 'Oman': 'Asia', 'Pakistan': 'Asia', 'Palestine': 'Asia',
    'Philippines': 'Asia', 'Qatar': 'Asia', 'Saudi Arabia': 'Asia', 'Singapore': 'Asia',
    'South Korea': 'Asia', 'Sri Lanka': 'Asia', 'Syria': 'Asia', 'Taiwan': 'Asia',
    'Tajikistan': 'Asia', 'Thailand': 'Asia', 'Timor-Leste': 'Asia', 'Turkey': 'Asia',
    'Turkmenistan': 'Asia', 'United Arab Emirates': 'Asia', 'Uzbekistan': 'Asia',
    'Vietnam': 'Asia', 'Yemen': 'Asia',
    // Europe
    'Albania': 'Europe', 'Andorra': 'Europe', 'Austria': 'Europe', 'Belarus': 'Europe',
    'Belgium': 'Europe', 'Bosnia and Herz.': 'Europe', 'Bulgaria': 'Europe',
    'Croatia': 'Europe', 'Czechia': 'Europe', 'Denmark': 'Europe', 'Estonia': 'Europe',
    'Finland': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Greece': 'Europe',
    'Hungary': 'Europe', 'Iceland': 'Europe', 'Ireland': 'Europe', 'Italy': 'Europe',
    'Kosovo': 'Europe', 'Latvia': 'Europe', 'Lithuania': 'Europe', 'Luxembourg': 'Europe',
    'Malta': 'Europe', 'Moldova': 'Europe', 'Monaco': 'Europe', 'Montenegro': 'Europe',
    'Netherlands': 'Europe', 'North Macedonia': 'Europe', 'Norway': 'Europe',
    'Poland': 'Europe', 'Portugal': 'Europe', 'Romania': 'Europe', 'Russia': 'Europe',
    'San Marino': 'Europe', 'Serbia': 'Europe', 'Slovakia': 'Europe', 'Slovenia': 'Europe',
    'Spain': 'Europe', 'Sweden': 'Europe', 'Switzerland': 'Europe', 'Ukraine': 'Europe',
    'United Kingdom': 'Europe', 'Vatican City': 'Europe',
    // North America
    'Antigua and Barbuda': 'North America', 'Bahamas': 'North America', 'Barbados': 'North America',
    'Belize': 'North America', 'Canada': 'North America', 'Costa Rica': 'North America',
    'Cuba': 'North America', 'Dominica': 'North America', 'Dominican Rep.': 'North America',
    'Dominican Republic': 'North America',
    'El Salvador': 'North America', 'Grenada': 'North America', 'Guatemala': 'North America',
    'Haiti': 'North America', 'Honduras': 'North America', 'Jamaica': 'North America',
    'Mexico': 'North America', 'Nicaragua': 'North America', 'Panama': 'North America',
    'St. Kitts and Nevis': 'North America', 'Saint Lucia': 'North America',
    'St. Vin. and Gren.': 'North America', 'Trinidad and Tobago': 'North America',
    'United States of America': 'North America',
    // South America
    'Argentina': 'South America', 'Bolivia': 'South America', 'Brazil': 'South America',
    'Chile': 'South America', 'Colombia': 'South America', 'Ecuador': 'South America',
    'Guyana': 'South America', 'Paraguay': 'South America', 'Peru': 'South America',
    'Suriname': 'South America', 'Uruguay': 'South America', 'Venezuela': 'South America',
    'Falkland Is.': 'South America',
    // Oceania
    'Australia': 'Oceania', 'Fiji': 'Oceania', 'Kiribati': 'Oceania',
    'Marshall Is.': 'Oceania', 'Micronesia': 'Oceania', 'Nauru': 'Oceania',
    'New Zealand': 'Oceania', 'Palau': 'Oceania', 'Papua New Guinea': 'Oceania',
    'Samoa': 'Oceania', 'Solomon Is.': 'Oceania', 'Tonga': 'Oceania',
    'Tuvalu': 'Oceania', 'Vanuatu': 'Oceania', 'New Caledonia': 'Oceania',
};

function getCountryColor(name: string, hovered: boolean): string {
    const continent = COUNTRY_CONTINENT[name];
    if (hovered) return (continent ? CONTINENT_COLORS_HOVER[continent] : DEFAULT_LAND_HOVER) || DEFAULT_LAND_HOVER;
    return (continent ? CONTINENT_COLORS[continent] : DEFAULT_LAND) || DEFAULT_LAND;
}

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

interface CartoonGlobeProps {
    deals?: any[];
    mapView?: 'world' | 'canada' | 'quebec';
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

// ÔòÉÔòÉÔòÉ SPACE PARTICLES ÔòÉÔòÉÔòÉ

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

interface Sparkle {
    x: number;
    y: number;
    size: number;
    angle: number;
    speed: number;
    opacity: number;
    phase: number;
}

function generateStars(width: number, height: number): Star[] {
    const stars: Star[] = [];
    const starColors = ['#FFFFFF', '#C8D6FF', '#FFE4C4', '#B8C8FF', '#FFDAB9', '#E8E0FF'];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.3 + Math.random() * 2,
            baseOpacity: 0.3 + Math.random() * 0.7,
            twinkleSpeed: 0.01 + Math.random() * 0.04,
            phase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)],
        });
    }
    return stars;
}

function generateSparkles(cx: number, cy: number, radius: number): Sparkle[] {
    const sparkles: Sparkle[] = [];
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
        const dist = radius + 12 + Math.random() * 50;
        sparkles.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            size: 2 + Math.random() * 4,
            angle,
            speed: 0.015 + Math.random() * 0.03,
            opacity: 0.3 + Math.random() * 0.6,
            phase: Math.random() * Math.PI * 2,
        });
    }
    return sparkles;
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;

    // Glowing 4-point star with color
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    grad.addColorStop(0, 'rgba(255,223,100,0.6)');
    grad.addColorStop(1, 'rgba(255,223,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFC300';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const r = i % 2 === 0 ? size : size * 0.3;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
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
        length: 40 + Math.random() * 80,
        angle: Math.PI * 0.6 + Math.random() * 0.5,
        speed: 4 + Math.random() * 6,
        opacity: 0.6 + Math.random() * 0.4,
        life: 0,
        maxLife: 40 + Math.random() * 30,
    };
}

export default function CartoonGlobe({
    deals = [],
    mapView = 'world',
    isMobile = false,
    onRegionSelect,
    onHoverDeal,
    onLeaveDeal,
    onSelectDeal,
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
    const sparklesRef = useRef<Sparkle[]>([]);
    const timeRef = useRef(0);
    const hoveredCountryRef = useRef<string | null>(null);
    const isMouseOnGlobeRef = useRef(false);

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
        duration: number; // frames
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

    useEffect(() => {
        loadWorldAtlas().then(setWorldData).catch(() => { });
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

    useEffect(() => {
        if (dimensions.width === 0) return;
        starsRef.current = generateStars(dimensions.width, dimensions.height);
        shootingStarsRef.current = [];
        const radius = Math.min(dimensions.width, dimensions.height) * (isMobile ? 0.38 : 0.40);
        sparklesRef.current = generateSparkles(dimensions.width / 2, dimensions.height / 2, radius);
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

    // Build a map of country name -> best deal for that country
    const countryBestDeal = useMemo(() => {
        const map = new Map<string, any>();
        for (const deal of visibleDeals) {
            const dest = deal.destination || deal.city || '';
            // Match deal to country name if we have coords
            const coords = getCoords(deal);
            if (!coords) continue;
            // We'll use the destination name as-is for matching in the tooltip
            const existing = map.get(dest);
            if (!existing || (deal.discount || 0) > (existing.discount || 0)) {
                map.set(dest, deal);
            }
        }
        return map;
    }, [visibleDeals]);

    // Helper: start fly-to animation toward a coordinate
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

        // ÔòÉÔòÉÔòÉ EVENT HANDLERS ÔòÉÔòÉÔòÉ
        const onMouseDown = (e: MouseEvent) => {
            isDraggingRef.current = true;
            lastMouseRef.current = [e.clientX, e.clientY];
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = e.clientX - lastMouseRef.current[0];
            const dy = e.clientY - lastMouseRef.current[1];
            lastMouseRef.current = [e.clientX, e.clientY];
            rotationRef.current = [
                rotationRef.current[0] + dx * 0.3,
                Math.max(-80, Math.min(80, rotationRef.current[1] - dy * 0.3)),
                0,
            ];
        };
        const onMouseUp = () => { isDraggingRef.current = false; };

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
            rotationRef.current = [
                rotationRef.current[0] + dx * 0.3,
                Math.max(-80, Math.min(80, rotationRef.current[1] - dy * 0.3)),
                0,
            ];
        };
        const onTouchEnd = () => { isDraggingRef.current = false; };

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        // Click
        const onClick = (e: MouseEvent) => {
            if (flyToRef.current.active) return; // ignore clicks during fly-to
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projection = d3.geoOrthographic().scale(radius).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);

            // Check pins first -> fly-to
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

            // Check countries -> direct region select (no zoom)
            for (const country of countries) {
                const ctx2 = document.createElement('canvas').getContext('2d');
                if (ctx2) {
                    const pathGen = d3.geoPath().projection(projection).context(ctx2);
                    ctx2.beginPath();
                    pathGen(country);
                    if (ctx2.isPointInPath(mx, my)) {
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
            const projection = d3.geoOrthographic().scale(radius).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);

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
                for (const country of countries) {
                    const ctx2 = document.createElement('canvas').getContext('2d');
                    if (ctx2) {
                        const pathGen = d3.geoPath().projection(projection).context(ctx2);
                        ctx2.beginPath();
                        pathGen(country);
                        if (ctx2.isPointInPath(mx, my)) {
                            const countryName = country.properties?.name || '';
                            const region = getRegionForCountry(countryName);
                            if (region) { canvas.style.cursor = 'pointer'; countryFound = true; }
                            hoveredCountryRef.current = countryName;

                            // Show tooltip for this country
                            const hasDeal = COUNTRIES_WITH_DEALS.has(countryName);
                            // Find best deal for this country
                            let bestDeal: any = null;
                            for (const deal of visibleDeals) {
                                const coords = getCoords(deal);
                                if (!coords) continue;
                                const continent = COUNTRY_CONTINENT[countryName];
                                const dealContinent = COUNTRY_CONTINENT[
                                    Object.keys(COUNTRY_CONTINENT).find(c =>
                                        (deal.destination || '').includes(c) || c.includes(deal.destination || '---')
                                    ) || ''
                                ];
                                // Simple match: check if the deal destination is in this country
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

        // Mouse enter/leave for pausing rotation
        const onCanvasEnter = () => { isMouseOnGlobeRef.current = true; };
        const onCanvasLeave = () => {
            isMouseOnGlobeRef.current = false;
            hoveredCountryRef.current = null;
            setTooltip(prev => ({ ...prev, visible: false }));
            onLeaveDeal();
        };
        canvas.addEventListener('mouseenter', onCanvasEnter);
        canvas.addEventListener('mouseleave', onCanvasLeave);

        // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
        // ÔòÉÔòÉÔòÉ MAIN ANIMATION LOOP ÔòÉÔòÉÔòÉ
        // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
        const animate = () => {
            timeRef.current += 1;

            // ÔöÇÔöÇÔöÇ FLY-TO ANIMATION ÔöÇÔöÇÔöÇ
            const fly = flyToRef.current;
            let currentScale = 1;
            if (fly.active) {
                fly.progress += 1;
                const t = Math.min(fly.progress / fly.duration, 1);
                // Ease in-out cubic
                const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                if (fly.phase === 'zoomIn') {
                    // Interpolate rotation
                    rotationRef.current = [
                        fly.startRotation[0] + (fly.targetRotation[0] - fly.startRotation[0]) * ease,
                        fly.startRotation[1] + (fly.targetRotation[1] - fly.startRotation[1]) * ease,
                        0,
                    ];
                    currentScale = fly.startScale + (fly.targetScale - fly.startScale) * ease;

                    if (t >= 1) {
                        // Trigger the deal select callback
                        if (fly.deal && onSelectDeal) {
                            onSelectDeal(fly.deal, { clientX: cx, clientY: cy } as any);
                        }
                        // Start zoom out
                        fly.phase = 'zoomOut';
                        fly.progress = 0;
                        fly.duration = 50;
                        fly.startScale = fly.targetScale;
                        fly.targetScale = 1;
                    }
                } else {
                    // Zoom out phase
                    currentScale = fly.startScale + (fly.targetScale - fly.startScale) * ease;
                    if (t >= 1) {
                        fly.active = false;
                        currentScale = 1;
                    }
                }
            } else {
                // Auto-rotate only when NOT dragging AND mouse NOT on globe
                if (!isDraggingRef.current && !isMouseOnGlobeRef.current) {
                    rotationRef.current = [rotationRef.current[0] + 0.03, rotationRef.current[1], 0];
                }
            }

            const projection = d3.geoOrthographic()
                .scale(radius * currentScale).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);
            const path = d3.geoPath().projection(projection).context(ctx);

            // ÔöÇÔöÇÔöÇ CLEAR WITH SPACE BACKGROUND ÔöÇÔöÇÔöÇ
            const spaceGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.8);
            spaceGrad.addColorStop(0, '#0B1628');
            spaceGrad.addColorStop(0.4, '#0A1220');
            spaceGrad.addColorStop(0.7, '#060D18');
            spaceGrad.addColorStop(1, '#030810');
            ctx.fillStyle = spaceGrad;
            ctx.fillRect(0, 0, width, height);

            // Subtle nebula glow (blueish)
            ctx.save();
            const nebulaGrad = ctx.createRadialGradient(
                cx + radius * 0.6, cy - radius * 0.4, 0,
                cx + radius * 0.6, cy - radius * 0.4, radius * 2
            );
            nebulaGrad.addColorStop(0, 'rgba(30, 60, 120, 0.08)');
            nebulaGrad.addColorStop(0.5, 'rgba(50, 30, 100, 0.04)');
            nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = nebulaGrad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            // Purple nebula hint
            ctx.save();
            const nebulaGrad2 = ctx.createRadialGradient(
                cx - radius * 1.2, cy + radius * 0.8, 0,
                cx - radius * 1.2, cy + radius * 0.8, radius * 1.5
            );
            nebulaGrad2.addColorStop(0, 'rgba(80, 40, 120, 0.06)');
            nebulaGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = nebulaGrad2;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            // ÔöÇÔöÇÔöÇ STARS ÔöÇÔöÇÔöÇ
            const stars = starsRef.current;
            for (const star of stars) {
                const twinkle = (Math.sin(timeRef.current * star.twinkleSpeed + star.phase) + 1) / 2;
                const opacity = star.baseOpacity * (0.4 + twinkle * 0.6);
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.fillStyle = star.color;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow for bigger stars
                if (star.size > 1.2) {
                    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
                    glow.addColorStop(0, `rgba(255,255,255,${opacity * 0.3})`);
                    glow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // ÔöÇÔöÇÔöÇ SHOOTING STARS ÔöÇÔöÇÔöÇ
            const shootingStars = shootingStarsRef.current;
            // Randomly spawn
            if (Math.random() < 0.005 && shootingStars.length < 3) {
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
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.7, `rgba(200,220,255,${alpha * 0.4})`);
                grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(ss.x, ss.y);
                ctx.stroke();

                // Head glow
                const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4);
                headGlow.addColorStop(0, `rgba(255,255,255,${alpha})`);
                headGlow.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = headGlow;
                ctx.beginPath();
                ctx.arc(ss.x, ss.y, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // ÔöÇÔöÇÔöÇ ATMOSPHERE GLOW (blue halo around globe) ÔöÇÔöÇÔöÇ
            const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.3);
            atmoGrad.addColorStop(0, 'rgba(80, 180, 255, 0.25)');
            atmoGrad.addColorStop(0.3, 'rgba(60, 140, 220, 0.12)');
            atmoGrad.addColorStop(0.6, 'rgba(40, 100, 200, 0.05)');
            atmoGrad.addColorStop(1, 'rgba(20, 60, 150, 0)');
            ctx.fillStyle = atmoGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();

            // ÔöÇÔöÇÔöÇ OCEAN ÔöÇÔöÇÔöÇ
            const oceanGrad = ctx.createRadialGradient(
                cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius
            );
            oceanGrad.addColorStop(0, '#1A5F8B');
            oceanGrad.addColorStop(0.5, '#144D72');
            oceanGrad.addColorStop(1, '#0E3D5E');
            ctx.fillStyle = oceanGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            // Graticule (subtle grid)
            ctx.save();
            ctx.globalAlpha = 0.06;
            ctx.strokeStyle = '#4A9CD4';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            path(graticule);
            ctx.stroke();
            ctx.restore();

            // ÔöÇÔöÇÔöÇ COUNTRIES (colored by continent) ÔöÇÔöÇÔöÇ
            for (const country of countries) {
                const name = country.properties?.name || '';
                const isHovered = hoveredCountryRef.current === name;
                const hasDeal = COUNTRIES_WITH_DEALS.has(name);

                ctx.beginPath();
                path(country);

                ctx.fillStyle = getCountryColor(name, isHovered);
                ctx.fill();

                // Cartoon thick white outline
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.lineWidth = isMobile ? 1 : 1.5;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.stroke();

                // Ô£¿ DEAL COUNTRY GLOW ÔÇö pulsing aura
                if (hasDeal) {
                    ctx.save();
                    const glowPulse = 0.12 + Math.sin(timeRef.current * 0.04) * 0.06;
                    ctx.globalAlpha = glowPulse;
                    ctx.shadowColor = '#50B4FF';
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = '#50B4FF';
                    ctx.beginPath();
                    path(country);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                }
            }

            // ÔöÇÔöÇÔöÇ FLIGHT ARCS ÔöÇÔöÇÔöÇ
            const yulCoord: [number, number] = [-73.74, 45.47];
            const yulProjected = projection(yulCoord);

            if (yulProjected) {
                for (const deal of visibleDeals) {
                    const coords = getCoords(deal);
                    if (!coords) continue;
                    const destProjected = projection([coords.lng, coords.lat]);
                    if (!destProjected) continue;

                    const discount = deal.discount || deal.disc || 0;
                    const level = deal.dealLevel || (discount >= 40 ? 'incredible' : discount >= 25 ? 'great' : 'good');
                    const arcColor = BADGE_COLORS[level] || '#2E7DDB';

                    const midX = (yulProjected[0] + destProjected[0]) / 2;
                    const dist = Math.sqrt(
                        (destProjected[0] - yulProjected[0]) ** 2 +
                        (destProjected[1] - yulProjected[1]) ** 2
                    );
                    const midY = Math.min(yulProjected[1], destProjected[1]) - dist * 0.25;

                    // Arc glow
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(yulProjected[0], yulProjected[1]);
                    ctx.quadraticCurveTo(midX, midY, destProjected[0], destProjected[1]);
                    ctx.strokeStyle = arcColor;
                    ctx.lineWidth = 5;
                    ctx.globalAlpha = 0.08;
                    ctx.stroke();

                    // Arc line (dashed, animated)
                    ctx.beginPath();
                    ctx.moveTo(yulProjected[0], yulProjected[1]);
                    ctx.quadraticCurveTo(midX, midY, destProjected[0], destProjected[1]);
                    ctx.strokeStyle = arcColor;
                    ctx.lineWidth = 1.8;
                    ctx.globalAlpha = 0.6;
                    ctx.setLineDash([6, 4]);
                    ctx.lineDashOffset = -timeRef.current * 0.6;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.restore();
                }
            }

            // ÔöÇÔöÇÔöÇ YUL PIN (Montreal) ÔöÇÔöÇÔöÇ
            if (yulProjected) {
                const pulse = Math.sin(timeRef.current * 0.06);
                const pulseRadius = 14 + pulse * 4;

                ctx.save();
                ctx.globalAlpha = 0.2 + pulse * 0.08;
                ctx.fillStyle = '#50B4FF';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], pulseRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // White circle with blue border
                ctx.save();
                ctx.shadowColor = 'rgba(80,180,255,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#50B4FF';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();

                ctx.save();
                ctx.font = `${isMobile ? 10 : 12}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Ô£ê´©Å', yulProjected[0], yulProjected[1]);
                ctx.restore();

                ctx.save();
                ctx.font = `800 ${isMobile ? 8 : 10}px 'Outfit', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = 6;
                ctx.fillText('YUL', yulProjected[0], yulProjected[1] - 16);
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // ÔöÇÔöÇÔöÇ DEAL PINS ÔöÇÔöÇÔöÇ
            for (const deal of visibleDeals) {
                const coords = getCoords(deal);
                if (!coords) continue;
                const projected = projection([coords.lng, coords.lat]);
                if (!projected) continue;

                const discount = deal.discount || deal.disc || 0;
                const level = deal.dealLevel || (discount >= 40 ? 'incredible' : discount >= 25 ? 'great' : 'good');
                const pinColor = BADGE_COLORS[level] || '#2E7DDB';
                const bounce = Math.max(0, Math.sin(timeRef.current * 0.04) * 1.5);

                // Glow
                ctx.save();
                const haloScale = 1 + Math.sin(timeRef.current * 0.05) * 0.15;
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = pinColor;
                ctx.beginPath();
                ctx.arc(projected[0], projected[1] - bounce, 10 * haloScale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Pin
                ctx.save();
                ctx.shadowColor = `${pinColor}80`;
                ctx.shadowBlur = 8;
                ctx.fillStyle = pinColor;
                ctx.beginPath();
                ctx.arc(projected[0], projected[1] - bounce, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();

                // Badge
                if (discount > 0) {
                    const badgeY = projected[1] - 20 - bounce;
                    const text = `-${Math.abs(Math.round(discount))}%`;
                    ctx.save();
                    ctx.font = `800 ${isMobile ? 8 : 9.5}px 'Outfit', sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    const badgeW = textWidth + 14;
                    const badgeH = 16;
                    const badgeX = projected[0] - badgeW / 2;

                    ctx.shadowColor = `${pinColor}60`;
                    ctx.shadowBlur = 6;
                    ctx.fillStyle = pinColor;
                    ctx.beginPath();
                    ctx.roundRect(badgeX, badgeY - badgeH / 2, badgeW, badgeH, 8);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, projected[0], badgeY);
                    ctx.restore();
                }
            }

            // ÔöÇÔöÇÔöÇ SPARKLES ÔöÇÔöÇÔöÇ
            const sparkles = sparklesRef.current;
            for (const s of sparkles) {
                const opacity = (Math.sin(timeRef.current * s.speed + s.phase) + 1) / 2 * s.opacity;
                const wobbleX = Math.sin(timeRef.current * 0.018 + s.phase) * 4;
                const wobbleY = Math.cos(timeRef.current * 0.013 + s.phase) * 4;
                drawSparkle(ctx, s.x + wobbleX, s.y + wobbleY, s.size, opacity);
            }

            // ÔöÇÔöÇÔöÇ GLOBE HIGHLIGHT (cartoon 3D shine) ÔöÇÔöÇÔöÇ
            ctx.save();
            const highlightGrad = ctx.createRadialGradient(
                cx - radius * 0.35, cy - radius * 0.35, 0,
                cx - radius * 0.35, cy - radius * 0.35, radius * 0.5,
            );
            highlightGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
            highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
            highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ÔöÇÔöÇÔöÇ EDGE GLOW (atmosphere rim) ÔöÇÔöÇÔöÇ
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.02);
            rimGrad.addColorStop(0, 'rgba(80,180,255,0)');
            rimGrad.addColorStop(0.5, 'rgba(80,180,255,0.08)');
            rimGrad.addColorStop(1, 'rgba(100,200,255,0.15)');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();

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
        };
    }, [worldData, dimensions, isMobile, visibleDeals, onRegionSelect, onHoverDeal, onLeaveDeal, onSelectDeal, mapView]);

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
            {/* ÔöÇÔöÇÔöÇ TOOLTIP OVERLAY ÔöÇÔöÇÔöÇ */}
            {tooltip.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x + 16,
                        top: tooltip.y - 10,
                        zIndex: 100,
                        pointerEvents: 'none',
                        background: 'rgba(10, 18, 32, 0.92)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: 14,
                        padding: '12px 16px',
                        border: '1px solid rgba(80, 180, 255, 0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(80,180,255,0.1)',
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
                        <span style={{ fontSize: 14 }}>­ƒîì</span>
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
                                    Ô£ê´©Å {tooltip.bestDeal.destination || tooltip.bestDeal.city}
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
                                    background: BADGE_COLORS[tooltip.bestDeal.dealLevel || 'good'] || '#2E7DDB',
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
                        color: '#50B4FF',
                        marginTop: 4,
                    }}>
                        Cliquer pour explorer ÔåÆ
                    </div>
                </div>
            )}
        </div>
    );
}
