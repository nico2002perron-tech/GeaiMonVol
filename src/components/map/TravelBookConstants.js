/* TravelBook shared constants, helpers and CSS */

export const BOOK_COLORS = [
    { bg: "#8B2500", spine: "#5C1A00", accent: "#D4A574" },
    { bg: "#1A3A5C", spine: "#0F2440", accent: "#7EB8D8" },
    { bg: "#2D5016", spine: "#1A3008", accent: "#8FBF6A" },
    { bg: "#4A1942", spine: "#2E0F2A", accent: "#C490BF" },
    { bg: "#5C3A1E", spine: "#3A2410", accent: "#C9A87C" },
    { bg: "#1A4A4A", spine: "#0E2E2E", accent: "#6BC4C4" },
    { bg: "#4A2C2A", spine: "#2E1A18", accent: "#C49A98" },
    { bg: "#2A3A5C", spine: "#1A2640", accent: "#8A9FBF" },
];

export const SLOTS = [
    { slot: "breakfast", label: "Déjeuner", icon: "🥐", isMeal: true, emoji: "☕" },
    { slot: "morning", label: "Matin", icon: "🌅", isMeal: false, emoji: "🏔️" },
    { slot: "lunch", label: "Dîner", icon: "🥗", isMeal: true, emoji: "🍽️" },
    { slot: "afternoon", label: "Après-midi", icon: "☀️", isMeal: false, emoji: "⚡" },
    { slot: "dinner", label: "Souper", icon: "🍽️", isMeal: true, emoji: "🥘" },
    { slot: "evening", label: "Soirée", icon: "🌙", isMeal: false, emoji: "✨" },
];

export const FOOD_PREFS = [
    { l: "Burger", i: "🍔", v: "burger" }, { l: "Pizza", i: "🍕", v: "pizza" },
    { l: "Fruits de mer", i: "🦞", v: "fruits-de-mer" }, { l: "Bistro", i: "🍷", v: "bistro" },
    { l: "Gastronomique", i: "⭐", v: "gastro" }, { l: "Asiatique", i: "🍜", v: "asiatique" },
    { l: "Brunch", i: "🥞", v: "brunch" }, { l: "Végé", i: "🥗", v: "vege" },
    { l: "Pub / bière", i: "🍺", v: "biere" }, { l: "Café", i: "☕", v: "cafe" },
    { l: "Street food", i: "🌮", v: "street" }, { l: "Terroir", i: "🏔️", v: "terroir" },
];

export const SWAP_REASONS = [
    { l: "Trop cher", i: "💸", v: "trop_cher" },
    { l: "Pas mon genre", i: "🙅", v: "pas_genre" },
    { l: "Déjà fait", i: "✅", v: "deja_fait" },
    { l: "Plus intense", i: "🔥", v: "intense" },
    { l: "Plus calme", i: "🌿", v: "calme" },
    { l: "Pas accessible", i: "♿", v: "access" },
];

export const ACTIVITY_CATEGORIES = [
    { id: "nature", label: "Nature", icon: "🌲", color: "#059669" },
    { id: "culture", label: "Culture", icon: "🏛️", color: "#7C3AED" },
    { id: "gastro", label: "Gastronomie", icon: "🍽️", color: "#E84855" },
    { id: "aventure", label: "Aventure", icon: "🧗", color: "#F59E0B" },
    { id: "relax", label: "Détente", icon: "🧘", color: "#06B6D4" },
    { id: "nightlife", label: "Nightlife", icon: "🍸", color: "#DB2777" },
    { id: "famille", label: "Famille", icon: "👨👩👧👦", color: "#8B5CF6" },
    { id: "shopping", label: "Shopping", icon: "🛍️", color: "#EC4899" },
];

export const BOOK_CSS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
@keyframes bookOpen{0%{transform:perspective(1200px) rotateY(-5deg) scale(.85);opacity:0}60%{transform:perspective(1200px) rotateY(3deg) scale(1.02)}100%{transform:perspective(1200px) rotateY(0) scale(1);opacity:1}}
@keyframes pageIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes pageOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-20px)}}
@keyframes floatBM{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,0,0,.06)}50%{box-shadow:0 0 20px rgba(0,0,0,.12)}}
.bk-page::-webkit-scrollbar{width:4px}.bk-page::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:4px}
.bk-tab:hover{transform:translateX(4px)!important}
.subway-item{transition:all .2s!important}.subway-item:hover{transform:translateX(4px)!important;box-shadow:0 4px 15px rgba(0,0,0,.08)!important}
.budget-bar{transition:width .6s cubic-bezier(.4,0,.2,1)}
.cost-edit:hover{background:rgba(0,0,0,.04)!important;border-color:rgba(0,0,0,.15)!important}
.tool-btn{transition:all .2s!important}.tool-btn:hover{transform:translateY(-2px)!important;box-shadow:0 4px 12px rgba(0,0,0,.1)!important}`;

export function calcDayBudget(day) {
    if (!day) return 0;
    let total = 0;
    SLOTS.forEach(({ slot }) => { const d = day[slot]; if (d?.cost) total += Number(d.cost) || 0; });
    return total;
}

export function calcTotalBudget(guide) {
    if (!guide?.days) return { total: 0, food: 0, activities: 0, accommodation: 0 };
    let food = 0, activities = 0;
    guide.days.forEach(day => {
        SLOTS.forEach(({ slot, isMeal }) => {
            const d = day[slot];
            if (d?.cost) { if (isMeal) food += Number(d.cost) || 0; else activities += Number(d.cost) || 0; }
        });
    });
    const accommodation = guide.accommodation?.price_per_night
        ? (Number(guide.accommodation.price_per_night) || 0) * (guide.days?.length || 1)
        : (guide.budget_summary?.accommodation_total || 0);
    return { total: food + activities + accommodation, food, activities, accommodation };
}
