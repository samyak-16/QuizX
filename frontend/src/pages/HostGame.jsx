// src/pages/HostGame.jsx - Host is also a player in self-paced mode
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Play,
  Trophy,
  Copy,
  Check,
  X,
  Loader2,
} from 'lucide-react';

const HostGame = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    gameState,
    createGame,
    startGame,
    submitAnswer,
    disconnectFromGame,
  } = useSocket();

  const [copied, setCopied] = useState(false);
  const [gameCreated, setGameCreated] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Create game on mount (only once)
  useEffect(() => {
    if (quizId && user?._id && !gameState.gameCode && !gameCreated) {
      if (quizId.length === 24 && /^[a-fA-F0-9]+$/.test(quizId)) {
        setGameCreated(true);
        createGame(quizId, user._id, {});
      }
    }
  }, [quizId, user, createGame, gameState.gameCode, gameCreated]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [gameState.questionIndex]);

  // Copy game code to clipboard
  const copyGameCode = useCallback(() => {
    if (gameState.gameCode) {
      navigator.clipboard.writeText(gameState.gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [gameState.gameCode]);

  // Handle starting the game (host plays too)
  const handleStartGame = useCallback(() => {
    const hostNickname = user?.name || 'Host';
    startGame(hostNickname);
  }, [startGame, user]);

  // Handle answer selection
  const handleAnswerClick = (answer) => {
    if (gameState.answerSubmitted) return;
    setSelectedAnswer(answer);
    submitAnswer(answer);
  };

  // Handle leaving
  const handleLeave = useCallback(() => {
    if (confirm('Are you sure you want to end this game?')) {
      disconnectFromGame();
      navigate('/dashboard');
    }
  }, [disconnectFromGame, navigate]);

  // Error state
  if (gameState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Creating Game</h2>
          <p className="text-muted-foreground mb-6">{gameState.error}</p>
          <button
            onClick={() => navigate('/my-quizzes')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to My Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!gameState.gameCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Creating game session...</p>
        </div>
      </div>
    );
  }

  // Lobby View - Waiting for players
  if (gameState.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {gameState.quizTitle || 'Quiz Game'}
            </h1>
            <button
              onClick={handleLeave}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Game Code */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center mb-8">
            <p className="text-muted-foreground mb-2">Share this code with players</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-6xl font-mono font-bold tracking-widest text-primary">
                {gameState.gameCode}
              </div>
              <button
                onClick={copyGameCode}
                className="p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Copy className="w-6 h-6 text-primary" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Go to <span className="font-semibold">/play</span> and enter the code
            </p>
          </div>

          {/* Participants */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Players Joined ({gameState.participants.length})
              </h2>
            </div>

            {gameState.participants.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Waiting for players to join... (You can also start solo!)
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gameState.participants.map((p, index) => (
                  <div
                    key={index}
                    className="bg-primary/10 rounded-lg p-3 text-center"
                  >
                    <span className="font-medium text-foreground">
                      {p.odickname}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Play className="w-6 h-6" />
            Start Game (You play too!)
          </button>
        </div>
      </div>
    );
  }

  // Playing View - Host answers questions too
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

  // Final Results
  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Game Over!</h1>
            <p className="text-muted-foreground">{gameState.quizTitle}</p>
          </div>

          {/* Leaderboard */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">Final Leaderboard</h2>
            </div>
            <div className="divide-y divide-border">
              {gameState.leaderboard?.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 ${
                    index === 0 ? 'bg-yellow-500/10' :
                    index === 1 ? 'bg-gray-300/10' :
                    index === 2 ? 'bg-orange-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{player.odickname}</span>
                  </div>
                  <span className="font-bold text-primary">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-6 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
};

export default HostGame;
