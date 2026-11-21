// Deploy only after configuring the Apple signing key in server secrets.
// No Apple key, authorization code or token is returned to the app or logged.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'npm:jose@6.1.3';

const audience = 'com.kangducheol.malsseumfeed';
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const respond = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { deleted: true }), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error('configuration');
  return value;
};
Deno.serve(async request => {
  if (request.method !== 'POST') return respond(405, 'method_not_allowed');
  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return respond(401, 'authentication_required');
    const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.getUser(authHeader.slice(7));
    if (error || !data.user) return respond(401, 'authentication_required');
    const input = await request.json();
    if (input.expectedUserId !== data.user.id || typeof input.authorizationCode !== 'string'
      || !input.authorizationCode || input.authorizationCode.length > 4096) return respond(400, 'invalid_request');
    const subjects = (data.user.identities ?? []).filter(identity => identity.provider === 'apple')
      .map(identity => identity.identity_data?.sub).filter((sub): sub is string => typeof sub === 'string');
    if (!subjects.length) return respond(403, 'apple_identity_required');
    const now = Math.floor(Date.now() / 1000);
    const key = await importPKCS8(required('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'), 'ES256');
    const secret = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: required('APPLE_KEY_ID') })
      .setIssuer(required('APPLE_TEAM_ID')).setSubject(audience).setAudience('https://appleid.apple.com')
      .setIssuedAt(now).setExpirationTime(now + 300).sign(key);
    // A fresh Apple authorization code is requested at deletion time, so long-lived Apple tokens need not be stored.
    const exchange = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: audience, client_secret: secret,
        code: input.authorizationCode, grant_type: 'authorization_code' }), signal: AbortSignal.timeout(15000),
    });
    if (!exchange.ok) return respond(400, 'apple_reauthentication_required');
    const tokens = await exchange.json();
    if (typeof tokens.id_token !== 'string' || typeof tokens.refresh_token !== 'string') return respond(502, 'apple_response_invalid');
    const { payload } = await jwtVerify(tokens.id_token, appleKeys, {
      issuer: 'https://appleid.apple.com', audience, algorithms: ['RS256'],
    });
    if (!payload.sub || !subjects.includes(payload.sub)) return respond(403, 'apple_account_mismatch');
    const revoked = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: audience, client_secret: secret,
        token: tokens.refresh_token, token_type_hint: 'refresh_token' }), signal: AbortSignal.timeout(15000),
    });
    if (!revoked.ok) return respond(502, 'apple_revocation_failed');
    const deletion = await admin.auth.admin.deleteUser(data.user.id);
    if (deletion.error) return respond(500, 'account_deletion_failed');
    return respond(200);
  } catch {
    return respond(500, 'account_deletion_unavailable');
  }
});
