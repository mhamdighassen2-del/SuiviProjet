-- ============================================================
--  Vide les données métier et les comptes (référentiel service conservé).
--  Usage : depuis backend/ → npm run db:clear
-- ============================================================

TRUNCATE TABLE historique, document, ordre_fabrication, suivi_service, projet, utilisateur CASCADE;
