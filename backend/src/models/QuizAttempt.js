import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, default: 0 }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  answers: [answerSchema],
  score: { 
    type: Number, 
    required: true,
    min: 0 
  },
  percentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  passed: { 
    type: Boolean, 
    required: true 
  },
  timeSpent: { 
    type: Number,  // in seconds
    default: 0 
  },
  attemptNumber: { 
    type: Number, 
    required: true,
    min: 1
  },
  startedAt: { 
    type: Date, 
    required: true 
  },
  completedAt: { 
    type: Date, 
    required: true,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Compound indexes
quizAttemptSchema.index({ userId: 1, quizId: 1 });
quizAttemptSchema.index({ userId: 1, courseId: 1 });
quizAttemptSchema.index({ quizId: 1, createdAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;