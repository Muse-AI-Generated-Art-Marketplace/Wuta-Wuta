import morgan from 'morgan';
import { config } from '../config/env';

/**
 * HTTP request logger middleware.
 * Uses 'dev' format in development for colourised concise logs,
 * and 'combined' (Apache-style) in production for structured access logs.
 */
export const logger = morgan(config.isDevelopment ? 'dev' : 'combined');
