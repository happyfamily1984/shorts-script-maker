# 인수인계 메모 (2026-11-27 기준, 앱 v2.7.0 / versionCode 39)

새 세션이 이 파일부터 읽으면 이어서 작업할 수 있습니다.

## 저장소·브랜치
- 앱: `happyfamily1984/shorts-script-maker` — 작업 브랜치 `ccr-b696e9f7-fudha3` (main에는 아직 합치지 않음)
- 유행 리포트: `happyfamily1984/short-form-report` (main, 매일 아침 6시 GitHub Actions)
- 앱이 순서 파일(kling/grok/pickle flow.json)을 `main`에서 읽으므로, main에 합치기 전에는 앱 설정의 "순서 업데이트"가 404가 난다. 지금은 순서 기본값이 `www/js/kling.js`에 들어 있어 APK에 포함된다.

## 서명 키 (git에 없음)
- `android/upload.jks`, `android/keystore.properties` 는 .gitignore 대상. 사용자에게 채팅으로 전달함(ShortDramaMaker-signing-key.zip).
- 새 세션에서 빌드하려면 사용자에게 받아 `android/` 에 다시 넣어야 한다. 키 SHA-256: `48:B2:97:11:81:40:E1:11:F8:5B:F5:30:D1:08:88:3B:C3:49:5A:56:3F:57:76:72:8A:AB:1D:51:7B:94:D3:61`
- 키가 없으면 같은 서명으로 업데이트할 수 없다(설치된 앱 덮어쓰기·플레이 업데이트 불가).

## 빌드
- `cd android && ./gradlew assembleRelease` (versionCode 매번 +1, 마지막 39 / 2.7.0)
- 대본 데이터: `python3 tools/dramas/check.py tools/dramas/data/*.json` → `python3 tools/dramas/build.py` (현재 22주제 2,200편)

## 사용자 결정 사항 (대화로 정한 것)
- 원클릭 구성(크레딧 절약): 핵심 2샷(4·5번)만 클링, 나머지 4샷은 그록 장면 이미지 + 천천히 확대. 한 편 약 60크레딧, 클링 월 3,300크레딧.
- 클링 모델: **비디오 생성 O1, 720p · 5s · 9:16 · 1개**(샷당 30크레딧). 1080p·10s는 비싸서 자동으로 바꾸거나 멈춘다.
- 업로드: "앱 직접 고르기" 또는 "피클에게 맡기기"(피클 = 텍스트로 지시하는 AI 에이전트 앱).
- 유행 리포트: 히트작 화면을 대체. 새로고침으로 short-form-report의 `trends/data/history.csv` → 날짜별 `analysis.json`·`raw.json` 을 읽는다. 한국/해외(미국·영어, 한국식 각색) 구분.
- 유행 형식 바꿔 쓰기: 원본의 등장인물·흐름·결말(왼쪽)과 내 입력(오른쪽)으로 새 대본 생성. 리포트 분석이 `cast`/`flow`/`ending`/`title_ko` 를 준다.
- 리포트 Gemini 키: Secrets `GEMINI_API_KEY`, `GEMINI_API_KEY_2`~`_5` (한도 차면 다음 키). 서로 다른 구글 클라우드 프로젝트 키여야 한도가 따로.

## 자동 입력(접근성) 현황 — 실제 화면 기록으로 맞춤
- 그록(`ai.x.grok`): 새 채팅 → 프롬프트 → "Generated Image" 대기(아래로 스크롤) → 열기 → "다운로드" → "닫기". 동작 확인됨.
- 클링(`kling.ai.video.chat`): 만들기 화면 확인 → 입력칸 펼치기 → O1·720p·5s 확인/자동 설정 → 앞 샷 사진 X → "+" → 앨범 "SDMRef" → 동그라미로 고르기 → "완료" → 프롬프트 → 생성. **생성까지 확인됨.**
- 클링 내려받기: 작품 목록에서 "[샷 N/6" 글자로 찾아 열기 → "다운로드" → 아래 창의 큰 "다운로드"(tv_download). v2.5.0 이후 실기기 미확인.
- 완성 영상 합치기(Media3): v2.5.1에서 장면 이미지를 클링 영상 바탕 위에 덮는 방식으로 바꿈. **실기기 미확인.**
- 피클: 공유로 보내기 우선, 실패 시 채팅 자동 입력(보내기 버튼 위치 추측).
- 화면 기록은 `다운로드/ShortDramaMaker/kling_screens_*.json` 에 자동 저장되고 앱에서 "바로 보내기".

## 남은 일
- 클링 내려받기·완성 영상 합치기 실기기 확인
- 추가 주제 2개 더 (21 라이더, 22 남녀갈등 다음)
- main 합치기 여부 결정
