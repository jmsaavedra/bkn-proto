import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for SalaryCap document
export interface ISalaryCap extends Document {
  season: string;
  salaryCap: number;
  luxuryTax: number;
  firstApron: number | null;
  secondApron: number | null;
  bri: number;
  playerShare: number;
  minimumSalary: {
    years0: number;
    years1: number;
    years2: number;
    years3: number;
    years4: number;
    years5: number;
    years6: number;
    years7: number;
    years8: number;
    years9: number;
    years10Plus: number;
  };
  maxSalary: {
    years0to6: {
      percentage: number;
      value: number;
    };
    years7to9: {
      percentage: number;
      value: number;
    };
    years10Plus: {
      percentage: number;
      value: number;
    };
  };
  exceptions: {
    midLevel: number;
    midLevelTaxpayer: number;
    biAnnual: number;
    minimumRoster: number;
  };
  createdAt: Date;
}

// Mongoose schema
const SalaryCapSchema = new Schema<ISalaryCap>(
  {
    season: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    salaryCap: {
      type: Number,
      required: true,
    },
    luxuryTax: {
      type: Number,
      required: true,
    },
    firstApron: {
      type: Number,
      default: null,
    },
    secondApron: {
      type: Number,
      default: null,
    },
    bri: {
      type: Number,
      required: true,
    },
    playerShare: {
      type: Number,
      required: true,
      default: 50,
    },
    minimumSalary: {
      years0: {
        type: Number,
        required: true,
      },
      years1: {
        type: Number,
        required: true,
      },
      years2: {
        type: Number,
        required: true,
      },
      years3: {
        type: Number,
        required: true,
      },
      years4: {
        type: Number,
        required: true,
      },
      years5: {
        type: Number,
        required: true,
      },
      years6: {
        type: Number,
        required: true,
      },
      years7: {
        type: Number,
        required: true,
      },
      years8: {
        type: Number,
        required: true,
      },
      years9: {
        type: Number,
        required: true,
      },
      years10Plus: {
        type: Number,
        required: true,
      },
    },
    maxSalary: {
      years0to6: {
        percentage: {
          type: Number,
          required: true,
          default: 25,
        },
        value: {
          type: Number,
          required: true,
        },
      },
      years7to9: {
        percentage: {
          type: Number,
          required: true,
          default: 30,
        },
        value: {
          type: Number,
          required: true,
        },
      },
      years10Plus: {
        percentage: {
          type: Number,
          required: true,
          default: 35,
        },
        value: {
          type: Number,
          required: true,
        },
      },
    },
    exceptions: {
      midLevel: {
        type: Number,
        required: true,
      },
      midLevelTaxpayer: {
        type: Number,
        required: true,
      },
      biAnnual: {
        type: Number,
        required: true,
      },
      minimumRoster: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Note: season is already indexed via unique: true in schema definition

// Prevent model recompilation in development
const SalaryCap: Model<ISalaryCap> = mongoose.models.SalaryCap || mongoose.model<ISalaryCap>('SalaryCap', SalaryCapSchema);

export default SalaryCap;
