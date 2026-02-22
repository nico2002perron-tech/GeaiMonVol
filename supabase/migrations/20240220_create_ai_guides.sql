-- ═══════════════════════════════════════════
-- TABLE: ai_guides
-- Stores generated AI travel guides per user
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    destination_code TEXT,
    country TEXT,
    departure_date DATE,
    return_date DATE,
    flight_price NUMERIC,
    preferences TEXT[] DEFAULT '{}',
    budget_style TEXT DEFAULT 'moderate',
    guide_data JSONB NOT NULL,
    model_used TEXT DEFAULT 'claude-haiku-4-5-20251001',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups and counting
CREATE INDEX IF NOT EXISTS idx_ai_guides_user_id ON ai_guides(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_guides_created_at ON ai_guides(created_at DESC);

-- RLS: Users can only see their own guides
ALTER TABLE ai_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own guides"
    ON ai_guides FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guides"
    ON ai_guides FOR INSERT
    WITH CHECK (auth.uid() = user_id);
