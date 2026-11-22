// Deletes the signed-in user. For Sign in with Apple users it first tries to revoke the Apple token
// (best effort) with a fresh authorization code, then always deletes the Supabase user.
// No Apple key, authorization code or token is returned to the app or logged.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'npm:jose@6.1.3';

const audience = 'com.kangducheol.malsseumfeed';
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const respond = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing ${name}`);
  return value;
};

async function revokeApple(code: string, subjects: string[]): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(required('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'), 'ES256');
  const secret = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: required('APPLE_KEY_ID') })
    .setIssuer(required('APPLE_TEAM_ID')).setSubject(audience).setAudience('https://appleid.apple.com')
    .setIssuedAt(now).setExpirationTime(now + 300).sign(key);
  const exchange = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: audience, client_secret: secret, code, grant_type: 'authorization_code' }),
    signal: AbortSignal.timeout(15000),
  });
  if (!exchange.ok) return `exchange_${exchange.status}`;
  const tokens = await exchange.json();
  if (typeof tokens.id_token !== 'string' || typeof tokens.refresh_token !== 'string') return 'apple_response_invalid';
  const { payload } = await jwtVerify(tokens.id_token, appleKeys, { issuer: 'https://appleid.apple.com', audience, algorithms: ['RS256'] });
  if (!payload.sub || !subjects.includes(payload.sub)) return 'apple_account_mismatch';
  const revoked = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: audience, client_secret: secret, token: tokens.refresh_token, token_type_hint: 'refresh_token' }),
    signal: AbortSignal.timeout(15000),
  });
  return revoked.ok ? 'revoked' : `revoke_${revoked.status}`;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return respond(405, { error: 'method_not_allowed' });
  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return respond(401, { error: 'authentication_required' });
    const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.getUser(authHeader.slice(7));
    if (error || !data.user) return respond(401, { error: 'authentication_required' });
    const input = await request.json().catch(() => ({}));
    if (input.expectedUserId !== data.user.id) return respond(400, { error: 'invalid_request' });
    const subjects = (data.user.identities ?? []).filter(identity => identity.provider === 'apple')
      .map(identity => identity.identity_data?.sub).filter((sub): sub is string => typeof sub === 'string');
    let apple = 'not_apple';
    if (subjects.length) {
      const code = input.authorizationCode;
      if (typeof code === 'string' && code && code.length <= 4096) {
        try { apple = await revokeApple(code, subjects); } catch (revokeError) { apple = `revoke_error: ${String(revokeError).slice(0, 80)}`; }
      } else apple = 'no_code';
      console.log(`apple revoke result: ${apple}`);
    }
    const deletion = await admin.auth.admin.deleteUser(data.user.id);
    if (deletion.error) {
      console.error(`delete failed: ${deletion.error.message}`);
      return respond(500, { error: 'account_deletion_failed' });
    }
    return respond(200, { deleted: true, apple });
  } catch (unexpected) {
    console.error(`unexpected: ${String(unexpected).slice(0, 200)}`);
    return respond(500, { error: 'account_deletion_unavailable' });
  }
});
