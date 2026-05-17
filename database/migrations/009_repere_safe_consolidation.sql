-- ============================================================
--  009_repere_safe_consolidation.sql
--  Consolidation idempotente du schéma "repere" + colonnes
--  projet (annee/numero_client/numero_dossier) + colonne
--  utilisateur.cellule.
--
--  À exécuter sur tout environnement où 006 et/ou 007 ont
--  laissé un état partiel, ou où aucune migration "repère"
--  n'a été appliquée.
--
--  ATTENTION : la migration 007 a un DROP TABLE repere CASCADE
--  destructif. Elle ne doit être exécutée que sur des
--  environnements vides. Sur les bases avec données, sauter 007
--  et lancer directement 006 puis 009 (cette migration corrige
--  les écarts éventuels).
-- ============================================================

-- 1. Types énumérés ------------------------------------------

DO $$ BEGIN
    CREATE TYPE cellule_type AS ENUM ('DEBITAGE', 'USINAGE', 'ASSEMBLAGE', 'AJUSTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_repere AS ENUM ('PLANIFIE', 'EN_COURS', 'CLOTURE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. utilisateur.cellule -------------------------------------

ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS cellule cellule_type;

-- 3. projet : numéro composite -------------------------------

ALTER TABLE projet ADD COLUMN IF NOT EXISTS annee          SMALLINT;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS numero_client  SMALLINT;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS numero_dossier SMALLINT;

-- 4. Table repere (créée seulement si absente) ---------------

CREATE TABLE IF NOT EXISTS repere (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id     UUID          NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    code          VARCHAR(50)   NOT NULL UNIQUE,
    designation   VARCHAR(255)  NOT NULL,
    numero_of     VARCHAR(100),
    statut        statut_repere NOT NULL DEFAULT 'PLANIFIE',
    temps_estime  INTEGER       NOT NULL DEFAULT 0 CHECK (temps_estime >= 0),
    avancement    DECIMAL(5,4)  NOT NULL DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 1),
    cause_retard  TEXT,
    cellule       cellule_type,
    ordre         SMALLINT      NOT NULL DEFAULT 1,
    cree_le       TIMESTAMP     NOT NULL DEFAULT NOW(),
    modifie_le    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 5. Colonnes additionnelles (si la table existait déjà sans elles)

ALTER TABLE repere ADD COLUMN IF NOT EXISTS cellule      cellule_type;
ALTER TABLE repere ADD COLUMN IF NOT EXISTS cause_retard TEXT;
ALTER TABLE repere ADD COLUMN IF NOT EXISTS numero_of    VARCHAR(100);

-- 6. Indexes -------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_repere_projet ON repere (projet_id);
CREATE INDEX IF NOT EXISTS idx_repere_statut ON repere (statut);
CREATE INDEX IF NOT EXISTS idx_repere_ordre  ON repere (projet_id, ordre);

-- 7. Trigger : recalcul taux_avancement du projet -----------
--    (formule alignée sur la cellule J35 du modèle Excel :
--     SUM(temps_estime × avancement) / SUM(temps_estime) × 100)

CREATE OR REPLACE FUNCTION fn_recalculer_avancement_reperes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_projet_id UUID;
BEGIN
    v_projet_id := COALESCE(NEW.projet_id, OLD.projet_id);
    UPDATE projet
    SET taux_avancement = (
        SELECT COALESCE(
            ROUND(SUM(avancement * temps_estime)::NUMERIC
                  / NULLIF(SUM(temps_estime), 0) * 100),
            0
        )::SMALLINT
        FROM repere
        WHERE projet_id = v_projet_id
    )
    WHERE id = v_projet_id;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculer_avancement ON repere;
DROP TRIGGER IF EXISTS trg_avancement_reperes    ON repere;

CREATE TRIGGER trg_avancement_reperes
    AFTER INSERT OR UPDATE OR DELETE ON repere
    FOR EACH ROW EXECUTE FUNCTION fn_recalculer_avancement_reperes();
