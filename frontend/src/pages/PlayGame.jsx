// src/pages/PlayGame.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Gamepad2,
  Users,
  Trophy,
  Loader2,
} from 'lucide-react';

const PlayGame = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    gameState,
    joinGame,
    submitAnswer,
    disconnectFromGame,
  } = useSocket();

  const [gameCode, setGameCode] = useState(searchParams.get('code') || '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Use user's name as default nickname
  useEffect(() => {
    if (user?.name && !nickname) {
      setNickname(user.name);
    }
  }, [user, nickname]);

  // Handle socket errors - reset joining state
  useEffect(() => {
    if (gameState.error) {
      setJoining(false);
      setError(gameState.error);
    }
  }, [gameState.error]);

  // Reset joining when successfully joined
  useEffect(() => {
    if (gameState.myNickname) {
      setJoining(false);
    }
  }, [gameState.myNickname]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [gameState.questionIndex]);

  // Handle join
  const handleJoin = useCallback(() => {
    if (!gameCode || gameCode.length !== 6) {
      setError('Please enter a valid 6-digit game code');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setError('');
    setJoining(true);
    joinGame(gameCode, nickname.trim(), user?._id);
  }, [gameCode, nickname, user, joinGame]);

  // Handle answer selection
  const handleAnswerClick = (answer) => {
    if (gameState.answerSubmitted || gameState.questionResults) return;
    setSelectedAnswer(answer);
    submitAnswer(answer);
  };

  // Handle leave
  const handleLeave = () => {
    disconnectFromGame();
    navigate('/');
  };

  // Join Screen
  if (!gameState.myNickname) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Gamepad2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Join Game</h1>
            <p className="text-muted-foreground">Enter the game code to play</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Game Code Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Game PIN
              </label>
              <input
                type="text"
                maxLength={6}
                value={gameCode}
                onChange={(e) => {
                  setGameCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-4 text-2xl text-center font-mono tracking-widest bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nickname
              </label>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="Enter your nickname"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={joining || gameCode.length !== 6 || !nickname.trim()}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Game'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby - Waiting for game to start
  if (gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              You're in!
            </h2>
            <p className="text-muted-foreground mb-6">
              Waiting for the host to start the game...
            </p>

            <div className="bg-muted rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Playing as</p>
              <p className="text-xl font-bold text-primary">
                {gameState.myNickname}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{gameState.quizTitle || 'Quiz Game'}</span>
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="mt-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>
    );
  }

  // Playing - Answer questions (self-paced)
  if (gameState.status === 'playing') {
    const question = gameState.currentQuestion;
    const colors = [
      { bg: 'bg-red-500', hover: 'hover:bg-red-600' },
      { bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
      { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
      { bg: 'bg-green-500', hover: 'hover:bg-green-600' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Question {gameState.questionIndex + 1} of {gameState.totalQuestions}
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-bold">{gameState.myScore || 0}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full mb-6">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${((gameState.questionIndex + 1) / gameState.totalQuestions) * 100}%`,
            }}
          ></div>
        </div>

        {/* Previous answer feedback */}
        {gameState.previousAnswer && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            gameState.previousAnswer.wasCorrect 
              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
              : 'bg-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            {gameState.previousAnswer.wasCorrect 
              ? `✓ Correct! +${gameState.previousAnswer.pointsEarned} points` 
              : `✗ Wrong! Answer: ${gameState.previousAnswer.correctAnswer}`}
          </div>
        )}

        {/* Question */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground text-center">
            {question?.questionText}
          </h2>
        </div>

        {/* Answer Options */}
        {!gameState.answerSubmitted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {question?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
                className={`${colors[index % 4].bg} ${colors[index % 4].hover} 
                  text-white font-semibold text-lg p-6 rounded-xl transition-all 
                  transform hover:scale-[1.02] active:scale-[0.98]
                  ${selectedAnswer === option ? 'ring-4 ring-white' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading next question...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Waiting for others to finish
  if (gameState.status === 'waiting-for-others') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">You finished!</h2>
          
          {gameState.myStats && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Score</p>
                  <p className="text-2xl font-bold text-primary">{gameState.myScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Correct</p>
                  <p className="text-2xl font-bold text-foreground">
                    {gameState.myStats.correctAnswers}/{gameState.myStats.totalQuestions}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-muted-foreground">
            Waiting for other players...
            {gameState.finishedCount && (
              <span className="block mt-2 font-medium">
                {gameState.finishedCount}/{gameState.totalPlayers} finished
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Game Over
  if (gameState.status === 'finished') {
    const myRank =
      gameState.leaderboard.findIndex(
        (p) => p.odickname === gameState.myNickname
      ) + 1;

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Game Over!</h1>

          {/* My Result */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <p className="text-muted-foreground mb-1">Your Rank</p>
            <p className="text-5xl font-bold text-primary mb-2">#{myRank}</p>
            <p className="text-muted-foreground mb-1">Final Score</p>
            <p className="text-2xl font-bold text-foreground">
              {gameState.myScore}
            </p>
          </div>

          {/* Top 3 */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Top Players</h3>
            <div className="space-y-2">
              {gameState.leaderboard.slice(0, 5).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    player.odickname === gameState.myNickname
                      ? 'bg-primary/20'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gray-300 text-gray-800'
                          : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-muted-foreground/20'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={
                        player.odickname === gameState.myNickname
                          ? 'font-bold text-primary'
                          : ''
                      }
                    >
                      {player.odickname}
                    </span>
                  </div>
                  <span className="font-medium">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Paused (host disconnected)
  if (gameState.status === 'paused') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Game Paused
          </h2>
          <p className="text-muted-foreground mb-4">
            Waiting for host to reconnect...
          </p>
          <button
            onClick={handleLeave}
            className="text-primary hover:underline"
          >
            Leave Game
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PlayGame;
