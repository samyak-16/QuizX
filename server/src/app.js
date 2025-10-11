// app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { inngestFunctions } from './inngest/index.js';
import { inngest } from './Config/inngest.js';
import { serve } from 'inngest/express';
import quizRouter from './Routes/quiz.route.js';
import userRouter from './Routes/user.route.js';
import profileRouter from './Routes/profile.route.js';

const app = express();

// middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true, // This is crucial for cookies to work
  })
);
app.use(express.json());
app.use(cookieParser());

// routes
app.get('/', (req, res) => {
  res.send('Hello from app.js');
});
app.use('/api/users', userRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/profile', profileRouter);

//Inngest route from interacting asynchronously with inngest cloud
app.use(
  '/api/inngest',
  serve({ client: inngest, functions: inngestFunctions })
);
// Export app, don't listen here
export { app };
