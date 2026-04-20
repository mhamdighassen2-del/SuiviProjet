-- ============================================================
--  seed.sql  —  Données de test
--  Exécuter APRÈS 001_init.sql
-- ============================================================

-- Utilisateurs de test (mot de passe = "password123" pour tous — hash bcrypt)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role) VALUES
    ('Admin',    'Système',  'admin@company.com',       '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'ADMIN'),
    ('Martin',   'Sophie',   's.martin@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',    'CHEF_PROJET'),
    ('Dupont',   'Marc',     'm.dupont@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'RESPONSABLE_SERVICE'),
    ('Lefebvre', 'Claire',   'c.lefebvre@company.com',  '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',   'RESPONSABLE_SERVICE'),
    ('Bernard',  'Thomas',   't.bernard@company.com',   '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu',    'UTILISATEUR');

-- Projets de test
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
    'EN_COURS'
FROM utilisateur u WHERE u.email = 's.martin@company.com';

-- Suivis (un par service, pour chaque projet)
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

-- OF de test (Méthodes uniquement)
INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT
    'OF-2024-001',
    ss.id,
    p.id,
    'Gabarit de soudure poste 3',
    '2024-03-15',
    '2024-05-30',
    'EN_COURS',
    70
FROM suivi_service ss
JOIN service s  ON s.id  = ss.service_id
JOIN projet p   ON p.id  = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = 'PROJ-2024-001';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT
    'OF-2024-002',
    ss.id,
    p.id,
    'Outillage montage châssis',
    '2024-04-01',
    '2024-06-15',
    'PLANIFIE',
    0
FROM suivi_service ss
JOIN service s ON s.id = ss.service_id
JOIN projet p  ON p.id = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = 'PROJ-2024-001';
