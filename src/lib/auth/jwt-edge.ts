export type JwtPayload = Record<string, unknown> & {
  exp?: number;
};

const MAX_JWT_SEGMENT_LENGTH = 2048;
const EXP_LEEWAY_SECONDS = 60;

function safeJsonParse<T>(input: string): T {
  if (input.length > MAX_JWT_SEGMENT_LENGTH) throw new Error('Token segment too large');
  try {
    return JSON.parse(input) as T;
  } catch {
    throw new Error('Invalid token format');
  }
}

function base64UrlToUint8Array(input: string): Uint8Array {
  if (input.length > MAX_JWT_SEGMENT_LENGTH) throw new Error('Token segment too large');
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  let raw: string;
  try {
    raw = atob(base64);
  } catch {
    throw new Error('Invalid token format');
  }
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function base64UrlToString(input: string): string {
  const bytes = base64UrlToUint8Array(input);
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Invalid token format');
  }
}

async function hmacSha256Verify(secret: string, data: string, signatureB64Url: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlToUint8Array(signatureB64Url);
  const payload = new TextEncoder().encode(data);
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature as BufferSource,
    payload as BufferSource
  );
}

export async function verifyAccessTokenEdge(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [headerB64Url, payloadB64Url, sigB64Url] = parts;

  if (headerB64Url.length > MAX_JWT_SEGMENT_LENGTH) throw new Error('Token segment too large');
  if (payloadB64Url.length > MAX_JWT_SEGMENT_LENGTH) throw new Error('Token segment too large');
  if (sigB64Url.length > MAX_JWT_SEGMENT_LENGTH) throw new Error('Token segment too large');

  // Verify signature FIRST. Do not trust/parse header or payload until after this passes.
  const signingInput = `${headerB64Url}.${payloadB64Url}`;
  const valid = await hmacSha256Verify(secret, signingInput, sigB64Url);
  if (!valid) throw new Error('Invalid signature');

  // Enforce HS256-only tokens (defense-in-depth).
  const headerJson = base64UrlToString(headerB64Url);
  const header = safeJsonParse<{ alg?: string; typ?: string }>(headerJson);
  if (header.typ !== 'JWT') throw new Error('Invalid token type');
  if (header.alg !== 'HS256') throw new Error('Unsupported alg');

  const payloadJson = base64UrlToString(payloadB64Url);
  const payload = safeJsonParse<JwtPayload>(payloadJson);

  if (typeof payload.exp !== 'number') {
    throw new Error('Invalid token payload');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds >= payload.exp + EXP_LEEWAY_SECONDS) {
    throw new Error('Token expired');
  }

  return payload;
}
