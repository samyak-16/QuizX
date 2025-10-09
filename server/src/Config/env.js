import dotenv from 'dotenv';
dotenv.config();

const env = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  MAILTRAP: {
    HOST: process.env.MAILTRAP_SMTP_HOST,
    PORT: process.env.MAILTRAP_SMTP_PORT,
    USER: process.env.MAILTRAP_SMTP_USER,
    PASS: process.env.MAILTRAP_SMTP_PASS,
  },
  PORT: process.env.PORT,

};

export { env };
