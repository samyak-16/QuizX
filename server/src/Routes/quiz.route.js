import express from 'express';
import {
  createQuiz,
  getQuizById,
  submitQuiz,
} from '../Controllers/quiz.controller.js';
import { authenticateUser } from '../Middlewares/auth.middleware.js';
import { upload } from '../Middlewares/multer.middleware.js';

const router = express.Router();

router.post('/create', authenticateUser, upload.single('pdf', 1), createQuiz);
router.get('/:quizId', authenticateUser, getQuizById);
router.post('/submit', authenticateUser, submitQuiz);

export default router;
