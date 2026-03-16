-- Hotel prices table for all-inclusive & pack voyage features
CREATE TABLE IF NOT EXISTS hotel_prices (
    id BIGSERIAL PRIMARY KEY,
    destination TEXT NOT NULL,
    destination_code TEXT NOT NULL,
    hotel_name TEXT,
    hotel_type TEXT,            -- 'all-inclusive', 'hotel', 'resort'
    stars INTEGER,
    price_per_night NUMERIC NOT NULL,
    total_price NUMERIC,
    nights INTEGER,
    check_in DATE,
    check_out DATE,
    currency TEXT DEFAULT 'CAD',
    rating NUMERIC,
    review_count INTEGER,
    image_url TEXT,
    booking_url TEXT,
    source TEXT DEFAULT 'serpapi_hotels',
    is_all_inclusive BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by destination + all-inclusive + recency
CREATE INDEX idx_hotel_prices_dest_ai ON hotel_prices (destination_code, is_all_inclusive, scanned_at DESC);
CREATE INDEX idx_hotel_prices_scanned ON hotel_prices (scanned_at DESC);
