-- Migration de documentation : table watchlist
-- Cette table existe déjà dans Supabase. Ce fichier documente le schéma attendu.

CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    destination_code TEXT,
    max_price NUMERIC,
    notify_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_destination ON watchlist (destination);
