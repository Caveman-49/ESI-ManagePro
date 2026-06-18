import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import academicYearsRoutes from './routes/academicYears.js';
import classesRoutes from './routes/classes.js';
import professorsRoutes from './routes/professors.js';
import roomsRoutes from './routes/rooms.js';
import modulesRoutes from './routes/modules.js';
import evaluationsRoutes from './routes/evaluations.js';
import timetablesRoutes from './routes/timetables.js';
import dashboardRoutes from './routes/dashboard.js';
import { startEvalAutoUpdateJob } from './jobs/evalAutoUpdate.js';
import { recalcModuleProgress } from './jobs/recalcModuleProgress.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/academic-years', academicYearsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/professors', professorsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/timetables', timetablesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve Frontend Static Files (Production) ──
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Catch-all: serve index.html for any non-API route (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log('✅ ESIManage Pro API running on http://localhost:' + PORT);
  // Démarre le job de mise à jour automatique des statuts d'évaluations
  startEvalAutoUpdateJob();
  // Recalcul initial de la progression des modules
  recalcModuleProgress();
});
