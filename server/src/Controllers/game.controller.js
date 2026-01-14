// src/Controllers/game.controller.js
import { GameSession } from '../Models/gameSession.model.js';
import { Quiz } from '../Models/quiz.model.js';
import { ApiError } from '../Utils/api-error.js';
import { ApiResponse } from '../Utils/api-response.js';
import { validateMongooseObjectId } from '../Utils/validateMongooseObjectId.js';

// Create a new game session
const createGameSession = async (req, res) => {
  const { quizId, settings } = req.body;
  const user = req.user;

  if (!quizId) {
    return res.status(400).json(new ApiError(400, 'Quiz ID is required'));
  }

  if (!validateMongooseObjectId(quizId)) {
    return res.status(400).json(new ApiError(400, 'Invalid quiz ID'));
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json(new ApiError(404, 'Quiz not found'));
    }

    if (quiz.status !== 'completed') {
      return res.status(400).json(new ApiError(400, 'Quiz is not ready'));
    }

    // Verify ownership or public quiz
    if (quiz.generatedBy.toString() !== user._id.toString() && !quiz.isPublic) {
      return res
        .status(403)
        .json(new ApiError(403, 'Not authorized to host this quiz'));
    }

    const gameCode = await GameSession.generateGameCode();

    const gameSession = new GameSession({
      gameCode,
      hostId: user._id,
      quizId,
      settings: settings || {},
    });

    await gameSession.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          gameCode,
          sessionId: gameSession._id,
          quiz: {
            title: quiz.title,
            category: quiz.category,
            totalQuestions: quiz.totalQuestions,
            difficulty: quiz.difficulty,
          },
        },
        'Game session created. Players can join with the game code.'
      )
    );
  } catch (error) {
    console.error('Error creating game session:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Failed to create game session'));
  }
};

// Validate game code (for players joining)
const validateGameCode = async (req, res) => {
  const { code } = req.params;

  if (!code || code.length !== 6) {
    return res.status(400).json(new ApiError(400, 'Invalid game code'));
  }

  try {
    const gameSession = await GameSession.findOne({
      gameCode: code,
      status: { $in: ['lobby', 'playing'] },
    }).populate('quizId', 'title category');

    if (!gameSession) {
      return res.status(404).json(new ApiError(404, 'Game not found'));
    }

    if (
      gameSession.status === 'playing' &&
      !gameSession.settings.allowLateJoin
    ) {
      return res.status(400).json(new ApiError(400, 'Game already in progress'));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          gameCode: gameSession.gameCode,
          quizTitle: gameSession.quizId?.title || 'Quiz',
          category: gameSession.quizId?.category || 'Other',
          participantCount: gameSession.participants.length,
          status: gameSession.status,
        },
        'Game found'
      )
    );
  } catch (error) {
    console.error('Error validating game code:', error);
    return res.status(500).json(new ApiError(500, 'Failed to validate game'));
  }
};

// Get game session details (for host)
const getGameSession = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!validateMongooseObjectId(id)) {
    return res.status(400).json(new ApiError(400, 'Invalid session ID'));
  }

  try {
    const gameSession = await GameSession.findById(id)
      .populate('quizId', 'title category totalQuestions difficulty questions')
      .populate('hostId', 'name email');

    if (!gameSession) {
      return res.status(404).json(new ApiError(404, 'Game session not found'));
    }

    // Only host can see full details
    if (gameSession.hostId._id.toString() !== user._id.toString()) {
      return res.status(403).json(new ApiError(403, 'Not authorized'));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          session: gameSession,
        },
        'Game session retrieved'
      )
    );
  } catch (error) {
    console.error('Error getting game session:', error);
    return res.status(500).json(new ApiError(500, 'Failed to get game session'));
  }
};

// Get game results
const getGameResults = async (req, res) => {
  const { id } = req.params;

  if (!validateMongooseObjectId(id)) {
    return res.status(400).json(new ApiError(400, 'Invalid session ID'));
  }

  try {
    const gameSession = await GameSession.findById(id)
      .populate('quizId', 'title category')
      .select('-participants.answers');

    if (!gameSession) {
      return res.status(404).json(new ApiError(404, 'Game not found'));
    }

    const leaderboard = gameSession.participants
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        odickname: p.odickname,
        score: p.score,
      }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          quizTitle: gameSession.quizId?.title,
          category: gameSession.quizId?.category,
          totalParticipants: gameSession.totalParticipants,
          averageScore: gameSession.averageScore,
          leaderboard,
          startedAt: gameSession.startedAt,
          endedAt: gameSession.endedAt,
        },
        'Game results retrieved'
      )
    );
  } catch (error) {
    console.error('Error getting game results:', error);
    return res.status(500).json(new ApiError(500, 'Failed to get results'));
  }
};

// Get host's game history
const getGameHistory = async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const games = await GameSession.find({ hostId: user._id })
      .populate('quizId', 'title category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('gameCode status totalParticipants averageScore createdAt endedAt');

    const total = await GameSession.countDocuments({ hostId: user._id });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          games,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Game history retrieved'
      )
    );
  } catch (error) {
    console.error('Error getting game history:', error);
    return res.status(500).json(new ApiError(500, 'Failed to get game history'));
  }
};

export {
  createGameSession,
  validateGameCode,
  getGameSession,
  getGameResults,
  getGameHistory,
};
