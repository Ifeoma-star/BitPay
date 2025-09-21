import mongoose from 'mongoose';

interface IChallenge {
  address: string;
  challenge: string;
  type: 'connection' | 'payment';
  expiresAt: Date;
  paymentId?: string;
  amount?: number;
}

const ChallengeSchema = new mongoose.Schema<IChallenge>({
  address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  challenge: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['connection', 'payment'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number
  }
}, {
  timestamps: true
});

export const Challenge = mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);
export type { IChallenge };