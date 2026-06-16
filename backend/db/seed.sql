-- ============================================================
-- ESIManage Pro — Seed Data (données initiales)
-- ============================================================

USE esimanage_pro;

-- ─── Années Académiques ─────────────────────────────────────
INSERT INTO academic_years (id, label, is_current) VALUES
('AY-2024-2025', '2024/2025', FALSE),
('AY-2025-2026', '2025/2026', TRUE),
('AY-2026-2027', '2026/2027', FALSE);

-- ─── Utilisateur Admin ──────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role) VALUES
('USR-01', 'Administrateur ESI', 'admin@esi.dz', 'admin123', 'Admin');

-- ─── Professeurs ────────────────────────────────────────────
INSERT INTO professors (id, name, department, email, availability, avatar_bg) VALUES
('PRF-01', 'Dr. Abdelkrim Rahmouni', 'Systèmes d''Information', 'a.rahmouni@esi.dz', 'En cours', 'bg-indigo-600'),
('PRF-02', 'Mme. Souad Khelil', 'Génie Logiciel', 's.khelil@esi.dz', 'Disponible', 'bg-teal-600'),
('PRF-03', 'Dr. Feriel Ziane', 'Génie Logiciel', 'f.ziane@esi.dz', 'Disponible', 'bg-violet-600'),
('PRF-04', 'Prof. Malik Bensaid', 'Systèmes et Réseaux', 'm.bensaid@esi.dz', 'Absent', 'bg-amber-600'),
('PRF-05', 'Prof. Lydia Ould', 'Intelligence Artificielle', 'l.ould@esi.dz', 'Disponible', 'bg-pink-600');

-- ─── Classes ────────────────────────────────────────────────
INSERT INTO classes (id, name, specialty, level, student_count, head_teacher_id, representative, schedule_progress) VALUES
('CLS-TC1',    'TC1',     'Tronc Commun',                          'Licence',   80, 'PRF-01', 'Amine Khelifi',      72),
('CLS-TC2',    'TC2',     'Tronc Commun',                          'Licence',   75, 'PRF-02', 'Sarah Bensaid',      85),
('CLS-TC3-ISI','TC3 ISI', 'Ingénierie des Systèmes d''Information','Licence',   38, 'PRF-03', 'Yacine Meziani',     90),
('CLS-TC3-IRS','TC3 IRS', 'Ingénierie des Réseaux et Systèmes',   'Licence',   36, 'PRF-04', 'Riad Belkacem',      88),
('CLS-M1-SI',  'M1 SI',   'Systèmes d''Information',               'Master 1',  25, 'PRF-05', 'Meriem Taleb',       65),
('CLS-M2-SI',  'M2 SI',   'SI – Systèmes d''Aide à la Décision',   'Master 2',  22, 'PRF-01', 'Farid Ouedraogo',    78),
('CLS-M1-IRS', 'M1 IRS',  'Réseaux et Systèmes',                  'Master 1',  28, 'PRF-04', 'Aïcha Diallo',       60),
('CLS-M2-IRS', 'M2 IRS',  'IRS – Cybersécurité',                  'Master 2',  20, 'PRF-03', 'Souleymane Kaboré',  74),
('CLS-M1-SD',  'M1 SD',   'Sciences des Données',                 'Master 1',  24, 'PRF-05', 'Inès Sawadogo',      58),
('CLS-M2-SD',  'M2 SD',   'SD – Sciences des Données',            'Master 2',  18, 'PRF-02', 'Brahima Traoré',     70);

-- ─── Salles ─────────────────────────────────────────────────
INSERT INTO rooms (id, name, type) VALUES
('RM-01', 'Amphi A',   'Amphithéâtre'),
('RM-02', 'Amphi B',   'Amphithéâtre'),
('RM-03', 'Labo 03',   'Laboratoire TP'),
('RM-04', 'Salle 104', 'Salle de cours'),
('RM-05', 'Salle 202', 'Salle de cours');

