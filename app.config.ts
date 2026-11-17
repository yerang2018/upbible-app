import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // .env.local은 업로드에서 제외하므로 원격 빌드의 공개 연결 설정을 별도로 확인합니다.
  if (process.env.EAS_BUILD === 'true') {
    const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length) throw new Error(`로그인 연결 설정이 없는 빌드입니다. Expo 환경에 등록해 주세요: ${missing.join(', ')}`);
  }
  if (process.env.UPBIBLE_IOS_PERSONAL_TEAM === '1') {
    // 무료 Personal Team은 Apple 로그인 capability를 서명할 수 없습니다.
    // 직접 설치하는 테스트 앱에만 적용하고 기본 출시 설정은 유지합니다.
    return {
      ...config,
      ios: { ...config.ios, usesAppleSignIn: false },
      plugins: [
        ...(config.plugins?.filter(plugin =>
          (typeof plugin === 'string' ? plugin : plugin[0]) !== 'expo-apple-authentication') ?? []),
        './plugins/with-personal-team-ios.cjs',
      ],
      extra: { ...config.extra, appleSignInDisabled: true },
    } as ExpoConfig;
  }
  return config as ExpoConfig;
};
