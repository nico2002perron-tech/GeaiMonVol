-- Expedition templates
CREATE TABLE IF NOT EXISTS expedition_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    destination_code TEXT NOT NULL,
    total_nights INT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'moderate', 'adventurous')),
    tags TEXT[] DEFAULT '{}',
    cover_image TEXT,
    description_fr TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Expedition stops (each leg of the itinerary)
CREATE TABLE IF NOT EXISTS expedition_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expedition_id UUID NOT NULL REFERENCES expedition_templates(id) ON DELETE CASCADE,
    stop_order INT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    nights INT NOT NULL,
    description_fr TEXT,
    highlights TEXT[] DEFAULT '{}',
    accommodation_type TEXT DEFAULT 'hotel',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    UNIQUE (expedition_id, stop_order)
);

-- Accommodation options per stop (Skyscanner Hotels data)
CREATE TABLE IF NOT EXISTS expedition_accommodations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stop_id UUID NOT NULL REFERENCES expedition_stops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_night NUMERIC,
    rating NUMERIC,
    image_url TEXT,
    booking_url TEXT,
    scanned_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_expedition_stops_expedition ON expedition_stops(expedition_id);
CREATE INDEX idx_expedition_accommodations_stop ON expedition_accommodations(stop_id);

-- RLS
ALTER TABLE expedition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read expedition_templates" ON expedition_templates FOR SELECT USING (true);
CREATE POLICY "Service write expedition_templates" ON expedition_templates FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read expedition_stops" ON expedition_stops FOR SELECT USING (true);
CREATE POLICY "Service write expedition_stops" ON expedition_stops FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read expedition_accommodations" ON expedition_accommodations FOR SELECT USING (true);
CREATE POLICY "Service write expedition_accommodations" ON expedition_accommodations FOR ALL USING (auth.role() = 'service_role');
