import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './server/routes/api.js';
import { initMongoDB, loadDataFromMongo, getMongoStatus } from './server/mongo.js';
import { db } from './server/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public assets (e.g. audio files, favicon)
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint with MongoDB status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LinguaNext',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    mongo: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Database status endpoint
app.get('/api/database/status', (req, res) => {
  res.json({
    ...getMongoStatus(),
    localCacheCounts: {
      users: db.getData().users.length,
      vocabularies: db.getData().vocabularies.length,
      vocabProgress: db.getData().vocabProgress.length,
      listeningExercises: db.getData().listeningExercises.length,
      writingSubmissions: db.getData().writingSubmissions.length,
      conversations: db.getData().conversations.length,
      activities: db.getData().activities.length,
    },
  });
});

async function startServer() {
  // Initialize MongoDB connection (falls back to local JSON if MONGODB_URI is not configured)
  const isMongoReady = await initMongoDB(db.getData());
  if (isMongoReady) {
    const mongoData = await loadDataFromMongo();
    if (mongoData) {
      db.hydrateFromMongo(mongoData);
      console.log('🔄 [MongoDB] Đã nạp dữ liệu từ MongoDB vào hệ thống LinguaNext!');
    }
  }

  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexPath);
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (isProd && hasDist) {
    console.log('🚀 [Production] Phục vụ ứng dụng từ thư mục "dist"');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint API không tồn tại' });
      }
      res.sendFile(distIndexPath);
    });
  } else {
    console.log('🛠️ [Development] Đang khởi động Vite middleware server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Global Express error handler to prevent crashing or blank responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Lỗi máy chủ:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi máy chủ nội bộ', message: err?.message });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`LinguaNext server running on http://0.0.0.0:${port}`);
  });
}

startServer();

