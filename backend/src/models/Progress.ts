import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IQuizQuestion } from './Quiz';
import { IPattern } from './Pattern';

interface IPatternProgress {
  patternId: string;
  completed: boolean;
  lastAccessed: Date;
}

interface IQuizAttempt {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  timestamp: Date;
}

export interface IProgress extends Document {
  user: Types.ObjectId;  // Changed this line to use Types.ObjectId
  patternsProgress: IPatternProgress[];
  quizAttempts: IQuizAttempt[];
  quizScore: number;
  totalPatternsViewed: number;
  lastActive: Date;
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
    }
  },
  { _id: false }
);

const progressSchema = new Schema<IProgress>(
  {
    user: {
      type: Schema.Types.ObjectId as any,  // Added 'as any' to suppress type error
      ref: 'User',
      required: true,
      unique: true
    },
    patternsProgress: [patternProgressSchema],
    quizAttempts: [quizAttemptSchema],
    quizScore: {
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
    }
  },
  {
    timestamps: true
  }
);

const Progress = mongoose.model<IProgress>('Progress', progressSchema);

export default Progress;