-- ============================================================
--  seed.sql  —  Données de test
--  Exécuter APRÈS 001_init.sql (+ 002, 003)
--  Scénario : 5 projets + 4 OF à niveaux d'avancement distincts
-- ============================================================

-- Utilisateurs de test (mot de passe = "password123" pour tous — hash bcrypt)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role) VALUES
    ('Admin',    'Système',  'admin@company.com',       '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'ADMIN'),
    ('Martin',   'Sophie',   's.martin@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',    'CHEF_PROJET'),
    ('Dupont',   'Marc',     'm.dupont@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'RESPONSABLE_SERVICE'),
    ('Lefebvre', 'Claire',   'c.lefebvre@company.com',  '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'RESPONSABLE_SERVICE'),
    ('Bernard',  'Thomas',   't.bernard@company.com',   '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',    'UTILISATEUR');

-- Rattachement service (colonne 003_utilisateur_service.sql) : obligatoire pour RESPONSABLE_SERVICE
UPDATE utilisateur u SET service_id = s.id
FROM service s
WHERE u.email = 'm.dupont@company.com' AND s.nom = 'METHODES';

UPDATE utilisateur u SET service_id = s.id
FROM service s
WHERE u.email = 'c.lefebvre@company.com' AND s.nom = 'PRODUCTION';

-- --- 5 projets (taux_avancement recalculé par trigger à partir des suivis) ---
INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut)
SELECT
    'PROJ-2024-001',
    'Ligne d''assemblage A3',
    'Renault Industries',
    '2024-01-15',
    '2024-09-30',
    u.id,
    'EN_COURS'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut)
SELECT
    'PROJ-2024-002',
    'Outillage presse P12',
    'Stellantis',
    '2024-03-01',
    '2024-12-15',
    u.id,
    'NON_DEMARRE'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut)
SELECT
    'PROJ-2025-003',
    'Cellule robotisée R7',
    'Safran',
    '2025-02-01',
    '2025-11-30',
    u.id,
    'TERMINE'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut)
SELECT
    'PROJ-2025-004',
    'Banc de test hydraulique',
    'Bosch',
    '2025-04-01',
    '2026-08-31',
    u.id,
    'EN_COURS'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut)
SELECT
    'PROJ-2025-005',
    'Retrofit ligne peinture',
    'Plastic Omnium',
    '2024-06-01',
    '2025-01-15',
    u.id,
    'EN_COURS'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

-- Suivis PROJ-2024-001 (moyenne ~45 %)
INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 80, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2024-001' AND s.nom = 'ETUDE';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 60, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2024-001' AND s.nom = 'METHODES';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 40, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2024-001' AND s.nom = 'PRODUCTION';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 0, 'NON_DEMARRE'
FROM projet p, service s
WHERE p.reference = 'PROJ-2024-001' AND s.nom = 'QUALITE_PRODUIT';

-- Suivis PROJ-2024-002 (tous à 0 %)
INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 0, 'NON_DEMARRE'
FROM projet p, service s
WHERE p.reference = 'PROJ-2024-002' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

-- Suivis PROJ-2025-003 (terminé — 100 % partout)
INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 100, 'TERMINE'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-003' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

-- Suivis PROJ-2025-004 (moyenne 50 %)
INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 50, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-004' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

-- Suivis PROJ-2025-005 (en retard — trigger projet → EN_RETARD si échéance passée)
INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 35, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-005' AND s.nom = 'ETUDE';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 25, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-005' AND s.nom = 'METHODES';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 15, 'EN_COURS'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-005' AND s.nom = 'PRODUCTION';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 10, 'NON_DEMARRE'
FROM projet p, service s
WHERE p.reference = 'PROJ-2025-005' AND s.nom = 'QUALITE_PRODUIT';

-- 4 OF — taux distincts : 0 %, 40 %, 75 %, 100 % (Méthodes / Production uniquement)
INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT
    'OF-TEST-001',
    ss.id,
    p.id,
    'Gabarit soudure — non démarré',
    '2025-03-01',
    '2026-06-30',
    'PLANIFIE',
    0
FROM suivi_service ss
JOIN service s  ON s.id  = ss.service_id
JOIN projet p   ON p.id  = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = 'PROJ-2024-001';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT
    'OF-TEST-002',
    ss.id,
    p.id,
    'Outillage P12 — en cours 40 %',
    '2025-04-01',
    '2026-09-15',
    'EN_COURS',
    40
FROM suivi_service ss
JOIN service s ON s.id = ss.service_id
JOIN projet p  ON p.id = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = 'PROJ-2024-002';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT
    'OF-TEST-003',
    ss.id,
    p.id,
    'Banc hydraulique — série pilote',
    '2025-05-15',
    '2026-10-01',
    'EN_COURS',
    75
FROM suivi_service ss
JOIN service s ON s.id = ss.service_id
JOIN projet p  ON p.id = ss.projet_id
WHERE s.nom = 'PRODUCTION' AND p.reference = 'PROJ-2025-004';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, date_fin_reelle, etat, taux_avancement
)
SELECT
    'OF-TEST-004',
    ss.id,
    p.id,
    'Pré-série cellule R7 — clôturé',
    '2025-03-01',
    '2025-10-31',
    '2025-10-28',
    'TERMINE',
    100
FROM suivi_service ss
JOIN service s ON s.id = ss.service_id
JOIN projet p  ON p.id = ss.projet_id
WHERE s.nom = 'PRODUCTION' AND p.reference = 'PROJ-2025-003';
