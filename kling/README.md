# 클링 자동 입력 순서 (flow.json)

앱의 "클링으로 보내기"는 이 파일의 순서대로 클링 앱을 조작한다. 앱 설정의 "순서 업데이트"를 누르면 이 파일을 다시 읽으므로, 클링 앱이 바뀌어도 APK를 새로 만들 필요가 없다.

- `start` → 샷마다 (`shot` → `between`) → `end`
- 단계: `unless{find,steps}`(대상이 이미 있으면 건너뛰고 없으면 steps 실행), `launch`, `wait{ms}`, `waitFor{find}`, `waitGone{find}`, `click{find}`, `longClick{find}`, `clickEach{find,count}`, `setText{find,value}`, `tap{x,y}`(화면 비율 0~1), `swipe{x1,y1,x2,y2,ms}`, `scrollTo{find}`, `back`
- `click` 에 `orTap{x,y}` 를 주면 대상을 못 찾았을 때 그 화면 위치를 누른다
- 공통: `say`(진행 막대 문구), `timeout`(ms), `optional`(못 찾아도 계속), `if`(`imageCount`, `autoGenerate`, 앞에 `!` 붙이면 반대), `after`(단계 뒤 대기 ms)
- `find`: `text`, `desc`, `any`(글자 또는 설명), `id`(뷰 id 끝부분), `cls`(클래스 끝부분), `pkg`, `editable`, `clickable`, `area`([왼,위,오른,아래] 비율), `minW`(dp), `index`(몇 번째, 음수는 뒤에서)
  - 글자 비교는 대소문자 무시 포함 검색, 앞에 `=`를 붙이면 완전히 같을 때만
- 값 치환: `${prompt}`, `${neg}`, `${shot}`, `${total}`, `${imageCount}`, `${duration}`
- 사진은 샷마다 사진 앱의 `Pictures/ShortDramaMaker` 에 1초 간격으로 저장되며, 첫 번째 인물이 가장 최신(맨 앞)이 된다.

`verified: false` 인 동안은 클링 화면을 보지 않고 쓴 추측 순서다. 앱 설정의 "클링 화면 기록"으로 만든 파일을 받아 실제 버튼에 맞춘다.
