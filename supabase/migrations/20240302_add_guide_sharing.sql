-- ═══════════════════════════════════════════
-- Add sharing capability to ai_guides
-- ═══════════════════════════════════════════

ALTER TABLE ai_guides
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_ai_guides_share_token ON ai_guides(share_token) WHERE share_token IS NOT NULL;

-- RLS: allow public read of shared guides via share_token
DROP POLICY IF EXISTS "Anyone can view public guides" ON ai_guides;
CREATE POLICY "Anyone can view public guides"
    ON ai_guides FOR SELECT
    USING (is_public = true AND share_token IS NOT NULL);

-- Allow users to update their own guides (for toggling share)
DROP POLICY IF EXISTS "Users can update own guides" ON ai_guides;
CREATE POLICY "Users can update own guides"
    ON ai_guides FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
