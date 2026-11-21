import * as AppleAuthentication from 'expo-apple-authentication';
import type { SupabaseClient } from '@supabase/supabase-js';
export async function deleteOwnAccount(client: SupabaseClient, expectedUserId: string): Promise<void> {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== expectedUserId) throw new Error('로그인 계정을 다시 확인해 주세요.');
  if (!data.user.identities?.some(identity => identity.provider === 'apple')) {
    const result = await client.rpc('delete_own_reader_account', { expected_user_id: expectedUserId });
    if (result.error) throw result.error;
    return;
  }
  const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
  if (!credential.authorizationCode) throw new Error('Apple 계정 확인을 완료하지 못했습니다.');
  const result = await client.functions.invoke('delete-apple-account', {
    body: { expectedUserId, authorizationCode: credential.authorizationCode },
  });
  if (result.error || result.data?.deleted !== true) throw new Error('계정을 삭제하지 못했습니다. 다시 시도하거나 문의해 주세요.');
}
