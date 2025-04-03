import mongoose, { Document, Schema } from 'mongoose';

interface IExample extends Document {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
}

export interface IPattern extends Document {
  id: string;
  title: string;
  description: string;
  icon: string;
  useCases: string[];
  algorithmicBackground: string;
  examples: IExample[];
}

const exampleSchema = new Schema<IExample>(
  {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    },
    code: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const patternSchema = new Schema<IPattern>(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    useCases: [{
      type: String,
      required: true
    }],
    algorithmicBackground: {
      type: String,
      required: true
    },
    examples: [exampleSchema]
  },
  {
    timestamps: true
  }
);

const Pattern = mongoose.model<IPattern>('Pattern', patternSchema);

export default Pattern;