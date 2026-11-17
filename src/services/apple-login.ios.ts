import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { accountClient, loginUnavailableReason } from './account';

export async function signInWithApple(): Promise<'success' | 'cancelled'> {
  const unavailable = loginUnavailableReason();
  if (unavailable) throw new Error(unavailable);
  const client = accountClient();
  if (!client) throw new Error('로그인 서비스가 설정되지 않았습니다.');
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new Error('Apple 로그인 응답을 확인하지 못했습니다.');
    const { data, error } = await client.auth.signInWithIdToken({
      provider: 'apple', token: credential.identityToken, nonce,
    });
    if (error || !data.session) throw new Error('Apple 로그인을 완료하지 못했습니다.');
    return 'success';
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') return 'cancelled';
    throw error;
  }
}
