-- ============================================================
--  003_utilisateur_service.sql  —  Rattachement utilisateur → service
--  (pour RESPONSABLE_SERVICE : droits limités au suivi/OF du service)
-- ============================================================

ALTER TABLE utilisateur
    ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES service(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_utilisateur_service ON utilisateur (service_id);
