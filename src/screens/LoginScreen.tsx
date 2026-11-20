import { useState } from 'react';
import { Link, Redirect, router } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText as Text } from '../components/AppText';
import { Pressable } from '../components/Touch';
import { loginUnavailableReason, signInWithProvider } from '../services/account';
import { useReader } from '../state/ReaderState';
import { colors, serif } from '../theme';

type Provider = 'custom:naver' | 'kakao';

export default function LoginScreen() {
  const reader = useReader();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const unavailable = loginUnavailableReason();
  const disabled = busy || !reader.ready || reader.storageError || Boolean(unavailable);

  if (reader.ready && reader.userId) return <Redirect href="/" />;

  async function login(provider: Provider) {
    setBusy(true);
    setMessage('');
    try {
      const result = await signInWithProvider(provider);
      if (result === 'redirecting') return;
      if (result === 'cancelled') setMessage('로그인을 취소했습니다.');
      else router.replace('/');
    } catch {
      setMessage('로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const button = (label: string, provider: Provider, backgroundColor: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => { void login(provider); }}
      style={[styles.providerButton, { backgroundColor }, disabled && styles.disabled]}
    >
      <Text style={styles.providerButtonText}>{label}</Text>
    </Pressable>
  );

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} bounces={false}>
      <View style={styles.brand}>
        <Image
          accessibilityLabel="업바이블 로고"
          source={require('../../assets/branding/upbible-icon.png')}
          style={styles.logo}
        />
        <Text accessibilityRole="header" style={styles.name}>업바이블</Text>
        <Text style={styles.tagline}>숏폼 말고,{'\n'}하나님 말씀을 내리는 시간</Text>
        <Text style={styles.description}>네이버 또는 카카오로 로그인하고 말씀 기록을 이어 보세요.</Text>
      </View>

      <View style={styles.actions}>
        {button('네이버로 로그인', 'custom:naver', '#03C75A')}
        {button('카카오로 로그인', 'kakao', '#FEE500')}
        {!reader.ready && <ActivityIndicator accessibilityLabel="로그인 상태 확인 중" color={colors.navy} />}
        {reader.storageError && <Text accessibilityLiveRegion="polite" style={styles.notice}>기기 기록을 확인하지 못했습니다. 기존 기록을 보존하기 위해 앱을 다시 열어 주세요.</Text>}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text> : null}
        <Link href="/privacy" asChild>
          <Pressable accessibilityRole="link" style={styles.privacy}>
            <Text style={styles.privacyText}>개인정보 처리 안내</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFCFC' },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 28 },
  brand: { alignItems: 'center', paddingTop: 28 },
  logo: { width: 92, height: 92, borderRadius: 24, backgroundColor: '#FFFFFF' },
  name: { color: colors.navy, fontFamily: serif, fontSize: 30, fontWeight: '700', marginTop: 18 },
  tagline: { color: colors.navy, fontFamily: serif, fontSize: 22, lineHeight: 34, textAlign: 'center', marginTop: 24 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  actions: { gap: 12, paddingTop: 36 },
  providerButton: { minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  providerButtonText: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  notice: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  privacy: { alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  privacyText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
