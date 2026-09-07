import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// MUST run before any other local imports that may initialize Prisma
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback for cwd .env

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { router } from './router.js';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Production Safety Checks
if (process.env.NODE_ENV === 'production') {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    console.error("CRITICAL SECURITY ERROR: DEV_AUTH_BYPASS is true in production!");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing in production!");
    process.exit(1);
  }
  if (!process.env.SMTP_ENCRYPTION_KEY) {
    console.error("CRITICAL SECURITY ERROR: SMTP_ENCRYPTION_KEY is missing in production!");
    process.exit(1);
  }
  const requiredSmtp = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missingSmtp = requiredSmtp.filter(key => !process.env[key]);
  if (missingSmtp.length > 0) {
    console.error(`CRITICAL EMAIL ERROR: Missing required SMTP config: ${missingSmtp.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.APP_URL) {
    console.warn("WARNING: APP_URL is not set in production. Email links will use the default fallback URL. Set APP_URL to your public frontend URL (e.g. https://recruitment.hackclubvit.co).");
  }
}

const app = express();
const port = process.env.PORT || 3001;

// Global Security Middlewares
app.use(helmet());

// Global Rate Limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true',
});
app.use(globalLimiter);

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://recruitment.hackclubvit.co'];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Routes
app.use('/api', router);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err.message);
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS policy violation' });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Independent API server running on port ${port}`);
});
