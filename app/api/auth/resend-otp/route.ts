import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOtp, getOtpExpiry } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';
import { withCors, optionsResponse } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  try {
    let body: { userId?: string; purpose?: string };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 }),
        req
      );
    }

    const { userId, purpose } = body;

    if (!userId || !purpose) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'userId and purpose are required.' },
          { status: 400 }
        ),
        req
      );
    }

    if (purpose !== 'LOGIN' && purpose !== 'REGISTER') {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid purpose.' }, { status: 400 }),
        req
      );
    }

    let user: { id: string; email: string; isVerified: boolean } | null = null;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isVerified: true },
      });
    } catch (dbError) {
      console.error('[resend-otp] DB lookup failed:', dbError);
      return withCors(
        NextResponse.json({ success: false, message: 'Database error. Please try again.' }, { status: 503 }),
        req
      );
    }

    if (!user) {
      return withCors(
        NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 }),
        req
      );
    }

    if (purpose === 'REGISTER' && user.isVerified) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Account is already verified. Please sign in.' },
          { status: 409 }
        ),
        req
      );
    }

    const otpCode = generateOtp();
    const expiresAt = getOtpExpiry(10);

    try {
      await db.$transaction([
        db.otpVerification.updateMany({
          where: { userId, purpose: purpose as 'LOGIN' | 'REGISTER', used: false },
          data: { used: true },
        }),
        db.otpVerification.create({
          data: { userId, otpCode, expiresAt, purpose: purpose as 'LOGIN' | 'REGISTER' },
        }),
      ]);
    } catch (txError) {
      console.error('[resend-otp] Transaction failed:', txError);
      return withCors(
        NextResponse.json({ success: false, message: 'Could not generate OTP. Please try again.' }, { status: 503 }),
        req
      );
    }

    // Send OTP email in the background asynchronously so the HTTP response returns instantly
    sendOtpEmail(user.email, otpCode, purpose as 'LOGIN' | 'REGISTER').catch((mailError) => {
      console.error('[resend-otp] Background mail send failed:', mailError);
    });

    return withCors(
      NextResponse.json({ success: true, message: 'A new OTP has been sent to your email.' }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error('[resend-otp] Unhandled error:', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
