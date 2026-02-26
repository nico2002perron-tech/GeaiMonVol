-- Migration de documentation : table profiles
-- Cette table existe déjà dans Supabase. Ce fichier documente le schéma attendu.

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    preferred_origin TEXT DEFAULT 'YUL',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour lookup par email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
