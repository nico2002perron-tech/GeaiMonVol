export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    home_airport: string;
    travel_style: string[];
    preferred_destinations: string[];
    budget_min: number | null;
    budget_max: number | null;
    trip_duration: string | null;
    hotel_stars_min: number;
    hotel_budget_night: number | null;
    travel_months: string[];
    interests: string[];
    questionnaire_completed: boolean;
    plan: 'free' | 'premium';
    stripe_customer_id: string | null;
    subscription_status: string;
    email_notifications: boolean;
    notification_frequency: 'instant' | 'daily' | 'weekly';
    created_at: string;
    updated_at: string;
}

export interface WatchlistItem {
    id: string;
    user_id: string;
    destination: string;
    country: string | null;
    region: string | null;
    target_price: number | null;
    flexibility: string;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}