-- ─── Modules ────────────────────────────────────────────────
-- TC1
INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status) VALUES
('MOD-01', 'Algorithmique & Structures de Données', 'PRF-01', 'CLS-TC1', 'S1', 45, 8, 82, NULL, 'En cours'),
('MOD-02', 'Mathématiques Discrètes',               'PRF-03', 'CLS-TC1', 'S1', 40, 0, 100, NULL, 'Terminé'),
('MOD-03', 'Programmation Impérative (C)',           'PRF-02', 'CLS-TC1', 'S2', 45, 15, 67, 'MOD-01', 'En cours');

-- TC2
INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status) VALUES
('MOD-04', 'Programmation Orientée Objet (Java)',    'PRF-02', 'CLS-TC2', 'S3', 45, 5, 89, 'MOD-03', 'En cours'),
('MOD-05', 'Bases de Données',                      'PRF-01', 'CLS-TC2', 'S3', 40, 0, 100, NULL, 'Terminé'),
('MOD-06', 'Systèmes d''Exploitation',               'PRF-04', 'CLS-TC2', 'S4', 35, 20, 43, NULL, 'En cours');

-- TC3 ISI
INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status) VALUES
('MOD-07', 'Génie Logiciel & UML',                  'PRF-03', 'CLS-TC3-ISI', 'S5', 40, 0, 100, 'MOD-04', 'Terminé'),
('MOD-08', 'Architecture Logicielle',               'PRF-03', 'CLS-TC3-ISI', 'S6', 35, 12, 66, 'MOD-07', 'En cours');

-- TC3 IRS
INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status) VALUES
('MOD-09', 'Réseaux Informatiques',                 'PRF-04', 'CLS-TC3-IRS', 'S5', 45, 0, 100, 'MOD-06', 'Terminé'),
('MOD-10', 'Sécurité & Cryptographie',              'PRF-04', 'CLS-TC3-IRS', 'S6', 40, 10, 75, 'MOD-09', 'En cours');

-- Masters
INSERT INTO modules (id, name, teacher_id, class_id, semester, total_hours, remaining_hours, progress, prerequisite_id, status) VALUES
('MOD-11', 'Machine Learning',                      'PRF-05', 'CLS-M1-SD', 'S1', 50, 18, 64, NULL, 'En cours'),
('MOD-12', 'Deep Learning',                         'PRF-05', 'CLS-M2-SD', 'S2', 45, 30, 33, 'MOD-11', 'En cours');

-- ─── Évaluations ────────────────────────────────────────────
INSERT INTO evaluations (id, module_id, type, eval_date, eval_time, class_id, room_id, academic_year_id, weight, status) VALUES
('EV-01', 'MOD-01', 'Examen Final (EF)',       '2026-06-15', '09:00:00', 'CLS-TC1',     'RM-01', 'AY-2025-2026', 60, 'Planifié'),
('EV-02', 'MOD-04', 'Contrôle Continu (CC)',   '2026-06-17', '11:00:00', 'CLS-TC2',     'RM-03', 'AY-2025-2026', 20, 'Planifié'),
('EV-03', 'MOD-07', 'Soutenance Projet',       '2026-06-18', '13:00:00', 'CLS-TC3-ISI', 'RM-04', 'AY-2025-2026', 40, 'Planifié'),
('EV-04', 'MOD-10', 'Examen mi-parcours',      '2026-06-20', '14:30:00', 'CLS-TC3-IRS', 'RM-05', 'AY-2025-2026', 30, 'Planifié'),
('EV-05', 'MOD-11', 'Contrôle Continu (CC)',   '2026-06-22', '10:00:00', 'CLS-M1-SD',   'RM-04', 'AY-2025-2026', 25, 'Planifié'),
('EV-06', 'MOD-05', 'Examen Final (EF)',       '2026-06-25', '08:30:00', 'CLS-TC2',     'RM-01', 'AY-2025-2026', 60, 'Terminé');
