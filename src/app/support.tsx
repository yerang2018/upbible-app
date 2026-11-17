import { Pressable } from '../components/Touch';
import { Link } from 'expo-router';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { colors, serif } from '../theme';

export default function Support() {
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>업바이블 고객 지원</Text>
      <Text style={styles.body}>사용 중 궁금한 점이나 오류가 있다면 문의해 주세요. 사용 중인 기기와 문제가 발생한 화면을 알려 주시면 확인에 도움이 됩니다. 성경 본문 오류는 책 이름과 장·절을 함께 알려 주세요.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('mailto:woonyoungja@gmail.com'); }}><Text selectable style={styles.link}>woonyoungja@gmail.com</Text></Pressable>
      <Text style={styles.body}>비밀번호·인증번호 등 민감한 정보는 보내지 마세요.</Text>
      <Text accessibilityRole="header" style={styles.heading}>다른 기기에서 기록을 이어 보려면</Text>
      <Text style={styles.body}>기존 기기의 내 계정에서 기록 동기화를 누른 뒤, 새 기기에서도 같은 로그인 방법과 계정으로 로그인하고 기록 동기화를 누르세요. 계정 기록과 기기 기록이 다르면 사용할 기록을 선택합니다.</Text>
      <Text accessibilityRole="header" style={styles.heading}>로그인 전 기록을 가져오려면</Text>
      <Text style={styles.body}>내 계정의 로그인 전 이 기기 기록 가져오기를 선택하세요. 기존 계정의 기기 기록을 백업한 뒤 비로그인 기록을 복사하며, 서버에 저장하려면 동기화를 눌러야 합니다.</Text>
      <Text accessibilityRole="header" style={styles.heading}>댓글은 다른 사람에게 보이나요?</Text>
      <Text style={styles.body}>개인 댓글은 다른 사용자에게 공개되지 않습니다. 로그인 없이 기기에 보관하거나 수동 동기화로 본인 계정에 저장할 수 있습니다.</Text>
      <Link href="/account"><Text style={styles.link}>로그인 및 내 계정</Text></Link>
      <Link href="/delete-account"><Text style={styles.link}>계정 삭제 안내 및 진행</Text></Link>
      <Link href="/privacy"><Text style={styles.link}>개인정보 처리 안내</Text></Link>
      <Link href="/"><Text style={styles.link}>성경 읽기로 돌아가기</Text></Link>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 28, paddingBottom: 48, gap: 18, maxWidth: 680, width: '100%', alignSelf: 'center' },
  title: { fontFamily: serif, fontSize: 26, color: colors.navy },
  heading: { fontSize: 17, fontWeight: '600', color: colors.navy, marginTop: 12 },
  body: { fontSize: 15, lineHeight: 26, color: colors.navy },
  link: { color: colors.navy, fontSize: 15, lineHeight: 26, textDecorationLine: 'underline' },
});
