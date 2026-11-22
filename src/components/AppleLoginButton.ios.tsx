import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { AppText as Text } from './AppText';
import { Pressable } from './Touch';
import type { AppleLoginButtonProps } from './AppleLoginButton';

// 네이버·카카오 버튼과 같은 크기·글자로 맞춘 Apple 로그인 버튼입니다. Apple 디자인 지침(검정 배경, Apple 로고, 흰 글자)을 따릅니다.
export function AppleLoginButton({ disabled, dimmed, onPress }: AppleLoginButtonProps) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Constants.expoConfig?.extra?.appleSignInDisabled) return;
    let active = true;
    AppleAuthentication.isAvailableAsync().then(value => { if (active) setAvailable(value); })
      .catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, []);
  if (!available) return null;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel="Apple로 로그인"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={() => { void onPress(); }}
    style={[styles.button, dimmed && styles.dimmed]}
  >
    <Text style={styles.text}>{'\uF8FF'}  Apple로 로그인</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: '#000000' },
  dimmed: { opacity: 0.55 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
