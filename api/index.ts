import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/routes/api.js';
import { initMongoDB, loadDataFromMongo, getMongoStatus } from '../server/mongo.js';
import { db } from '../server/db.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Vercel preview URLs and custom domains
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy initialization of MongoDB for serverless instances
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDbInitialized() {
  if (isDbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        const isMongoReady = await initMongoDB(db.getData());
        if (isMongoReady) {
          const mongoData = await loadDataFromMongo();
          if (mongoData) {
            db.hydrateFromMongo(mongoData);
            console.log('🔄 [Vercel Serverless] Đã nạp dữ liệu từ MongoDB Atlas!');
          }
        }
      } catch (err) {
        console.warn('⚠️ [Vercel Serverless] Lỗi khởi tạo MongoDB, sử dụng bộ nhớ tạm:', err);
      } finally {
        isDbInitialized = true;
      }
    })();
  }
  return dbInitPromise;
}

// Middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
  } catch {}
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LinguaNext',
    serverless: true,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    mongo: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LinguaNext',
    serverless: true,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    mongo: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Mount routes on BOTH /api and root / so any Vercel routing configuration works
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Serverless Function Error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Lỗi máy chủ nội bộ',
      message: err?.message || 'Đã xảy ra sự cố trong quá trình xử lý yêu cầu.',
    });
  }
});

export default app;
