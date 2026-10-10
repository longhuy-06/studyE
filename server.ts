import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './server/routes/api.js';
import { initMongoDB, loadDataFromMongo, getMongoStatus } from './server/mongo.js';
import { db } from './server/db.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LinguaNext server running on http://0.0.0.0:${port}`);
  });
}

startServer();
