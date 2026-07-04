import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateOtp, getOtpExpiry } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';
import { withCors, optionsResponse } from '@/lib/cors';
import { signJwt } from '@/lib/jwt';

const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkJ3/6HHQsEMi8C8h5uX6G';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string; deviceType?: string };
    try {
      body = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 }),
        req
      );
    }

    const { email, password, deviceType } = body;

    if (!email || !password) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Email and password are required.' },
          { status: 400 }
        ),
        req
      );
    }

    const emailLower = email.toLowerCase().trim();
    const resolvedDevice =
      deviceType?.toLowerCase() === 'native_app' ? 'NATIVE_APP' : 'WEB';

    // ── User lookup ───────────────────────────────────────────────────────
    let user: {
      id: string;
      email: string;
      passwordHash: string;
      isVerified: boolean;
      deviceType: string;
    } | null = null;

    try {
      user = await db.user.findUnique({
        where: { email: emailLower },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          isVerified: true,
          deviceType: true,
        },
      });
    } catch (dbError) {
      console.error('[login] DB lookup failed:', dbError);
      return withCors(
        NextResponse.json({ success: false, message: 'Database error. Please try again.' }, { status: 503 }),
        req
      );
    }

    // Always hash-compare to prevent timing attack regardless of user existence
    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    } catch (hashError) {
      console.error('[login] bcrypt failed:', hashError);
      return withCors(
        NextResponse.json({ success: false, message: 'Internal error. Please try again.' }, { status: 500 }),
        req
      );
    }

    if (!user || !passwordValid) {
      return withCors(
        NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 }),
        req
      );
    }

    if (!user.isVerified) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: 'Account not verified. Please complete registration.',
            userId: user.id,
            requiresVerification: true,
          },
          { status: 403 }
        ),
        req
      );
    }

    // ── Direct Login for Verified Users ───────────────────────────────────
    let token: string;
    try {
      token = signJwt({ sub: user.id, email: user.email });
    } catch (jwtError) {
      console.error('[login] JWT sign failed:', jwtError);
      return withCors(
        NextResponse.json({ success: false, message: 'Could not issue token. Please try again.' }, { status: 500 }),
        req
      );
    }

    const now = new Date();
    let updatedUser;
    try {
      updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          loginCount: { increment: 1 },
          lastLoginAt: now,
          deviceType: resolvedDevice as 'WEB' | 'NATIVE_APP',
        },
        select: {
          id: true,
          email: true,
          isVerified: true,
          loginCount: true,
        },
      });
    } catch (dbError) {
      console.error('[login] Failed to update login audit:', dbError);
      updatedUser = {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        loginCount: 1,
      };
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Login successful.',
          token,
          userId: user.id, // For backwards compatibility and tests
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            isVerified: updatedUser.isVerified,
            loginCount: updatedUser.loginCount,
            lastLoginAt: now.toISOString(),
          },
        },
        { status: 200 }
      ),
      req
    );
  } catch (error) {
    console.error('[login] Unhandled error:', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
