import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db/database.js';
import { seedData } from './db/seed.js';
import { authMiddleware } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import eventRoutes from './routes/events.js';
import clubRoutes from './routes/clubs.js';
import teamRoutes from './routes/teams.js';
import achievementRoutes from './routes/achievements.js';
import verificationRoutes from './routes/verification.js';
import internshipRoutes from './routes/internships.js';
import scholarshipRoutes from './routes/scholarships.js';
import researchRoutes from './routes/research.js';
import notificationRoutes from './routes/notifications.js';
import savedRoutes from './routes/saved.js';
import leaderboardRoutes from './routes/leaderboard.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import opportunitiesRoutes from './routes/opportunities.js';
import archiveRoutes from './routes/archive.js';
import superAdminRoutes from './routes/superAdmin.js';
import myAchievementsRoutes from './routes/myAchievements.js';
import { ingestResearchData } from './db/ingest_research.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB, seed baseline data, and ingest verified research
initDatabase();
seedData();
try {
  ingestResearchData();
} catch (e) {
  console.warn('Research ingestion notice:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Global middleware
const allowedOrigin = process.env.CORS_ORIGIN
  ? (process.env.CORS_ORIGIN.includes(',') ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : process.env.CORS_ORIGIN)
  : true;
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (uses persistent volume when UPLOAD_DIR is set)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Static file serving for built client frontend
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Attach current user if valid JWT is present
app.use(authMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    application: 'AIT Campus Connect',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/my-achievements', myAchievementsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// SPA fallback for frontend client routing (non-API routes)
if (fs.existsSync(clientDistPath)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AIT Campus Connect Server running on http://localhost:${PORT}`);
});
