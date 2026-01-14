// src/Models/dailyActivity.model.js
import mongoose from 'mongoose';

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    date: {
      type: String, // Format: "YYYY-MM-DD" for easy querying
      required: true,
    },

    // Quiz activity
    quizzesCompleted: { type: Number, default: 0 },
    quizzesCreated: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },

    // Multiplayer activity
    gamesHosted: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    multiplayerWins: { type: Number, default: 0 },

    // Gamification
    xpEarned: { type: Number, default: 0 },
    achievementsUnlocked: [{ type: String }], // Achievement IDs unlocked this day

    // Study time (in minutes)
    studyTimeMinutes: { type: Number, default: 0 },

    // Streak
    streakMaintained: { type: Boolean, default: false }, // Did user maintain streak today?
  },
  { timestamps: true }
);

// Compound index for efficient querying
dailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

// Get or create today's activity for a user
dailyActivitySchema.statics.getToday = async function (userId) {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  let activity = await this.findOne({ userId, date: today });

  if (!activity) {
    activity = await this.create({ userId, date: today });
  }

  return activity;
};

// Calculate streak for a user
dailyActivitySchema.statics.calculateStreak = async function (userId) {
  const activities = await this.find({ userId, streakMaintained: true })
    .sort({ date: -1 })
    .limit(365) // Max 1 year lookback
    .select('date');

  if (activities.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of activities) {
    const activityDate = new Date(activity.date);
    activityDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate - activityDate) / (1000 * 60 * 60 * 24)
    );

    // If first activity is not today or yesterday, streak is 0
    if (streak === 0 && diffDays > 1) {
      return 0;
    }

    // If there's a gap in dates, streak ends
    if (streak > 0 && diffDays > 1) {
      break;
    }

    streak++;
    currentDate = activityDate;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
};

// Increment activity counters
dailyActivitySchema.methods.incrementQuizCompleted = async function (
  questionsCount,
  correctCount,
  xp = 50
) {
  this.quizzesCompleted += 1;
  this.questionsAnswered += questionsCount;
  this.correctAnswers += correctCount;
  this.xpEarned += xp;
  this.streakMaintained = true;
  return this.save();
};

dailyActivitySchema.methods.incrementGamePlayed = async function (
  won = false,
  xp = 30
) {
  this.gamesPlayed += 1;
  if (won) this.multiplayerWins += 1;
  this.xpEarned += xp;
  this.streakMaintained = true;
  return this.save();
};

const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);
export { DailyActivity };
