import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { withCors, optionsResponse } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  try {
    let body: { userId?: string; otpCode?: string; purpose?: string };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 }),
        req
      );
    }

    const { userId, otpCode, purpose } = body;

    if (!userId || !otpCode || !purpose) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'userId, otpCode and purpose are required.' },
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

    const normalizedCode = otpCode.trim();

    // ── Hot-path OTP lookup (hits compound index: userId, purpose, used) ──
    let otp: {
      id: string;
      expiresAt: Date;
      user: {
        id: string;
        email: string;
        isVerified: boolean;
        loginCount: number;
      };
    } | null = null;

    try {
      otp = await db.otpVerification.findFirst({
        where: {
          userId,
          otpCode: normalizedCode,
          purpose: purpose as 'LOGIN' | 'REGISTER',
          used: false,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              email: true,
              isVerified: true,
              loginCount: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error('[verify-otp] DB lookup failed:', dbError);
      return withCors(
        NextResponse.json({ success: false, message: 'Database error. Please try again.' }, { status: 503 }),
        req
      );
    }

    if (!otp) {
      // Differentiate expired vs invalid for better UX
      let isExpired = false;
      try {
        const staleOtp = await db.otpVerification.findFirst({
          where: {
            userId,
            otpCode: normalizedCode,
            purpose: purpose as 'LOGIN' | 'REGISTER',
            used: false,
            expiresAt: { lte: new Date() },
          },
          select: { id: true },
        });
        isExpired = !!staleOtp;
      } catch { /* non-fatal */ }

      return withCors(
        NextResponse.json(
          {
            success: false,
            message: isExpired
              ? 'OTP has expired. Please request a new code.'
              : 'Invalid OTP. Please check the code and try again.',
          },
          { status: 401 }
        ),
        req
      );
    }

    const now = new Date();

    // ── Atomic: mark OTP used + update user audit fields + cleanup stale OTPs
    try {
      await db.$transaction([
        // 1. Mark this OTP used
        db.otpVerification.update({
          where: { id: otp.id },
          data: { used: true },
        }),
        // 2. Update user: verify + increment loginCount + lastLoginAt
        db.user.update({
          where: { id: userId },
          data: {
            isVerified: true,
            loginCount: { increment: 1 },
            lastLoginAt: now,
          },
        }),
        // 3. Delete all stale OTPs for this user (used or expired) to keep table lean
        db.otpVerification.deleteMany({
          where: {
            userId,
            id: { not: otp.id },
            OR: [
              { used: true },
              { expiresAt: { lte: now } },
            ],
          },
        }),
      ]);
    } catch (txError) {
      console.error('[verify-otp] Transaction failed:', txError);
      return withCors(
        NextResponse.json({ success: false, message: 'Verification failed. Please try again.' }, { status: 503 }),
        req
      );
    }

    // ── Sign JWT ───────────────────────────────────────────────────────────
    let token: string;
    try {
      token = signJwt({ sub: otp.user.id, email: otp.user.email });
    } catch (jwtError) {
      console.error('[verify-otp] JWT sign failed:', jwtError);
      return withCors(
        NextResponse.json({ success: false, message: 'Could not issue token. Please try again.' }, { status: 500 }),
        req
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'OTP verified successfully.',
          token,
          user: {
            id: otp.user.id,
            email: otp.user.email,
            isVerified: true,
            loginCount: otp.user.loginCount + 1,
            lastLoginAt: now.toISOString(),
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error('[verify-otp] Unhandled error:', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
