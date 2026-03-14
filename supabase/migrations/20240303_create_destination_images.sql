-- Table pour cacher les images de destinations (Unsplash)
CREATE TABLE IF NOT EXISTS destination_images (
    id BIGSERIAL PRIMARY KEY,
    city TEXT NOT NULL,
    image_url TEXT NOT NULL,
    photographer TEXT,
    source TEXT DEFAULT 'unsplash',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city)
);

-- Index pour lookup rapide par ville
CREATE INDEX IF NOT EXISTS idx_destination_images_city ON destination_images (city);
