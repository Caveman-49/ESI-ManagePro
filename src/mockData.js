// Mock data for ESIManage Pro - Timetable & Evaluation Portal

export const todaySchedule = [
  {
    id: "SCH-01",
    time: "08:30 - 10:00",
    subject: "Algorithmique & Structures de Données",
    classGroup: "TC1",
    room: "Amphi A",
    professor: "Dr. A. Rahmouni",
    type: "Cours",
    color: "border-indigo-500 text-indigo-400 bg-indigo-500/5"
  },
  {
    id: "SCH-02",
    time: "10:15 - 11:45",
    subject: "Programmation Orientée Objet (Java)",
    classGroup: "TC2",
    room: "Labo 03",
    professor: "Mme. S. Khelil",
    type: "TP",
    color: "border-teal-500 text-teal-400 bg-teal-500/5"
  },
  {
    id: "SCH-03",
    time: "13:00 - 14:30",
    subject: "Génie Logiciel & UML",
    classGroup: "TC3 ISI",
    room: "Salle 104",
    professor: "Dr. F. Ziane",
    type: "TD",
    color: "border-violet-500 text-violet-400 bg-violet-500/5"
  },
  {
    id: "SCH-04",
    time: "14:45 - 16:15",
    subject: "Sécurité & Cryptographie",
    classGroup: "TC3 IRS",
    room: "Salle 202",
    professor: "Prof. M. Bensaid",
    type: "Cours",
    color: "border-pink-500 text-pink-400 bg-pink-500/5"
  }
];

export const classesList = [
  // ── Tronc Commun ──────────────────────────────────────────────────────────
  {
    id: "CLS-TC1",
    name: "TC1",
    specialty: "Tronc Commun",
    level: "Licence",
    studentCount: 80,
    headTeacher: "Dr. A. Rahmouni",
    representative: "Amine Khelifi",
    scheduleProgress: 72
  },
  {
    id: "CLS-TC2",
    name: "TC2",
    specialty: "Tronc Commun",
    level: "Licence",
    studentCount: 75,
    headTeacher: "Mme. S. Khelil",
    representative: "Sarah Bensaid",
    scheduleProgress: 85
  },
  {
    id: "CLS-TC3-ISI",
    name: "TC3 ISI",
    specialty: "Ingénierie des Systèmes d'Information",
    level: "Licence",
    studentCount: 38,
    headTeacher: "Dr. F. Ziane",
    representative: "Yacine Meziani",
    scheduleProgress: 90
  },
  {
    id: "CLS-TC3-IRS",
    name: "TC3 IRS",
    specialty: "Ingénierie des Réseaux et Systèmes",
    level: "Licence",
    studentCount: 36,
    headTeacher: "Prof. M. Bensaid",
    representative: "Riad Belkacem",
    scheduleProgress: 88
  },
  // ── Master — Systèmes d'Information ───────────────────────────────────────
  {
    id: "CLS-M1-SI",
    name: "M1 SI",
    specialty: "Systèmes d'Information",
    level: "Master 1",
    studentCount: 25,
    headTeacher: "Prof. L. Ould",
    representative: "Meriem Taleb",
    scheduleProgress: 65
  },
  {
    id: "CLS-M2-SI",
    name: "M2 SI",
    specialty: "SI – Systèmes d'Aide à la Décision",
    level: "Master 2",
    studentCount: 22,
    headTeacher: "Dr. A. Rahmouni",
    representative: "Farid Ouedraogo",
    scheduleProgress: 78
  },
  // ── Master — Réseaux et Systèmes ──────────────────────────────────────────
  {
    id: "CLS-M1-IRS",
    name: "M1 IRS",
    specialty: "Réseaux et Systèmes",
    level: "Master 1",
    studentCount: 28,
    headTeacher: "Prof. M. Bensaid",
    representative: "Aïcha Diallo",
    scheduleProgress: 60
  },
  {
    id: "CLS-M2-IRS",
    name: "M2 IRS",
    specialty: "IRS – Cybersécurité",
    level: "Master 2",
    studentCount: 20,
    headTeacher: "Dr. F. Ziane",
    representative: "Souleymane Kaboré",
    scheduleProgress: 74
  },
  // ── Master — Sciences des Données ─────────────────────────────────────────
  {
    id: "CLS-M1-SD",
    name: "M1 SD",
    specialty: "Sciences des Données",
    level: "Master 1",
    studentCount: 24,
    headTeacher: "Prof. L. Ould",
    representative: "Inès Sawadogo",
    scheduleProgress: 58
  },
  {
    id: "CLS-M2-SD",
    name: "M2 SD",
    specialty: "SD – Sciences des Données",
    level: "Master 2",
    studentCount: 18,
    headTeacher: "Mme. S. Khelil",
    representative: "Brahima Traoré",
    scheduleProgress: 70
  }
];

