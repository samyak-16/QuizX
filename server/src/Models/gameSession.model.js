// src/Models/gameSession.model.js
import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  odickname: { type: String, required: true },
  odocketId: { type: String }, // Socket connection ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional - if logged in
  score: { type: Number, default: 0 },
  answers: [
    {
      questionIndex: { type: Number, required: true },
      answer: { type: String },
      timeMs: { type: Number }, // Response time in milliseconds
      isCorrect: { type: Boolean },
      pointsEarned: { type: Number, default: 0 },
    },
  ],
  joinedAt: { type: Date, default: Date.now },
});

const gameSessionSchema = new mongoose.Schema(
  {
    gameCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    }, // 6-digit PIN like "482951"

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },

    status: {
      type: String,
      enum: ['lobby', 'playing', 'paused', 'showing-results', 'finished'],
      default: 'lobby',
    },

    currentQuestionIndex: { type: Number, default: -1 }, // -1 means not started

    participants: [participantSchema],

    settings: {
      questionTimer: { type: Number, default: 20 }, // Seconds per question
      pointsPerQuestion: { type: Number, default: 1000 }, // Max points
      showLeaderboardAfterEach: { type: Boolean, default: true },
      allowLateJoin: { type: Boolean, default: false }, // Join after game started
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
    },

    questionStartedAt: { type: Date }, // When current question started (for timing)

    startedAt: { type: Date },
    endedAt: { type: Date },

    // Stats
    totalParticipants: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Generate unique 6-digit game code
gameSessionSchema.statics.generateGameCode = async function () {
  let code;
  let exists = true;

  while (exists) {
    // Generate random 6-digit number
    code = Math.floor(100000 + Math.random() * 900000).toString();
    exists = await this.findOne({ gameCode: code, status: { $ne: 'finished' } });
  }

  return code;
};

// Calculate score based on correctness and speed
gameSessionSchema.statics.calculateScore = function (
  isCorrect,
  responseTimeMs,
  questionTimerMs,
  maxPoints = 1000
) {
  if (!isCorrect) return 0;

  // Faster answers get more points
  const timeBonus = Math.max(0, (questionTimerMs - responseTimeMs) / questionTimerMs);
  return Math.round(maxPoints * (0.5 + 0.5 * timeBonus)); // Min 50% of max if correct
};

// Get leaderboard
gameSessionSchema.methods.getLeaderboard = function (limit = 10) {
  return this.participants
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p, index) => ({
      rank: index + 1,
      odickname: p.odickname,
      score: p.score,
      odocketId: p.odocketId,
    }));
};

// Update stats before saving
gameSessionSchema.pre('save', function (next) {
  this.totalParticipants = this.participants.length;

  if (this.participants.length > 0) {
    const totalScore = this.participants.reduce((sum, p) => sum + p.score, 0);
    this.averageScore = Math.round(totalScore / this.participants.length);
  }

  next();
});

const GameSession = mongoose.model('GameSession', gameSessionSchema);
export { GameSession };
