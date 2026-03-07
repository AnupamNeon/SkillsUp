import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () =>
      logger.info('MongoDB connected successfully')
    );
    mongoose.connection.on('error', (err) =>
      logger.error('MongoDB connection error', { error: err.message })
    );
    mongoose.connection.on('disconnected', () =>
      logger.warn('MongoDB disconnected')
    );

    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
};

export default connectDB;