export const professorsList = [
  {
    id: "PRF-01",
    name: "Dr. Abdelkrim Rahmouni",
    department: "Systèmes d'Information",
    email: "a.rahmouni@esi.dz",
    activeModules: ["Algorithmique", "Bases de Données"],
    availability: "En cours",
    avatarBg: "bg-indigo-600"
  },
  {
    id: "PRF-02",
    name: "Mme. Souad Khelil",
    department: "Génie Logiciel",
    email: "s.khelil@esi.dz",
    activeModules: ["POO (Java)", "Concepts Web"],
    availability: "Disponible",
    avatarBg: "bg-teal-600"
  },
  {
    id: "PRF-03",
    name: "Dr. Feriel Ziane",
    department: "Génie Logiciel",
    email: "f.ziane@esi.dz",
    activeModules: ["Génie Logiciel & UML", "Architecture Logicielle"],
    availability: "Disponible",
    avatarBg: "bg-violet-600"
  },
  {
    id: "PRF-04",
    name: "Prof. Malik Bensaid",
    department: "Systèmes et Réseaux",
    email: "m.bensaid@esi.dz",
    activeModules: ["Sécurité & Cryptographie", "Réseaux Mobiles"],
    availability: "Absent",
    avatarBg: "bg-amber-600"
  },
  {
    id: "PRF-05",
    name: "Prof. Lydia Ould",
    department: "Intelligence Artificielle",
    email: "l.ould@esi.dz",
    activeModules: ["Machine Learning", "Deep Learning"],
    availability: "Disponible",
    avatarBg: "bg-pink-600"
  }
];

export const roomsList = [
  { id: "RM-01", name: "Amphi A", type: "Amphithéâtre" },
  { id: "RM-02", name: "Amphi B", type: "Amphithéâtre" },
  { id: "RM-03", name: "Labo 03", type: "Laboratoire TP" },
  { id: "RM-04", name: "Salle 104", type: "Salle de cours" },
  { id: "RM-05", name: "Salle 202", type: "Salle de cours" }
];

