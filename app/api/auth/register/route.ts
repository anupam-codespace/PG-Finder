import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateOtp, getOtpExpiry } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';
import { withCors, optionsResponse } from '@/lib/cors';
import { validateEmailDomain } from '@/lib/email-validator';
import fs from 'fs';
import path from 'path';

// Helper to log errors to a local file for diagnostic visibility
function logErrorToFile(context: string, error: any) {
  try {
    const logPath = path.join(process.cwd(), 'db_error.log');
    const logMessage = `[${new Date().toISOString()}] ${context} ERROR:\n` +
      `DATABASE_URL in process.env: ${process.env.DATABASE_URL || 'UNDEFINED'}\n` +
      `Message: ${error?.message || error}\n` +
      `Stack: ${error?.stack || 'No stack'}\n` +
      `Stringified: ${JSON.stringify(error)}\n` +
      `-------------------------------------------\n`;
    fs.appendFileSync(logPath, logMessage, 'utf8');
  } catch (e) {
    console.error('Failed to write to db_error.log:', e);
  }
}

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

    const domainValidation = validateEmailDomain(emailLower);
    if (!domainValidation.isValid) {
      return withCors(
        NextResponse.json({ success: false, message: domainValidation.message }, { status: 400 }),
        req
      );
    }

    if (password.length < 8) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'Password must be at least 8 characters.' },
          { status: 400 }
        ),
        req
      );
    }

    const resolvedDevice =
      deviceType?.toLowerCase() === 'native_app' ? 'NATIVE_APP' : 'WEB';

    // ── Check existing user ───────────────────────────────────────────────
    let existingUser: { id: string } | null = null;
    try {
      existingUser = await db.user.findUnique({
        where: { email: emailLower },
        select: { id: true },
      });
    } catch (dbError) {
      console.error('[register] DB lookup failed:', dbError);
      logErrorToFile('REGISTER_DB_LOOKUP', dbError);
      return withCors(
        NextResponse.json({ success: false, message: 'Database error. Please try again.' }, { status: 503 }),
        req
      );
    }

    if (existingUser) {
      return withCors(
        NextResponse.json(
          { success: false, message: 'An account with this email already exists.' },
          { status: 409 }
        ),
        req
      );
    }

    // ── Hash password ─────────────────────────────────────────────────────
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error('[register] bcrypt failed:', hashError);
      logErrorToFile('REGISTER_BCRYPT', hashError);
      return withCors(
        NextResponse.json({ success: false, message: 'Internal error. Please try again.' }, { status: 500 }),
        req
      );
    }

    // ── Atomic: create user + invalidate old OTPs + create new OTP ────────
    const otpCode = generateOtp();
    const expiresAt = getOtpExpiry(10);

    let userId: string;
    try {
      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: emailLower,
            passwordHash,
            isVerified: false,
            deviceType: resolvedDevice as 'WEB' | 'NATIVE_APP',
          },
          select: { id: true },
        });

        await tx.otpVerification.create({
          data: {
            userId: user.id,
            otpCode,
            expiresAt,
            purpose: 'REGISTER',
          },
        });

        return user;
      });

      userId = result.id;
    } catch (txError) {
      console.error('[register] Transaction failed:', txError);
      logErrorToFile('REGISTER_TRANSACTION', txError);
      
      const isUniqueConstraint = txError && (txError as any).code === 'P2002';
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: isUniqueConstraint
              ? 'An account with this email already exists.'
              : 'Could not create account. Please try again.',
          },
          { status: isUniqueConstraint ? 409 : 503 }
        ),
        req
      );
    }

    // Send OTP email in the background asynchronously so the HTTP response returns instantly
    sendOtpEmail(emailLower, otpCode, 'REGISTER').catch((mailError) => {
      console.error('[register] Background mail send failed:', mailError);
      logErrorToFile('REGISTER_BACKGROUND_MAIL_SEND', mailError);
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Registration initiated. Check your email for the OTP.',
          userId,
        },
        { status: 201 }
      ),
      req
    );
  } catch (error) {
    console.error('[register] Unhandled error:', error);
    logErrorToFile('REGISTER_UNHANDLED', error);
    return withCors(
      NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 }),
      req
    );
  }
}
