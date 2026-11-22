import * as AppleAuthentication from 'expo-apple-authentication';
import type { SupabaseClient } from '@supabase/supabase-js';

const describe = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : String(error);

// Apple로 가입한 계정은 Apple 연결 해제(토큰 폐기)를 먼저 시도하고,
// 그 단계가 실패해도 계정과 서버 기록 삭제는 끝까지 진행합니다.
export async function deleteOwnAccount(client: SupabaseClient, expectedUserId: string): Promise<void> {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== expectedUserId) throw new Error('user: 로그인 계정을 다시 확인해 주세요.');
  const problems: string[] = [];
  if (data.user.identities?.some(identity => identity.provider === 'apple')) {
    let authorizationCode: string | null = null;
    try {
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
      authorizationCode = credential.authorizationCode ?? null;
    } catch (appleError) {
      if (appleError && typeof appleError === 'object' && 'code' in appleError && appleError.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('cancelled');
      }
      problems.push(`apple: ${describe(appleError)}`);
    }
    try {
      const result = await client.functions.invoke('delete-apple-account', { body: { expectedUserId, authorizationCode } });
      if (!result.error && result.data?.deleted === true) return;
      problems.push(`function: ${describe(result.error ?? result.data?.error)}`);
    } catch (functionError) {
      problems.push(`function: ${describe(functionError)}`);
    }
  }
  const result = await client.rpc('delete_own_reader_account', { expected_user_id: expectedUserId });
  if (result.error) throw new Error([...problems, `rpc: ${result.error.message}`].join(' / '));
}
