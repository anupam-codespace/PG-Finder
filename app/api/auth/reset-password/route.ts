import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { withCors, optionsResponse } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; otpCode?: string; newPassword?: string };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 }),
        req
      );
    }

    const { email, otpCode, newPassword } = body;

    if (!email || !otpCode || !newPassword) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Email, OTP code, and new password are required.' },
          { status: 400 }
        ),
        req
      );
    }

    if (newPassword.length < 6) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters long.' },
          { status: 400 }
        ),
        req
      );
    }

    const emailLower = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: emailLower },
      select: { id: true },
    });

    if (!user) {
      return withCors(
        NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 }),
        req
      );
    }

    // Find the latest active OTP for reset password
    const validOtp = await db.otpVerification.findFirst({
      where: {
        userId: user.id,
        otpCode: otpCode.trim(),
        purpose: 'RESET_PASSWORD',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validOtp) {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid or expired OTP.' }, { status: 400 }),
        req
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and mark OTP as used inside a transaction
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      db.otpVerification.update({
        where: { id: validOtp.id },
        data: { used: true },
      }),
    ]);

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Your password has been reset successfully. Please log in with your new password.',
      }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error('[reset-password] Unhandled error:', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
