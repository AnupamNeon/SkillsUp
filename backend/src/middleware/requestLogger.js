import morgan from 'morgan';
import logger from '../utils/logger.js';

const stream = { write: (msg) => logger.http(msg.trim()) };

const requestLogger =
  process.env.NODE_ENV === 'production'
    ? morgan('combined', { stream })
    : morgan(':method :url :status :response-time ms', { stream });

export default requestLogger;