-- Migration de documentation : table price_history
-- Cette table existe déjà dans Supabase. Ce fichier documente le schéma attendu.

CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    origin TEXT NOT NULL DEFAULT 'YUL',
    destination TEXT NOT NULL,
    destination_code TEXT,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',
    airline TEXT,
    stops INTEGER,
    departure_date DATE,
    return_date DATE,
    source TEXT,
    raw_data JSONB,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_price_history_scanned_at ON price_history (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_destination ON price_history (destination);
CREATE INDEX IF NOT EXISTS idx_price_history_price ON price_history (price ASC);
