// 리디렉션 주소가 일치하지 않거나 오류 응답이면 인증 코드를 교환하지 않습니다.
export function extractAuthorizationCode(callbackUrl: string, expectedRedirect: string): string {
  let actual: URL;
  let expected: URL;
  try { actual = new URL(callbackUrl); expected = new URL(expectedRedirect); }
  catch { throw new Error('로그인 응답 주소가 올바르지 않습니다.'); }
  if (actual.protocol !== expected.protocol || actual.host !== expected.host || actual.pathname !== expected.pathname || actual.username || actual.password) {
    throw new Error('예상하지 못한 로그인 응답 주소입니다.');
  }
  if (actual.searchParams.has('error')) throw new Error('로그인이 완료되지 않았습니다. 다시 시도해 주세요.');
  const codes = actual.searchParams.getAll('code');
  if (codes.length !== 1 || !codes[0]) throw new Error('로그인 결과를 확인하지 못했습니다.');
  return codes[0];
}
