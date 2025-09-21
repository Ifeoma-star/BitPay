export interface Stream {
  id: string;
  sender: string;
  recipient: string;
  totalAmount: bigint;
  vestedAmount: bigint;
  startBlock: number;
  endBlock: number;
  isActive: boolean;
  createdAt: Date;
  description?: string;
}

export interface StreamCreate {
  recipient: string;
  totalAmount: bigint;
  duration: number; // in blocks
  description?: string;
}

export interface StreamWithdraw {
  streamId: string;
  amount?: bigint; // if not provided, withdraw all available
}

export interface StreamStatus {
  id: string;
  isActive: boolean;
  totalAmount: bigint;
  vestedAmount: bigint;
  withdrawnAmount: bigint;
  remainingAmount: bigint;
  progressPercentage: number;
  estimatedCompletionTime: Date;
}