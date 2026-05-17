-- ============================================================
--  004 — Conversations assistant IA par projet
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_conversation (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id   UUID NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES utilisateur(id),
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_projet_created
    ON ai_conversation (projet_id, created_at);
