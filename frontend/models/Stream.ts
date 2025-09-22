import mongoose from 'mongoose';

export interface IStream {
  _id?: string;
  streamId: string; // Unique identifier for the stream
  sender: string; // Wallet address of sender
  recipient: string; // Wallet address of recipient
  totalAmount: string; // Total amount in microSTX (stored as string to handle BigInt)
  vestedAmount: string; // Amount vested so far in microSTX
  withdrawnAmount: string; // Amount withdrawn so far in microSTX
  startBlock: number; // Start block number
  endBlock: number; // End block number
  currentBlock?: number; // Current block for calculations
  isActive: boolean; // Whether stream is active
  isCancelled: boolean; // Whether stream was cancelled
  description?: string; // Optional description
  contractAddress: string; // Smart contract address
  transactionId?: string; // Creation transaction ID
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBlock?: number; // Last block when stream was updated
}

const streamSchema = new mongoose.Schema<IStream>({
  streamId: {
    type: String,
    required: true,
    unique: true,
  },
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: String,
    required: true,
  },
  vestedAmount: {
    type: String,
    default: '0',
  },
  withdrawnAmount: {
    type: String,
    default: '0',
  },
  startBlock: {
    type: Number,
    required: true,
  },
  endBlock: {
    type: Number,
    required: true,
  },
  currentBlock: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isCancelled: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
  },
  lastUpdatedBlock: {
    type: Number,
  },
}, {
  timestamps: true,
});

// Indexes for performance (streamId unique index already defined in schema)
streamSchema.index({ sender: 1 });
streamSchema.index({ recipient: 1 });
streamSchema.index({ isActive: 1 });
streamSchema.index({ isCancelled: 1 });
streamSchema.index({ startBlock: 1 });
streamSchema.index({ endBlock: 1 });
streamSchema.index({ createdAt: 1 });

// Compound indexes for common queries
streamSchema.index({ sender: 1, isActive: 1 });
streamSchema.index({ recipient: 1, isActive: 1 });
streamSchema.index({ isActive: 1, isCancelled: 1 });

const Stream = mongoose.models.Stream || mongoose.model<IStream>('Stream', streamSchema);

export default Stream;