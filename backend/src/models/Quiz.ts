import mongoose, { Document, Schema } from 'mongoose';

interface IQuizOption {
  id: string;
  pattern: string;
}

export interface IQuizQuestion extends Document {
  id: string;
  question: string;
  description: string;
  options: IQuizOption[];
  correctAnswer: string;
  explanation: string;
}

const quizOptionSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    pattern: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    question: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    options: [quizOptionSchema],
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', quizQuestionSchema);

export default QuizQuestion;