export const modulesList = [
  // ── TC1 ──────────────────────────────────────────────────────────────────
  {
    id: "MOD-01",
    name: "Algorithmique & Structures de Données",
    teacher: "Dr. A. Rahmouni",
    className: "TC1",
    semester: "S1",
    totalHours: 45,
    remainingHours: 8,
    progress: 82,
    prerequisite: null,
    status: "En cours"
  },
  {
    id: "MOD-02",
    name: "Mathématiques Discrètes",
    teacher: "Dr. F. Ziane",
    className: "TC1",
    semester: "S1",
    totalHours: 40,
    remainingHours: 0,
    progress: 100,
    prerequisite: null,
    status: "Terminé"
  },
  {
    id: "MOD-03",
    name: "Programmation Impérative (C)",
    teacher: "Mme. S. Khelil",
    className: "TC1",
    semester: "S2",
    totalHours: 45,
    remainingHours: 15,
    progress: 67,
    prerequisite: "Algorithmique & Structures de Données",
    status: "En cours"
  },
  // ── TC2 ──────────────────────────────────────────────────────────────────
  {
    id: "MOD-04",
    name: "Programmation Orientée Objet (Java)",
    teacher: "Mme. S. Khelil",
    className: "TC2",
    semester: "S3",
    totalHours: 45,
    remainingHours: 5,
    progress: 89,
    prerequisite: "Programmation Impérative (C)",
    status: "En cours"
  },
  {
    id: "MOD-05",
    name: "Bases de Données",
    teacher: "Dr. A. Rahmouni",
    className: "TC2",
    semester: "S3",
    totalHours: 40,
    remainingHours: 0,
    progress: 100,
    prerequisite: null,
    status: "Terminé"
  },
  {
    id: "MOD-06",
    name: "Systèmes d'Exploitation",
    teacher: "Prof. M. Bensaid",
    className: "TC2",
    semester: "S4",
    totalHours: 35,
    remainingHours: 20,
    progress: 43,
    prerequisite: null,
    status: "En cours"
  },
  // ── TC3 ISI ───────────────────────────────────────────────────────────────
  {
    id: "MOD-07",
    name: "Génie Logiciel & UML",
    teacher: "Dr. F. Ziane",
    className: "TC3 ISI",
    semester: "S5",
    totalHours: 40,
    remainingHours: 0,
    progress: 100,
    prerequisite: "Programmation Orientée Objet (Java)",
    status: "Terminé"
  },
  {
    id: "MOD-08",
    name: "Architecture Logicielle",
    teacher: "Dr. F. Ziane",
    className: "TC3 ISI",
    semester: "S6",
    totalHours: 35,
    remainingHours: 12,
    progress: 66,
    prerequisite: "Génie Logiciel & UML",
    status: "En cours"
  },
  // ── TC3 IRS ───────────────────────────────────────────────────────────────
  {
    id: "MOD-09",
    name: "Réseaux Informatiques",
    teacher: "Prof. M. Bensaid",
    className: "TC3 IRS",
    semester: "S5",
    totalHours: 45,
    remainingHours: 0,
    progress: 100,
    prerequisite: "Systèmes d'Exploitation",
    status: "Terminé"
  },
  {
    id: "MOD-10",
    name: "Sécurité & Cryptographie",
    teacher: "Prof. M. Bensaid",
    className: "TC3 IRS",
    semester: "S6",
    totalHours: 40,
    remainingHours: 10,
    progress: 75,
    prerequisite: "Réseaux Informatiques",
    status: "En cours"
  },
  // ── Masters ───────────────────────────────────────────────────────────────
  {
    id: "MOD-11",
    name: "Machine Learning",
    teacher: "Prof. L. Ould",
    className: "M1 SD",
    semester: "S1",
    totalHours: 50,
    remainingHours: 18,
    progress: 64,
    prerequisite: null,
    status: "En cours"
  },
  {
    id: "MOD-12",
    name: "Deep Learning",
    teacher: "Prof. L. Ould",
    className: "M2 SD",
    semester: "S2",
    totalHours: 45,
    remainingHours: 30,
    progress: 33,
    prerequisite: "Machine Learning",
    status: "En cours"
  }
];

export const evaluationsList = [
  {
    id: "EV-01",
    moduleName: "Algorithmique & Structures de Données",
    type: "Examen Final (EF)",
    date: "15 Juin 2026",
    time: "09:00",
    classGroup: "TC1",
    room: "Amphi A & B",
    weight: 60,
    status: "Planifié"
  },
  {
    id: "EV-02",
    moduleName: "Programmation Orientée Objet (Java)",
    type: "Contrôle Continu (CC)",
    date: "17 Juin 2026",
    time: "11:00",
    classGroup: "TC2",
    room: "Labo 03",
    weight: 20,
    status: "Planifié"
  },
  {
    id: "EV-03",
    moduleName: "Génie Logiciel & UML",
    type: "Soutenance Projet",
    date: "18 Juin 2026",
    time: "13:00",
    classGroup: "TC3 ISI",
    room: "Salle 104",
    weight: 40,
    status: "Planifié"
  },
  {
    id: "EV-04",
    moduleName: "Sécurité & Cryptographie",
    type: "Examen mi-parcours",
    date: "20 Juin 2026",
    time: "14:30",
    classGroup: "TC3 IRS",
    room: "Salle 202",
    weight: 30,
    status: "Planifié"
  },
  {
    id: "EV-05",
    moduleName: "Machine Learning",
    type: "Contrôle Continu (CC)",
    date: "22 Juin 2026",
    time: "10:00",
    classGroup: "M1 SD",
    room: "Salle 104",
    weight: 25,
    status: "Planifié"
  },
  {
    id: "EV-06",
    moduleName: "Bases de Données",
    type: "Examen Final (EF)",
    date: "25 Juin 2026",
    time: "08:30",
    classGroup: "TC2",
    room: "Amphi A",
    weight: 60,
    status: "Terminé"
  }
];

