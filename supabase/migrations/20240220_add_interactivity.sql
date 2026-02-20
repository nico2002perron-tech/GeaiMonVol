-- ═══════════════════════════════════════════
-- TABLE: ai_guide_feedback
-- Stores user feedback, ratings, and swap logs
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_guide_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES ai_guides(id) ON DELETE CASCADE,
    destination TEXT,
    day_number INTEGER,
    slot TEXT, -- 'morning', 'lunch', 'afternoon', 'dinner', 'evening'
    action TEXT NOT NULL, -- 'rate', 'swap_request', 'swap_confirm'
    rating INTEGER, -- 1 to 5
    swap_reason TEXT,
    original_activity JSONB,
    replacement_activity JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics and history
CREATE INDEX IF NOT EXISTS idx_ai_guide_feedback_user_id ON ai_guide_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_guide_feedback_guide_id ON ai_guide_feedback(guide_id);

-- RLS: Users can only see/insert their own feedback
ALTER TABLE ai_guide_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
    ON ai_guide_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
    ON ai_guide_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);
