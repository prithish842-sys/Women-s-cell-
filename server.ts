import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { fileURLToPath } from 'url';

import authRouter from './server/routes/auth.js';
import publicRouter from './server/routes/public.js';
import studentRouter from './server/routes/student.js';
import facultyRouter from './server/routes/faculty.js';
import adminRouter from './server/routes/admin.js';
import iccRouter from './server/routes/icc.js';
import safetyRouter from './server/routes/safety.js';
import wellbeingRouter from './server/routes/wellbeing.js';
import adminSafetyRouter from './server/routes/adminSafety.js';
import { errorMiddleware } from './server/middleware/auth.js';
import { connectDatabase, disconnectDatabase, prisma } from './server/config/prisma.js';
import { PUBLIC_UPLOAD_ROOT } from './server/middleware/upload.js';
import { createGracefulShutdownCoordinator } from './server/utils/gracefulShutdown.js';
import { isApplicationReady, setApplicationReady, withTimeout } from './server/utils/readiness.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', ...(isProduction ? ['CLIENT_URL'] : [])];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required. Copy .env.example to .env and configure it.`);
  }
}

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT_MS || 15000);
const READY_DATABASE_TIMEOUT_MS = Number(process.env.READY_DATABASE_TIMEOUT_MS || 3000);
const SERVER_REQUEST_TIMEOUT_MS = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 120000);
const SERVER_HEADERS_TIMEOUT_MS = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 65000);
const SERVER_KEEP_ALIVE_TIMEOUT_MS = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 5000);
if (isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(CLIENT_URL)) {
  throw new Error('CLIENT_URL must be the deployed frontend origin in production.');
}

function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const identifier = typeof req.body?.identifier === 'string'
        ? req.body.identifier.trim().toLowerCase()
        : typeof req.body?.registerNumber === 'string'
          ? req.body.registerNumber.trim().toLowerCase()
          : 'anonymous';
      return `${ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown')}:${identifier}`;
    },
    message: {
      success: false,
      message: 'Too many authentication attempts for this account. Please wait before trying again.',
    },
  });
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 80,
    standardHeaders: true,
    legacyHeaders: false,
  });

  for (const publicUploadPath of [
    'profiles',
    'skills',
    'gallery',
    'achievements',
    'members',
    'thumbnails',
  ]) {
    app.use(`/uploads/${publicUploadPath}`, express.static(path.join(PUBLIC_UPLOAD_ROOT, publicUploadPath)));
  }
  app.get('/uploads/:filename', (req, res, next) => {
    const filename = path.basename(req.params.filename);
    const isLegacyPublicUpload = /^(demo_(?:(?:album\d*)|ach)_[a-z0-9_]+\.png|demo_cert_[a-z0-9_]+\.pdf|placeholder_gallery\.(?:png|jpe?g|webp))$/i.test(filename);
    if (!isLegacyPublicUpload) return next();
    res.sendFile(path.join(PUBLIC_UPLOAD_ROOT, filename), (error) => {
      if (error) next();
    });
  });

  app.get('/api/v1/health', async (_req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        success: true,
        data: {
          server: 'connected',
          database: 'connected',
          databaseProvider: 'postgresql',
          orm: 'prisma',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/v1/health/live', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'alive',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/api/v1/health/ready', async (_req, res) => {
    if (!isApplicationReady()) {
      return res.status(503).json({
        success: false,
        data: {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, READY_DATABASE_TIMEOUT_MS, 'Readiness database check timed out');
      return res.json({
        success: true,
        data: {
          status: 'ready',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      return res.status(503).json({
        success: false,
        data: {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/student/register', authLimiter);
  app.use('/api/v1/admin/gallery', uploadLimiter);
  app.use('/api/v1/admin/achievements', uploadLimiter);

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/public', publicRouter);
  app.use('/api/v1/students', studentRouter);
  app.use('/api/v1/icc', iccRouter);
  app.use('/api/v1/safety', safetyRouter);
  app.use('/api/v1/wellbeing', wellbeingRouter);
  app.use('/api/v1/faculty', facultyRouter);
  app.use('/api/v1/admin/safety', adminSafetyRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();

async function startServer() {
  await connectDatabase();
  const server = app.listen(PORT, '0.0.0.0', () => {
    setApplicationReady(true);
    console.log('================================================');
    console.log(`Singa Pen Portal API running on http://localhost:${PORT}`);
    console.log(`Client origin allowed: ${CLIENT_URL}`);
    console.log('================================================');
  });

  server.requestTimeout = SERVER_REQUEST_TIMEOUT_MS;
  server.headersTimeout = SERVER_HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = SERVER_KEEP_ALIVE_TIMEOUT_MS;

  const shutdown = createGracefulShutdownCoordinator({
    server,
    disconnectDatabase,
    timeoutMs: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  });
  server.on('connection', shutdown.trackConnection);

  process.once('SIGINT', () => {
    void shutdown.requestShutdown({ reason: 'SIGINT', exitCode: 0 });
  });
  process.once('SIGTERM', () => {
    void shutdown.requestShutdown({ reason: 'SIGTERM', exitCode: 0 });
  });
  process.once('uncaughtException', (error) => {
    void shutdown.requestShutdown({ reason: 'uncaughtException', error, exitCode: 1 });
  });
  process.once('unhandledRejection', (reason) => {
    void shutdown.requestShutdown({ reason: 'unhandledRejection', error: reason, exitCode: 1 });
  });
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  startServer().catch((error) => {
    setApplicationReady(false);
    console.error('Critical failure starting server:', error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error));
    process.exit(1);
  });
}
