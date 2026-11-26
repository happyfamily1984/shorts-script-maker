# 다른 AI에게 대본 작성 맡기기

저장 위치 (깃허브):
- 저장소: `happyfamily1984/shorts-script-maker`
- 브랜치: `ccr-b696e9f7-fudha3` (main에 합친 뒤에는 `main`)
- 폴더: `tools/dramas/data/`
- 파일 이름: `<주제id>_<글자>_<번호>.json` — 파일 하나에 대본 정확히 10편
  - 예: `divorce_C_1.json`, `divorce_C_2.json` … `divorce_C_10.json`
  - `<글자>`는 작업 묶음 표시. A·B는 이미 쓰였으니 C부터 쓴다. 같은 주제를 두 AI에게 동시에 맡기면 한쪽은 C, 다른 쪽은 D를 준다.
  - 남은 개수와 다음 파일 이름은 `python3 tools/dramas/status.py` 로 확인한다.

다 모이면: `python3 tools/dramas/build.py` 로 `www/js/dramas.js` 를 다시 만들고 APK를 빌드한다(앱에 들어가는 단계).

---

## ① 저장소에 직접 접근하는 AI용 (Claude Code, Codex, Cursor 등)

아래 블록에서 `[주제id]`, `[글자]`, `[편수]`만 바꿔 붙여 넣는다. 한 번에 50편(파일 5개) 정도가 적당하다.

```
깃허브 저장소 happyfamily1984/shorts-script-maker 의 브랜치 ccr-b696e9f7-fudha3 에서 작업해.

1. 먼저 읽어:
   - tools/dramas/SPEC.md (대본 형식, 6샷 히트 공식, 도파민 규칙, 클링 안전 규칙, 예시)
   - tools/dramas/THEMES.md 에서 "## [주제id]" 부분
   - tools/dramas/data/[주제id]_*.json 이 이미 있으면 제목과 줄거리를 모두 읽고 같은 설정을 피해
2. 주제 [주제id] 의 숏드라마 대본 [편수]편을 한국어·영어로 새로 써.
   - 파일: tools/dramas/data/[주제id]_[글자]_1.json 부터, 파일 하나에 정확히 10편(JSON 배열)
   - 스크립트·템플릿으로 찍어 내지 말고 한 편씩 직접 써. 직업, 장소, 무시당하는 이유, 반전 장치, 응징 방식이 편마다 달라야 해.
   - 기존 히트작의 제목·인물 이름·대사를 베끼지 마. 공식만 따르고 내용은 새로 써.
3. 검사: python3 tools/dramas/check.py tools/dramas/data/[주제id]_[글자]_*.json --min [편수]
   "오류 0개"가 나올 때까지 고쳐.
4. tools/dramas/data/ 안의 네 파일만 커밋하고 같은 브랜치에 푸시해. 다른 파일은 건드리지 마.
5. 끝나면 편수와 검사 결과 한 줄만 보고해.
```

---

## ② 저장소에 못 들어가는 채팅 AI용 (챗GPT, 제미나이, 그록 등)

AI가 JSON 텍스트를 출력하면, 그 내용을 깃허브 웹에서 `tools/dramas/data/[주제id]_[글자]_[번호].json` 파일로 저장한다(Add file → Create new file). 한 번 요청에 10편씩 받는 것이 안전하다.
저장한 뒤 저장소에 접근하는 AI(①)에게 `check.py` 검사와 수정을 맡기면 된다.

