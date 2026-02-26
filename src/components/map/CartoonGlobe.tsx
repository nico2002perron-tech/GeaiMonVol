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

// ÔòÉÔòÉÔòÉ SPACE PARTICLES ÔòÉÔòÉÔòÉ

// ═══ ZOOM & INERTIA CONSTANTS ═══
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_DEFAULT = 1.0;
const ZOOM_STEP = 0.15;
const ZOOM_SMOOTHING = 0.12;
const INERTIA_FRICTION = 0.95;
const INERTIA_THRESHOLD = 0.01;
const CITY_LABEL_ZOOM_THRESHOLD = 1.2;
const AIRPLANE_CYCLE_FRAMES = 300;

// ═══ HOLOGRAPHIC TRAJECTORY ═══
const HOLO_ROTATE_FRAMES = 40;
const HOLO_ARC_FRAMES = 60;
const HOLO_SUSTAIN_FRAMES = 40;
const HOLO_FADEOUT_FRAMES = 30;
const HOLO_PARTICLE_COUNT = 35;
const HOLO_TRAIL_LENGTH = 60;
const HOLO_COLORS = {
    primary: '#00FFFF',
    secondary: '#FF00FF',
    glow: 'rgba(0, 255, 255, 0.6)',
    trail: 'rgba(0, 200, 255, 0.3)',
    particle: ['#00FFFF', '#40E0D0', '#FFFFFF', '#80FFE0', '#00CED1'],
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
    originCoords: [number, number]; // [lng, lat] YUL
    destCoords: [number, number];   // [lng, lat] destination
    startRotation: [number, number, number];
    targetRotation: [number, number, number];
    startScale: number;
    particles: HoloParticle[];
    arcProgress: number;
    glowIntensity: number;
    trailPoints: { x: number; y: number; alpha: number }[];
    ripples: { radius: number; alpha: number }[];
    dimFactor: number; // 1 = normal, 0 = fully dimmed
}

// ═══ CLOUD PATCH ═══
interface CloudPatch {
    lng: number;
    lat: number;
    rx: number;
    ry: number;
    rotation: number;
    driftSpeed: number;
    opacity: number;
    phase: number;
}

