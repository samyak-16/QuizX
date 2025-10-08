import { env } from './env.js';
import Groq from 'groq-sdk/index.mjs';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

// const createCompletions = groq.chat.completions.create;

export { groq };
