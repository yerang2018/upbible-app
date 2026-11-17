import { Pressable } from '../components/Touch';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { LineIcon } from '../components/LineIcon';
import { AppleLoginButton } from '../components/AppleLoginButton';
import { signInWithApple } from '../services/apple-login';
import { accountClient, loginUnavailableReason, signInWithProvider } from '../services/account';
import { useReader } from '../state/ReaderState';
import { colors, serif } from '../theme';

export default function Account() {
  const reader = useReader();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{ action: 'import' | 'delete'; userId: string } | null>(null);
  const confirm = confirmation?.userId === reader.userId ? confirmation.action : null;
  const setConfirm = (action: 'import' | 'delete' | null) => setConfirmation(action && reader.userId ? { action, userId: reader.userId } : null);
  const unavailable = loginUnavailableReason();
  const disabled = busy || reader.syncBusy || !reader.ready || reader.storageError;
  async function login(provider: 'custom:naver' | 'kakao') {
    setBusy(true); setMessage('');
    try { const result = await signInWithProvider(provider); if (result === 'redirecting') return; if (result === 'cancelled') setMessage('로그인을 취소했습니다.'); }
    catch { setMessage('로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    setBusy(false);
  }
  async function logout() {
    setBusy(true); setMessage('');
    try { const result = await accountClient()?.auth.signOut({ scope: 'local' }); if (result?.error) throw result.error; }
    catch { setMessage('로그아웃하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  async function appleLogin() {
    if (disabled || unavailable) return;
    setBusy(true); setMessage('');
    try { if (await signInWithApple() === 'cancelled') setMessage('로그인을 취소했습니다.'); }
    catch { setMessage('Apple 로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  async function confirmed() {
    const action = confirm; if (!action || !reader.userId) return; setConfirm(null); setBusy(true); setMessage('');
    try { if (action === 'import') await reader.importGuest(); else { await reader.deleteAccount(); setMessage('업바이블 계정과 서버 기록을 삭제했습니다. 로그인 제공자와의 연결 해제는 아래 안내에서 별도로 진행해 주세요.'); } }
    catch { setMessage('처리를 완료하지 못했습니다. 네트워크와 계정 상태를 확인해 주세요.'); }
    finally { setBusy(false); }
  }
  const button = (label: string, action: () => void, style?: object, blocked = false) => <Pressable accessibilityRole="button" disabled={disabled || blocked} onPress={action} style={[styles.button, style, (disabled || blocked) && { opacity: 0.5 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>내 계정</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" style={styles.close} onPress={() => router.replace('/')}><LineIcon name="close" /></Pressable></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.description}>{!reader.ready ? '계정을 확인하고 있습니다.' : reader.userId ? '로그인되었습니다. 계정별 기록을 사용하고 있습니다.' : '로그인하면 여러 기기에서 기록을 이어 볼 수 있습니다. 로그인 없이도 성경을 읽을 수 있습니다.'}</Text>
      {reader.storageError && <Text style={styles.description}>기기 기록을 읽지 못해 변경을 중단했습니다. 기존 기록을 보존하기 위해 앱을 다시 열어 주세요.</Text>}
      {!reader.userId ? <>
        {button('네이버로 로그인', () => { void login('custom:naver'); }, { backgroundColor: '#03C75A' }, Boolean(unavailable))}
        {button('카카오로 로그인', () => { void login('kakao'); }, { backgroundColor: '#FEE500' }, Boolean(unavailable))}
        <AppleLoginButton disabled={disabled || Boolean(unavailable)} onPress={appleLogin} />
        {unavailable && <Text style={styles.description}>{unavailable}</Text>}
        <Text style={styles.small}>로그인하면 이용자 식별자가 업바이블 인증 서비스(Supabase)에 전달됩니다. 기존 비로그인 기록은 자동으로 계정에 옮겨지지 않습니다.</Text>
      </> : <>
        <Text style={styles.description}>이 계정의 기기 기록: 좋아요 {reader.likes.length}개 · 저장 {reader.bookmarks.length}개 · 개인 댓글 {reader.comments.length}개</Text>
        {button(reader.syncBusy ? '동기화 중…' : '기록 동기화', () => { void reader.syncRecords(); })}
        <Text style={styles.small}>읽던 위치·좋아요·저장·개인 댓글·글자 크기를 계정에 저장합니다. 다른 기기에서도 같은 계정으로 로그인한 후 동기화를 눌러 이어 읽으세요. 댓글은 다른 사람에게 공개되지 않습니다.</Text>
        {reader.syncChoice && <View style={styles.panel}>
          <Text style={styles.description}>계정에 다른 기록이 있습니다. 어떤 기록을 사용할까요? 현재 계정의 기기 기록은 선택 전에 백업합니다.</Text>
          {button('계정 기록을 이 기기로 불러오기', () => { void reader.syncRecords('remote'); })}
          {button('이 기기 기록으로 계정 기록 바꾸기', () => { void reader.syncRecords('local'); })}
        </View>}
        {reader.syncMessage && <Text accessibilityLiveRegion="polite" style={styles.description}>{reader.syncMessage}</Text>}
        {button('로그인 전 이 기기 기록 가져오기', () => setConfirm('import'))}
        {button('로그아웃', () => { void logout(); })}
        {button('회원 탈퇴', () => setConfirm('delete'), { borderColor: '#A33' })}
      </>}
      {confirm && <View style={styles.panel}>
        <Text style={styles.description}>{confirm === 'import' ? '현재 계정의 기기 기록을 백업한 뒤, 로그인 전 기록으로 바꿉니다. 서버 기록은 동기화를 누르기 전까지 바뀌지 않습니다.' : '업바이블 계정과 서버에 동기화한 기록을 삭제합니다. 삭제는 되돌릴 수 없습니다. 비로그인 기록과 다른 기기에 남은 사본은 자동 삭제되지 않습니다. 네이버·카카오의 연결 해제는 해당 서비스에서도 별도로 진행할 수 있습니다.'}</Text>
        {button(confirm === 'delete' ? '계정과 서버 기록 삭제 확인' : '기록 가져오기 확인', () => { void confirmed(); })}
        {button('취소', () => setConfirm(null))}
      </View>}
      {message && <Text accessibilityLiveRegion="polite" style={styles.description}>{message}</Text>}
      <Link href="/privacy"><Text style={styles.small}>개인정보 처리와 계정 연결 해제 안내</Text></Link>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  title: { fontFamily: serif, fontSize: 23, color: colors.navy }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 28, gap: 18 }, description: { color: colors.navy, fontSize: 15, lineHeight: 25 }, small: { color: colors.muted, fontSize: 13, lineHeight: 22 },
  button: { minHeight: 52, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.navy, fontSize: 16, fontWeight: '600' }, panel: { padding: 16, gap: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 14 },
});
