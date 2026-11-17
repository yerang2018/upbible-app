import assert from 'node:assert/strict';
import test from 'node:test';
import { extractAuthorizationCode } from './oauth-callback.ts';
const target='malsseumfeed://auth/callback';

test('정상 콜백에서 인증 코드만 읽습니다', () => {
  assert.equal(extractAuthorizationCode(`${target}?code=abc`,target),'abc');
});
test('다른 주소나 경로의 인증 코드는 거부합니다', () => {
  for (const url of ['https://auth/callback?code=abc','malsseumfeed://other/callback?code=abc','malsseumfeed://auth/other?code=abc']) {
    assert.throws(()=>extractAuthorizationCode(url,target));
  }
});
test('오류나 누락 및 중복 코드 응답은 거부합니다', () => {
  for (const query of ['error=access_denied','code=','code=a&code=b','code=a&error=access_denied']) {
    assert.throws(()=>extractAuthorizationCode(`${target}?${query}`,target));
  }
});

test('HTTPS 웹 복귀 주소에서도 하나의 인증 코드만 받습니다', () => {
  const web='https://upbible-friends-preview.adepttomato2.chatgpt.site/auth/callback';
  assert.equal(extractAuthorizationCode(`${web}?code=web-code`,web),'web-code');
  for (const bad of [
    web.replace('https:', 'http:')+'?code=a',
    web.replace('chatgpt.site', 'chatgpt.site.evil.example')+'?code=a',
    web.replace('/auth/callback', '/other')+'?code=a',
    web+'?code=a&error=access_denied',
    web+'#access_token=not-a-code',
    web+'?code=a&code=b',
  ]) assert.throws(()=>extractAuthorizationCode(bad,web));
});
