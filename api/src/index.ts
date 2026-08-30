import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { router } from './router.js';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? process.env.ALLOWED_ORIGIN.split(',') 
  : ['http://localhost:3000', 'https://recruitment.hackclubvit.co'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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
