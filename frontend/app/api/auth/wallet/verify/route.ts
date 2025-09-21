import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature } from '@/lib/auth/wallet-auth';
import { validateChallenge } from '@/lib/auth/challenge-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, message, publicKey, walletType = 'stacks' } = body;

    // Validate required fields
    if (!address || !signature || !message || !publicKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: address, signature, message, or publicKey' },
        { status: 400 }
      );
    }

    // Verify the challenge
    const isChallengeValid = await validateChallenge(address, message);
    if (!isChallengeValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }

    // Verify wallet signature
    const isValidSignature = verifyWalletSignature({
      address,
      signature,
      message,
      publicKey,
      walletType,
    });

    console.log('🔍 Wallet signature verification:', {
      address,
      verified: isValidSignature,
      message: message.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      verified: isValidSignature,
      address,
      message: isValidSignature ? 'Signature verified successfully' : 'Invalid signature',
    });

  } catch (error) {
    console.error('❌ Wallet verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed' 
      },
      { status: 500 }
    );
  }
}