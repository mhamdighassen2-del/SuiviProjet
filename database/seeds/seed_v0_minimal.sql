-- ============================================================
--  Seed minimal pour démo / captures « version 0 » (sans projets ni OF).
--  Mot de passe : password123 (même hash bcrypt que seed.sql)
-- ============================================================

INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role) VALUES
    ('Admin', 'Système', 'admin@company.com', '$2b$10$doai5q4aXVAmBFcOFusD0ujDYOImAIzhmnFB98TmEen4.c2bjciKu', 'ADMIN');
