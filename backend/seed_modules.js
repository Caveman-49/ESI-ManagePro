import pool from './db.js';

const modulesData = [
  // ── Semester S1 (TC1) ──
  { id: '1INF1100', name: "Utilisation des systèmes d'exploitation les plus courants", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-01' },
  { id: '2INF1100', name: "Bureautique", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '1INF1101', name: "Algorithmique et structures de données statiques", class_id: 'CLS-TC1', semester: 'S1', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '1INF1102', name: "Programmation", class_id: 'CLS-TC1', semester: 'S1', total_hours: 60, teacher_id: 'PRF-02' },
  { id: '1INF1103', name: "Logique et raisonnement", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '1INF1104', name: "Analyse 1", class_id: 'CLS-TC1', semester: 'S1', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF1105', name: "Statistiques descriptives", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF1106', name: "Électrocinétique", class_id: 'CLS-TC1', semester: 'S1', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '2INF1106', name: "Électrostatique", class_id: 'CLS-TC1', semester: 'S1', total_hours: 15, teacher_id: 'PRF-04' },
  { id: '1INF1107', name: "Comptabilité Générale", class_id: 'CLS-TC1', semester: 'S1', total_hours: 45, teacher_id: 'PRF-05' },
  { id: '1INF1108', name: "Anglais 1", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '2INF1108', name: "Techniques d'expression 1", class_id: 'CLS-TC1', semester: 'S1', total_hours: 30, teacher_id: 'PRF-02' },

  // ── Semester S2 (TC1) ──
  { id: '1INF1600', name: "Algorithmique et structures de données dynamiques", class_id: 'CLS-TC1', semester: 'S2', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '2INF1600', name: "Introduction à la programmation web", class_id: 'CLS-TC1', semester: 'S2', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '1INF1601', name: "Électronique numérique", class_id: 'CLS-TC1', semester: 'S2', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF1602', name: "Architecture et fonctionnement des ordinateurs", class_id: 'CLS-TC1', semester: 'S2', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '1INF1603', name: "Algèbre générale", class_id: 'CLS-TC1', semester: 'S2', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '2INF1603', name: "Algèbre linéaire 1", class_id: 'CLS-TC1', semester: 'S2', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF1604', name: "Analyse 2", class_id: 'CLS-TC1', semester: 'S2', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF1605', name: "Électronique analogique", class_id: 'CLS-TC1', semester: 'S2', total_hours: 37, teacher_id: 'PRF-04' },
  { id: '2INF1605', name: "Électromagnétisme", class_id: 'CLS-TC1', semester: 'S2', total_hours: 37, teacher_id: 'PRF-04' },
  { id: '1INF1606', name: "Économie générale", class_id: 'CLS-TC1', semester: 'S2', total_hours: 25, teacher_id: 'PRF-05' },
  { id: '1INF1607', name: "Anglais 2", class_id: 'CLS-TC1', semester: 'S2', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '2INF1607', name: "Techniques d'expression 2", class_id: 'CLS-TC1', semester: 'S2', total_hours: 30, teacher_id: 'PRF-02' },

  // ── Semester S3 (TC2) ──
  { id: '1INF2100', name: "Algorithmiques, structures de données et complexité", class_id: 'CLS-TC2', semester: 'S3', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '1INF2101', name: "Programmation orientée objet", class_id: 'CLS-TC2', semester: 'S3', total_hours: 45, teacher_id: 'PRF-02' },
  { id: '1INF2102', name: "Utilisation des systèmes d'exploitation Unix/Linux", class_id: 'CLS-TC2', semester: 'S3', total_hours: 30, teacher_id: 'PRF-01' },
  { id: '2INF2102', name: "Conception des systèmes d'exploitation", class_id: 'CLS-TC2', semester: 'S3', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '1INF2103', name: "Algèbre linéaire 2", class_id: 'CLS-TC2', semester: 'S3', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '1INF2104', name: "Probabilités", class_id: 'CLS-TC2', semester: 'S3', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF2105', name: "Graphes et optimisation", class_id: 'CLS-TC2', semester: 'S3', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF2106', name: "Électrotechnique", class_id: 'CLS-TC2', semester: 'S3', total_hours: 22, teacher_id: 'PRF-04' },
  { id: '2INF2106', name: "Électronique de puissance", class_id: 'CLS-TC2', semester: 'S3', total_hours: 22, teacher_id: 'PRF-04' },
  { id: '1INF2107', name: "Droit (travail, sociétés, TIC)", class_id: 'CLS-TC2', semester: 'S3', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF2108', name: "Anglais 3", class_id: 'CLS-TC2', semester: 'S3', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '1INF2109', name: "Comptabilité analytique", class_id: 'CLS-TC2', semester: 'S3', total_hours: 45, teacher_id: 'PRF-05' },

  // ── Semester S4 (TC2) ──
  { id: '1INF2600', name: "Architectures clients / serveurs", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-01' },
  { id: '2INF2600', name: "Administration des systèmes d'exploitation", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-01' },
  { id: '1INF2601', name: "Statistique inférentielle", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF2602', name: "Sécurité informatique", class_id: 'CLS-TC2', semester: 'S4', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF2603', name: "Modèle relationnel et bases de données", class_id: 'CLS-TC2', semester: 'S4', total_hours: 60, teacher_id: 'PRF-01' },
  { id: '1INF2604', name: "Architectures et technologies des réseaux", class_id: 'CLS-TC2', semester: 'S4', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF2605', name: "Modèles OSI et TCP/IP", class_id: 'CLS-TC2', semester: 'S4', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '2INF2605', name: "Routage IP", class_id: 'CLS-TC2', semester: 'S4', total_hours: 15, teacher_id: 'PRF-04' },
  { id: '1INF2606', name: "Analyse numérique matricielle", class_id: 'CLS-TC2', semester: 'S4', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF2607', name: "Connaissance de l'entreprise", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '2INF2607', name: "Communication en entreprise", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '3INF2607', name: "Analyse financière", class_id: 'CLS-TC2', semester: 'S4', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF2608', name: "Projet tutoré", class_id: 'CLS-TC2', semester: 'S4', total_hours: 15, teacher_id: 'PRF-02' },

  // ── Semester S5 (TC3 ISI) ──
  { id: '1INF3110', name: "Administration réseaux", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '1INF3111', name: "Création d'entreprise", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF3112', name: "Anglais 4", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 50, teacher_id: 'PRF-03' },
  { id: '1INF3113', name: "Optimisation", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-01' },
  { id: '1INF3114', name: "Conduite de projets informatiques", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '2INF3114', name: "Projet tutoré", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 50, teacher_id: 'PRF-02' },
  { id: '3INF3114', name: "IHM", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '1INF3115', name: "Conception des systèmes d'information", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 45, teacher_id: 'PRF-05' },
  { id: '2INF3115', name: "Analyse et conception orientée objets", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 45, teacher_id: 'PRF-03' },
  { id: '1INF3116', name: "Administration des bases de données", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 45, teacher_id: 'PRF-01' },
  { id: '1INF3117', name: "Techniques de compilation", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-03' },
  { id: '1INF3118', name: "Programmation orientée objet avancée", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '2INF3118', name: "Programmation Web avancée", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-02' },
  { id: '3INF3118', name: "Développement mobile", class_id: 'CLS-TC3-ISI', semester: 'S5', total_hours: 30, teacher_id: 'PRF-02' },

  // ── Semester S5 (TC3 IRS) ──
  { id: '1INF3120', name: "Administration réseaux avancé", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 60, teacher_id: 'PRF-04' },
  { id: '2INF3120', name: "Administration réseaux", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '1INF3121', name: "Conception de réseaux locaux", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '1INF3122', name: "Création d'entreprise", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-05' },
  { id: '1INF3123', name: "Anglais 4", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 50, teacher_id: 'PRF-03' },
  { id: '1INF3124', name: "Traitement du signal", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '1INF3125', name: "Diagnostic et maintenance, maintenance matérielle", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF3126', name: "Informatique Industrielle (automates programmables, graphcet)", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF3127', name: "Technologies émergentes", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '1INF3128', name: "Programmation Système", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 45, teacher_id: 'PRF-04' },
  { id: '1INF3129', name: "Déploiement de réseaux locaux et métropolitains", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '2INF3129', name: "Infrastructures des réseaux mobiles", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 30, teacher_id: 'PRF-04' },
  { id: '3INF3129', name: "Projet tutoré", class_id: 'CLS-TC3-IRS', semester: 'S5', total_hours: 15, teacher_id: 'PRF-02' }
];

async function run() {
  try {
    console.log('Clearing old modules...');
    await pool.query('DELETE FROM modules');

    console.log(`Seeding ${modulesData.length} modules from PDF...`);
    for (const mod of modulesData) {
      await pool.query(
        `INSERT INTO modules (id, name, class_id, semester, total_hours, remaining_hours, progress, teacher_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'En cours')`,
        [mod.id, mod.name, mod.class_id, mod.semester, mod.total_hours, mod.total_hours, mod.teacher_id]
      );
    }

    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding modules:', err);
    process.exit(1);
  }
}

run();
