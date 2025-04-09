import mongoose, { Document, Schema, Types } from 'mongoose';


interface IPatternProgress {
  patternId: string;
  completed: boolean;
  lastAccessed: Date;
  viewCount: number; // How many times the user has viewed this pattern
}

interface IQuizAttempt {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timestamp: Date;
  patternTested: string; // The pattern related to this question
}

interface IDiagnosticAttempt {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timestamp: Date;
  patternTested: string; // The pattern related to this question
}

export interface IProgress extends Document {
  user: Types.ObjectId;
  patternsProgress: IPatternProgress[];
  quizAttempts: IQuizAttempt[];
  diagnosticAttempts: IDiagnosticAttempt[];
  quizScore: number;
  diagnosticScore: number;
  totalPatternsViewed: number;
  lastActive: Date;
  // Quiz related fields
  correctQuizCount: number; // Total number of correct quiz answers
  totalQuizAttempts: number; // Total number of quiz attempts
  // Diagnostic related fields
  diagnosticCompleted: boolean;
  lastDiagnosticAttempt: Date | null;
}

const patternProgressSchema = new Schema(
  {
    patternId: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    viewCount: {
      type: Number,
      default: 1
    }
  },
  { _id: false }
);

const quizAttemptSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    correct: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    patternTested: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const diagnosticAttemptSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    correct: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    patternTested: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      unique: true
    },
    patternsProgress: [patternProgressSchema],
    quizAttempts: [quizAttemptSchema],
    diagnosticAttempts: [diagnosticAttemptSchema],
    quizScore: {
      type: Number,
      default: 0
    },
    diagnosticScore: {
      type: Number,
      default: 0
    },
    totalPatternsViewed: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    // Quiz related fields
    correctQuizCount: {
      type: Number,
      default: 0
    },
    totalQuizAttempts: {
      type: Number,
      default: 0
    },
    // Diagnostic related fields
    diagnosticCompleted: {
      type: Boolean,
      default: false
    },
    lastDiagnosticAttempt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Progress = mongoose.model<IProgress>('Progress', progressSchema);

export default Progress;