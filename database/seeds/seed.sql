-- ============================================================
--  seed.sql  —  Données de test
--  Exécuter APRÈS 001_init.sql (+ 002, 003, 006)
--  Scénario : 5 projets + 4 OF + repères par projet
-- ============================================================

-- Utilisateurs de test (mot de passe = "password123" pour tous — hash bcrypt)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role, cellule) VALUES
    ('Admin',    'Système',  'admin@company.com',       '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'ADMIN',                NULL),
    ('Martin',   'Sophie',   's.martin@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'CHEF_PROJET',          NULL),
    ('Dupont',   'Marc',     'm.dupont@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'RESPONSABLE_SERVICE',  'USINAGE'),
    ('Lefebvre', 'Claire',   'c.lefebvre@company.com',  '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'RESPONSABLE_SERVICE',  'ASSEMBLAGE'),
    ('Bernard',  'Thomas',   't.bernard@company.com',   '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'UTILISATEUR',          'DEBITAGE'),
    ('Haddad',   'Karim',    'k.haddad@company.com',    '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'UTILISATEUR',          'AJUSTAGE');

-- Rattachement service pour les RESPONSABLE_SERVICE
UPDATE utilisateur u SET service_id = s.id
FROM service s
WHERE u.email = 'm.dupont@company.com' AND s.nom = 'METHODES';

UPDATE utilisateur u SET service_id = s.id
FROM service s
WHERE u.email = 'c.lefebvre@company.com' AND s.nom = 'PRODUCTION';

-- --- 5 projets avec numérotation structurée ---
-- Format référence : YYYY-CCC-DDD

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut,
                    annee, numero_client, numero_dossier)
SELECT '2026-052-001', 'Ligne d''assemblage A3', 'Renault Industries',
       '2026-01-15', '2026-09-30', u.id, 'EN_COURS',
       2026, 52, 1
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut,
                    annee, numero_client, numero_dossier)
SELECT '2026-031-002', 'Outillage presse P12', 'Stellantis',
       '2026-03-01', '2026-12-15', u.id, 'NON_DEMARRE',
       2026, 31, 2
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut,
                    annee, numero_client, numero_dossier)
SELECT '2025-018-003', 'Cellule robotisée R7', 'Safran',
       '2025-02-01', '2025-11-30', u.id, 'TERMINE',
       2025, 18, 3
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut,
                    annee, numero_client, numero_dossier)
SELECT '2026-045-004', 'Banc de test hydraulique', 'Bosch',
       '2026-04-01', '2026-08-31', u.id, 'EN_COURS',
       2026, 45, 4
FROM utilisateur u WHERE u.email = 's.martin@company.com';

INSERT INTO projet (reference, nom, client, date_debut, date_fin_prevue, responsable_id, statut,
                    annee, numero_client, numero_dossier)
SELECT '2025-011-005', 'Retrofit ligne peinture', 'Plastic Omnium',
       '2024-06-01', '2025-01-15', u.id, 'EN_COURS',
       2025, 11, 5
FROM utilisateur u WHERE u.email = 's.martin@company.com';

-- --- Suivis par service (maintenu pour compatibilité) ---

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 80, 'EN_COURS' FROM projet p, service s
WHERE p.reference = '2026-052-001' AND s.nom = 'ETUDE';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 60, 'EN_COURS' FROM projet p, service s
WHERE p.reference = '2026-052-001' AND s.nom = 'METHODES';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 40, 'EN_COURS' FROM projet p, service s
WHERE p.reference = '2026-052-001' AND s.nom = 'PRODUCTION';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 0, 'NON_DEMARRE' FROM projet p, service s
WHERE p.reference = '2026-052-001' AND s.nom = 'QUALITE_PRODUIT';

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 0, 'NON_DEMARRE' FROM projet p, service s
WHERE p.reference = '2026-031-002' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 100, 'TERMINE' FROM projet p, service s
WHERE p.reference = '2025-018-003' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 50, 'EN_COURS' FROM projet p, service s
WHERE p.reference = '2026-045-004' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

INSERT INTO suivi_service (projet_id, service_id, taux_avancement, statut)
SELECT p.id, s.id, 25, 'EN_COURS' FROM projet p, service s
WHERE p.reference = '2025-011-005' AND s.nom IN ('ETUDE', 'METHODES', 'PRODUCTION', 'QUALITE_PRODUIT');

-- --- Repères pour 2026-052-001 (piliers) ---
-- Code format : 26-052-001-SSS

INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-001', 'Pilier 1', '03452/2026-1', 'CLOTURE',   60,  1, 'DEBITAGE',   1 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-002', 'Pilier 2', '03453/2026-1', 'EN_COURS',  120, 0, 'USINAGE',    2 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-003', 'Pilier 3', '03454/2026-1', 'CLOTURE',   150, 1, 'USINAGE',    3 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-004', 'Traverse A', NULL,          'PLANIFIE',  45,  0, 'DEBITAGE',   4 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-005', 'Traverse B', NULL,          'CLOTURE',   66,  1, 'ASSEMBLAGE', 5 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-006', 'Platine base', NULL,        'PLANIFIE',  35,  0, 'DEBITAGE',   6 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-007', 'Support moteur', NULL,      'EN_COURS',  78,  0, 'USINAGE',    7 FROM projet p WHERE p.reference = '2026-052-001';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-052-001-008', 'Bride fixation', NULL,      'PLANIFIE',  48,  0, 'AJUSTAGE',   8 FROM projet p WHERE p.reference = '2026-052-001';

-- --- Repères pour 2026-045-004 (banc hydraulique) ---

INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-045-004-001', 'Bâti principal',    '04501/2026-1', 'CLOTURE',  200, 1, 'DEBITAGE',   1 FROM projet p WHERE p.reference = '2026-045-004';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-045-004-002', 'Bloc distributeur', '04502/2026-1', 'EN_COURS', 180, 0, 'USINAGE',    2 FROM projet p WHERE p.reference = '2026-045-004';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-045-004-003', 'Panneau de commande', NULL,          'PLANIFIE', 120, 0, 'ASSEMBLAGE', 3 FROM projet p WHERE p.reference = '2026-045-004';
INSERT INTO repere (projet_id, code, designation, numero_of, statut, temps_estime, avancement, cellule, ordre)
SELECT p.id, '26-045-004-004', 'Tuyauterie HP',    NULL,             'PLANIFIE',  90, 0, 'AJUSTAGE',   4 FROM projet p WHERE p.reference = '2026-045-004';

-- --- OF existants ---

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT 'OF-TEST-001', ss.id, p.id,
    'Gabarit soudure — non démarré', '2026-03-01', '2026-06-30', 'PLANIFIE', 0
FROM suivi_service ss JOIN service s ON s.id = ss.service_id JOIN projet p ON p.id = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = '2026-052-001';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT 'OF-TEST-002', ss.id, p.id,
    'Outillage P12 — en cours 40 %', '2026-04-01', '2026-09-15', 'EN_COURS', 40
FROM suivi_service ss JOIN service s ON s.id = ss.service_id JOIN projet p ON p.id = ss.projet_id
WHERE s.nom = 'METHODES' AND p.reference = '2026-031-002';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, etat, taux_avancement
)
SELECT 'OF-TEST-003', ss.id, p.id,
    'Banc hydraulique — série pilote', '2026-05-15', '2026-10-01', 'EN_COURS', 75
FROM suivi_service ss JOIN service s ON s.id = ss.service_id JOIN projet p ON p.id = ss.projet_id
WHERE s.nom = 'PRODUCTION' AND p.reference = '2026-045-004';

INSERT INTO ordre_fabrication (
    numero_of, suivi_service_id, projet_id,
    designation, date_lancement, date_fin_prevue, date_fin_reelle, etat, taux_avancement
)
SELECT 'OF-TEST-004', ss.id, p.id,
    'Pré-série cellule R7 — clôturé', '2025-03-01', '2025-10-31', '2025-10-28', 'TERMINE', 100
FROM suivi_service ss JOIN service s ON s.id = ss.service_id JOIN projet p ON p.id = ss.projet_id
WHERE s.nom = 'PRODUCTION' AND p.reference = '2025-018-003';
