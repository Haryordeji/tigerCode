import mongoose, { Document, Schema } from 'mongoose';

interface IDiagnosticOption {
  id: string;
  pattern: string;
}

export interface IDiagnosticQuestion extends Document {
  id: string;
  question: string;
  description: string;
  options: IDiagnosticOption[];
  correctAnswer: string;
  explanation: string;
}

const diagnosticOptionSchema = new Schema(
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

const diagnosticQuestionSchema = new Schema<IDiagnosticQuestion>(
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
    options: [diagnosticOptionSchema],
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

const DiagnosticQuestion = mongoose.model<IDiagnosticQuestion>('DiagnosticQuestion', diagnosticQuestionSchema);

export default DiagnosticQuestion;