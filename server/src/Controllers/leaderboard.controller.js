import { User } from '../Models/user.model.js';
import { GameSession } from '../Models/gameSession.model.js';
import { Quiz } from '../Models/quiz.model.js';
import { ApiError } from '../Utils/api-error.js';
import { ApiResponse } from '../Utils/api-response.js';

/**
 * Get Global Leaderboard
 * Rankings based on total score from all quizzes attempted
 */
const getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate users with their total scores
    const leaderboard = await User.aggregate([
      {
        $match: {
          'quizzesAttempted.0': { $exists: true }, // Only users who attempted quizzes
        },
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          quizzesAttempted: 1,
          totalScore: {
            $sum: '$quizzesAttempted.score',
          },
          quizzesCount: {
            $size: '$quizzesAttempted',
          },
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$quizzesAttempted' }, 0] },
              then: {
                $divide: [
                  { $sum: '$quizzesAttempted.score' },
                  { $size: '$quizzesAttempted' },
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { totalScore: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: skip + index + 1,
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
      totalScore: user.totalScore,
      quizzesCount: user.quizzesCount,
      averageScore: Math.round(user.averageScore * 10) / 10,
    }));

    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      'quizzesAttempted.0': { $exists: true },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          leaderboard: rankedLeaderboard,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / parseInt(limit)),
            totalUsers,
            hasMore: skip + rankedLeaderboard.length < totalUsers,
          },
        },
        'Global leaderboard fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Failed to fetch global leaderboard'));
  }
};

/**
 * Get Weekly Leaderboard
 * Rankings based on scores from the last 7 days
 */
const getWeeklyLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const leaderboard = await User.aggregate([
      {
        $unwind: '$quizzesAttempted',
      },
      {
        $match: {
          'quizzesAttempted.completedAt': { $gte: oneWeekAgo },
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          weeklyScore: { $sum: '$quizzesAttempted.score' },
          weeklyQuizzes: { $sum: 1 },
        },
      },
      {
        $sort: { weeklyScore: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
      weeklyScore: user.weeklyScore,
      weeklyQuizzes: user.weeklyQuizzes,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { leaderboard: rankedLeaderboard },
        'Weekly leaderboard fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Failed to fetch weekly leaderboard'));
  }
};

/**
 * Get Quiz-specific Leaderboard
 * Rankings for a specific quiz
 */
const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { limit = 50 } = req.query;

    if (!quizId) {
      return res.status(400).json(new ApiError(400, 'Quiz ID is required'));
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json(new ApiError(404, 'Quiz not found'));
    }

    // Get all users who attempted this quiz
    const leaderboard = await User.aggregate([
      {
        $unwind: '$quizzesAttempted',
      },
      {
        $match: {
          'quizzesAttempted.quiz': quiz._id,
        },
      },
      {
        $sort: { 'quizzesAttempted.score': -1 },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          bestScore: { $max: '$quizzesAttempted.score' },
          attempts: { $sum: 1 },
          lastAttempt: { $max: '$quizzesAttempted.completedAt' },
        },
      },
      {
        $sort: { bestScore: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
      bestScore: user.bestScore,
      attempts: user.attempts,
      lastAttempt: user.lastAttempt,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category,
            totalQuestions: quiz.totalQuestions,
          },
          leaderboard: rankedLeaderboard,
        },
        'Quiz leaderboard fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Failed to fetch quiz leaderboard'));
  }
};

/**
 * Get Game Session Leaderboard
 * Final rankings from a multiplayer game session
 */
const getGameLeaderboard = async (req, res) => {
  try {
    const { gameCode } = req.params;

    if (!gameCode) {
      return res.status(400).json(new ApiError(400, 'Game code is required'));
    }

    const gameSession = await GameSession.findOne({ gameCode })
      .populate('quizId', 'title category')
      .lean();

    if (!gameSession) {
      return res.status(404).json(new ApiError(404, 'Game session not found'));
    }

    // Sort participants by score
    const leaderboard = gameSession.participants
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => ({
        rank: index + 1,
        odickname: participant.odickname,
        score: participant.score,
        correctAnswers: participant.answers.filter((a) => a.isCorrect).length,
        totalAnswers: participant.answers.length,
        averageTime:
          participant.answers.length > 0
            ? Math.round(
                participant.answers.reduce((sum, a) => sum + (a.timeMs || 0), 0) /
                  participant.answers.length
              )
            : 0,
      }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          game: {
            gameCode: gameSession.gameCode,
            quiz: gameSession.quizId,
            status: gameSession.status,
            startedAt: gameSession.startedAt,
            endedAt: gameSession.endedAt,
          },
          leaderboard,
        },
        'Game leaderboard fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching game leaderboard:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Failed to fetch game leaderboard'));
  }
};

/**
 * Get Current User's Rank
 * Returns the authenticated user's position on the global leaderboard
 */
const getUserRank = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's total score
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiError(404, 'User not found'));
    }

    const userTotalScore = user.quizzesAttempted.reduce(
      (sum, attempt) => sum + (attempt.score || 0),
      0
    );

    // Count users with higher scores
    const usersAhead = await User.aggregate([
      {
        $match: {
          'quizzesAttempted.0': { $exists: true },
        },
      },
      {
        $project: {
          totalScore: { $sum: '$quizzesAttempted.score' },
        },
      },
      {
        $match: {
          totalScore: { $gt: userTotalScore },
        },
      },
      {
        $count: 'count',
      },
    ]);

    const rank = (usersAhead[0]?.count || 0) + 1;
    const totalUsers = await User.countDocuments({
      'quizzesAttempted.0': { $exists: true },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          rank,
          totalUsers,
          totalScore: userTotalScore,
          quizzesAttempted: user.quizzesAttempted.length,
          percentile:
            totalUsers > 0
              ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100)
              : 0,
        },
        'User rank fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return res.status(500).json(new ApiError(500, 'Failed to fetch user rank'));
  }
};

export {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getQuizLeaderboard,
  getGameLeaderboard,
  getUserRank,
};
