import { IMG } from '@/lib/data/images';

export interface Hotel {
    name: string;
    city: string;
    stars: number;
    rating: number;
    reviews: number;
    price: number;
    old: number;
    disc: number;
    photo: string;
    tags: string[];
    fallback?: string;
}

const rawHotels: Hotel[] = [
    {
        name: "Riad Yasmine", city: "Marrakech", stars: 4, rating: 9.2, reviews: 1840, price: 68, old: 145, disc: 53,
        photo: "https://images.unsplash.com/photo-1570214476695-19bd467e6f7a?w=600&h=360&fit=crop",
        tags: ["top"]
    },
    {
        name: "Hotel 1898", city: "Barcelone", stars: 4, rating: 8.9, reviews: 2310, price: 95, old: 195, disc: 51,
        photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop",
        tags: ["top"]
    },
    {
        name: "Shinjuku Granbell", city: "Tokyo", stars: 4, rating: 8.7, reviews: 3200, price: 82, old: 165, disc: 50,
        photo: "https://images.unsplash.com/photo-1590490360182-c33d5394585e?w=600&h=360&fit=crop",
        tags: ["top"]
    },
    {
        name: "The Yama Hotel", city: "Bali", stars: 5, rating: 9.4, reviews: 960, price: 55, old: 130, disc: 58,
        photo: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=360&fit=crop",
        tags: ["coup-coeur"]
    },
    {
        name: "Casa do Principe", city: "Lisbonne", stars: 3, rating: 9.0, reviews: 1450, price: 72, old: 140, disc: 49,
        photo: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=360&fit=crop",
        tags: ["top"]
    },
    {
        name: "Maison Souquet", city: "Paris", stars: 5, rating: 9.3, reviews: 870, price: 185, old: 380, disc: 51,
        photo: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=360&fit=crop",
        tags: ["luxe"]
    },
    {
        name: "Palazzo Manfredi", city: "Rome", stars: 5, rating: 9.5, reviews: 620, price: 210, old: 420, disc: 50,
        photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=360&fit=crop",
        tags: ["luxe"]
    },
    {
        name: "Riu Cancun", city: "Cancun", stars: 5, rating: 8.6, reviews: 4100, price: 92, old: 210, disc: 56,
        photo: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=360&fit=crop",
        tags: ["all-inclusive"]
    },
    {
        name: "Chatrium Riverside", city: "Bangkok", stars: 5, rating: 8.8, reviews: 2700, price: 48, old: 105, disc: 54,
        photo: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=360&fit=crop",
        tags: ["top"]
    },
];

// Generate fallback for each hotel
export const HOTELS = rawHotels.map(h => {
    return {
        ...h,
        photo: IMG[h.name] || IMG[h.name + "_sm"] || h.photo,
        fallback: IMG[h.name + "_sm"] || IMG[h.name] || h.photo
    };
});
