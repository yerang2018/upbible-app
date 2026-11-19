# 업바이블 — AI 인수인계 문서

이 파일은 Claude, 라이너, ChatGPT 등 어떤 AI 도구든 이 프로젝트를 바로 이어받을 수 있도록 정리한 문서입니다.
작업 규칙은 `AGENTS.md`, 화면·기능 상세는 `README.md`, 출시 진행 기록은 `docs/release/출시_진행상황.md`를 함께 읽으세요.

@AGENTS.md

## 사용자

- 예랑님(존댓말, 코딩 경험 없음). 설명은 쉬운 한국어로, 명령어는 그대로 복사해 붙여 넣을 수 있게 안내합니다.
- 코드 수정은 AI가 하고, 아이폰 반영(케이블 연결·설치)은 예랑님 맥북에서 합니다.

## 앱 목적

개역한글 성경 66권·1,189장을 인스타그램 쇼츠처럼 한 절씩 세로로 넘겨 읽는 앱입니다.
좋아요·저장·개인 댓글·이미지 카드 공유, 네이버·카카오 로그인과 수동 기록 동기화(Supabase)를 제공합니다.

## 구조

- Expo SDK 58 + React Native 0.88 + TypeScript, Expo Router.
- `src/app/` 화면(라우트), `src/screens/` 쇼츠·MY 화면 본체, `src/components/` UI 조각,
  `src/domain/` 순수 로직과 테스트(`*.test.mjs`), `src/services/` 로그인·동기화, `src/data/` 성경 원문(`krv.json`)과 노출 범위.
- `supabase/` 서버(DB) 설정, `scripts/` 성경 데이터 가져오기·검사, `plugins/` 무료 Apple 개인 팀용 설정 플러그인.
- `ios/`, `android/`는 자동 생성 폴더라서 GitHub에 올리지 않습니다. 직접 수정하지 말고 `app.json`·`app.config.ts`에서 설정합니다.
- `.env.local`(Supabase 공개 주소·공개 키 2개)은 GitHub에 올리지 않습니다. 새 컴퓨터에서는 예랑님 맥북의 파일을 복사해야 합니다.
- `output/`(빌드 결과·스크린샷, 약 460MB)도 GitHub에 올리지 않습니다.

## 현재 상태 (2026-11-20 기준)

- iPhone 13에 무료 Apple 개인 팀으로 서명한 독립 실행 앱 설치 완료. 네이버 로그인·재실행 유지 확인.
- **무료 설치 프로필은 2026-11-24 오전 10:18(한국 시각)에 만료** → 그 전후로 다시 빌드·설치해야 합니다.
- 최신 UI 수정(배경 6종, MY 설정, 글자 크기 본문 전용, 눌림 효과 등)과 새 쇼츠 아이콘(입체 책+재생 표시)을 2026-11-20 iPhone 13에 업데이트 설치·실행 완료. 실제 화면·기록 유지는 예랑님 확인 대기.
- 임시 제작 폴더 `/private/tmp/upbible-ios-20261117`은 재시동 시 사라짐. 다시 만드는 방법은 출시 진행상황 문서 2026-11-20 항목 참고.
- Android 테스트 APK 제작 완료(링크는 출시 진행상황 문서). 실제 갤럭시 로그인은 미검증.
- 공개 웹 체험판 v6 운영 중(README 참고). 네이버 운영 검수 2026-11-16 접수, 승인 대기.
- Apple 로그인은 코드만 있고 Supabase 쪽 비활성화 상태. 회원 탈퇴 실제 검증 미완료.

## 남은 작업 (우선순위)

1. 최신 UI를 아이폰에 설치해 예랑님 확인 받기.
2. 11월 24일 프로필 만료 전후 재설치.
3. 네이버 검수 결과 확인, 카카오 로그인 실기기 확인, 기기 간 동기화 확인.
4. Apple Developer 유료 가입 후 Apple 로그인·TestFlight 준비.
5. 임시 계정으로 회원 탈퇴 전 과정 검증, 개인정보처리방침 확정, 스토어 등록 자료.
자세한 내용: `docs/release/출시_진행상황.md`의 "다음 순서".

## 수정 후 확인 명령

```bash
npm install          # 처음 한 번
npx tsc --noEmit     # 타입 검사
npx expo lint        # 코드 검사
npm test             # 도메인 테스트
npm run bible:check  # 성경 데이터 검사
```

## 아이폰에서 실행하는 방법 (예랑님 맥북)

1. GitHub에서 최신 코드를 받습니다(터미널):
   ```bash
   cd '/Users/cheon-yerang/Documents/ChatGPT/창업/malsseum-feed'
   git pull
   npm install
   ```
2. **빠른 미리보기(케이블 불필요)**: `npm start` → 터미널 QR 코드를 아이폰 카메라로 비춤 → Expo Go로 열기. 맥북과 아이폰은 같은 와이파이.
3. **독립 실행 앱 설치(케이블 필요)**: 아이폰을 케이블로 연결하고 잠금 해제 → `npm run ios:standalone`.
   처음이거나 만료 후라면 Xcode에서 Signing & Capabilities → Team을 본인 Personal Team으로 선택하고,
   아이폰 설정 → 일반 → VPN 및 기기 관리에서 개발자 앱을 신뢰합니다.
   참고: 이전에는 한글 경로 문제를 피하려고 `/private/tmp/upbible-ios-20261117`에 복사본을 만들어 빌드했습니다. 이 임시 폴더는 맥 재시동 시 사라질 수 있으며, 빌드가 실패하면 같은 방식으로 영문 경로에 복사해 빌드합니다.

## 클라우드 AI(라이너·웹 Claude)로 작업할 때

클라우드 AI는 아이폰에 직접 설치할 수 없습니다. 흐름은 다음과 같습니다.
1. AI가 GitHub 저장소 코드를 수정해 올립니다(커밋·푸시).
2. 예랑님이 맥북에서 `git pull` 후 위 "아이폰에서 실행하는 방법"의 2번 또는 3번을 실행합니다.
작업이 끝나면 AI는 이 파일의 "현재 상태"와 `docs/release/출시_진행상황.md`를 갱신합니다.

## GitHub 저장소

- https://github.com/yerang2018/malsseum-feed (private). 맥북의 이 폴더는 이미 연결되어 있어 `git pull`, `git push`가 바로 됩니다(GitHub CLI는 `~/.local/bin/gh`).
