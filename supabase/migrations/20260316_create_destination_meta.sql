-- Destination metadata — pre-computed stats per destination
-- Updated by cron after each scan phase

CREATE TABLE IF NOT EXISTS destination_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_code TEXT NOT NULL UNIQUE,
    destination TEXT NOT NULL,
    country TEXT,
    region TEXT,
    best_months TEXT[] DEFAULT '{}',
    cheapest_airline TEXT,
    avg_price_7d NUMERIC,
    avg_price_30d NUMERIC,
    avg_price_90d NUMERIC,
    lowest_price_ever NUMERIC,
    lowest_price_date TIMESTAMPTZ,
    image_url TEXT,
    description_fr TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_destination_meta_code ON destination_meta(destination_code);

-- RLS: public read, admin write
ALTER TABLE destination_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "destination_meta_public_read" ON destination_meta
    FOR SELECT USING (true);

CREATE POLICY "destination_meta_admin_write" ON destination_meta
    FOR ALL USING (auth.role() = 'service_role');
