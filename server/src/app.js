// app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { inngestFunctions } from './inngest/index.js';
import { inngest } from './Config/inngest.js';
import { serve } from 'inngest/express';
import quizRouter from './Routes/quiz.route.js';

const app = express();

// middlewares
app.use(
  cors({
    origin: 'http://localhost:5173', // Update to your frontend URL if different
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// routes
app.get('/', (req, res) => {
  res.send('Hello from app.js');
});
app.use('api/quizes', quizRouter);

//Inngest route from interacting asynchronously with inngest cloud
app.use(
  '/api/inngest',
  serve({ client: inngest, functions: inngestFunctions })
);
// Export app, don't listen here
export { app };
