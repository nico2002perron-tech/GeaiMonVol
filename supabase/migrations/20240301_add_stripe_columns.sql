-- Ajouter les colonnes Stripe à la table profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
    ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Index pour lookup par stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
    ON profiles (stripe_customer_id);

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN profiles.subscription_status IS 'active | canceled | past_due | inactive';
COMMENT ON COLUMN profiles.plan IS 'free | premium | guide';
