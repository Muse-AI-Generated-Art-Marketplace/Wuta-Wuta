import 'dotenv/config';
import { createApp } from './app';
import { config } from './config/env';

/**
 * Entry point for the Wuta-Wuta Backend API.
 */
const startServer = (): void => {
  try {
    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`
🚀 Wuta-Wuta Backend API is running!
🌐 URL: http://localhost:${config.port}
📂 Base path: /api
🔧 Environment: ${config.nodeEnv}
      `);
    });

    // Handle graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
  }
};

startServer();
