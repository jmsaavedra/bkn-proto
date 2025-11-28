import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// TypeScript interface for Player document
export interface IPlayer extends Document {
  nbaId: number;
  name: {
    full: string;
    first: string;
    last: string;
  };
  position: string;
  height: number;
  weight: number;
  birthDate: Date;
  age: number;
  country: string;
  draft: {
    year: number;
    round: number;
    pick: number;
    team: string;
  };
  currentTeamId: Types.ObjectId;
  status: 'active' | 'inactive' | 'retired' | 'gleague';
  trajectory: {
    peakAge: number;
    careerArc: 'ascending' | 'peak' | 'declining' | 'unknown';
    injuryHistory: Array<{
      season: string;
      type: string;
      gamesOut: number;
    }>;
    seasonStats: Array<{
      season: string;
      team: string;
      gamesPlayed: number;
      mpg: number;
      ppg: number;
      rpg: number;
      apg: number;
      per: number;
      ws: number;
      vorp: number;
      bpm: number;
    }>;
  };
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const PlayerSchema = new Schema<IPlayer>(
  {
    nbaId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      full: {
        type: String,
        required: true,
      },
      first: {
        type: String,
        required: true,
      },
      last: {
        type: String,
        required: true,
      },
    },
    position: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'USA',
    },
    draft: {
      year: {
        type: Number,
        required: true,
      },
      round: {
        type: Number,
        required: true,
      },
      pick: {
        type: Number,
        required: true,
      },
      team: {
        type: String,
        required: true,
      },
    },
    currentTeamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'retired', 'gleague'],
      default: 'active',
    },
    trajectory: {
      peakAge: {
        type: Number,
        default: 27,
      },
      careerArc: {
        type: String,
        enum: ['ascending', 'peak', 'declining', 'unknown'],
        default: 'unknown',
      },
      injuryHistory: [
        {
          season: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
          },
          gamesOut: {
            type: Number,
            required: true,
          },
        },
      ],
      seasonStats: [
        {
          season: {
            type: String,
            required: true,
          },
          team: {
            type: String,
            required: true,
          },
          gamesPlayed: {
            type: Number,
            required: true,
          },
          mpg: {
            type: Number,
            required: true,
          },
          ppg: {
            type: Number,
            required: true,
          },
          rpg: {
            type: Number,
            required: true,
          },
          apg: {
            type: Number,
            required: true,
          },
          per: {
            type: Number,
            required: true,
          },
          ws: {
            type: Number,
            required: true,
          },
          vorp: {
            type: Number,
            required: true,
          },
          bpm: {
            type: Number,
            required: true,
          },
        },
      ],
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
PlayerSchema.index({ 'name.last': 1, 'name.first': 1 });
PlayerSchema.index({ currentTeamId: 1 });
PlayerSchema.index({ status: 1 });
PlayerSchema.index({ position: 1 });

// Prevent model recompilation in development
const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
