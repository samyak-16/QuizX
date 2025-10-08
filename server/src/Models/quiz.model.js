// src/models/quiz.model.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // 4 options
  correctAnswer: { type: String, required: true }, // can store the text or index
  explanation: { type: String }, // optional: why the answer is correct
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Physics Chapter 1 Quiz"
    sourceType: {
      type: String,
      enum: ['pdf', 'youtube'],
      required: true,
    },
    youtubeUrl: { type: String }, // for YT link
    pdfUrl: { type: String }, // (pdf link - cloudinary / s3),
    pdfPath: { type: String }, //Temp local path where pdf gets stored initially , usefull for inngest function during event call,
    youtubeMp3Path: {
      type: String,
    }, //Temp local path where audio of the youtube Video gets stored initially , usefull for inngest function during event call, and in error handling
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [questionSchema],
    totalQuestions: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      // Example Flow With Status

      // User uploads a PDF → status = "pending"

      // Backend starts transcription → update status = "processing"

      // AI generates questions → still status = "processing"

      // Quiz saved successfully → update status = "completed"

      // If any error occurs → status = "failed"
    },
    generatedAt: { type: Date, default: Date.now }, //After status completed
  },
  { timestamps: true }
);

quizSchema.pre('save', function (next) {
  this.totalQuestions = this.questions.length;
  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);
export { Quiz };
