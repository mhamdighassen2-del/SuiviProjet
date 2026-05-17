-- ============================================================
--  008_causes_retard_enum.sql
--  Aligne la colonne repere.cause_retard sur la liste fermée
--  du modèle Excel de l'encadrant (feuille "Listes").
--
--  La liste doit rester strictement synchrone avec :
--    - backend/src/models/causes-retard.ts
--    - frontend/src/constants/causesRetard.ts
-- ============================================================

-- 1. Type énuméré (idempotent)
DO $$ BEGIN
    CREATE TYPE cause_retard_enum AS ENUM (
        'ATT ST/ACHAT',
        'ATT BC',
        'ATT PRODUIT CLIENT',
        'Att retour client',
        'CAPACITE',
        'Replanifié par le client',
        'En pause par le client',
        'Retard matière',
        'Problème qualité',
        'Problème technique',
        'Manque ressource',
        'Sous-traitance',
        'En attente validation',
        'Autre'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Conversion de la colonne cause_retard (TEXT -> cause_retard_enum)
--    Les valeurs hors liste sont normalisées en NULL pour préserver la migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'repere'
          AND column_name = 'cause_retard'
          AND udt_name <> 'cause_retard_enum'
    ) THEN
        ALTER TABLE repere
            ALTER COLUMN cause_retard TYPE cause_retard_enum
            USING (
                CASE
                    WHEN cause_retard IS NULL OR cause_retard = '' THEN NULL
                    WHEN cause_retard IN (
                        'ATT ST/ACHAT','ATT BC','ATT PRODUIT CLIENT','Att retour client',
                        'CAPACITE','Replanifié par le client','En pause par le client',
                        'Retard matière','Problème qualité','Problème technique',
                        'Manque ressource','Sous-traitance','En attente validation','Autre'
                    ) THEN cause_retard::cause_retard_enum
                    ELSE NULL
                END
            );
    END IF;
END$$;
