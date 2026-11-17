## 사용자가 정한 현재 수정 범위

- 최신 사용자 요청에 따라 확정된 디자인을 개역한글 성경 전체 66권·1,189장에 적용합니다.
- 원본 성경 데이터와 기존 저장 기록은 유지하고, 노출 범위는 `src/data/reading-scope.ts`에서 제한합니다.
- 글자 크기는 1·2·3단계로 제공하며 구절 길이에 관계없이 고정합니다. 4단계는 사용자 요청으로 제거했습니다. 한 화면에 맞지 않는 긴 구절은 가로 페이지로 나누며 본문 세로 스크롤은 사용하지 않습니다.
- 2026-11-17 최신 요청: 글자 크기 선택은 성경 본문에만 적용합니다. 버튼·메뉴·탭·선택 박스 크기는 고정합니다. 배경 선택과 MY 설정, 터치 반응 효과를 추가합니다.
- 선택창은 위쪽 막대를 아래로 끌어 닫을 수 있습니다. 오른쪽 위는 초성 책 검색·장절 선택으로 이동합니다. 본문 한 번 탭으로 앞뒤 문맥을 열지 않습니다(최신 요청으로 제거). 두 번 탭 좋아요는 유지합니다.
- 긴 구절의 가로 넘김을 유지하고 맨 위에 인스타그램 스토리 형태의 분할 진행 막대를 표시합니다. 구절 사이 이동은 기존 세로 넘김을 유지하며 자동 넘김은 사용하지 않습니다.
- 본문은 화면 가로 중앙에 놓고 오른쪽 동작 버튼 때문에 치우치지 않게 합니다.
- 좋아요·댓글·저장·공유 버튼은 화면 높이와 관계없이 오른쪽 세로 배치를 유지합니다.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
