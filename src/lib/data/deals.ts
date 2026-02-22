export interface Deal {
    id: string;
    destination: string;
    country: string;
    price: number;
    originalPrice?: number; // For strikethrough
    discount?: number; // % off
    route: string; // e.g., "YUL - CDG"
    dates: string; // e.g., "12-19 Sept"
    coords: [number, number]; // [lon, lat] for D3
    tags: string[]; // ["Direct", "Eco", "Hot"]
    img: string; // Path to image (e.g., /img/deals/paris.webp)
}

// Sample data with new image paths
export const FLIGHT_DEALS: Deal[] = [
    {
        id: "paris-1",
        destination: "Paris",
        country: "France",
        price: 580,
        originalPrice: 850,
        discount: 32,
        route: "YUL - CDG",
        dates: "10-18 Oct",
        coords: [2.3522, 48.8566],
        tags: ["Direct", "Hot"],
        img: "/img/deals/paris.webp"
    },
    {
        id: "tokyo-1",
        destination: "Tokyo",
        country: "Japon",
        price: 950,
        originalPrice: 1400,
        discount: 35,
        route: "YUL - HND",
        dates: "1-15 Nov",
        coords: [139.6917, 35.6895],
        tags: ["Eco"],
        img: "/img/deals/tokyo.webp"
    },
    {
        id: "nyc-1",
        destination: "New York",
        country: "États-Unis",
        price: 240,
        route: "YUL - JFK",
        dates: "W-E Sept",
        coords: [-74.006, 40.7128],
        tags: ["Direct", "Weekend"],
        img: "/img/deals/nyc.webp"
    }
];

// Helper to get deal by ID
export function getDealById(id: string): Deal | undefined {
    return FLIGHT_DEALS.find(d => d.id === id);
}
