export async function signInWithApple(): Promise<'success' | 'cancelled'> {
  throw new Error('Apple 로그인은 iPhone 앱에서 이용할 수 있습니다.');
}
