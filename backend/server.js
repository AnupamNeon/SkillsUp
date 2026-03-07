import 'dotenv/config';
import { validateEnv } from './src/config/env.js';
import logger from './src/utils/logger.js';

// Validate environment BEFORE importing anything that uses env vars
validateEnv();

// Dynamic imports after env validation
const { default: app } = await import('./src/app.js');
const { default: connectDB } = await import('./src/config/database.js');
const { default: connectCloudinary } = await import('./src/config/cloudinary.js');

const PORT = parseInt(process.env.PORT, 10);

async function startServer() {
  try {
    await connectDB();
    await connectCloudinary();

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();