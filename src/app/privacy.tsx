import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineIcon } from '../components/LineIcon';
import { colors } from '../theme';

export default function Privacy() {
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>개인정보 안내</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" style={styles.close}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><LineIcon name="close" /></Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>기기에 저장하는 정보</Text>
      <Text style={styles.paragraph}>읽던 위치, 글자 크기, 좋아요와 저장한 구절, 구절별 댓글을 이 기기에 저장합니다. 댓글은 다른 사용자에게 공개되지 않습니다.</Text>
      <Text style={styles.heading}>로그인과 계정 기록</Text>
      <Text style={styles.paragraph}>네이버·카카오 로그인에서 동의한 이용자 식별자를 Supabase 인증 서비스로 전달하여 업바이블 계정을 구분합니다. iPhone의 Apple 로그인을 사용하는 경우 Apple 이용자 식별자와 동의한 이메일(이메일 가리기 주소 포함)을 인증 서비스에 전달합니다. 서비스 자체 비밀번호는 받지 않습니다. 웹의 로그인 상태는 현재 브라우저 탭에 보관하며 탭을 닫으면 다시 로그인해야 할 수 있습니다.</Text>
      <Text style={styles.paragraph}>내 계정에서 기록 동기화를 누르면 읽던 위치, 좋아요, 저장한 구절, 개인 댓글, 글자 크기를 Supabase의 계정별 저장소에 전송합니다. 로그인만으로 기존 비로그인 기록을 올리지는 않습니다. 댓글은 다른 사용자에게 공개되지 않습니다. 계정별로 기록을 분리하며 서버에 보관된 기록은 다른 기기에서 같은 계정으로 불러올 수 있습니다.</Text>
      <Text style={styles.heading}>회원 탈퇴와 연결 해제</Text>
      <Text style={styles.paragraph}>내 계정의 회원 탈퇴에서 확인하면 업바이블 계정과 서버에 동기화된 기록을 삭제합니다. 현재 기기의 해당 계정 기록과 내부 백업도 삭제합니다. 다른 기기나 브라우저에 남은 사본, 비로그인 기록, 직접 공유한 사본은 별도로 삭제해야 합니다. 서비스 제공자의 백업·보안 로그 보관은 해당 서비스 정책을 따릅니다.</Text>
      <Text style={styles.paragraph}>업바이블 계정 삭제와 별도로 네이버·카카오 설정에 남은 서비스 연결을 해제할 수 있습니다. 다시 로그인하면 새 업바이블 계정이 생성될 수 있습니다.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://nid.naver.com/user2/help/externalAuth?lang=ko_KR'); }}><Text style={styles.paragraph}>네이버 계정의 연결 서비스 관리</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://accounts.kakao.com'); }}><Text style={styles.paragraph}>카카오계정 관리 → 연결된 서비스</Text></Pressable>
      <Text style={styles.heading}>공유 기능</Text>
      <Text style={styles.paragraph}>공유하기를 선택하면 성경 구절과 출처가 기기의 공유 기능을 통해 사용자가 선택한 앱이나 수신처에 전달됩니다. 이후 정보 처리는 선택한 서비스의 정책을 따릅니다.</Text>
      <Text style={styles.heading}>기록 삭제와 백업</Text>
      <Text style={styles.paragraph}>좋아요와 저장은 각 항목에서 취소할 수 있으며 댓글은 해당 구절의 댓글 화면에서 삭제할 수 있습니다. 설치 앱을 삭제하거나 웹 브라우저의 사이트 데이터를 지우면 해당 기기에 저장된 기록이 삭제됩니다. 서버에 동기화한 기록은 회원 탈퇴 전까지 계정에 남습니다. 기기 백업에서의 복원 여부는 기기 설정에 따라 달라질 수 있으며, 다른 앱에 공유한 사본은 별도로 관리해야 합니다.</Text>
      <Text style={styles.heading}>문의</Text>
      <Text selectable style={styles.paragraph}>woonyoungja@gmail.com</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.navy, flexShrink: 1 },
  close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 28, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '600', color: colors.navy, marginTop: 24, marginBottom: 10 },
  paragraph: { fontSize: 14, lineHeight: 24, color: colors.navy },
});
