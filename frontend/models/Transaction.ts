import mongoose from 'mongoose';

export interface ITransaction {
  _id?: string;
  txId: string; // Stacks transaction ID
  streamId: string; // Associated stream ID
  type: 'create' | 'withdraw' | 'cancel'; // Transaction type
  sender: string; // Wallet address of sender
  recipient?: string; // Wallet address of recipient (for creates)
  amount: string; // Amount in microSTX (stored as string to handle BigInt)
  blockHeight: number; // Block height when transaction was mined
  blockHash?: string; // Block hash
  status: 'pending' | 'confirmed' | 'failed'; // Transaction status
  contractAddress: string; // Smart contract address
  functionName: string; // Contract function called
  functionArgs?: any[]; // Function arguments
  fee: string; // Transaction fee in microSTX
  nonce?: number; // Transaction nonce
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date; // When transaction was confirmed
}

const transactionSchema = new mongoose.Schema<ITransaction>({
  txId: {
    type: String,
    required: true,
    unique: true,
  },
  streamId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['create', 'withdraw', 'cancel'],
  },
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
  },
  amount: {
    type: String,
    required: true,
  },
  blockHeight: {
    type: Number,
    required: true,
  },
  blockHash: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  },
  contractAddress: {
    type: String,
    required: true,
  },
  functionName: {
    type: String,
    required: true,
  },
  functionArgs: {
    type: [mongoose.Schema.Types.Mixed],
  },
  fee: {
    type: String,
    required: true,
  },
  nonce: {
    type: Number,
  },
  confirmedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for performance (txId unique index already defined in schema)
transactionSchema.index({ streamId: 1 });
transactionSchema.index({ sender: 1 });
transactionSchema.index({ recipient: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ blockHeight: 1 });
transactionSchema.index({ createdAt: 1 });

// Compound indexes for common queries
transactionSchema.index({ streamId: 1, type: 1 });
transactionSchema.index({ sender: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: 1 });

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;