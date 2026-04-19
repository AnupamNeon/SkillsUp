import 'dotenv/config';
import { validateEnv } from './src/config/env.js';
import logger from './src/utils/logger.js';
import { initializeAI } from './src/config/ai.js';

// // Validate environment BEFORE importing anything that uses env vars
// validateEnv();

// Dynamic imports after env validation
const { default: app } = await import('./src/app.js');
const { default: connectDB } = await import('./src/config/database.js');
const { default: connectCloudinary } = await import('./src/config/cloudinary.js');

const PORT = parseInt(process.env.PORT, 10);

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    await connectCloudinary();
    initializeAI(); // ← Add this

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
};

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