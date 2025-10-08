import dotenv from 'dotenv';
dotenv.config();

const env = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  MONGO_URL: process.env.MONGO_URL,
};

export { env };
