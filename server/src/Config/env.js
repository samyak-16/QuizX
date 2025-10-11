import dotenv from 'dotenv';
dotenv.config();

const env = {
  GROQ_API_KEY: process.env.GROQ_API_KEY || 'dummy_key_for_testing',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/quizx',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_for_development',
  MAILTRAP: {
    HOST: process.env.MAILTRAP_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    PORT: process.env.MAILTRAP_SMTP_PORT || '2525',
    USER: process.env.MAILTRAP_SMTP_USER || 'dummy_user',
    PASS: process.env.MAILTRAP_SMTP_PASS || 'dummy_pass',
  },
  PORT: process.env.PORT || 3000,
};

export { env };
