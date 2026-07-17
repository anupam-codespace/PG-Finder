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
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 }),
        req
      );
    }

    const { email } = body;

    if (!email) {
      return withCors(
        NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 }),
        req
      );
    }

    const emailLower = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: emailLower },
      select: { id: true, email: true },
    });

    if (!user) {
      return withCors(
        NextResponse.json({ success: false, message: 'No account exists with this email address.' }, { status: 404 }),
        req
      );
    }

    const otpCode = generateOtp();
    const expiresAt = getOtpExpiry(10); // 10 minutes expiry

    // Mark previous active RESET_PASSWORD OTPs as used and create new one
    await db.$transaction([
      db.otpVerification.updateMany({
        where: { userId: user.id, purpose: 'RESET_PASSWORD', used: false },
        data: { used: true },
      }),
      db.otpVerification.create({
        data: {
          userId: user.id,
          otpCode,
          expiresAt,
          purpose: 'RESET_PASSWORD',
        },
      }),
    ]);

    // Send OTP email asynchronously
    sendOtpEmail(user.email, otpCode, 'RESET_PASSWORD').catch((mailError) => {
      console.error('[forgot-password] Background mail send failed:', mailError);
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: 'An OTP has been sent to your email to reset your password.',
        userId: user.id,
      }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error('[forgot-password] Unhandled error:', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