export const roomOccupancyTimeline = [
  { hour: "08:30", occupancy: 60 },
  { hour: "10:15", occupancy: 80 },
  { hour: "12:00", occupancy: 20 },
  { hour: "13:00", occupancy: 75 },
  { hour: "14:45", occupancy: 70 },
  { hour: "16:30", occupancy: 10 }
];

export const classAvgPerformance = [
  { name: "TC1", average: 12.8 },
  { name: "TC2", average: 13.5 },
  { name: "TC3 ISI", average: 14.2 },
  { name: "M1 SI", average: 15.6 },
  { name: "TC3 IRS", average: 13.9 }
];

// Weekly Timetable Data
// Weekly Timetable Data
export const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "14:00 - 16:00",
  "16:00 - 18:00"
];

export const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const timetablesList = [
  {
    id: "TT-01",
    date: "2025/2026",
    classe: "TC1",
    semester: "S1",
    schedule: {
      "Lundi": {
        "08:00 - 10:00": { subject: "Algorithmique", type: "Cours", color: "bg-indigo-500/15 border-indigo-500/50 text-indigo-600 dark:text-indigo-400" },
        "10:00 - 12:00": { subject: "Mathématiques", type: "TD", color: "bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400" },
        "14:00 - 16:00": null,
        "16:00 - 18:00": { subject: "Physique", type: "TP", color: "bg-pink-500/15 border-pink-500/50 text-pink-600 dark:text-pink-400" }
      },
      "Mardi": {
        "08:00 - 10:00": { subject: "Physique", type: "Cours", color: "bg-pink-500/15 border-pink-500/50 text-pink-600 dark:text-pink-400" },
        "10:00 - 12:00": { subject: "Algorithmique", type: "TD", color: "bg-indigo-500/15 border-indigo-500/50 text-indigo-600 dark:text-indigo-400" },
        "14:00 - 16:00": { subject: "Langues", type: "Cours", color: "bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400" },
        "16:00 - 18:00": null
      },
      "Mercredi": {
        "08:00 - 10:00": null,
        "10:00 - 12:00": { subject: "Mathématiques", type: "Cours", color: "bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400" },
        "14:00 - 16:00": { subject: "Algorithmique", type: "TP", color: "bg-indigo-500/15 border-indigo-500/50 text-indigo-600 dark:text-indigo-400" },
        "16:00 - 18:00": { subject: "Sport", type: "TP", color: "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" }
      },
      "Jeudi": {
        "08:00 - 10:00": { subject: "Mécanique", type: "Cours", color: "bg-violet-500/15 border-violet-500/50 text-violet-600 dark:text-violet-400" },
        "10:00 - 12:00": { subject: "Mécanique", type: "TD", color: "bg-violet-500/15 border-violet-500/50 text-violet-600 dark:text-violet-400" },
        "14:00 - 16:00": null,
        "16:00 - 18:00": null
      },
      "Vendredi": {
        "08:00 - 10:00": null,
        "10:00 - 12:00": null,
        "14:00 - 16:00": null,
        "16:00 - 18:00": null
      },
      "Samedi": {
        "08:00 - 10:00": { subject: "Électronique", type: "Cours", color: "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400" },
        "10:00 - 12:00": { subject: "Électronique", type: "TP", color: "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400" },
        "14:00 - 16:00": null,
        "16:00 - 18:00": null
      }
    }
  }
];
