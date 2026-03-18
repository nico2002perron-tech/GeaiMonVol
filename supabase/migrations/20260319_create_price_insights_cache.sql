-- Price Insights Cache
-- Stores SerpAPI Google Flights price_insights data per route
-- TTL: 7 days (checked at query time, not via cron)

CREATE TABLE IF NOT EXISTS price_insights_cache (
    id BIGSERIAL PRIMARY KEY,
    origin TEXT NOT NULL DEFAULT 'YUL',
    destination_code TEXT NOT NULL,
    lowest_price NUMERIC,
    price_level TEXT,           -- 'low', 'typical', 'high'
    typical_price_low NUMERIC,
    typical_price_high NUMERIC,
    price_history JSONB,        -- array of [timestamp_ms, price] pairs
    raw_response JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- One cached result per route (origin + destination)
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_insights_route
    ON price_insights_cache(origin, destination_code);

CREATE INDEX IF NOT EXISTS idx_price_insights_fetched
    ON price_insights_cache(fetched_at DESC);
