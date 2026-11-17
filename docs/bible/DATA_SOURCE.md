# 성경 66권의 데이터 출처

확인일: 2026-11-09. 사용자 요청에 따라 확정된 디자인에 개역한글 66권 전체를 포함합니다.

## 번역본과 배포 고지

- 번역본: 성경전서 개역한글판, 대한성서공회, 1961.
- 공식 안내: https://www.bskorea.or.kr/bbs/content.php?co_id=subpage2_3_4_1
- 공식 안내 표에서 개역한글판의 저작재산권 보호기간 만료일을 2011-12-31로 확인했습니다.
- 역본명·저작자 표기를 유지하고 본문 문자열을 임의로 교정·현대화하거나 다른 역본을 섞지 않습니다.
- 공식 출처 표기: https://bible.bskorea.or.kr/copyright_notice

## 공개 전자 데이터

- 저장소: https://github.com/thiagobodruk/bible
- 원본 파일: `json/ko_krv.json` (Korean Revised).
- 고정 버전: `98a52a5439c1cfe566676e8508795834424a5f3a`
- 원본 URL: https://raw.githubusercontent.com/thiagobodruk/bible/98a52a5439c1cfe566676e8508795834424a5f3a/json/ko_krv.json
- 원본 SHA-256: `5b76e6372773aca94806042de7874d2ae9e1f45b581bf5d0f2b3d0fb12e93d49`
- 전자 데이터 저장소의 MIT 고지는 `THIRD_PARTY_LICENSE.txt`에 그대로 보존했습니다.
- 저장소의 MIT 고지와 원 번역본의 권리는 구분합니다. 다른 역본의 이용 권한까지 확보했다는 뜻이 아닙니다.
- `upstream-README.md`는 내려받은 시점의 배포 설명을 보존한 문서입니다.

`scripts/import-bible.mjs`는 원본 해시를 먼저 확인하고, 66권을 원본 순서대로 추출합니다.
JSON 포맷은 다시 직렬화하지만 각 절의 문자열과 절 순서는 변경하지 않습니다.
앱에는 창세기부터 요한계시록까지 포함합니다. 다시 가져오기 외에는 외부 성경 API를 호출하지 않습니다.

## 검사 범위와 한계

- 66권, 1,189장, 원본 절 번호 기준 31,103개 항목.
- 요한3서 1장은 이 KRV 배포본에서 15절입니다. KJV의 14절 기준으로 임의 병합하지 않습니다.
  확인: https://www.bible.com/bible/88/3JN.1.KRV
- 사도행전 8:37의 `(없음)` 및 합절 안내 등 원본 항목을 삭제하지 않아 이후 절 번호가 밀리지 않습니다.
  확인: https://www.bible.com/bible/88/ACT.8.KRV
- 66권의 기대 장 수·장별 절 수는 해시로 고정한 배포 원본에서 기록한 값이며 독립적인 정본 전수 대조 값이 아닙니다.
- 각 장의 절 수, 순서, 빈 문자열, 문자 깨짐, HTML 흔적, 검토한 추출 파일 해시를 검사합니다.
- 표본 대조: 창세기 1:1, 1:2, 1:31을 배포 기관의 KRV 표시와 대조했습니다.
  대조 페이지: https://www.bible.com/bible/88/GEN.1.KRV
- 이 검사는 원본에서 추출한 뒤 문자열이 바뀌지 않았는지와 데이터 구조를 확인합니다.
  **66권의 구조와 고정 원본 일치를 검사했으며, 대한성서공회 정본 전체와 단어별 대조를 끝낸 것은 아닙니다.**
- 원 저장소도 크롤링 과정의 인코딩·구문 오류 가능성을 고지합니다.
  오탈자가 의심되면 해당 절의 정본과 대조하고 근거와 변경 내역을 기록한 뒤 수정합니다.
- 장별 절 수가 맞는 것만으로 모든 단어의 정확성이 증명되지는 않습니다.

## 글꼴과 아이콘

- 글꼴: 나눔명조 Regular. https://github.com/google/fonts/tree/main/ofl/nanummyeongjo
- 라이선스: SIL Open Font License 1.1. `assets/fonts/OFL.txt` 보존 및 앱의 출처 화면에 원문 표시.
- 글꼴 SHA-256: `7ed9e8653a8ed04285d51dc343ffea6eb3d9c73afc27383ea8929ee4ffd03205`
- 선 아이콘은 `src/components/LineIcon.tsx`에서 직접 작성한 SVG 도형입니다.
- 참고 앱의 이미지·로고·사진·스크린샷은 앱에 포함하지 않았습니다.
