import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes';

/**
 * Creates and configures the Express application.
 */
export const createApp = (): Express => {
  const app = express();

  // 1. Security & request enhancements
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 2. Logging
  app.use(logger);

  // 3. Global rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: 'TooManyRequests',
      message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // 4. API Routes
  app.use('/api', apiRoutes);

  // 5. 404 Handler
  app.use(notFound);

  // 6. Error handling
  app.use(errorHandler);

  return app;
};
