#!/usr/bin/env node
/**
 * scripts/automated-test.ts
 *
 * Standalone integration test suite for Globiz Patholab auth API.
 * No external test framework required — runs with ts-node or tsx.
 *
 * Usage:
 *   npx tsx scripts/automated-test.ts
 *   BASE_URL=https://your-domain.com npx tsx scripts/automated-test.ts
 *
 * Requires: npm install -D tsx (already in devDeps via typescript)
 * The dev server must be running on BASE_URL before executing this script.
 */

import { PrismaClient } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const db = new PrismaClient({ log: [] });

// ─────────────────────────────────────────────────────────────────────────────
// Result matrix
// ─────────────────────────────────────────────────────────────────────────────
interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  duration: number;
  detail?: string;
}

const results: TestResult[] = [];

function pass(suite: string, name: string, duration: number, detail?: string) {
  results.push({ suite, name, passed: true, duration, detail });
}

function fail(suite: string, name: string, duration: number, detail: string) {
  results.push({ suite, name, passed: false, duration, detail });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function post(
  path: string,
  body: Record<string, unknown>,
  origin = 'http://localhost'
): Promise<{ status: number; headers: Record<string, string>; body: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify(body),
  });

  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });

  let responseBody: Record<string, unknown> = {};
  try {
    responseBody = await res.json();
  } catch { /* non-JSON response */ }

  return { status: res.status, headers, body: responseBody };
}

async function options(path: string, origin: string): Promise<{ status: number; headers: Record<string, string> }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'OPTIONS',
    headers: { Origin: origin },
  });
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  return { status: res.status, headers };
}

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

function uniqueEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@globiztest.dev`;
}

async function cleanupUser(email: string): Promise<void> {
  await db.user.deleteMany({ where: { email } }).catch(() => null);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
async function suiteRegister() {
  const SUITE = 'Register';

  // 1a. Valid registration
  {
    const email = uniqueEmail();
    const t0 = Date.now();
    try {
      const { status, body } = await post('/api/auth/register', {
        email,
        password: 'Test@12345',
        deviceType: 'native_app',
      });
      assert(status === 201, `expected 201, got ${status}`);
      assert(body.success === true, 'success not true');
      assert(typeof body.userId === 'string', 'userId missing');
      pass(SUITE, 'Valid registration returns 201 + userId', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Valid registration returns 201 + userId', Date.now() - t0, String(e));
    } finally {
      await cleanupUser(email);
    }
  }

  // 1b. Duplicate email
  {
    const email = uniqueEmail();
    const t0 = Date.now();
    try {
      await post('/api/auth/register', { email, password: 'Test@12345' });
      const { status, body } = await post('/api/auth/register', { email, password: 'Test@12345' });
      assert(status === 409, `expected 409, got ${status}`);
      assert(typeof body.message === 'string', 'message missing');
      pass(SUITE, 'Duplicate email returns 409', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Duplicate email returns 409', Date.now() - t0, String(e));
    } finally {
      await cleanupUser(email);
    }
  }

  // 1c. Missing fields
  {
    const t0 = Date.now();
    try {
      const { status } = await post('/api/auth/register', { email: 'bad@x.com' });
      assert(status === 400, `expected 400, got ${status}`);
      pass(SUITE, 'Missing password returns 400', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Missing password returns 400', Date.now() - t0, String(e));
    }
  }

  // 1d. Weak password
  {
    const t0 = Date.now();
    try {
      const { status } = await post('/api/auth/register', {
        email: uniqueEmail(),
        password: 'short',
      });
      assert(status === 400, `expected 400, got ${status}`);
      pass(SUITE, 'Short password returns 400', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Short password returns 400', Date.now() - t0, String(e));
    }
  }

  // 1e. Invalid email format
  {
    const t0 = Date.now();
    try {
      const { status } = await post('/api/auth/register', {
        email: 'not-an-email',
        password: 'Test@12345',
      });
      assert(status === 400, `expected 400, got ${status}`);
      pass(SUITE, 'Invalid email format returns 400', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Invalid email format returns 400', Date.now() - t0, String(e));
    }
  }

  // 1f. High-concurrency: 10 simultaneous requests same email
  {
    const email = uniqueEmail();
    const t0 = Date.now();
    try {
      const promises = Array.from({ length: 10 }, () =>
        post('/api/auth/register', { email, password: 'Test@12345' })
      );
      const responses = await Promise.all(promises);
      const successes = responses.filter((r) => r.status === 201).length;
      const conflicts = responses.filter((r) => r.status === 409).length;
      // Exactly 1 must succeed (race-safe unique constraint)
      assert(successes === 1, `expected 1 success, got ${successes}`);
      assert(conflicts === 9, `expected 9 conflicts, got ${conflicts}`);
      pass(SUITE, 'High-concurrency: exactly 1 success for same email', Date.now() - t0,
        `successes=${successes} conflicts=${conflicts}`);
    } catch (e: unknown) {
      fail(SUITE, 'High-concurrency: exactly 1 success for same email', Date.now() - t0, String(e));
    } finally {
      await cleanupUser(email);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — /api/auth/verify-otp (mock OTP injection)
// ─────────────────────────────────────────────────────────────────────────────
async function suiteVerifyOtp() {
  const SUITE = 'VerifyOTP';
  const email = uniqueEmail();
  let userId: string;

  // Bootstrap: create a test user directly in DB
  try {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('Test@12345', 12);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        isVerified: false,
        deviceType: 'WEB',
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (e) {
    fail(SUITE, 'Test user bootstrap', 0, `DB error: ${String(e)}`);
    return;
  }

  // 2a. Valid OTP (injected directly into DB)
  {
    const t0 = Date.now();
    const code = '999001';
    const future = new Date(Date.now() + 10 * 60 * 1000);
    await db.otpVerification.create({
      data: { userId, otpCode: code, expiresAt: future, purpose: 'REGISTER' },
    });

    try {
      const { status, body, headers } = await post(
        '/api/auth/verify-otp',
        { userId, otpCode: code, purpose: 'REGISTER' },
        'capacitor://localhost'
      );
      assert(status === 200, `expected 200, got ${status}`);
      assert(body.success === true, 'success not true');
      assert(typeof body.token === 'string' && body.token.length > 20, 'token invalid');
      assert(typeof (body.user as Record<string, unknown>)?.id === 'string', 'user.id missing');
      assert(typeof (body.user as Record<string, unknown>)?.email === 'string', 'user.email missing');
      // Validate JWT structure (3 segments separated by dots)
      const parts = (body.token as string).split('.');
      assert(parts.length === 3, `JWT should have 3 parts, got ${parts.length}`);
      // Validate CORS headers
      const acao = headers['access-control-allow-origin'];
      assert(
        acao === 'capacitor://localhost',
        `CORS header wrong: ${acao}`
      );
      pass(SUITE, 'Valid OTP returns JWT + correct CORS header', Date.now() - t0,
        `token_length=${(body.token as string).length} cors=${acao}`);
    } catch (e: unknown) {
      fail(SUITE, 'Valid OTP returns JWT + correct CORS header', Date.now() - t0, String(e));
    }
  }

  // 2b. Same code re-use (should fail — marked used)
  {
    const t0 = Date.now();
    const code = '999001';
    try {
      const { status, body } = await post('/api/auth/verify-otp', {
        userId, otpCode: code, purpose: 'REGISTER',
      });
      assert(status === 401, `expected 401, got ${status}`);
      assert(typeof body.message === 'string', 'message missing');
      pass(SUITE, 'Re-used OTP rejected (401)', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Re-used OTP rejected (401)', Date.now() - t0, String(e));
    }
  }

  // 2c. Expired OTP (inject with past expiry)
  {
    const t0 = Date.now();
    const code = '999002';
    const past = new Date(Date.now() - 1000); // 1 second ago
    await db.otpVerification.create({
      data: { userId, otpCode: code, expiresAt: past, purpose: 'LOGIN' },
    });

    try {
      const { status, body } = await post('/api/auth/verify-otp', {
        userId, otpCode: code, purpose: 'LOGIN',
      });
      assert(status === 401, `expected 401, got ${status}`);
      const msg = (body.message as string) ?? '';
      assert(msg.toLowerCase().includes('expir'), `expected expiry message, got: ${msg}`);
      pass(SUITE, 'Expired OTP returns 401 with expiry message', Date.now() - t0,
        `message="${msg}"`);
    } catch (e: unknown) {
      fail(SUITE, 'Expired OTP returns 401 with expiry message', Date.now() - t0, String(e));
    }
  }

  // 2d. Wrong code
  {
    const t0 = Date.now();
    try {
      const { status } = await post('/api/auth/verify-otp', {
        userId, otpCode: '000000', purpose: 'LOGIN',
      });
      assert(status === 401, `expected 401, got ${status}`);
      pass(SUITE, 'Wrong OTP code returns 401', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Wrong OTP code returns 401', Date.now() - t0, String(e));
    }
  }

  // 2e. Boundary: OTP expiring in 1 second must still be valid NOW
  {
    const t0 = Date.now();
    const code = '999003';
    const nearFuture = new Date(Date.now() + 1500); // 1.5s from now
    await db.otpVerification.create({
      data: { userId, otpCode: code, expiresAt: nearFuture, purpose: 'LOGIN' },
    });

    try {
      const { status, body } = await post('/api/auth/verify-otp', {
        userId, otpCode: code, purpose: 'LOGIN',
      });
      assert(status === 200, `near-expiry OTP should pass, got ${status}`);
      assert(body.success === true, 'success not true');
      pass(SUITE, 'Near-expiry OTP (1.5s) still valid', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Near-expiry OTP (1.5s) still valid', Date.now() - t0, String(e));
    }
  }

  // 2f. Missing fields
  {
    const t0 = Date.now();
    try {
      const { status } = await post('/api/auth/verify-otp', { userId });
      assert(status === 400, `expected 400, got ${status}`);
      pass(SUITE, 'Missing otpCode/purpose returns 400', Date.now() - t0);
    } catch (e: unknown) {
      fail(SUITE, 'Missing otpCode/purpose returns 400', Date.now() - t0, String(e));
    }
  }

  // Cleanup
  await cleanupUser(email);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — CORS headers on all endpoints
// ─────────────────────────────────────────────────────────────────────────────
async function suiteCors() {
  const SUITE = 'CORS';
  const endpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/verify-otp',
    '/api/auth/resend-otp',
  ];

  for (const endpoint of endpoints) {
    // OPTIONS preflight from capacitor://localhost
    {
      const t0 = Date.now();
      try {
        const { status, headers } = await options(endpoint, 'capacitor://localhost');
        assert(
          status === 204 || status === 200,
          `OPTIONS ${endpoint} expected 204, got ${status}`
        );
        assert(
          headers['access-control-allow-origin'] === 'capacitor://localhost',
          `ACAO wrong: ${headers['access-control-allow-origin']}`
        );
        assert(
          headers['access-control-allow-methods']?.includes('POST'),
          `ACAM missing POST: ${headers['access-control-allow-methods']}`
        );
        pass(SUITE, `OPTIONS preflight: ${endpoint}`, Date.now() - t0,
          `acao=${headers['access-control-allow-origin']}`);
      } catch (e: unknown) {
        fail(SUITE, `OPTIONS preflight: ${endpoint}`, Date.now() - t0, String(e));
      }
    }

    // POST from http://localhost origin
    {
      const t0 = Date.now();
      try {
        const { headers } = await post(endpoint, {}, 'http://localhost');
        const acao = headers['access-control-allow-origin'];
        assert(
          acao === 'http://localhost',
          `ACAO from http://localhost wrong: ${acao}`
        );
        pass(SUITE, `POST CORS from http://localhost: ${endpoint}`, Date.now() - t0,
          `acao=${acao}`);
      } catch (e: unknown) {
        fail(SUITE, `POST CORS from http://localhost: ${endpoint}`, Date.now() - t0, String(e));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — /api/auth/login audit fields
// ─────────────────────────────────────────────────────────────────────────────
async function suiteLoginAudit() {
  const SUITE = 'LoginAudit';
  const email = uniqueEmail();

  try {
    // Bootstrap verified user
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('Test@12345', 12);
    await db.user.create({
      data: { email, passwordHash, isVerified: true, deviceType: 'WEB' },
    });

    // Login attempt — should send OTP (email will fail in test env, but audit update + OTP creation is the target)
    const t0 = Date.now();
    try {
      const { status, body } = await post('/api/auth/login', {
        email,
        password: 'Test@12345',
        deviceType: 'native_app',
      });
      // 200 = OTP sent, 502 = mail failed (acceptable in test env with no SMTP)
      assert(
        status === 200 || status === 502,
        `expected 200 or 502, got ${status}: ${JSON.stringify(body)}`
      );

      if (status === 200) {
        assert(typeof body.userId === 'string', 'userId missing');
        // Verify deviceType was updated in DB
        const user = await db.user.findUnique({ where: { email }, select: { deviceType: true } });
        assert(user?.deviceType === 'NATIVE_APP', `deviceType not updated: ${user?.deviceType}`);
        pass(SUITE, 'Login updates deviceType to NATIVE_APP', Date.now() - t0,
          `deviceType=${user?.deviceType}`);
      } else {
        pass(SUITE, 'Login (mail unavailable in test env) returns 502 gracefully', Date.now() - t0);
      }
    } catch (e: unknown) {
      fail(SUITE, 'Login audit field update', Date.now() - t0, String(e));
    }

    // Wrong password
    {
      const t0 = Date.now();
      try {
        const { status } = await post('/api/auth/login', { email, password: 'WrongPass!' });
        assert(status === 401, `expected 401, got ${status}`);
        pass(SUITE, 'Wrong password returns 401', Date.now() - t0);
      } catch (e: unknown) {
        fail(SUITE, 'Wrong password returns 401', Date.now() - t0, String(e));
      }
    }
  } finally {
    await cleanupUser(email);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner & Report
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Globiz Patholab — Automated Integration Test Suite  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time  : ${new Date().toISOString()}\n`);

  // Connectivity check
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost' },
    });
    if (!res.ok && res.status !== 204) throw new Error(`Server returned ${res.status}`);
  } catch (e) {
    console.error(`\n  ✗ Cannot reach ${BASE_URL} — is the dev server running?\n  ${e}\n`);
    process.exit(1);
  }

  const suites = [
    { name: 'Register', fn: suiteRegister },
    { name: 'VerifyOTP', fn: suiteVerifyOtp },
    { name: 'CORS', fn: suiteCors },
    { name: 'LoginAudit', fn: suiteLoginAudit },
  ];

  for (const suite of suites) {
    process.stdout.write(`  Running suite: ${suite.name}...`);
    const t = Date.now();
    await suite.fn();
    console.log(` done (${Date.now() - t}ms)`);
  }

  await db.$disconnect();

  // ── Results matrix ──────────────────────────────────────────────────────
  console.log('\n┌───────────────────────────────────────────────────────────────────────┐');
  console.log('│  RESULTS                                                              │');
  console.log('├────┬──────────────┬───────────────────────────────────────┬────┬──────┤');
  console.log('│  # │ Suite        │ Test                                  │ ms │ Pass │');
  console.log('├────┼──────────────┼───────────────────────────────────────┼────┼──────┤');

  results.forEach((r, i) => {
    const idx = String(i + 1).padStart(2, ' ');
    const suite = r.suite.padEnd(12, ' ');
    const name = r.name.slice(0, 37).padEnd(37, ' ');
    const ms = String(r.duration).padStart(4, ' ');
    const status = r.passed ? '  ✓  ' : '  ✗  ';
    console.log(`│ ${idx} │ ${suite} │ ${name} │ ${ms} │ ${status}│`);
    if (!r.passed && r.detail) {
      console.log(`│    │              │   → ${r.detail.slice(0, 64).padEnd(64, ' ')} │`);
    }
  });

  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  const totalMs = results.reduce((a, r) => a + r.duration, 0);

  console.log('└────┴──────────────┴───────────────────────────────────────┴────┴──────┘');
  console.log(`\n  Passed : ${totalPassed}/${results.length}`);
  console.log(`  Failed : ${totalFailed}/${results.length}`);
  console.log(`  Total  : ${totalMs}ms\n`);

  if (totalFailed > 0) {
    console.error('  RESULT: FAIL — see failures above\n');
    process.exit(1);
  } else {
    console.log('  RESULT: PASS — all tests passed\n');
    process.exit(0);
  }
}

run().catch((e) => {
  console.error('Unhandled test runner error:', e);
  process.exit(1);
});
