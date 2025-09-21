import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
      profileComplete: user.profileComplete,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}