import mongoose from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  walletAddress?: string;
  walletPublicKey?: string;
  walletType?: 'stacks';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // Not required because wallet users might not have passwords
  },
  walletAddress: {
    type: String,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    unique: true,
  },
  walletPublicKey: {
    type: String,
  },
  walletType: {
    type: String,
    enum: ['stacks'],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  lastLoginAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ isActive: 1 });

// Ensure unique email and wallet address constraints
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;