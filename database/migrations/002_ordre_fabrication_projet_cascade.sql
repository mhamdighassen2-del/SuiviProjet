-- ============================================================
--  002 — FK ordre_fabrication.projet_id : suppression en cascade
--  Sans cela, DELETE sur projet échoue si des OF existent (RESTRICT).
--  À exécuter après 001_init.sql sur les bases déjà créées.
-- ============================================================

ALTER TABLE ordre_fabrication
    DROP CONSTRAINT IF EXISTS ordre_fabrication_projet_id_fkey;

ALTER TABLE ordre_fabrication
    ADD CONSTRAINT ordre_fabrication_projet_id_fkey
    FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE;
