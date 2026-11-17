// 비밀번호를 앱에서 받지 않는 제공자 로그인. 기록은 수동 동기화로만 전송합니다.
import 'react-native-url-polyfill/auto';
import { makeRedirectUri } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { extractAuthorizationCode } from '../domain/oauth-callback';

WebBrowser.maybeCompleteAuthSession();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

let client: SupabaseClient | null = null;
const registeredRedirect = 'malsseumfeed://auth/callback';
function accountRedirectUri(): string {
  if (Platform.OS === 'web') return `${window.location.origin}/auth/callback`;
  // 개발 서버 주소가 앱 복귀 주소에 섞이지 않도록 네이티브 주소를 명시합니다.
  return makeRedirectUri({ native: registeredRedirect, scheme: 'malsseumfeed', path: 'auth/callback' });
}

export function loginUnavailableReason(): string | null {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return '화면을 준비하고 있습니다.';
    if (!window.isSecureContext) return '로그인은 HTTPS 주소에서 이용해 주세요.';
    if (!url || !key) return '로그인 서비스의 공개 연결 설정이 없습니다.';
    return null;
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'Expo Go에서는 이 로그인을 확인할 수 없습니다. 업바이블 앱으로 열어 주세요.';
  const redirect = accountRedirectUri();
  if (redirect !== registeredRedirect) return 'Expo Go에서는 이 로그인을 확인할 수 없습니다. 업바이블 개발 빌드로 열어 주세요.';
  if (!url || !key) return '로그인 서비스를 준비하지 못했습니다. 앱을 업데이트하거나 문의해 주세요.';
  return null;
}

export function accountClient(): SupabaseClient | null {
  if (!url || !key || (Platform.OS === 'web' && typeof window === 'undefined')) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { storage: Platform.OS === 'web' ? window.sessionStorage : secureStorage, autoRefreshToken: true, persistSession: true,
        detectSessionInUrl: false, flowType: 'pkce' },
    });
    const auth = client.auth;
    AppState.addEventListener('change', state => {
      if (state === 'active') auth.startAutoRefresh();
      else auth.stopAutoRefresh();
    });
  }
  return client;
}

export async function signInWithProvider(provider: 'kakao' | 'custom:naver'): Promise<'success' | 'cancelled' | 'redirecting'> {
  const unavailable = loginUnavailableReason();
  if (unavailable) throw new Error(unavailable);
  const auth = accountClient();
  if (!auth) throw new Error('로그인 서비스가 아직 설정되지 않았습니다.');
  const redirectTo = accountRedirectUri();
  const { data, error } = await auth.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true,
      // 카카오 기본 권한(이메일·프로필)을 요구하지 않고 계정 식별만 사용합니다.
      queryParams: { scope: provider === 'kakao' ? '' : 'openid' } },
  });
  if (error) throw error;
  if (!data.url) throw new Error('로그인 주소를 가져오지 못했습니다.');
  if (Platform.OS === 'web') {
    window.location.assign(data.url);
    return 'redirecting';
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';
  const code = extractAuthorizationCode(result.url, redirectTo);
  const exchanged = await auth.auth.exchangeCodeForSession(code);
  if (exchanged.error) throw exchanged.error;
  return 'success';
}

let callbackExchange: Promise<void> | null = null;
export function completeWebSignIn(): Promise<void> {
  if (callbackExchange) return callbackExchange;
  callbackExchange = (async () => {
    if (Platform.OS !== 'web') return;
    const auth = accountClient();
    if (!auth) throw new Error('로그인 서비스가 설정되지 않았습니다.');
    const responseUrl = window.location.href;
    // 인증 코드를 주소창과 이후 방문 기록에 남기지 않습니다.
    window.history.replaceState(null, '', '/auth/callback');
    const code = extractAuthorizationCode(responseUrl, accountRedirectUri());
    const { data, error } = await auth.auth.exchangeCodeForSession(code);
    if (error || !data.session) throw new Error('로그인 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
  })();
  return callbackExchange;
}
