import { Platform } from 'react-native';

// 실제 로그인 검증 전에는 정식 배포에서 계정 화면을 숨깁니다.
// 별도의 테스트 빌드에서만 명시적으로 켤 수 있습니다.
export const accountTestEnabled = __DEV__ ||
  (Platform.OS === 'web' && process.env.EXPO_PUBLIC_AUTH_TEST_MODE === 'true');