```
너는 세계적으로 히트한 세로형 숏드라마(ReelShort, DramaBox 스타일) 전문 작가야.
AI 영상 생성기(Kling)로 바로 만들 수 있는 6샷 숏드라마 대본 10편을 한국어·영어로 써 줘. 모두 새로 만든 오리지널이어야 하고, 기존 작품의 제목·인물 이름·대사를 베끼면 안 돼.

[주제] [주제id] — [주제 이름]: [통쾌한 지점]
(아래 "주제 목록"에서 골라 이 줄을 채운다)

[6샷 히트 공식 — 반드시 이 순서, 정확히 6샷]
1. 훅·굴욕: 사건 한가운데서 시작. 악역이 주인공(또는 약자)을 공개적으로 모욕하는 장면과 독한 대사. 설명·인사 금지.
2. 고조: 악역이 선을 넘는다(더 심한 모욕, 물건 던지기, 쫓아내기, 구경꾼의 비웃음). 주인공은 흔들리지 않는다.
3. 복선: 반전을 예고하는 작은 단서 하나(전화 한 통, 검은 카드, 반지, 다급한 등장, 화면에 뜬 이름).
4. 반전 공개: 제3자의 등장이나 증거로 진짜 정체·진실이 한 문장으로 드러난다. 가장 강한 대사.
5. 참교육: 악역의 표정이 무너지고 대가를 치른다(해고, 계약 파기, 무릎, 출입 금지, 경찰 인계, 공개 망신).
6. 클리프행어: 끝났다고 생각한 순간 새 궁금증 하나(새 인물, 더 큰 비밀, 의미심장한 한마디)로 끊는다.

[규칙]
- 샷 하나 = 5초 영상 한 컷. 화면 묘사는 눈에 보이는 동작 하나(한국어 45자, 영어 22단어 이내). 대사는 한 줄(한국어 28자, 영어 14단어 이내), 없어도 된다. 대사 있는 샷이 4개 이상.
- 악역은 확실히 밉게, 주인공은 침착하고 품위 있게. 10편의 직업·장소·반전 장치·응징 방식을 모두 다르게.
- 설정은 한국과 해외 어디서나 통해야 한다(회사, 호텔, 레스토랑, 결혼식, 병원, 공항, 매장, 파티 등). 한국에만 있는 제도·명절·군대 금지.
- 한국어 칸은 한국 이름, 영어 칸은 서양 이름. 영어 칸에는 한글 금지. 영어는 번역투가 아니라 원어민 숏드라마 대사처럼.
- 인물 외형은 나이대, 성별, 머리, 옷 색과 종류, 인상까지(전신 이미지를 만들 수 있게). 인종·국적은 쓰지 않는다.
- 금지(영상 생성이 거부됨): 피, 흉기, 총, 살인, 자해, 성적 묘사, 노출, 마약, 미성년자, 실존 인물, 실제 브랜드, 뺨 때리기 같은 직접 폭력. 응징은 지위·법·증거·공개 망신으로. 영어로 slap, shoot, kill, blood, knife 같은 단어도 쓰지 않는다.
- 제목은 사건을 그대로 말하게: 한국어 22자, 영어 8단어 이내.

[출력 형식 — JSON 배열 하나만 출력, 설명 없이]
대본 한 편은 다음 6칸 배열이다:
["한국어 제목", "English Title", "한국어 한 줄 줄거리(60자 이내)", "English logline (max 25 words)",
 [ ["역할", "한국 이름", "English name", "한국어 외형·복장", "English look and outfit"], ... 2~4명 ],
 [ ["한국어 장소", "English place", "한국어 화면 묘사", "English visible action", 화자번호, "한국어 대사", "English line", "카메라코드"], ... 정확히 6개 ]
]
- 역할: H 주인공, V 악역, A 조력자(반전을 알리는 사람), X 기타. H와 V는 꼭 있어야 한다.
- 화자번호: 인물 배열의 순번(0부터). 대사가 없으면 -1 이고 대사 두 칸은 "".
- 카메라코드 하나: cu 얼굴 클로즈업, ms 미디엄, ws 와이드, pi 천천히 다가감, cz 급속 줌, ots 어깨 너머, low 로우앵글, trk 따라가기, rx 구경꾼 반응, slo 슬로모션. 같은 코드를 4번 이상 쓰지 않는다.

[예시 한 편]
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

이제 [주제]에 맞는 새 대본 10편을 위 형식의 JSON 배열 하나로만 출력해. 예시와 같은 설정은 쓰지 마.
(이어서 더 받을 때: "앞의 10편과 겹치지 않게 10편 더")
```

---

## 주제 목록 (② 프롬프트의 [주제] 줄에 넣는다)

| 주제id | 이름 | 통쾌한 지점 |
|---|---|---|
| hidden | 정체 숨긴 재벌 | 깔보던 사람이 정체를 알고 얼어붙는 순간 |
| gapjil | 갑질 참교육 | 갑질하던 사람이 더 큰 권한 앞에서 무너진다 |
| guardian | 숨은 고수가 약자를 구함 | 만만하게 본 상대가 압도적인 강자였다 |
| affair | 불륜 응징 | 증거가 가장 공개적인 자리에서 터진다 (성적 묘사 없이 사진·메시지·손잡기 수준) |
| comeback | 버림받고 성공해 돌아옴 | 버린 사람이 주인공 앞에 을로 선다 |
| inlaws | 시댁·처가 무시 역전 | 천대하던 집안이 한순간에 태도를 바꾼다 |
| bully | 학폭 가해자 응징 | 그때의 약자가 가해자의 운명을 쥐고 있다 (모두 성인, 과거 괴롭힘은 말로만) |
| divorce | 이혼 후 역전 | 버린 배우자가 후회하지만 이미 늦었다 |
| karma | 선행의 보답 | 도와준 사람이 인생을 바꿔 줄 거물이었다 |
| scam | 사기꾼 역관광 | 호구인 줄 알았던 상대가 전문가였다 |
| master | 숨은 실력자 | 허드렛일하던 사람이 전설급 실력을 보인다 |
| heir | 출생의 비밀·진짜 상속자 | 가짜가 누리던 자리가 한순간에 바뀐다 |
| rebirth | 회귀 복수 | 배신자의 수를 알고 한 발 앞서 무너뜨린다 (죽음 묘사 없이) |
| contract | 계약 결혼·정체 숨긴 배우자 | 무시하던 사람들 앞에서 배우자가 정체를 드러낸다 |
| credit | 공 가로챈 상사 응징 | 발표장에서 질문 하나에 무너진다 |
| family | 돈만 밝히는 가족 참교육 | 호구로 보던 주인공이 판을 뒤집는다 |
| makeover | 외모 무시에서 변신 역전 | 비웃던 사람들이 못 알아보고 매달린다 |
| frame | 누명 벗기 | 몰아세우던 사람이 화면 속 진범이다 |
| audition | 면접·오디션 실력 한 방 | 비웃던 심사위원이 일어나 박수 친다 |
| test | 위장 테스트 | 친절했던 한 사람만 보상받는다 |
| rider | 라이더 | 무시당하던 배달라이더가 정체·실력·정의로 판을 뒤집는다 (주인공은 모든 편에서 배달라이더, 교통사고·부상 장면 금지, 실제 배달 앱 이름 금지) |
| gender | 남녀갈등 | 혐오와 편견을 쏟아낸 사람이 증거와 실력 앞에서 무너진다 (남자 입장 gender_M_*, 여자 입장 gender_F_* 파일로 나눠 각 50편) |

주제별 자세한 변주 아이디어는 `tools/dramas/THEMES.md` 에 있다. 21번 이후 추가 주제(rider, gender)는 THEMES.md 맨 아래 규칙을 꼭 따른다.
