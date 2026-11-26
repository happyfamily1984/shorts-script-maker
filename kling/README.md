# 자동 입력 순서 (kling/flow.json, grok/flow.json, pickle/flow.json)

앱의 "클링으로 보내기"는 kling/flow.json, "그록으로 생성"은 grok/flow.json 의 순서대로 그 앱을 조작한다. 그록 순서는 끝에 `returnApp` 으로 이 앱에 돌아오고, 앱은 그 사이 갤러리에 새로 저장된 사진을 인물 칸에 첨부한다. "피클에게 업로드 맡기기"는 먼저 완성 영상과 지시문을 피클 앱에 바로 공유하고, 피클이 공유를 받지 않으면 pickle/flow.json 순서로 피클 채팅에 지시문(`${prompt}`)을 입력해 보낸다. 앱 설정의 "순서 업데이트"를 누르면 이 파일을 다시 읽으므로, 클링 앱이 바뀌어도 APK를 새로 만들 필요가 없다.

- `start` → 샷마다 (`shot` → `between`) → (원클릭 제작일 때) `collectStart` → 샷마다 `collect` → `collectEnd` → `end`
- `collect` 는 생성이 끝난 영상을 샷 순서대로 내려받는 단계. `find.index` 에 `${ri}`(뒤에서부터 순번: 최신 목록에서 먼저 넣은 샷이 아래에 있을 때) 또는 `${i0}`(0부터 순번)를 쓸 수 있다
- 단계: `returnApp`(이 앱으로 돌아오기), `repeat{count,steps,until}`(until 대상이 보이면 바로 끝냄)(steps를 count번 반복, 안에서 `${k}`=0부터 순번, `${rk}`=거꾸로 순번), `unless{find,steps}`(대상이 이미 있으면 건너뛰고 없으면 steps 실행), `when{find,steps}`(대상이 보이면 steps 실행), `launch`, `wait{ms}`, `waitFor{find}`, `waitGone{find}`, `click{find}`, `longClick{find}`, `clickEach{find,count}`, `setText{find,value}`, `tap{x,y}`(화면 비율 0~1), `tapIn{find,rx,ry}`(찾은 칸 안의 상대 위치 0~1), `swipe{x1,y1,x2,y2,ms}`, `scrollTo{find}`, `back`
- `click` 에 `orTap{x,y}` 를 주면 대상을 못 찾았을 때 그 화면 위치를 누른다
- 공통: `say`(진행 막대 문구), `timeout`(ms), `optional`(못 찾아도 계속), `fail`(못 찾으면 멈추며 보여 줄 문구), `if`(`imageCount`, `autoGenerate`, 앞에 `!` 붙이면 반대), `after`(단계 뒤 대기 ms)
- `find`: `text`, `desc`, `any`(글자 또는 설명), `id`(뷰 id 끝부분), `cls`(클래스 끝부분), `pkg`, `editable`, `clickable`, `area`([왼,위,오른,아래] 비율), `minW`(dp), `index`(몇 번째, 음수는 뒤에서)
  - 글자 비교는 대소문자 무시 포함 검색, 앞에 `=`를 붙이면 완전히 같을 때만
- 값 치환: `${i0}`, `${ri}`, `${prompt}`, `${neg}`, `${shot}`, `${total}`, `${imageCount}`, `${duration}`
- 사진은 샷마다 사진 앱의 `Pictures/ShortDramaMaker` 에 1초 간격으로 저장되며, 첫 번째 인물이 가장 최신(맨 앞)이 된다.

`verified: false` 인 동안은 클링 화면을 보지 않고 쓴 추측 순서다. 앱 설정의 "클링 화면 기록"으로 만든 파일을 받아 실제 버튼에 맞춘다.
