import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionId: { 
    type: String, 
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  questionText: { 
    type: String, 
    required: true, 
    trim: true 
  },
  questionType: { 
    type: String, 
    enum: ['multiple-choice', 'true-false', 'fill-in-blank'],
    default: 'multiple-choice'
  },
  options: [{
    optionId: String,
    optionText: String,
    isCorrect: Boolean
  }],
  correctAnswer: { 
    type: String, 
    required: true 
  },
  explanation: { 
    type: String, 
    trim: true 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: { 
    type: Number, 
    default: 1,
    min: 1 
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  chapterId: { 
    type: String, 
    required: true,
    index: true
  },
  lectureId: { 
    type: String, 
    index: true
  },
  quizTitle: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quizDescription: { 
    type: String, 
    trim: true 
  },
  questions: [questionSchema],
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  passingScore: { 
    type: Number, 
    default: 60,
    min: 0,
    max: 100
  },
  timeLimit: { 
    type: Number,  // in minutes
    default: null 
  },
  attemptsAllowed: { 
    type: Number, 
    default: -1  // -1 = unlimited
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  generatedBy: { 
    type: String, 
    enum: ['ai', 'manual'],
    default: 'ai'
  },
  aiModel: { 
    type: String,  // 'gpt-4', 'gemini-pro', etc.
    default: null
  },
  createdBy: { 
    type: String, 
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  minimize: false
});

// Compound indexes
quizSchema.index({ courseId: 1, chapterId: 1 });
quizSchema.index({ courseId: 1, lectureId: 1 });
quizSchema.index({ createdBy: 1, createdAt: -1 });

// Calculate total points before saving
quizSchema.pre('save', function () {
  this.totalPoints = this.questions.reduce(
    (sum, q) => sum + (q.points || 1),
    0
  );
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;