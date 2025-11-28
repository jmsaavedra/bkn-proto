import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for Team document
export interface ITeam extends Document {
  nbaId: number;
  name: string;
  city: string;
  fullName: string;
  abbreviation: string;
  conference: 'East' | 'West';
  division: string;
  capSheet: {
    season: string;
    totalSalary: number;
    capSpace: number;
    luxuryTaxSpace: number;
    apronRoom: number;
    projectedTax: number;
    draftPicks: Array<{
      year: number;
      round: number;
      originalTeam: string;
      status: 'owned' | 'owed' | 'conditional';
      protections?: string;
    }>;
  };
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const TeamSchema = new Schema<ITeam>(
  {
    nbaId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    conference: {
      type: String,
      enum: ['East', 'West'],
      required: true,
    },
    division: {
      type: String,
      required: true,
    },
    capSheet: {
      season: {
        type: String,
        required: true,
      },
      totalSalary: {
        type: Number,
        default: 0,
      },
      capSpace: {
        type: Number,
        default: 0,
      },
      luxuryTaxSpace: {
        type: Number,
        default: 0,
      },
      apronRoom: {
        type: Number,
        default: 0,
      },
      projectedTax: {
        type: Number,
        default: 0,
      },
      draftPicks: [
        {
          year: {
            type: Number,
            required: true,
          },
          round: {
            type: Number,
            required: true,
            min: 1,
            max: 2,
          },
          originalTeam: {
            type: String,
            required: true,
          },
          status: {
            type: String,
            enum: ['owned', 'owed', 'conditional'],
            required: true,
          },
          protections: String,
        },
      ],
    },
    logoUrl: {
      type: String,
      required: true,
    },
    primaryColor: {
      type: String,
      required: true,
    },
    secondaryColor: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries (abbreviation already indexed via unique: true)
TeamSchema.index({ conference: 1 });
TeamSchema.index({ division: 1 });

// Prevent model recompilation in development
const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
