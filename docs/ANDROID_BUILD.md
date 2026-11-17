# 안드로이드 설치용 빌드 준비

- 기존 말씀피드와 같은 코드·디자인·66권 데이터를 사용합니다.
- 앱 식별자: `com.kangducheol.malsseumfeed`
- 버전: 1.0.0 / versionCode 1
- Expo 프로젝트: @kangducheol/malsseum-feed
- EAS preview 설정: internal 배포, APK 출력.
- 기기에서 읽은 위치·좋아요·저장·댓글은 각 기기의 AsyncStorage에 저장합니다.
- 외부 빌드 업로드에서 환경변수 파일·서명 파일·이전 설치 파일을 제외하도록 `.easignore`를 설정했습니다.

## 확인 결과

2026-11-09: TypeScript·lint 검사 및 Android JavaScript/Hermes 코드 생성 통과.
APK 생성 및 다운로드 파일 압축 무결성·필수 구성 검사를 통과했습니다.
안드로이드 실기기·에뮬레이터의 화면과 조작 검증은 아직 완료하지 않았습니다.
사용자가 코드·성경·글꼴의 Expo 업로드를 명시적으로 승인하여 원격 빌드를 시작했습니다.
빌드: https://expo.dev/accounts/kangducheol/projects/malsseum-feed/builds/4d33dcc9-4f0b-46d5-8d5a-24a88159c9f1
Play Store 등록은 진행하지 않았습니다.

## 완료된 APK

- 상태: FINISHED
- 완료: 2026-11-09 03:13 KST
- 다운로드: https://expo.dev/artifacts/eas/9RyigHozmqr7sFXMXqloHouRPpH43KFEAixg6uUnQwk.apk
- 보관: `output/android/malsseum-feed-1.0.0.apk`
- SHA-256: `9623d181897ed84eda9e919ac5fba06be13e1ed8eacecc3e8a136e1a8d4a93c7`
