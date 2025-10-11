import { env } from './env.js';
import Groq from 'groq-sdk';

const groq = new Groq({ 
  apiKey: env.GROQ_API_KEY || 'dummy_key_for_testing'
});

// const createCompletions = groq.chat.completions.create;

export { groq };
