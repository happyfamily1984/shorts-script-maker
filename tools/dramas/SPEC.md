# 숏드라마 대본 데이터 규격 (한국어·영어 이중)

세로형 AI 숏드라마 제작 앱에 들어갈 대본을 쓴다. 사용자는 대본을 고르고, 인물 이미지를 만들고(그록·챗GPT), Kling으로 샷별 영상을 생성한다.
그래서 모든 샷은 "5초짜리 영상 한 컷"으로 바로 생성할 수 있어야 하고, 한국어판(국내용)과 영어판(해외용)이 같은 내용이어야 한다.

목표는 하나다. **첫 3초에 붙잡고, 30초 안에 도파민이 터지고, 다음 화를 누르게 만드는 것.**
ReelShort·DramaBox 같은 세계 히트 숏드라마의 공식을 그대로 쓴다.

## 히트 공식: 6샷 구조 (반드시 이 순서, 정확히 6샷)
1. **훅·굴욕** — 사건 한가운데서 시작. 악역이 주인공(또는 약자)을 공개적으로 모욕·무시하는 장면과 독한 대사. 설명·인사 금지.
2. **고조** — 악역이 선을 넘는다(더 심한 모욕, 물건 던지기, 쫓아내기, 구경꾼의 비웃음). 주인공은 흔들리지 않는다.
3. **복선** — 반전을 예고하는 작은 단서 하나(전화 한 통, 검은 카드, 낯익은 반지, 누군가의 다급한 등장, 화면에 뜬 이름).
4. **반전 공개** — 제3자의 등장이나 증거로 진짜 정체·진실이 한 문장으로 드러난다. 가장 강한 대사.
5. **참교육** — 악역의 표정이 무너지고 대가를 치른다(해고, 계약 파기, 무릎, 출입 금지, 경찰 인계, 공개 망신). 주인공의 통쾌한 한마디.
6. **클리프행어** — 끝났다고 생각한 순간 새 궁금증 하나(새 인물, 더 큰 비밀, 의미심장한 한마디)로 끊는다.

## 도파민 규칙
- 악역은 확실히 밉게, 주인공은 품위 있게. 시청자가 "빨리 혼내 줘"라고 느끼게 쌓고 4~5샷에서 터뜨린다.
- 신분·힘의 격차가 뒤집히는 순간이 핵심이다(무시하던 사람이 고개 숙이는 그림).
- 대사는 짧고 독하게. 한 샷에 대사 한 줄(없어도 됨). 한국어 28자 이내, 영어 14단어 이내. 5초 안에 말할 수 있어야 한다.
- 화면 묘사(행동)는 **눈에 보이는 동작 하나**만. 속마음·설명 금지. 한국어 45자 이내, 영어 22단어 이내.
- 100편이 서로 달라야 한다. 장소, 직업, 무시하는 이유, 반전의 방식, 대가를 계속 바꾼다. 같은 설정 반복 금지.
- 제목은 클릭을 부르게: 한국어 22자 이내, 영어 8단어 이내. (예: "청소부를 무시한 본부장", "The Janitor They Mocked")

## 세계 시장용 규칙
- 한국·서양 어디서 찍어도 통하는 설정만 쓴다(회사, 호텔, 레스토랑, 결혼식, 병원, 공항, 매장, 파티, 법원, 학교 동창회 등). 한국에만 있는 제도·명절·군대·은어 금지.
- 한국어판 인물 이름은 한국 이름(서윤, 태준 등), 영어판은 서양 이름(Grace, Derek 등). 100편 안에서 이름을 다양하게.
- 영어판은 번역투가 아니라 영어권 숏드라마처럼 자연스럽고 짧게. 영어 필드에는 한글을 넣지 않는다.

## AI 영상 생성(Kling) 안전 규칙 — 어기면 생성이 거부된다
- 피, 흉기, 총, 살인, 자해, 고문, 성적 묘사, 노출, 마약, 미성년자 연애·폭력 묘사 금지. 실존 인물·실제 브랜드명 금지.
- 응징은 폭력이 아니라 **지위·법·증거·공개 망신**으로 한다(해고, 체포, 계약 파기, 무릎 꿇기, 쫓겨남). 뺨 때리기 같은 직접 폭력도 쓰지 않는다. 물 끼얹기, 서류 던지기, 밀치기 정도까지만.
- 한 샷에 인물은 최대 3명이 화면 중심. 군중은 "뒤의 구경꾼들" 정도로만.

