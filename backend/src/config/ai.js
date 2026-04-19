import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

let gemini = null;

export const initializeAI = () => {
  const provider = process.env.AI_PROVIDER || 'gemini';

  try {
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      logger.info('Gemini AI initialized successfully');
    }

    if (!gemini) {
      logger.warn('No AI provider configured');
    }
  } catch (error) {
    logger.error('AI initialization failed', { error: error.message });
  }
};

export const getAIClient = () => {
  const provider = process.env.AI_PROVIDER || 'gemini';

  if (provider === 'gemini') {
    if (!gemini) throw new Error('Gemini not initialized');
    return { client: gemini, type: 'gemini' };
  }

  throw new Error('No AI provider available');
};

export default { initializeAI, getAIClient };