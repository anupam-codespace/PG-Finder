import { NextRequest, NextResponse } from 'next/server';

// Capacitor Android uses https://localhost as its WebView origin.
// When testing on a real device over WiFi, the WebView origin may also be
// null (file://) or the LAN IP. We keep an explicit list + regex fallback.
const ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:3005',
  // Mac LAN IP — used by Android/iOS device on the same WiFi network
  'http://192.168.29.49:3005',
  'http://192.168.29.49',
];

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowed =
    !origin || // null origin (Capacitor file:// or same-origin)
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin); // any LAN IP

  return {
    'Access-Control-Allow-Origin': allowed ? (origin || '*') : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function withCors(
  response: NextResponse,
  req: NextRequest
): NextResponse {
  const headers = corsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function optionsResponse(req: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}
