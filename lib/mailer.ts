import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
  connectionTimeout: 6000,
  greetingTimeout: 6000,
  socketTimeout: 6000,
});

export async function sendOtpEmail(
  to: string,
  otpCode: string,
  purpose: 'LOGIN' | 'REGISTER'
): Promise<void> {
  const subject =
    purpose === 'REGISTER'
      ? 'Verify your Globiz Patholab account'
      : 'Your Globiz Patholab login OTP';

  const actionText =
    purpose === 'REGISTER'
      ? 'complete your registration'
      : 'sign in to your account';

  // ── Always write OTP to local dev log file for easy local testing ───────
  try {
    const logPath = path.join(process.cwd(), 'otp_log.txt');
    const logEntry = `[${new Date().toISOString()}] TO: ${to} | PURPOSE: ${purpose} | CODE: ${otpCode}\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
    console.log(`\n [DEV OTP LOG] Sent to: ${to} | Code: ${otpCode}\n`);
  } catch (logErr) {
    console.error('Failed to write to otp_log.txt:', logErr);
  }

  // ── Attempt SMTP delivery ────────────────────────────────────────────────
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_USER.includes('example.com') || process.env.GMAIL_USER.includes('your-gmail')) {
      console.warn('Gmail SMTP credentials not configured. Falling back to local logging.');
      return;
    }

    await transporter.sendMail({
      from: `"Globiz Patholab" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${subject}</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Globiz Patholab</h1>
                      <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Diagnostic Excellence</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Use the code below to ${actionText}.</p>
                      <p style="margin:0 0 28px;color:#6b7280;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
                      <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                        <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#1a1a2e;font-family:monospace;">${otpCode}</span>
                      </div>
                      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">If you did not request this code, please ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} Globiz Patholab. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`Email successfully sent to ${to}`);
  } catch (smtpError: any) {
    // Graceful fallback: log warning but do NOT crash/throw.
    // Allows developers to run & verify flows locally without functional SMTP.
    console.warn(`[SMTP Warning] Failed to send email to ${to}: ${smtpError?.message || smtpError}. Local OTP fallback succeeded.`);
  }
}
