import { NextRequest, NextResponse } from 'next/server';
import { generateChallenge } from '@/lib/auth/challenge-store';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 Challenge API called with URL:', request.url);
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const type = searchParams.get('type') as 'connection' | 'payment' || 'connection';
    const paymentId = searchParams.get('paymentId') || undefined;
    const amount = searchParams.get('amount') ? parseInt(searchParams.get('amount')!) : undefined;
    
    console.log('📥 Challenge request params:', { address, type, paymentId, amount });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Validate address format (basic Stacks address validation)
    if (!address.startsWith('SP') && !address.startsWith('ST')) {
      return NextResponse.json(
        { success: false, error: 'Invalid Stacks address format' },
        { status: 400 }
      );
    }

    const { challenge, expiresAt } = await generateChallenge(address, type, paymentId, amount);

    console.log('✅ Generated challenge for address:', address);

    return NextResponse.json({
      success: true,
      challenge,
      expiresAt: expiresAt.toISOString(),
      type,
    });

  } catch (error) {
    console.error('❌ Challenge generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}