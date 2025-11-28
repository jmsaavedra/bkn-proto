import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// TypeScript interfaces
interface AssetItem {
  type: 'player' | 'pick' | 'cash';
  playerId?: Types.ObjectId;
  pickDetails?: {
    year: number;
    round: number;
    originalTeam: string;
    protections?: string;
  };
  cashAmount?: number;
}

interface TeamInvolvement {
  teamId: Types.ObjectId;
  role: 'acquired' | 'traded' | 'signed' | 'waived';
  assetsIn: AssetItem[];
  assetsOut: AssetItem[];
  salaryIn: number;
  salaryOut: number;
  netCapImpact: number;
}

interface TransactionDetails {
  headline: string;
  description: string;
  source: string;
  sourceUrl?: string;
}

interface HistoricalComparison {
  transactionId: Types.ObjectId;
  similarityScore: number;
  outcome?: string;
}

interface Evaluation {
  surplusValue: number;
  winNowScore: number;
  rebuildScore: number;
  capFlexibilityImpact: number;
  riskScore: number;
  historicalComparisons: HistoricalComparison[];
  compositeScore: number;
}

export interface ITransaction extends Document {
  type: 'TRADE' | 'SIGNING' | 'WAIVER' | 'EXTENSION' | 'TWO_WAY' | 'TEN_DAY' | 'DRAFT_PICK' | 'BUYOUT' | 'SIGN_AND_TRADE';
  date: Date;
  season: string;
  teams: TeamInvolvement[];
  players: Types.ObjectId[];
  contracts: Types.ObjectId[];
  details: TransactionDetails;
  evaluation: Evaluation;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const AssetItemSchema = new Schema<AssetItem>(
  {
    type: {
      type: String,
      enum: ['player', 'pick', 'cash'],
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
    },
    pickDetails: {
      year: {
        type: Number,
      },
      round: {
        type: Number,
        min: 1,
        max: 2,
      },
      originalTeam: {
        type: String,
      },
      protections: {
        type: String,
      },
    },
    cashAmount: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const TeamInvolvementSchema = new Schema<TeamInvolvement>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    role: {
      type: String,
      enum: ['acquired', 'traded', 'signed', 'waived'],
      required: true,
    },
    assetsIn: [AssetItemSchema],
    assetsOut: [AssetItemSchema],
    salaryIn: {
      type: Number,
      default: 0,
    },
    salaryOut: {
      type: Number,
      default: 0,
    },
    netCapImpact: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const HistoricalComparisonSchema = new Schema<HistoricalComparison>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    outcome: {
      type: String,
    },
  },
  { _id: false }
);

const EvaluationSchema = new Schema<Evaluation>(
  {
    surplusValue: {
      type: Number,
      default: 0,
    },
    winNowScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rebuildScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    capFlexibilityImpact: {
      type: Number,
      default: 0,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    historicalComparisons: [HistoricalComparisonSchema],
    compositeScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

// Main Transaction schema
const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ['TRADE', 'SIGNING', 'WAIVER', 'EXTENSION', 'TWO_WAY', 'TEN_DAY', 'DRAFT_PICK', 'BUYOUT', 'SIGN_AND_TRADE'],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    season: {
      type: String,
      required: true,
      index: true,
    },
    teams: [TeamInvolvementSchema],
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    contracts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Contract',
      },
    ],
    details: {
      headline: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      source: {
        type: String,
        required: true,
      },
      sourceUrl: {
        type: String,
      },
    },
    evaluation: {
      type: EvaluationSchema,
      default: () => ({
        surplusValue: 0,
        winNowScore: 0,
        rebuildScore: 0,
        capFlexibilityImpact: 0,
        riskScore: 0,
        historicalComparisons: [],
        compositeScore: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ season: 1, date: -1 });
TransactionSchema.index({ 'teams.teamId': 1 });
TransactionSchema.index({ players: 1 });
TransactionSchema.index({ 'evaluation.compositeScore': -1 });
TransactionSchema.index({ date: -1 });

// Text index for search
TransactionSchema.index({
  'details.headline': 'text',
  'details.description': 'text',
});

// Prevent model recompilation in development
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
