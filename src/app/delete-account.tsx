import { Pressable } from '../components/Touch';
import { Link } from 'expo-router';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { colors } from '../theme';

export default function DeleteAccount() {
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>업바이블 계정 삭제</Text>
      <Text style={styles.body}>앱을 설치하지 않아도 이 웹사이트에서 계정 삭제를 시작할 수 있습니다.</Text>
      <Text style={styles.body}>1. 내 계정에서 삭제할 계정과 같은 로그인 방법으로 로그인합니다.</Text>
      <Text style={styles.body}>2. 회원 탈퇴를 누른 뒤 삭제할 내용을 확인합니다.</Text>
      <Text style={styles.body}>3. 계정과 서버 기록 삭제 확인을 누릅니다.</Text>
      <Link href="/account" asChild><Pressable accessibilityRole="link" style={styles.button}><Text style={styles.buttonText}>내 계정에서 삭제 진행하기</Text></Pressable></Link>
      <Text accessibilityRole="header" style={styles.heading}>삭제되는 정보</Text>
      <Text style={styles.body}>업바이블 계정과 서버에 동기화한 읽던 위치·좋아요·저장·개인 댓글·글자 크기를 삭제합니다. 현재 기기의 해당 계정 기록과 내부 백업도 삭제합니다. 삭제는 되돌릴 수 없습니다.</Text>
      <Text style={styles.body}>다른 기기에 남은 사본, 비로그인 기록과 직접 공유한 사본은 별도로 삭제해야 합니다. 인증·저장소 제공자의 백업 및 보안 로그 보관은 해당 서비스 정책을 따릅니다.</Text>
      <Text style={styles.body}>업바이블 계정 삭제는 네이버·카카오 계정 자체를 삭제하는 기능이 아닙니다. 로그인 제공자에 남은 서비스 연결은 해당 제공자의 연결 관리에서 해제할 수 있습니다.</Text>
      <Text accessibilityRole="header" style={styles.heading}>로그인할 수 없거나 도움이 필요한 경우</Text>
      <Text style={styles.body}>아래 문의처에 계정 삭제 도움을 요청해 주세요. 비밀번호·인증번호는 보내지 마세요. 본인 확인이 필요한 경우 별도로 안내드립니다.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('mailto:woonyoungja@gmail.com?subject=' + encodeURIComponent('업바이블 계정 삭제 문의')); }}><Text style={styles.link}>woonyoungja@gmail.com</Text></Pressable>
      <Link href="/privacy"><Text style={styles.link}>개인정보 처리 안내</Text></Link>
      <Link href="/support"><Text style={styles.link}>고객 지원</Text></Link>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 28, paddingBottom: 48, gap: 18, maxWidth: 680, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.navy },
  heading: { fontSize: 17, fontWeight: '600', color: colors.navy, marginTop: 12 },
  body: { fontSize: 15, lineHeight: 26, color: colors.navy },
  button: { backgroundColor: colors.navy, padding: 16, borderRadius: 12, minHeight: 52, alignItems: 'center' },
  buttonText: { color: colors.paper, fontSize: 16, fontWeight: '600' },
  link: { color: colors.navy, fontSize: 15, lineHeight: 26, textDecorationLine: 'underline' },
});
