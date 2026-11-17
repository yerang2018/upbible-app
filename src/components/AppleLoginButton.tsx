export type AppleLoginButtonProps = {
  disabled: boolean;
  onPress: () => Promise<void>;
};

// Apple의 네이티브 로그인 버튼은 iOS에서만 제공합니다.
export function AppleLoginButton(_props: AppleLoginButtonProps) {
  return null;
}