function generateCloudPatches(): CloudPatch[] {
    const patches: CloudPatch[] = [];
    const positions = [
        { lng: -30, lat: 20 }, { lng: 60, lat: 10 }, { lng: -90, lat: 35 },
        { lng: 120, lat: -15 }, { lng: -150, lat: 5 }, { lng: 20, lat: -30 },
        { lng: 170, lat: 30 }, { lng: -60, lat: -10 }, { lng: 90, lat: 45 },
        { lng: -120, lat: -25 },
    ];
    for (const pos of positions) {
        patches.push({
            lng: pos.lng + (Math.random() - 0.5) * 20,
            lat: pos.lat + (Math.random() - 0.5) * 10,
            rx: 15 + Math.random() * 25,
            ry: 8 + Math.random() * 12,
            rotation: Math.random() * Math.PI,
            driftSpeed: 0.04 + Math.random() * 0.04,
            opacity: 0.08 + Math.random() * 0.07,
            phase: Math.random() * Math.PI * 2,
        });
    }
    return patches;
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
    const sparklesRef = useRef<Sparkle[]>([]);
    const timeRef = useRef(0);
    const hoveredCountryRef = useRef<string | null>(null);
    const isMouseOnGlobeRef = useRef(false);
    const zoomTargetRef = useRef(ZOOM_DEFAULT);
    const zoomCurrentRef = useRef(ZOOM_DEFAULT);
    const velocityRef = useRef<[number, number]>([0, 0]);
    const lastDragTimeRef = useRef(0);
    const cloudPatchesRef = useRef<CloudPatch[]>([]);

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
    const holoIdRef = useRef<number>(0); // to distinguish successive holo triggers

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
        cloudPatchesRef.current = generateCloudPatches();
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

    // Helper: start holographic fly-to animation
    const startHoloFlyTo = useCallback((deal: any) => {
        const coords = getCoords(deal);
        if (!coords) return;

        // Cancel any existing fly-to
        flyToRef.current.active = false;

        const holo = holoRef.current;
        holo.active = true;
        holo.phase = 'rotate';
        holo.frame = 0;
        holo.deal = deal;
        holo.originCoords = [-73.74, 45.47]; // YUL
        holo.destCoords = [coords.lng, coords.lat];
        holo.startRotation = [...rotationRef.current] as [number, number, number];
        holo.targetRotation = [-coords.lng, -coords.lat, 0];
        holo.startScale = zoomCurrentRef.current;
        holo.arcProgress = 0;
        holo.glowIntensity = 0;
        holo.trailPoints = [];
        holo.ripples = [];
        holo.dimFactor = 1;

        // Generate particles
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

    // Watch flyToDeal prop to trigger holographic animation
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
            if (flyToRef.current.active || holoRef.current.active) return; // ignore clicks during fly-to or holo
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projection = d3.geoOrthographic().scale(radius * zoomCurrentRef.current).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);

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
            } else if (!holoRef.current.active) {
                // Apply inertia (only when holo not active)
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
                    // Auto-rotate only when NOT dragging AND mouse NOT on globe AND no inertia
                    if (!isDraggingRef.current && !isMouseOnGlobeRef.current) {
                        rotationRef.current = [rotationRef.current[0] + 0.03, rotationRef.current[1], 0];
                    }
                }
            }

            // ═══ HOLOGRAPHIC TRAJECTORY ANIMATION ═══
            const holo = holoRef.current;
            if (holo.active) {
                holo.frame += 1;

                // Cancel on drag
                if (isDraggingRef.current && holo.phase !== 'fadeOut') {
                    holo.phase = 'fadeOut';
                    holo.frame = 0;
                }

                if (holo.phase === 'rotate') {
                    const t = Math.min(holo.frame / HOLO_ROTATE_FRAMES, 1);
                    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    // Rotate globe toward destination
                    rotationRef.current = [
                        holo.startRotation[0] + (holo.targetRotation[0] - holo.startRotation[0]) * ease,
                        holo.startRotation[1] + (holo.targetRotation[1] - holo.startRotation[1]) * ease,
                        0,
                    ];
                    // Zoom in (enhanced for premium feel)
                    const targetZoom = Math.min(2.0, holo.startScale + 0.8);
                    zoomTargetRef.current = holo.startScale + (targetZoom - holo.startScale) * ease;
                    // Dim other elements progressively
                    holo.dimFactor = 1 - ease * 0.85;
                    holo.glowIntensity = ease * 0.3;

                    if (t >= 1) {
                        holo.phase = 'arc';
                        holo.frame = 0;
                    }
                } else if (holo.phase === 'arc') {
                    const t = Math.min(holo.frame / HOLO_ARC_FRAMES, 1);
                    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    holo.arcProgress = ease;
                    holo.glowIntensity = 0.3 + ease * 0.7;
                    holo.dimFactor = 0.15;

                    // Update particles along arc
                    for (const p of holo.particles) {
                        p.t = (p.t + p.speed) % 1;
                        if (p.t > holo.arcProgress) p.alpha *= 0.5;
                    }

                    if (t >= 1) {
                        holo.phase = 'sustain';
                        holo.frame = 0;
                        // Trigger deal select callback
                        if (holo.deal && onSelectDeal) {
                            onSelectDeal(holo.deal, { clientX: cx, clientY: cy } as any);
                        }
                    }
                } else if (holo.phase === 'sustain') {
                    const t = Math.min(holo.frame / HOLO_SUSTAIN_FRAMES, 1);
                    holo.arcProgress = 1;
                    // Keep zoom locked at enhanced level
                    zoomTargetRef.current = Math.min(2.0, holo.startScale + 0.8);
                    // Pulsing glow
                    holo.glowIntensity = 0.7 + Math.sin(holo.frame * 0.15) * 0.3;
                    holo.dimFactor = 0.15;

                    // Particles keep circulating
                    for (const p of holo.particles) {
                        p.t = (p.t + p.speed) % 1;
                        p.alpha = 0.4 + Math.sin(holo.frame * 0.1 + p.phase) * 0.3;
                    }

                    // Ripple effect at destination
                    if (holo.frame % 12 === 0) {
                        holo.ripples.push({ radius: 0, alpha: 0.8 });
                    }
                    for (let i = holo.ripples.length - 1; i >= 0; i--) {
                        holo.ripples[i].radius += 1.2;
                        holo.ripples[i].alpha *= 0.96;
                        if (holo.ripples[i].alpha < 0.02) holo.ripples.splice(i, 1);
                    }

                    if (t >= 1) {
                        holo.phase = 'fadeOut';
                        holo.frame = 0;
                    }
                } else if (holo.phase === 'fadeOut') {
                    const t = Math.min(holo.frame / HOLO_FADEOUT_FRAMES, 1);
                    const ease = t * t; // ease-in
                    holo.glowIntensity = Math.max(0, (1 - ease));
                    holo.dimFactor = 0.15 + ease * 0.85; // restore to 1
                    holo.arcProgress = Math.max(0, 1 - ease);
                    // Zoom back
                    zoomTargetRef.current = 1.0;

                    // Fade particles
                    for (const p of holo.particles) {
                        p.alpha *= 0.92;
                    }
                    // Fade ripples
                    for (const r of holo.ripples) {
                        r.alpha *= 0.85;
                    }

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

            // Smooth zoom interpolation
            zoomCurrentRef.current += (zoomTargetRef.current - zoomCurrentRef.current) * ZOOM_SMOOTHING;
            if (Math.abs(zoomCurrentRef.current - zoomTargetRef.current) < 0.001) {
                zoomCurrentRef.current = zoomTargetRef.current;
            }

            const visibleRadius = radius * currentScale * zoomCurrentRef.current;
            const projection = d3.geoOrthographic()
                .scale(visibleRadius).translate([cx, cy]).rotate(rotationRef.current).clipAngle(90);
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

            // ═══ IMPROVED ATMOSPHERE GLOW (multi-layer + Fresnel + pulse) ═══
            const atmoPulse = 1.0 + Math.sin(timeRef.current * 0.015) * 0.05;

            // Layer 1: Outer fading blue
            const atmo1 = ctx.createRadialGradient(cx, cy, visibleRadius * 1.0, cx, cy, visibleRadius * 1.5 * atmoPulse);
            atmo1.addColorStop(0, 'rgba(80, 180, 255, 0.10)');
            atmo1.addColorStop(0.4, 'rgba(60, 140, 220, 0.05)');
            atmo1.addColorStop(1, 'rgba(20, 60, 150, 0)');
            ctx.fillStyle = atmo1;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.5 * atmoPulse, 0, Math.PI * 2);
            ctx.fill();

            // Layer 2: Inner bright rim
            const atmo2 = ctx.createRadialGradient(cx, cy, visibleRadius * 0.93, cx, cy, visibleRadius * 1.12);
            atmo2.addColorStop(0, 'rgba(100, 200, 255, 0.0)');
            atmo2.addColorStop(0.5, 'rgba(80, 180, 255, 0.18)');
            atmo2.addColorStop(1, 'rgba(60, 140, 200, 0.0)');
            ctx.fillStyle = atmo2;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.12, 0, Math.PI * 2);
            ctx.fill();

            // Layer 3: Fresnel-like edge glow
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const fresnelGrad = ctx.createRadialGradient(cx, cy, visibleRadius * 0.88, cx, cy, visibleRadius * 1.05);
            fresnelGrad.addColorStop(0, 'rgba(100, 200, 255, 0)');
            fresnelGrad.addColorStop(0.7, 'rgba(100, 200, 255, 0.06)');
            fresnelGrad.addColorStop(0.9, 'rgba(120, 210, 255, 0.14)');
            fresnelGrad.addColorStop(1, 'rgba(140, 220, 255, 0.20)');
            ctx.fillStyle = fresnelGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius * 1.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();

            // ÔöÇÔöÇÔöÇ OCEAN ÔöÇÔöÇÔöÇ
            const oceanGrad = ctx.createRadialGradient(
                cx - visibleRadius * 0.3, cy - visibleRadius * 0.3, 0, cx, cy, visibleRadius
            );
            oceanGrad.addColorStop(0, '#1A5F8B');
            oceanGrad.addColorStop(0.5, '#144D72');
            oceanGrad.addColorStop(1, '#0E3D5E');
            ctx.fillStyle = oceanGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
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

            // ═══ CLOUD LAYER ═══
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.clip();
            const clouds = cloudPatchesRef.current;
            for (const cloud of clouds) {
                const cloudLng = cloud.lng + timeRef.current * cloud.driftSpeed;
                const cloudCenter = projection([cloudLng, cloud.lat]);
                if (!cloudCenter) continue;
                const edgePoint = projection([cloudLng + cloud.rx, cloud.lat]);
                const edgePointY = projection([cloudLng, cloud.lat + cloud.ry]);
                if (!edgePoint || !edgePointY) continue;
                const screenRx = Math.abs(edgePoint[0] - cloudCenter[0]);
                const screenRy = Math.abs(edgePointY[1] - cloudCenter[1]);
                if (screenRx < 2 || screenRy < 2) continue;
                const pulseOpacity = cloud.opacity + Math.sin(timeRef.current * 0.02 + cloud.phase) * 0.02;
                ctx.globalAlpha = pulseOpacity;
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                if (!isMobile) ctx.filter = `blur(${Math.max(3, screenRx * 0.3)}px)`;
                ctx.beginPath();
                ctx.ellipse(cloudCenter[0], cloudCenter[1], screenRx, screenRy, cloud.rotation, 0, Math.PI * 2);
                ctx.fill();
                if (!isMobile) ctx.filter = 'none';
            }
            ctx.restore();

            // ═══ SOLAR LIGHTING (directional light from top-left) ═══
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.clip();
            const solarGrad = ctx.createRadialGradient(
                cx - visibleRadius * 0.5, cy - visibleRadius * 0.5, 0,
                cx + visibleRadius * 0.2, cy + visibleRadius * 0.2, visibleRadius * 1.2
            );
            solarGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
            solarGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
            solarGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
            solarGrad.addColorStop(1, 'rgba(0, 0, 20, 0.18)');
            ctx.fillStyle = solarGrad;
            ctx.fillRect(cx - visibleRadius, cy - visibleRadius, visibleRadius * 2, visibleRadius * 2);
            ctx.restore();

            // ÔöÇÔöÇÔöÇ FLIGHT ARCS ÔöÇÔöÇÔöÇ
            const yulCoord: [number, number] = [-73.74, 45.47];
            const yulProjected = projection(yulCoord);
            const holoDim = holo.active ? holo.dimFactor : 1;

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
                    ctx.globalAlpha = 0.08 * holoDim;
                    ctx.stroke();

                    // Arc line (dashed, animated)
                    ctx.beginPath();
                    ctx.moveTo(yulProjected[0], yulProjected[1]);
                    ctx.quadraticCurveTo(midX, midY, destProjected[0], destProjected[1]);
                    ctx.strokeStyle = arcColor;
                    ctx.lineWidth = 1.8;
                    ctx.globalAlpha = 0.6 * holoDim;
                    ctx.setLineDash([6, 4]);
                    ctx.lineDashOffset = -timeRef.current * 0.6;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.restore();
                }
            }

            // ═══ ANIMATED AIRPLANES ON ARCS ═══
            if (yulProjected) {
                visibleDeals.forEach((deal, dealIndex) => {
                    const coords = getCoords(deal);
                    if (!coords) return;
                    const destProjected = projection([coords.lng, coords.lat]);
                    if (!destProjected) return;
                    const apMidX = (yulProjected[0] + destProjected[0]) / 2;
                    const apDist = Math.sqrt(
                        (destProjected[0] - yulProjected[0]) ** 2 +
                        (destProjected[1] - yulProjected[1]) ** 2
                    );
                    const apMidY = Math.min(yulProjected[1], destProjected[1]) - apDist * 0.25;
                    const phaseOffset = (dealIndex * 73) % AIRPLANE_CYCLE_FRAMES;
                    const at = ((timeRef.current + phaseOffset) % AIRPLANE_CYCLE_FRAMES) / AIRPLANE_CYCLE_FRAMES;
                    const omt = 1 - at;
                    const px = omt * omt * yulProjected[0] + 2 * omt * at * apMidX + at * at * destProjected[0];
                    const py = omt * omt * yulProjected[1] + 2 * omt * at * apMidY + at * at * destProjected[1];
                    const tx = 2 * omt * (apMidX - yulProjected[0]) + 2 * at * (destProjected[0] - apMidX);
                    const ty = 2 * omt * (apMidY - yulProjected[1]) + 2 * at * (destProjected[1] - apMidY);
                    const angle = Math.atan2(ty, tx);
                    const sz = isMobile ? 4 : 5;
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(angle);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.85 * holoDim;
                    ctx.shadowColor = 'rgba(80, 180, 255, 0.6)';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(sz * 1.5, 0);
                    ctx.lineTo(-sz, -sz * 0.7);
                    ctx.lineTo(-sz * 0.5, 0);
                    ctx.lineTo(-sz, sz * 0.7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.restore();
                });
            }

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

                    // Helper: get point on quadratic bézier at parameter t
                    const bezierPt = (bt: number): [number, number] => {
                        const omt2 = 1 - bt;
                        return [
                            omt2 * omt2 * originProj[0] + 2 * omt2 * bt * hMidX + bt * bt * destProj[0],
                            omt2 * omt2 * originProj[1] + 2 * omt2 * bt * hMidY + bt * bt * destProj[1],
                        ];
                    };
                    // Helper: get tangent on quadratic bézier at parameter t
                    const bezierTangent = (bt: number): [number, number] => {
                        const omt2 = 1 - bt;
                        return [
                            2 * omt2 * (hMidX - originProj[0]) + 2 * bt * (destProj[0] - hMidX),
                            2 * omt2 * (hMidY - originProj[1]) + 2 * bt * (destProj[1] - hMidY),
                        ];
                    };
                    // Helper: get perpendicular normal at parameter t
                    const bezierNormal = (bt: number): [number, number] => {
                        const [tgx, tgy] = bezierTangent(bt);
                        const len = Math.sqrt(tgx * tgx + tgy * tgy) || 1;
                        return [-tgy / len, tgx / len];
                    };

                    // --- TRAIL POINTS ---
                    if (holo.arcProgress > 0) {
                        const trailSteps = Math.floor(holo.arcProgress * HOLO_TRAIL_LENGTH);
                        holo.trailPoints = [];
                        for (let i = 0; i <= trailSteps; i++) {
                            const tt = i / HOLO_TRAIL_LENGTH;
                            const [ptx, pty] = bezierPt(tt);
                            const alpha = (i / trailSteps) * 0.3 * intensity;
                            holo.trailPoints.push({ x: ptx, y: pty, alpha });
                        }

                        // Draw trail
                        ctx.save();
                        for (const tp of holo.trailPoints) {
                            ctx.globalAlpha = tp.alpha;
                            ctx.fillStyle = HOLO_COLORS.trail;
                            ctx.beginPath();
                            ctx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }

                    // --- MAIN HOLOGRAPHIC ARC ---
                    if (holo.arcProgress > 0.01) {
                        ctx.save();
                        // Outer glow
                        ctx.shadowColor = HOLO_COLORS.glow;
                        ctx.shadowBlur = 15 * intensity;
                        ctx.globalCompositeOperation = 'lighter';

                        // Draw the arc up to arcProgress
                        const steps = 60;
                        const maxStep = Math.floor(holo.arcProgress * steps);

                        // Thick glow stroke
                        ctx.beginPath();
                        const [startPt0, startPt1] = bezierPt(0);
                        ctx.moveTo(startPt0, startPt1);
                        for (let i = 1; i <= maxStep; i++) {
                            const [bpx, bpy] = bezierPt(i / steps);
                            ctx.lineTo(bpx, bpy);
                        }
                        // Gradient stroke cyan→magenta→cyan
                        const arcGrad = ctx.createLinearGradient(originProj[0], originProj[1], destProj[0], destProj[1]);
                        arcGrad.addColorStop(0, HOLO_COLORS.primary);
                        arcGrad.addColorStop(0.5, HOLO_COLORS.secondary);
                        arcGrad.addColorStop(1, HOLO_COLORS.primary);
                        ctx.strokeStyle = arcGrad;
                        ctx.lineWidth = 6;
                        ctx.globalAlpha = 0.4 * intensity;
                        ctx.stroke();

                        // Inner bright stroke
                        ctx.shadowBlur = 8 * intensity;
                        ctx.beginPath();
                        ctx.moveTo(startPt0, startPt1);
                        for (let i = 1; i <= maxStep; i++) {
                            const [bpx, bpy] = bezierPt(i / steps);
                            ctx.lineTo(bpx, bpy);
                        }
                        ctx.strokeStyle = arcGrad;
                        ctx.lineWidth = 2.5;
                        ctx.globalAlpha = 0.8 * intensity;
                        ctx.stroke();

                        ctx.globalCompositeOperation = 'source-over';
                        ctx.shadowBlur = 0;
                        ctx.restore();

                        // --- ARC HEAD (bright point at leading edge) ---
                        if (holo.arcProgress < 1) {
                            const [headX, headY] = bezierPt(holo.arcProgress);
                            ctx.save();
                            ctx.globalCompositeOperation = 'lighter';
                            ctx.globalAlpha = intensity;
                            const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, 12);
                            headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                            headGrad.addColorStop(0.3, HOLO_COLORS.primary);
                            headGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                            ctx.fillStyle = headGrad;
                            ctx.beginPath();
                            ctx.arc(headX, headY, 12, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.restore();
                        }
                    }

                    // --- PARTICLES ---
                    if (holo.arcProgress > 0) {
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        for (const p of holo.particles) {
                            if (p.t > holo.arcProgress) continue;
                            const [ptx, pty] = bezierPt(p.t);
                            const [nx, ny] = bezierNormal(p.t);
                            const wobble = Math.sin(timeRef.current * 0.08 + p.phase) * 8 * p.offset;
                            const fx = ptx + nx * wobble;
                            const fy = pty + ny * wobble;

                            ctx.globalAlpha = p.alpha * intensity;
                            ctx.fillStyle = p.color;
                            ctx.shadowColor = p.color;
                            ctx.shadowBlur = 4;
                            ctx.beginPath();
                            ctx.arc(fx, fy, p.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.shadowBlur = 0;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.restore();
                    }

                    // --- RIPPLE EFFECT AT DESTINATION ---
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

                    // --- DESTINATION GLOW LABEL ---
                    if (holo.phase === 'sustain' || (holo.phase === 'arc' && holo.arcProgress > 0.8)) {
                        const labelAlpha = holo.phase === 'sustain' ? intensity : (holo.arcProgress - 0.8) * 5 * intensity;
                        const destName = holo.deal?.destination || holo.deal?.city || '';
                        if (destName) {
                            ctx.save();
                            ctx.globalAlpha = labelAlpha;
                            ctx.font = `800 ${isMobile ? 10 : 12}px 'Outfit', sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            // Glow text
                            ctx.shadowColor = HOLO_COLORS.glow;
                            ctx.shadowBlur = 12;
                            ctx.fillStyle = HOLO_COLORS.primary;
                            ctx.fillText(destName, destProj[0], destProj[1] - 18);
                            ctx.shadowBlur = 0;
                            ctx.restore();
                        }
                    }
                }
            }

            // ═══ IMPROVED YUL PIN (Montreal) ═══
            if (yulProjected) {
                const pulse = Math.sin(timeRef.current * 0.06);

                // Double pulse ring
                const pulseRadius = 18 + pulse * 6;
                ctx.save();
                ctx.globalAlpha = 0.15 + pulse * 0.08;
                ctx.fillStyle = '#50B4FF';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], pulseRadius, 0, Math.PI * 2);
                ctx.fill();
                // Second pulse ring (offset phase)
                const pulse2 = Math.sin(timeRef.current * 0.06 + Math.PI);
                ctx.globalAlpha = 0.10 + pulse2 * 0.05;
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], 22 + pulse2 * 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Main circle (larger)
                ctx.save();
                ctx.shadowColor = 'rgba(80,180,255,0.7)';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(yulProjected[0], yulProjected[1], 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#50B4FF';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();

                // Bird/geai silhouette inside the circle
                ctx.save();
                ctx.translate(yulProjected[0], yulProjected[1]);
                ctx.scale(0.5, 0.5);
                ctx.fillStyle = '#50B4FF';
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.quadraticCurveTo(6, -6, 8, 0);
                ctx.quadraticCurveTo(6, 2, 3, 4);
                ctx.lineTo(0, 8);
                ctx.lineTo(-3, 4);
                ctx.quadraticCurveTo(-6, 2, -8, 0);
                ctx.quadraticCurveTo(-6, -6, 0, -8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Pill-shaped label
                ctx.save();
                const yulLabel = 'YUL Montr\u00e9al';
                ctx.font = `800 ${isMobile ? 8 : 10}px 'Outfit', sans-serif`;
                const labelWidth = ctx.measureText(yulLabel).width;
                const pillW = labelWidth + 16;
                const pillH = isMobile ? 16 : 18;
                const pillX = yulProjected[0] - pillW / 2;
                const pillY = yulProjected[1] - 24;
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 8;
                ctx.fillStyle = 'rgba(10, 18, 32, 0.85)';
                ctx.beginPath();
                ctx.roundRect(pillX, pillY - pillH / 2, pillW, pillH, pillH / 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(80, 180, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(yulLabel, yulProjected[0], pillY);
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
                    const labelY = projected[1] + 14;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
                        ctx.fillText(cityName, projected[0] + ox, labelY + oy);
                    }
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(cityName, projected[0], labelY);
                }
                ctx.restore();
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
                cx - visibleRadius * 0.35, cy - visibleRadius * 0.35, 0,
                cx - visibleRadius * 0.35, cy - visibleRadius * 0.35, visibleRadius * 0.5,
            );
            highlightGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
            highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
            highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, visibleRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // (Edge glow replaced by Fresnel layer in atmosphere section above)

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
