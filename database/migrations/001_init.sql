-- ============================================================
--  001_init.sql  —  Schéma initial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  TYPES ÉNUMÉRÉS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE role_utilisateur AS ENUM (
        'ADMIN', 'CHEF_PROJET', 'RESPONSABLE_SERVICE', 'UTILISATEUR'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_projet AS ENUM (
        'NON_DEMARRE', 'EN_COURS', 'EN_RETARD', 'TERMINE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE nom_service AS ENUM (
        'ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_suivi AS ENUM (
        'NON_DEMARRE', 'EN_COURS', 'BLOQUE', 'TERMINE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE etat_of AS ENUM (
        'PLANIFIE', 'EN_COURS', 'SUSPENDU', 'TERMINE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
--  UTILISATEUR
-- ============================================================

CREATE TABLE IF NOT EXISTS utilisateur (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nom               VARCHAR(100) NOT NULL,
    prenom            VARCHAR(100) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash TEXT         NOT NULL,
    role              role_utilisateur NOT NULL DEFAULT 'UTILISATEUR',
    actif             BOOLEAN      NOT NULL DEFAULT TRUE,
    cree_le           TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS service (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nom         nom_service NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO service (nom, description)
VALUES
    ('ETUDE',          'Bureau d''études techniques'),
    ('METHODES',       'Service méthodes et industrialisation'),
    ('PRODUCTION',     'Service production'),
    ('QUALITE_PRODUIT','Contrôle qualité produit')
ON CONFLICT (nom) DO NOTHING;

-- ============================================================
--  PROJET
-- ============================================================

CREATE TABLE IF NOT EXISTS projet (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        VARCHAR(50)   NOT NULL UNIQUE,
    nom              VARCHAR(255)  NOT NULL,
    client           VARCHAR(255)  NOT NULL,
    date_debut       DATE          NOT NULL,
    date_fin_prevue  DATE          NOT NULL,
    date_fin_reelle  DATE,
    responsable_id   UUID          NOT NULL REFERENCES utilisateur(id),
    statut           statut_projet NOT NULL DEFAULT 'NON_DEMARRE',
    taux_avancement  SMALLINT      NOT NULL DEFAULT 0
                         CHECK (taux_avancement BETWEEN 0 AND 100),
    cree_le          TIMESTAMP     NOT NULL DEFAULT NOW(),
    mis_a_jour_le    TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates_projet CHECK (date_debut <= date_fin_prevue)
);

CREATE INDEX IF NOT EXISTS idx_projet_statut      ON projet (statut);
CREATE INDEX IF NOT EXISTS idx_projet_responsable ON projet (responsable_id);

CREATE OR REPLACE FUNCTION fn_maj_statut_projet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.statut = 'EN_COURS' AND NEW.date_fin_prevue < CURRENT_DATE THEN
        NEW.statut := 'EN_RETARD';
    END IF;
    NEW.mis_a_jour_le := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_statut_projet ON projet;
CREATE TRIGGER trg_statut_projet
    BEFORE INSERT OR UPDATE ON projet
    FOR EACH ROW EXECUTE FUNCTION fn_maj_statut_projet();

-- ============================================================
--  SUIVI PAR SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS suivi_service (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id         UUID         NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    service_id        UUID         NOT NULL REFERENCES service(id),
    responsable_id    UUID         REFERENCES utilisateur(id),
    taux_avancement   SMALLINT     NOT NULL DEFAULT 0
                          CHECK (taux_avancement BETWEEN 0 AND 100),
    date_debut_reelle DATE,
    date_fin_reelle   DATE,
    commentaire       TEXT,
    blocage           TEXT,
    statut            statut_suivi NOT NULL DEFAULT 'NON_DEMARRE',
    mis_a_jour_le     TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (projet_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_suivi_projet ON suivi_service (projet_id);

CREATE OR REPLACE FUNCTION fn_recalculer_avancement_projet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE projet
    SET taux_avancement = (
        SELECT COALESCE(AVG(taux_avancement), 0)::SMALLINT
        FROM suivi_service
        WHERE projet_id = NEW.projet_id
    )
    WHERE id = NEW.projet_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avancement_projet ON suivi_service;
CREATE TRIGGER trg_avancement_projet
    AFTER INSERT OR UPDATE ON suivi_service
    FOR EACH ROW EXECUTE FUNCTION fn_recalculer_avancement_projet();

-- ============================================================
--  ORDRE DE FABRICATION (OF)
-- ============================================================

CREATE TABLE IF NOT EXISTS ordre_fabrication (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_of         VARCHAR(50)  NOT NULL UNIQUE,
    suivi_service_id  UUID         NOT NULL REFERENCES suivi_service(id) ON DELETE CASCADE,
    projet_id         UUID         NOT NULL REFERENCES projet(id),
    designation       VARCHAR(255) NOT NULL,
    date_lancement    DATE         NOT NULL,
    date_fin_prevue   DATE         NOT NULL,
    date_fin_reelle   DATE,
    etat              etat_of      NOT NULL DEFAULT 'PLANIFIE',
    taux_avancement   SMALLINT     NOT NULL DEFAULT 0
                          CHECK (taux_avancement BETWEEN 0 AND 100),
    commentaire       TEXT,
    cree_le           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates_of CHECK (date_lancement <= date_fin_prevue)
);

CREATE INDEX IF NOT EXISTS idx_of_projet     ON ordre_fabrication (projet_id);
CREATE INDEX IF NOT EXISTS idx_of_etat       ON ordre_fabrication (etat);
CREATE INDEX IF NOT EXISTS idx_of_fin_prevue ON ordre_fabrication (date_fin_prevue);

CREATE OR REPLACE FUNCTION fn_verifier_service_of()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_nom nom_service;
BEGIN
    SELECT s.nom INTO v_nom
    FROM suivi_service ss
    JOIN service s ON s.id = ss.service_id
    WHERE ss.id = NEW.suivi_service_id;

    IF v_nom NOT IN ('METHODES', 'PRODUCTION') THEN
        RAISE EXCEPTION 'Les OF sont réservés aux services METHODES et PRODUCTION. Service actuel : %', v_nom;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verifier_service_of ON ordre_fabrication;
CREATE TRIGGER trg_verifier_service_of
    BEFORE INSERT OR UPDATE ON ordre_fabrication
    FOR EACH ROW EXECUTE FUNCTION fn_verifier_service_of();

-- ============================================================
--  DOCUMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS document (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    suivi_service_id  UUID         NOT NULL REFERENCES suivi_service(id) ON DELETE CASCADE,
    nom_fichier       VARCHAR(255) NOT NULL,
    chemin_stockage   TEXT         NOT NULL,
    type_mime         VARCHAR(100),
    uploade_par       UUID         REFERENCES utilisateur(id),
    uploade_le        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  HISTORIQUE
-- ============================================================

CREATE TABLE IF NOT EXISTS historique (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id  UUID         REFERENCES utilisateur(id),
    table_cible     VARCHAR(100) NOT NULL,
    entite_id       UUID         NOT NULL,
    action          VARCHAR(10)  NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    ancienne_valeur JSONB,
    nouvelle_valeur JSONB,
    cree_le         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historique_entite ON historique (table_cible, entite_id);
CREATE INDEX IF NOT EXISTS idx_historique_date   ON historique (cree_le DESC);

-- ============================================================
--  VUE : OF en retard
-- ============================================================

CREATE OR REPLACE VIEW v_ofs_en_retard AS
SELECT
    of.id,
    of.numero_of,
    of.designation,
    of.date_fin_prevue,
    of.etat,
    of.taux_avancement,
    p.reference    AS projet_reference,
    p.nom          AS projet_nom,
    s.nom          AS service_nom,
    CURRENT_DATE - of.date_fin_prevue AS jours_retard
FROM ordre_fabrication of
JOIN suivi_service ss ON ss.id = of.suivi_service_id
JOIN service s        ON s.id  = ss.service_id
JOIN projet p         ON p.id  = of.projet_id
WHERE of.date_fin_prevue < CURRENT_DATE
  AND of.etat != 'TERMINE'
ORDER BY jours_retard DESC;