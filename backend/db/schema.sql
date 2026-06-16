-- ============================================================
-- ESIManage Pro — Database Schema (MySQL 8+)
-- ============================================================

CREATE DATABASE IF NOT EXISTS esimanage_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE esimanage_pro;

-- ─── 1. Années Académiques ──────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(20) UNIQUE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- ─── 2. Utilisateurs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── 3. Professeurs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    availability VARCHAR(50) DEFAULT 'Disponible',
    avatar_bg VARCHAR(50) DEFAULT 'bg-indigo-600'
) ENGINE=InnoDB;

-- ─── 4. Classes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    student_count INT DEFAULT 0,
    head_teacher_id VARCHAR(50),
    representative VARCHAR(100),
    schedule_progress INT DEFAULT 0,
    CONSTRAINT fk_classes_head_teacher FOREIGN KEY (head_teacher_id) REFERENCES professors(id) ON DELETE SET NULL,
    CONSTRAINT chk_schedule_progress CHECK (schedule_progress BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- ─── 5. Salles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ─── 6. Modules ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    teacher_id VARCHAR(50),
    class_id VARCHAR(50),
    semester VARCHAR(10) NOT NULL,
    total_hours INT DEFAULT 0,
    remaining_hours INT DEFAULT 0,
    progress INT DEFAULT 0,
    prerequisite_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'En cours',
    CONSTRAINT fk_modules_teacher FOREIGN KEY (teacher_id) REFERENCES professors(id) ON DELETE SET NULL,
    CONSTRAINT fk_modules_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_modules_prerequisite FOREIGN KEY (prerequisite_id) REFERENCES modules(id) ON DELETE SET NULL,
    CONSTRAINT chk_progress CHECK (progress BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- ─── 7. Emplois du Temps ────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetables (
    id VARCHAR(50) PRIMARY KEY,
    period VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    academic_year_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timetables_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── 8. Sessions d'Emplois du Temps ────────────────────────
CREATE TABLE IF NOT EXISTS timetable_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    day_idx INT NOT NULL,
    slot_idx INT NOT NULL,
    subject VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    teacher VARCHAR(150),
    room VARCHAR(100),
    CONSTRAINT fk_sessions_timetable FOREIGN KEY (timetable_id) REFERENCES timetables(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT chk_day_idx CHECK (day_idx BETWEEN 0 AND 5),
    CONSTRAINT chk_slot_idx CHECK (slot_idx BETWEEN 0 AND 3),
    CONSTRAINT chk_session_type CHECK (type IN ('Cours', 'TD', 'TP', 'Evaluation')),
    CONSTRAINT uq_timetable_slot UNIQUE (timetable_id, class_id, day_idx, slot_idx)
) ENGINE=InnoDB;

-- ─── 9. Notes d'Emplois du Temps ───────────────────────────
CREATE TABLE IF NOT EXISTS timetable_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id VARCHAR(50) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    note_text TEXT NOT NULL,
    CONSTRAINT fk_notes_timetable FOREIGN KEY (timetable_id) REFERENCES timetables(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT uq_timetable_note UNIQUE (timetable_id, class_id)
) ENGINE=InnoDB;

-- ─── 10. Évaluations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    eval_date DATE NOT NULL,
    eval_time TIME NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    room_id VARCHAR(50),
    academic_year_id VARCHAR(50),
    weight INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Planifié',
    CONSTRAINT fk_eval_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_eval_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
    CONSTRAINT chk_weight CHECK (weight BETWEEN 0 AND 100)
) ENGINE=InnoDB;
