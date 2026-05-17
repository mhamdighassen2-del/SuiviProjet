-- ============================================================
--  007_adapt_reperes_cellules.sql
--  Adapte le schéma existant pour les repères et cellules
--  À exécuter après 001..006 (si déjà appliqués partiellement)
-- ============================================================

-- 1. Ajouter colonne cellule directe sur utilisateur (nom_cellule = enum existant)
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS cellule nom_cellule;

-- 2. Renommer client_code en numero_client sur projet (table vide, rename safe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='projet' AND column_name='client_code'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='projet' AND column_name='numero_client'
    ) THEN
        ALTER TABLE projet RENAME COLUMN client_code TO numero_client;
    END IF;
END$$;

-- 3. Recréer la table repere avec le bon schéma (table vide)
DROP TABLE IF EXISTS repere CASCADE;

-- Supprimer l'ancien enum et recréer avec nos valeurs
DROP TYPE IF EXISTS statut_repere CASCADE;
CREATE TYPE statut_repere AS ENUM ('PLANIFIE', 'EN_COURS', 'CLOTURE');

CREATE TABLE repere (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id     UUID NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    code          VARCHAR(50) UNIQUE NOT NULL,
    designation   VARCHAR(255) NOT NULL,
    numero_of     VARCHAR(100),
    statut        statut_repere NOT NULL DEFAULT 'PLANIFIE',
    temps_estime  INTEGER NOT NULL DEFAULT 0,
    avancement    DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (avancement >= 0 AND avancement <= 1),
    cause_retard  TEXT,
    cellule       nom_cellule,
    ordre         SMALLINT NOT NULL DEFAULT 1,
    cree_le       TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repere_projet ON repere(projet_id);
CREATE INDEX idx_repere_ordre  ON repere(projet_id, ordre);

-- 4. Trigger de recalcul avancement projet depuis repères
CREATE OR REPLACE FUNCTION fn_recalculer_avancement_reperes()
RETURNS TRIGGER AS $$
DECLARE v_projet_id UUID;
BEGIN
    v_projet_id := COALESCE(NEW.projet_id, OLD.projet_id);
    UPDATE projet
    SET taux_avancement = (
        SELECT COALESCE(
            SUM(avancement * temps_estime)::NUMERIC / NULLIF(SUM(temps_estime), 0) * 100,
            0
        )
        FROM repere WHERE projet_id = v_projet_id
    )
    WHERE id = v_projet_id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculer_avancement ON repere;
CREATE TRIGGER trg_recalculer_avancement
AFTER INSERT OR UPDATE OR DELETE ON repere
FOR EACH ROW EXECUTE FUNCTION fn_recalculer_avancement_reperes();