## 출력 형식
파일 하나에 대본 10편, JSON 배열. 대본 한 편은 아래 배열(순서 고정):
```
[
  "한국어 제목", "English Title",
  "한국어 한 줄 줄거리(60자 이내)", "English logline (max 25 words)",
  [  // 인물 2~4명. 역할코드 H=주인공, V=악역, A=조력자·반전을 알리는 사람, X=기타. H와 V는 반드시 1명 이상.
    ["H", "한국 이름", "English name", "한국어 외형·복장(나이대, 성별, 머리, 옷, 인상) 45자 이내", "English look & outfit, max 20 words"],
    ...
  ],
  [  // 정확히 6샷
    ["한국어 장소", "English place", "한국어 화면 묘사", "English visual action", 화자번호, "한국어 대사", "English line", "카메라코드"],
    ...
  ]
]
```
- 화자번호: 인물 배열의 순번(0부터). 대사가 없는 샷은 -1, 대사 두 칸은 빈 문자열 "".
- 화면 묘사에는 인물 이름을 쓴다(한국어판은 한국 이름, 영어판은 영어 이름).
- 외형·복장은 전신 이미지를 만들 수 있게 구체적으로(나이대, 성별, 머리 모양, 옷 색과 종류, 인상). 인종·국적은 쓰지 않는다(앱이 모드에 따라 붙인다).
- 카메라코드(하나만): `cu` 얼굴 클로즈업, `ms` 미디엄, `ws` 와이드(장소 소개), `pi` 천천히 다가감, `cz` 얼굴로 급속 줌, `ots` 어깨 너머, `low` 로우앵글(위엄), `trk` 따라가기, `rx` 구경꾼 반응 컷, `slo` 슬로모션.
  - 추천: 1샷 `cz`/`ms`, 4샷 `low`/`pi`/`slo`, 5샷 `cu`/`rx`, 6샷 `pi`/`cu`. 같은 코드만 반복하지 않는다.

## 예시 (정체 숨긴 재벌)
```
["청소부를 무시한 본부장", "The Janitor They Mocked",
 "신입 본부장이 로비 청소부에게 물을 끼얹는다. 그 청소부는 회사를 세운 회장이었다.", "A new director throws water on a lobby janitor, who turns out to be the company's founder.",
 [["H", "서윤", "Grace", "50대 여성, 회색 청소 유니폼, 단정히 묶은 머리, 차분하고 깊은 눈빛", "woman in her 50s, gray janitor uniform, neatly tied-back hair, calm deep eyes"],
  ["V", "태준", "Derek", "30대 남성, 몸에 붙는 남색 정장, 올백 머리, 거만한 미소", "man in his 30s, slim navy suit, slicked-back hair, arrogant smirk"],
  ["A", "한 실장", "Mr. Collins", "60대 남성, 검은 정장, 은발, 꼿꼿한 자세", "man in his 60s, black suit, silver hair, upright posture"]],
 [["회사 로비", "corporate lobby", "태준이 걸레질하던 서윤에게 컵의 물을 끼얹는다", "Derek flings a cup of water onto Grace as she mops the floor", 1, "눈 똑바로 뜨고 다녀, 청소부 주제에.", "Watch where you're going, janitor.", "cz"],
  ["회사 로비", "corporate lobby", "태준이 대걸레를 발로 차고 직원들이 뒤에서 웃는다", "Derek kicks her mop away while employees laugh behind him", 1, "내일부터 나오지 마. 넌 해고야.", "Don't come back tomorrow. You're fired.", "ms"],
  ["회사 로비", "corporate lobby", "서윤이 젖은 얼굴을 닦으며 낡은 휴대폰으로 전화를 건다", "Grace wipes her wet face and makes a call on an old phone", 0, "한 실장, 로비로 내려와요.", "Mr. Collins, come down to the lobby.", "cu"],
  ["회사 로비", "corporate lobby", "한 실장이 뛰어와 서윤 앞에 90도로 허리를 숙인다", "Mr. Collins rushes in and bows deeply in front of Grace", 2, "회장님, 왜 여기 계십니까!", "Madam Chairwoman, why are you here!", "low"],
  ["회사 로비", "corporate lobby", "태준의 얼굴이 하얗게 질리고 무릎이 꺾인다", "Derek's face turns pale and his knees give out", 0, "해고는 내가 하는 거예요. 당신부터.", "I do the firing here. Starting with you.", "cu"],
  ["회사 정문 앞", "outside the company entrance", "검은 세단에서 내린 낯선 남자가 서윤을 보고 미소 짓는다", "A stranger steps out of a black sedan and smiles at Grace", -1, "", "", "pi"]]]
```

## 검사
파일을 쓰면 `python3 /home/user/shorts-script-maker/tools/dramas/check.py <파일경로>` 로 검사하고, 오류 0개가 될 때까지 고친다.
