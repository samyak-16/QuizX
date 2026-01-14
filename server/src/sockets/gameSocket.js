// src/sockets/gameSocket.js
import { GameSession } from '../Models/gameSession.model.js';
import { Quiz } from '../Models/quiz.model.js';
import { DailyActivity } from '../Models/dailyActivity.model.js';
import mongoose from 'mongoose';

// Store active games in memory for fast access
const activeGames = new Map();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         (typeof id === 'string' ? id.length === 24 : true);
};

export const setupGameSocket = (io) => {
  const gameNamespace = io.of('/game');

  gameNamespace.on('connection', (socket) => {
    console.log(`🎮 Socket connected: ${socket.id}`);

    // ==================== HOST EVENTS ====================

    // Host creates a new game
    socket.on('create-game', async ({ quizId, hostId, settings }) => {
      try {
        // Validate quizId before querying
        if (!quizId || !isValidObjectId(quizId)) {
          return socket.emit('error', { message: 'Invalid quiz ID' });
        }

        if (!hostId || !isValidObjectId(hostId)) {
          return socket.emit('error', { message: 'Invalid host ID' });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }

        if (quiz.status !== 'completed') {
          return socket.emit('error', { message: 'Quiz is not ready yet' });
        }

        const gameCode = await GameSession.generateGameCode();

        const gameSession = new GameSession({
          gameCode,
          hostId,
          quizId,
          settings: settings || {},
        });

        await gameSession.save();

        // Store in memory for fast access
        activeGames.set(gameCode, {
          sessionId: gameSession._id.toString(),
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            questions: quiz.questions.map((q) => ({
              _id: q._id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
            totalQuestions: quiz.totalQuestions,
          },
          hostSocketId: socket.id,
          hostId: hostId,
          participants: new Map(),
          status: 'lobby',
          gameStartTime: null,
        });

        // Host joins the game room
        socket.join(gameCode);
        socket.gameCode = gameCode;
        socket.isHost = true;

        socket.emit('game-created', {
          gameCode,
          sessionId: gameSession._id,
          quiz: {
            title: quiz.title,
            totalQuestions: quiz.totalQuestions,
            category: quiz.category,
          },
        });

        console.log(`🎮 Game created: ${gameCode} by host ${hostId}`);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { message: 'Failed to create game' });
      }
    });

    // Host starts the game
    socket.on('start-game', async ({ gameCode, hostNickname }) => {
      try {
        const game = activeGames.get(gameCode);
        if (!game || socket.id !== game.hostSocketId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        // Add host as a participant too
        game.participants.set(socket.id, {
          odickname: hostNickname || 'Host',
          odocketId: socket.id,
          userId: game.hostId,
          score: 0,
          answers: [],
          currentQuestionIndex: 0,
          questionStartTime: Date.now(),
          finished: false,
        });

        // Update all participants to have self-paced tracking
        for (const [socketId, participant] of game.participants) {
          if (socketId !== socket.id) {
            participant.currentQuestionIndex = 0;
            participant.questionStartTime = Date.now();
            participant.finished = false;
          }
        }

        game.status = 'playing';
        game.gameStartTime = Date.now();

        // Update database
        await GameSession.findByIdAndUpdate(game.sessionId, {
          status: 'playing',
          startedAt: new Date(),
          $push: {
            participants: {
              odickname: hostNickname || 'Host',
              odocketId: socket.id,
              userId: game.hostId,
            },
          },
        });

        // Send first question to all players (including host)
        const question = game.quiz.questions[0];
        const safeQuestion = {
          index: 0,
          questionText: question.questionText,
          options: question.options,
          totalQuestions: game.quiz.totalQuestions,
        };

        // Broadcast to all players
        gameNamespace.to(gameCode).emit('game-started', {
          question: safeQuestion,
          totalQuestions: game.quiz.totalQuestions,
        });

        console.log(`🎮 Game started: ${gameCode} with ${game.participants.size} players`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Host advances to next question
    socket.on('next-question', async ({ gameCode }) => {
      try {
        const game = activeGames.get(gameCode);
        if (!game || socket.id !== game.hostSocketId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const nextIndex = game.currentQuestionIndex + 1;

        if (nextIndex >= game.quiz.totalQuestions) {
          // Game is finished
          return endGame(gameNamespace, gameCode, game);
        }

        game.currentQuestionIndex = nextIndex;
        game.questionStartTime = Date.now();

        // Update database
        await GameSession.findByIdAndUpdate(game.sessionId, {
          currentQuestionIndex: nextIndex,
          questionStartedAt: new Date(),
        });

        const question = game.quiz.questions[nextIndex];
        const safeQuestion = {
          index: nextIndex,
          questionText: question.questionText,
          options: question.options,
          totalQuestions: game.quiz.totalQuestions,
        };

        gameNamespace.to(gameCode).emit('new-question', {
          question: safeQuestion,
          questionTimer: 20,
        });
      } catch (error) {
        console.error('Error advancing question:', error);
        socket.emit('error', { message: 'Failed to advance question' });
      }
    });

    // Host shows results for current question
    socket.on('show-question-results', async ({ gameCode }) => {
      try {
        const game = activeGames.get(gameCode);
        if (!game || socket.id !== game.hostSocketId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const question = game.quiz.questions[game.currentQuestionIndex];

        // Count answers
        const answerCounts = {};
        question.options.forEach((opt) => (answerCounts[opt] = 0));

        let correctCount = 0;
        game.participants.forEach((participant) => {
          const answer = participant.answers[game.currentQuestionIndex];
          if (answer) {
            answerCounts[answer.answer] = (answerCounts[answer.answer] || 0) + 1;
            if (answer.isCorrect) correctCount++;
          }
        });

        const leaderboard = getLeaderboard(game, 5);

        gameNamespace.to(gameCode).emit('question-results', {
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          answerCounts,
          correctCount,
          totalAnswers: game.participants.size,
          leaderboard,
        });
      } catch (error) {
        console.error('Error showing results:', error);
        socket.emit('error', { message: 'Failed to show results' });
      }
    });

    // Host ends game manually
    socket.on('end-game', async ({ gameCode }) => {
      try {
        const game = activeGames.get(gameCode);
        if (!game || socket.id !== game.hostSocketId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        await endGame(gameNamespace, gameCode, game);
      } catch (error) {
        console.error('Error ending game:', error);
        socket.emit('error', { message: 'Failed to end game' });
      }
    });

    // ==================== PLAYER EVENTS ====================

    // Player joins a game
    socket.on('join-game', async ({ gameCode, odickname, userId }) => {
      console.log(`🎮 Join attempt: code=${gameCode}, nickname=${odickname}, userId=${userId}`);
      try {
        const game = activeGames.get(gameCode);
        if (!game) {
          console.log(`🎮 Game not found: ${gameCode}`);
          console.log(`🎮 Active games: ${Array.from(activeGames.keys()).join(', ')}`);
          return socket.emit('error', { message: 'Game not found. Check the code and try again.' });
        }

        if (game.status !== 'lobby' && !game.settings?.allowLateJoin) {
          return socket.emit('error', { message: 'Game already started' });
        }

        // Check for duplicate nickname
        let finalNickname = odickname;
        let counter = 1;
        while (
          Array.from(game.participants.values()).some(
            (p) => p.odickname === finalNickname
          )
        ) {
          finalNickname = `${odickname}${counter}`;
          counter++;
        }

        // Add participant
        game.participants.set(socket.id, {
          odickname: finalNickname,
          odocketId: socket.id,
          userId: userId || null,
          score: 0,
          answers: [],
        });

        // Update database
        await GameSession.findByIdAndUpdate(game.sessionId, {
          $push: {
            participants: {
              odickname: finalNickname,
              odocketId: socket.id,
              userId: userId || null,
            },
          },
        });

        // Join socket room
        socket.join(gameCode);
        socket.gameCode = gameCode;
        socket.odickname = finalNickname;
        socket.isHost = false;

        // Notify player
        socket.emit('joined-game', {
          odickname: finalNickname,
          quizTitle: game.quiz.title,
          participantCount: game.participants.size,
        });

        // Notify host and other players
        gameNamespace.to(gameCode).emit('player-joined', {
          odickname: finalNickname,
          participantCount: game.participants.size,
          participants: Array.from(game.participants.values()).map((p) => ({
            odickname: p.odickname,
          })),
        });

        console.log(`🎮 Player ${finalNickname} joined game ${gameCode}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Player submits answer (self-paced - auto advances to next question)
    socket.on('submit-answer', async ({ gameCode, questionIndex, answer }) => {
      try {
        const game = activeGames.get(gameCode);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }

        const participant = game.participants.get(socket.id);
        if (!participant) {
          return socket.emit('error', { message: 'You are not in this game' });
        }

        if (participant.finished) {
          return socket.emit('error', { message: 'You have already finished' });
        }

        if (questionIndex !== participant.currentQuestionIndex) {
          return socket.emit('error', { message: 'Invalid question' });
        }

        // Check if already answered this question
        if (participant.answers[questionIndex]) {
          return socket.emit('error', { message: 'Already answered' });
        }

        const question = game.quiz.questions[questionIndex];
        const isCorrect = answer === question.correctAnswer;
        const responseTimeMs = Date.now() - participant.questionStartTime;
        const questionTimerMs = 30000; // 30 seconds max for scoring

        const points = GameSession.calculateScore(
          isCorrect,
          responseTimeMs,
          questionTimerMs,
          1000
        );

        // Store answer
        participant.answers[questionIndex] = {
          answer,
          isCorrect,
          timeMs: responseTimeMs,
          pointsEarned: points,
        };
        participant.score += points;

        // Update database
        await GameSession.updateOne(
          { _id: game.sessionId, 'participants.odocketId': socket.id },
          {
            $set: { 'participants.$.score': participant.score },
            $push: {
              'participants.$.answers': {
                questionIndex,
                answer,
                timeMs: responseTimeMs,
                isCorrect,
                pointsEarned: points,
              },
            },
          }
        );

        // Move to next question
        const nextIndex = questionIndex + 1;
        
        if (nextIndex >= game.quiz.totalQuestions) {
          // Player finished all questions
          participant.finished = true;
          participant.finishedAt = Date.now();
          
          // Send finish event to this player
          socket.emit('player-finished', {
            totalScore: participant.score,
            answeredCorrectly: participant.answers.filter(a => a?.isCorrect).length,
            totalQuestions: game.quiz.totalQuestions,
            timeTaken: Date.now() - game.gameStartTime,
          });

          // Check if all players finished
          const allFinished = Array.from(game.participants.values()).every(p => p.finished);
          
          if (allFinished) {
            // End the game and show final leaderboard
            await endGame(gameNamespace, gameCode, game);
          } else {
            // Notify others about progress
            const finishedCount = Array.from(game.participants.values()).filter(p => p.finished).length;
            gameNamespace.to(gameCode).emit('player-progress', {
              finishedCount,
              totalPlayers: game.participants.size,
            });
          }
        } else {
          // Send next question to this player
          participant.currentQuestionIndex = nextIndex;
          participant.questionStartTime = Date.now();

          const nextQuestion = game.quiz.questions[nextIndex];
          socket.emit('next-question', {
            question: {
              index: nextIndex,
              questionText: nextQuestion.questionText,
              options: nextQuestion.options,
              totalQuestions: game.quiz.totalQuestions,
            },
            previousAnswer: {
              wasCorrect: isCorrect,
              correctAnswer: question.correctAnswer,
              pointsEarned: points,
            },
            totalScore: participant.score,
          });
        }

        console.log(`🎮 Player ${participant.odickname} answered Q${questionIndex + 1} (${isCorrect ? 'correct' : 'wrong'})`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', async () => {
      console.log(`🎮 Socket disconnected: ${socket.id}`);

      if (socket.gameCode) {
        const game = activeGames.get(socket.gameCode);
        if (game) {
          if (socket.isHost) {
            // Host disconnected - pause or end game
            game.status = 'paused';
            gameNamespace.to(socket.gameCode).emit('host-disconnected', {
              message: 'Host has disconnected. Game paused.',
            });
          } else {
            // Player disconnected
            const participant = game.participants.get(socket.id);
            if (participant) {
              game.participants.delete(socket.id);
              gameNamespace.to(socket.gameCode).emit('player-left', {
                odickname: participant.odickname,
                participantCount: game.participants.size,
              });
            }
          }
        }
      }
    });
  });

  return gameNamespace;
};

// Helper: Get leaderboard
function getLeaderboard(game, limit = 10) {
  return Array.from(game.participants.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p, index) => ({
      rank: index + 1,
      odickname: p.odickname,
      score: p.score,
    }));
}

// Helper: End game
async function endGame(gameNamespace, gameCode, game) {
  game.status = 'finished';

  const leaderboard = getLeaderboard(game, 100);

  // Update database
  await GameSession.findByIdAndUpdate(game.sessionId, {
    status: 'finished',
    endedAt: new Date(),
  });

  // Update daily activity for participants
  for (const [socketId, participant] of game.participants) {
    if (participant.userId) {
      try {
        const activity = await DailyActivity.getToday(participant.userId);
        const won = leaderboard[0]?.odickname === participant.odickname;
        await activity.incrementGamePlayed(won, won ? 100 : 30);
      } catch (e) {
        console.error('Error updating daily activity:', e);
      }
    }
  }

  // Broadcast final results
  gameNamespace.to(gameCode).emit('game-ended', {
    leaderboard,
    totalQuestions: game.quiz.totalQuestions,
    quizTitle: game.quiz.title,
  });

  // Clean up memory after a delay
  setTimeout(() => {
    activeGames.delete(gameCode);
  }, 60000); // Keep for 1 minute for late connections

  console.log(`🎮 Game ended: ${gameCode}`);
}

export { activeGames };
