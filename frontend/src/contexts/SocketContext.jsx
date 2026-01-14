// src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState({
    gameCode: null,
    status: null, // 'lobby', 'playing', 'showing-results', 'finished'
    isHost: false,
    participants: [],
    currentQuestion: null,
    questionIndex: -1,
    totalQuestions: 0,
    leaderboard: [],
    myScore: 0,
    myNickname: null,
    quizTitle: null,
    answerSubmitted: false,
    questionResults: null,
    error: null,
  });

  // Connect to game namespace
  const connectToGame = useCallback(() => {
    if (socket) return socket;

    const newSocket = io(`${SOCKET_URL}/game`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('🎮 Connected to game server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🎮 Disconnected from game server');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('🎮 Socket error:', error);
      // Reset game state on error
      setGameState((prev) => ({
        ...prev,
        error: error.message || 'An error occurred',
      }));
    });

    setSocket(newSocket);
    return newSocket;
  }, [socket]);

  // Disconnect from game
  const disconnectFromGame = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setGameState({
        gameCode: null,
        status: null,
        isHost: false,
        participants: [],
        currentQuestion: null,
        questionIndex: -1,
        totalQuestions: 0,
        leaderboard: [],
        myScore: 0,
        myNickname: null,
        quizTitle: null,
        answerSubmitted: false,
        questionResults: null,
        error: null,
      });
    }
  }, [socket]);

  // Setup event listeners when socket changes
  useEffect(() => {
    if (!socket) return;

    // Host events
    socket.on('game-created', (data) => {
      setGameState((prev) => ({
        ...prev,
        gameCode: data.gameCode,
        status: 'lobby',
        isHost: true,
        quizTitle: data.quiz?.title,
        totalQuestions: data.quiz?.totalQuestions,
      }));
    });

    // Player events
    socket.on('joined-game', (data) => {
      console.log('🎮 Received joined-game:', data);
      setGameState((prev) => ({
        ...prev,
        myNickname: data.odickname || data.nickname,
        quizTitle: data.quizTitle,
        status: 'lobby',
      }));
    });

    socket.on('player-joined', (data) => {
      console.log('🎮 Player joined:', data);
      setGameState((prev) => ({
        ...prev,
        participants: data.participants,
      }));
    });

    socket.on('player-left', (data) => {
      setGameState((prev) => ({
        ...prev,
        participants: prev.participants.filter(
          (p) => p.odickname !== data.odickname
        ),
      }));
    });

    // Game flow events
    socket.on('game-started', (data) => {
      setGameState((prev) => ({
        ...prev,
        status: 'playing',
        currentQuestion: data.question,
        questionIndex: data.question.index,
        totalQuestions: data.totalQuestions || data.question.totalQuestions,
        answerSubmitted: false,
        previousAnswer: null,
      }));
    });

    // Self-paced: next question after answering
    socket.on('next-question', (data) => {
      setGameState((prev) => ({
        ...prev,
        currentQuestion: data.question,
        questionIndex: data.question.index,
        answerSubmitted: false,
        previousAnswer: data.previousAnswer,
        myScore: data.totalScore,
      }));
    });

    // Player finished all questions
    socket.on('player-finished', (data) => {
      setGameState((prev) => ({
        ...prev,
        status: 'waiting-for-others',
        myScore: data.totalScore,
        myStats: {
          correctAnswers: data.answeredCorrectly,
          totalQuestions: data.totalQuestions,
          timeTaken: data.timeTaken,
        },
      }));
    });

    // Progress update (how many finished)
    socket.on('player-progress', (data) => {
      setGameState((prev) => ({
        ...prev,
        finishedCount: data.finishedCount,
        totalPlayers: data.totalPlayers,
      }));
    });

    socket.on('game-ended', (data) => {
      setGameState((prev) => ({
        ...prev,
        status: 'finished',
        leaderboard: data.leaderboard,
      }));
    });

    socket.on('host-disconnected', () => {
      setGameState((prev) => ({
        ...prev,
        status: 'paused',
      }));
    });

    return () => {
      socket.off('game-created');
      socket.off('joined-game');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('next-question');
      socket.off('player-finished');
      socket.off('player-progress');
      socket.off('game-ended');
      socket.off('host-disconnected');
    };
  }, [socket]);

  // Game actions
  const createGame = useCallback(
    (quizId, hostId, settings = {}) => {
      const gameSocket = connectToGame();
      gameSocket.emit('create-game', { quizId, hostId, settings });
    },
    [connectToGame]
  );

  const joinGame = useCallback(
    (gameCode, nickname, userId = null) => {
      const gameSocket = connectToGame();
      console.log('🎮 Emitting join-game:', { gameCode, nickname, userId });
      setGameState((prev) => ({ ...prev, gameCode, error: null }));
      gameSocket.emit('join-game', { gameCode, odickname: nickname, userId });
    },
    [connectToGame]
  );

  const startGame = useCallback((hostNickname) => {
    if (socket && gameState.gameCode) {
      socket.emit('start-game', { gameCode: gameState.gameCode, hostNickname });
    }
  }, [socket, gameState.gameCode]);

  const submitAnswer = useCallback(
    (answer) => {
      if (socket && gameState.gameCode && !gameState.answerSubmitted) {
        socket.emit('submit-answer', {
          gameCode: gameState.gameCode,
          questionIndex: gameState.questionIndex,
          answer,
        });
        // Immediately mark as submitted for UI feedback
        setGameState((prev) => ({ ...prev, answerSubmitted: true }));
      }
    },
    [socket, gameState.gameCode, gameState.questionIndex, gameState.answerSubmitted]
  );

  const showQuestionResults = useCallback(() => {
    if (socket && gameState.gameCode) {
      socket.emit('show-question-results', { gameCode: gameState.gameCode });
    }
  }, [socket, gameState.gameCode]);

  const nextQuestion = useCallback(() => {
    if (socket && gameState.gameCode) {
      socket.emit('next-question', { gameCode: gameState.gameCode });
    }
  }, [socket, gameState.gameCode]);

  const endGame = useCallback(() => {
    if (socket && gameState.gameCode) {
      socket.emit('end-game', { gameCode: gameState.gameCode });
    }
  }, [socket, gameState.gameCode]);

  const value = {
    socket,
    isConnected,
    gameState,
    connectToGame,
    disconnectFromGame,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    showQuestionResults,
    nextQuestion,
    endGame,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
