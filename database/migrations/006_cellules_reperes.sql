-- ============================================================
--  006_cellules_reperes.sql
--  Ajout : cellule utilisateur, reperes par projet,
--           champs annee/numero_client/numero_dossier sur projet
-- ============================================================

-- ---- Types énumérés ----------------------------------------

DO $$ BEGIN
    CREATE TYPE cellule_type AS ENUM ('DEBITAGE', 'USINAGE', 'ASSEMBLAGE', 'AJUSTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_repere AS ENUM ('PLANIFIE', 'EN_COURS', 'CLOTURE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---- Colonne cellule sur utilisateur -----------------------

ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS cellule cellule_type;

-- ---- Colonnes de structuration du numéro projet ------------

ALTER TABLE projet ADD COLUMN IF NOT EXISTS annee           SMALLINT;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS numero_client   SMALLINT;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS numero_dossier  SMALLINT;

-- ---- Table repere ------------------------------------------

CREATE TABLE IF NOT EXISTS repere (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id     UUID          NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    code          VARCHAR(25)   NOT NULL UNIQUE,
    designation   VARCHAR(255)  NOT NULL,
    numero_of     VARCHAR(60),
    statut        statut_repere NOT NULL DEFAULT 'PLANIFIE',
    temps_estime  INTEGER       NOT NULL DEFAULT 0 CHECK (temps_estime >= 0),
    avancement    DECIMAL(5,4)  NOT NULL DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 1),
    cause_retard  VARCHAR(100),
    cellule       cellule_type,
    ordre         SMALLINT      NOT NULL DEFAULT 1,
    cree_le       TIMESTAMP     NOT NULL DEFAULT NOW(),
    modifie_le    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repere_projet ON repere (projet_id);
CREATE INDEX IF NOT EXISTS idx_repere_statut ON repere (statut);
CREATE INDEX IF NOT EXISTS idx_repere_ordre  ON repere (projet_id, ordre);

-- ---- Trigger : recalcul taux_avancement depuis les repères --

CREATE OR REPLACE FUNCTION fn_recalculer_avancement_reperes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_projet_id UUID;
    v_total     BIGINT;
    v_fait      NUMERIC;
    v_taux      SMALLINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_projet_id := OLD.projet_id;
    ELSE
        v_projet_id := NEW.projet_id;
    END IF;

    SELECT COALESCE(SUM(temps_estime), 0),
           COALESCE(SUM(avancement * temps_estime), 0)
    INTO v_total, v_fait
    FROM repere
    WHERE projet_id = v_projet_id;

    IF v_total > 0 THEN
        v_taux := LEAST(ROUND((v_fait / v_total) * 100), 100)::SMALLINT;
    ELSE
        v_taux := 0;
    END IF;

    UPDATE projet SET taux_avancement = v_taux WHERE id = v_projet_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_avancement_reperes ON repere;
CREATE TRIGGER trg_avancement_reperes
    AFTER INSERT OR UPDATE OR DELETE ON repere
    FOR EACH ROW EXECUTE FUNCTION fn_recalculer_avancement_reperes();
