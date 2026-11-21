import type { SupabaseClient } from '@supabase/supabase-js';
export async function deleteOwnAccount(client: SupabaseClient, expectedUserId: string): Promise<void> {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== expectedUserId) throw new Error('로그인 계정을 다시 확인해 주세요.');
  if (data.user.identities?.some(identity => identity.provider === 'apple')) {
    throw new Error('Apple로 가입한 계정은 iPhone 업바이블 앱에서 탈퇴해 주세요.');
  }
  const result = await client.rpc('delete_own_reader_account', { expected_user_id: expectedUserId });
  if (result.error) throw result.error;
}
