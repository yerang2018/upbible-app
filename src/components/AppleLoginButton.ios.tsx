import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import type { AppleLoginButtonProps } from './AppleLoginButton';

export function AppleLoginButton({ disabled, onPress }: AppleLoginButtonProps) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Constants.expoConfig?.extra?.appleSignInDisabled) return;
    let active = true;
    AppleAuthentication.isAvailableAsync().then(value => { if (active) setAvailable(value); })
      .catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, []);
  if (!available) return null;
  return <View pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.5 : 1 }}>
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={14}
      style={{ width: '100%', height: 52 }}
      onPress={() => { void onPress(); }}
    />
  </View>;
}
