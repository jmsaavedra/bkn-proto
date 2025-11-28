import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for EvaluationWeights document
export interface IEvaluationWeights extends Document {
  name: string;
  isDefault: boolean;
  weights: {
    surplusValue: number;
    winNow: number;
    rebuild: number;
    capFlexibility: number;
    risk: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const EvaluationWeightsSchema = new Schema<IEvaluationWeights>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    weights: {
      surplusValue: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.25,
      },
      winNow: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.25,
      },
      rebuild: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.15,
      },
      capFlexibility: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.20,
      },
      risk: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.15,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Validation: weights must sum to 1.0
EvaluationWeightsSchema.pre('save', function (next) {
  const sum =
    this.weights.surplusValue +
    this.weights.winNow +
    this.weights.rebuild +
    this.weights.capFlexibility +
    this.weights.risk;

  if (Math.abs(sum - 1.0) > 0.0001) {
    next(new Error('Weights must sum to 1.0'));
  } else {
    next();
  }
});

// Ensure only one default configuration
EvaluationWeightsSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.models.EvaluationWeights.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Index
EvaluationWeightsSchema.index({ isDefault: 1 });

// Prevent model recompilation in development
const EvaluationWeights: Model<IEvaluationWeights> =
  mongoose.models.EvaluationWeights || mongoose.model<IEvaluationWeights>('EvaluationWeights', EvaluationWeightsSchema);

export default EvaluationWeights;
