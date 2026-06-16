import express from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`✅ ESIManage Pro API running on http://localhost:${PORT}`);
});
