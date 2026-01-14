// src/Routes/game.route.js
import express from 'express';
import { authenticateUser } from '../Middlewares/auth.middleware.js';
import {
  createGameSession,
  validateGameCode,
  getGameSession,
  getGameResults,
  getGameHistory,
} from '../Controllers/game.controller.js';

const gameRouter = express.Router();

// Protected routes (require authentication)
gameRouter.post('/create', authenticateUser, createGameSession);
gameRouter.get('/session/:id', authenticateUser, getGameSession);
gameRouter.get('/history', authenticateUser, getGameHistory);

// Public routes (no auth required for players)
gameRouter.get('/join/:code', validateGameCode);
gameRouter.get('/results/:id', getGameResults);

export default gameRouter;
