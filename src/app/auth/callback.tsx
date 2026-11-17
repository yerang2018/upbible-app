import { Pressable } from '../../components/Touch';
import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { completeWebSignIn } from '../../services/account';
import { colors } from '../../theme';

// 인증 코드 교환은 account 서비스의 열린 인증 세션에서 한 번만 처리합니다.
// Router에도 복귀 경로를 등록해 Android에서 존재하지 않는 화면이 뜨지 않게 합니다.
export default function AuthCallback() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    completeWebSignIn().then(() => { if (active) router.replace('/account'); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (Platform.OS !== 'web') return <Redirect href={'/account'} />;
  return <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
    {failed ? <>
      <Text>로그인을 완료하지 못했습니다. 로그인 화면에서 다시 시도해 주세요.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/account')} style={{ padding: 16 }}><Text>돌아가기</Text></Pressable>
    </> : <><ActivityIndicator color={colors.navy} /><Text>로그인을 확인하고 있습니다.</Text></>}
  </View>;
}
