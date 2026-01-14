import express from 'express';
import {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getQuizLeaderboard,
  getGameLeaderboard,
  getUserRank,
} from '../Controllers/leaderboard.controller.js';
import { authenticateUser } from '../Middlewares/auth.middleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/global', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/quiz/:quizId', getQuizLeaderboard);
router.get('/game/:gameCode', getGameLeaderboard);

// Protected routes (auth required)
router.get('/my-rank', authenticateUser, getUserRank);

export default router;
