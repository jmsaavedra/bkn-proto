import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// TypeScript interface for Contract document
export interface IContract extends Document {
  playerId: Types.ObjectId;
  teamId: Types.ObjectId;
  type: 'standard' | 'two-way' | 'ten-day' | 'max' | 'supermax' | 'rookie' | 'veteran-min' | 'mid-level' | 'bi-annual';
  startSeason: string;
  endSeason: string;
  years: number;
  totalValue: number;
  seasons: Array<{
    season: string;
    salary: number;
    capHit: number;
    deadCap: number;
    guaranteed: number;
    bonuses?: number;
  }>;
  options: {
    playerOption?: {
      season: string;
      value: number;
    };
    teamOption?: {
      season: string;
      value: number;
    };
    earlyTermination?: {
      season: string;
    };
  };
  tradeKicker: number;
  noTradeClause: boolean;
  tradeRestriction?: string;
  signingType: 'free-agent' | 'extension' | 'rookie' | 'trade';
  signedDate: Date;
  status: 'active' | 'completed' | 'waived' | 'traded';
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const ContractSchema = new Schema<IContract>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['standard', 'two-way', 'ten-day', 'max', 'supermax', 'rookie', 'veteran-min', 'mid-level', 'bi-annual'],
      required: true,
    },
    startSeason: {
      type: String,
      required: true,
    },
    endSeason: {
      type: String,
      required: true,
    },
    years: {
      type: Number,
      required: true,
      min: 1,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    seasons: [
      {
        season: {
          type: String,
          required: true,
        },
        salary: {
          type: Number,
          required: true,
          min: 0,
        },
        capHit: {
          type: Number,
          required: true,
          min: 0,
        },
        deadCap: {
          type: Number,
          default: 0,
        },
        guaranteed: {
          type: Number,
          required: true,
          min: 0,
        },
        bonuses: {
          type: Number,
          default: 0,
        },
      },
    ],
    options: {
      playerOption: {
        season: String,
        value: Number,
      },
      teamOption: {
        season: String,
        value: Number,
      },
      earlyTermination: {
        season: String,
      },
    },
    tradeKicker: {
      type: Number,
      default: 0,
      min: 0,
      max: 15,
    },
    noTradeClause: {
      type: Boolean,
      default: false,
    },
    tradeRestriction: {
      type: String,
    },
    signingType: {
      type: String,
      enum: ['free-agent', 'extension', 'rookie', 'trade'],
      required: true,
    },
    signedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'waived', 'traded'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
ContractSchema.index({ playerId: 1, status: 1 });
ContractSchema.index({ teamId: 1, status: 1 });
ContractSchema.index({ startSeason: 1, endSeason: 1 });
ContractSchema.index({ status: 1 });

// Prevent model recompilation in development
const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;
