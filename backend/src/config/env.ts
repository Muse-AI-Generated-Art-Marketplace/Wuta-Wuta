import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  frontendUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  stellar: {
    contractId: string;
    horizonUrl: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'wuta-wuta-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  stellar: {
    contractId: process.env.STELLAR_CONTRACT_ID || '',
    horizonUrl:
      process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
  },
};
