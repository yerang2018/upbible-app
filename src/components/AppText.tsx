import { Text, TextInput } from 'react-native';
import type { TextProps, TextInputProps } from 'react-native';

// 본문 크기는 VerseStory에서만 적용합니다. 화면 조작부의 크기는 고정합니다.
export function AppText(props: TextProps) {
  return <Text {...props} allowFontScaling={false} />;
}
export function AppTextInput(props: TextInputProps) {
  return <TextInput {...props} allowFontScaling={false} />;
}
