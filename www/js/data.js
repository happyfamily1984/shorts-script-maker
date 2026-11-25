/* 숏드라마 대본메이커 기본 데이터
   대본 본문은 dramas.js(tools/dramas/data 에서 생성), 히트작 벤치마킹은 hits.js 와 깃허브 저장소에서 온다. */
'use strict';

/* 도파민 주제 20. punch = 무엇이 통쾌한가, beats = 이 주제의 6샷 공식 */
const THEMES = [
  { id:'hidden', name:'정체 숨긴 재벌', en:'Hidden Billionaire', icon:'crown', hue:42, punch:'깔보던 사람이 정체를 알고 얼어붙는 순간', tags:['hiddenidentity','billionaire','ceo'] },
  { id:'gapjil', name:'갑질 참교육', en:'Karen Gets Schooled', icon:'bolt', hue:8, punch:'갑질하던 사람이 더 큰 권한 앞에서 무너진다', tags:['karma','instantkarma','customerservice'] },
  { id:'guardian', name:'숨은 고수가 약자를 구함', en:'The Quiet Protector', icon:'shield', hue:218, punch:'만만하게 본 상대가 압도적인 강자였다', tags:['protector','hero','justice'] },
  { id:'affair', name:'불륜 응징', en:'Cheater Exposed', icon:'flame', hue:350, punch:'증거가 가장 공개적인 자리에서 터진다', tags:['cheater','revenge','exposed'] },
  { id:'comeback', name:'버림받고 성공해 돌아옴', en:'The Comeback', icon:'rocket', hue:262, punch:'버린 사람이 주인공 앞에 을로 선다', tags:['comeback','revenge','glowup'] },
  { id:'inlaws', name:'시댁·처가 무시 역전', en:'In-Laws Regret', icon:'home', hue:28, punch:'천대하던 집안이 한순간에 태도를 바꾼다', tags:['inlaws','family','regret'] },
  { id:'bully', name:'학폭 가해자 응징', en:'Bully Meets Karma', icon:'target', hue:196, punch:'그때의 약자가 가해자의 운명을 쥐고 있다', tags:['bully','karma','reunion'] },
  { id:'divorce', name:'이혼 후 역전', en:'After the Divorce', icon:'exit', hue:286, punch:'버린 배우자가 후회하지만 이미 늦었다', tags:['divorce','regret','exhusband'] },
  { id:'karma', name:'선행의 보답', en:'Kindness Pays Back', icon:'gift', hue:150, punch:'도와준 사람이 인생을 바꿔 줄 거물이었다', tags:['kindness','karma','heartwarming'] },
  { id:'scam', name:'사기꾼 역관광', en:'Scammer Gets Played', icon:'eye', hue:172, punch:'호구인 줄 알았던 상대가 전문가였다', tags:['scammer','exposed','justice'] },
  { id:'master', name:'숨은 실력자', en:'The Hidden Master', icon:'star', hue:48, punch:'허드렛일하던 사람이 전설급 실력을 보인다', tags:['hiddentalent','genius','respect'] },
  { id:'heir', name:'출생의 비밀·진짜 상속자', en:'The True Heir', icon:'key', hue:330, punch:'가짜가 누리던 자리가 한순간에 바뀐다', tags:['heiress','trueheir','secret'] },
  { id:'rebirth', name:'회귀 복수', en:'Second Chance Revenge', icon:'refresh', hue:246, punch:'배신자의 수를 알고 한 발 앞서 무너뜨린다', tags:['rebirth','secondchance','revenge'] },
  { id:'contract', name:'계약 결혼·정체 숨긴 배우자', en:'Secret Billionaire Spouse', icon:'heart', hue:340, punch:'무시하던 사람들 앞에서 배우자가 정체를 드러낸다', tags:['contractmarriage','billionairehusband','romance'] },
  { id:'credit', name:'공 가로챈 상사 응징', en:'Credit Thief Exposed', icon:'trophy', hue:204, punch:'발표장에서 질문 하나에 무너진다', tags:['office','toxicboss','exposed'] },
  { id:'family', name:'돈만 밝히는 가족 참교육', en:'Greedy Relatives', icon:'users', hue:16, punch:'호구로 보던 주인공이 판을 뒤집는다', tags:['greedyfamily','inheritance','karma'] },
  { id:'makeover', name:'외모 무시에서 변신 역전', en:'The Glow-Up', icon:'sparkle', hue:300, punch:'비웃던 사람들이 못 알아보고 매달린다', tags:['glowup','makeover','regret'] },
  { id:'frame', name:'누명 벗기', en:'Framed No More', icon:'scale', hue:222, punch:'몰아세우던 사람이 화면 속 진범이다', tags:['framed','truth','justice'] },
  { id:'audition', name:'면접·오디션 실력 한 방', en:'They Laughed Until', icon:'mic', hue:96, punch:'비웃던 심사위원이 일어나 박수 친다', tags:['audition','talent','underdog'] },
  { id:'test', name:'위장 테스트', en:'The Undercover Boss', icon:'search', hue:186, punch:'친절했던 한 사람만 보상받는다', tags:['undercoverboss','test','kindness'] }
];

/* 6샷 구조 이름과 역할 */
const BEATS = [
  ['훅·굴욕', 'HOOK', '사건 한가운데서 시작. 악역의 공개 모욕과 독한 대사.'],
  ['고조', 'ESCALATION', '악역이 선을 넘는다. 주인공은 흔들리지 않는다.'],
  ['복선', 'THE HINT', '반전을 예고하는 작은 단서 하나.'],
  ['반전 공개', 'THE REVEAL', '진짜 정체·진실이 한 문장으로 드러난다.'],
  ['참교육', 'PAYBACK', '악역의 표정이 무너지고 대가를 치른다.'],
  ['클리프행어', 'CLIFFHANGER', '새 궁금증 하나로 끊는다.']
];

/* 카메라 코드 → [이름, 한국어 프롬프트 문구, 영어 프롬프트 문구] */
const CAMS = {
  cu: ['얼굴 클로즈업', '얼굴 클로즈업, 미세한 표정 변화가 보이게', 'Tight close-up on the face, subtle micro-expressions'],
  ms: ['미디엄 샷', '허리 위 미디엄 샷, 고정 카메라', 'Medium shot from the waist up, locked-off camera'],
  ws: ['와이드 샷', '장소 전체가 보이는 와이드 샷, 고정 카메라', 'Wide establishing shot of the location, locked-off camera'],
  pi: ['천천히 다가감', '인물 쪽으로 천천히 다가가는 카메라', 'Slow push-in toward the subject'],
  cz: ['급속 줌', '얼굴로 빠르게 치고 들어가는 급속 줌', 'Fast dramatic crash zoom onto the face'],
  ots: ['어깨 너머', '상대 어깨 너머로 잡은 샷', 'Over-the-shoulder shot'],
  low: ['로우앵글', '아래에서 올려다보는 로우앵글, 위엄 있는 구도', 'Low-angle hero shot looking up, powerful framing'],
  trk: ['따라가기', '걷는 인물을 옆에서 따라가는 트래킹 샷', 'Lateral tracking shot following the walking subject'],
  rx: ['구경꾼 반응', '충격받은 구경꾼들의 표정을 잡는 반응 컷', 'Reaction cut on shocked bystanders, wide eyes and open mouths'],
  slo: ['슬로모션', '슬로모션, 머리카락과 옷자락이 천천히 움직임', 'Slow motion, hair and fabric moving gently']
};

/* 영상 스타일 → [이름, 한국어, 영어] */
const STYLES = {
  real: ['실사 드라마', '실사 영화 같은 드라마 화면, 얕은 심도, 자연스러운 피부 질감, 드라마틱한 조명', 'photorealistic cinematic TV drama look, shallow depth of field, natural skin texture, dramatic lighting'],
  glossy: ['화려한 재벌 드라마', '화려하고 고급스러운 재벌 드라마 화면, 따뜻한 금빛 조명, 선명한 색감', 'glossy high-end billionaire drama look, warm golden lighting, rich saturated colors'],
  webtoon: ['웹툰 애니', '선이 깔끔한 웹툰 애니메이션 스타일, 선명한 색, 셀 셰이딩', 'clean-line webtoon anime style, vivid colors, cel shading'],
  toon3d: ['3D 애니', '부드러운 3D 애니메이션 영화 스타일, 풍부한 표정', 'soft stylized 3D animated film style, expressive faces']
};

/* 인물 분위기(모드별 기본값). 사용자가 설정에서 바꿀 수 있다 */
const CAST_DEFAULT = { kr: '한국인', en: 'American' };
const ROLE_NAME = { H: '주인공', V: '악역', A: '조력자', X: '주변 인물' };
const NEG = { kr: '흐릿함, 얼굴 왜곡, 손가락 기형, 인물 얼굴 바뀜, 옷 바뀜, 화면 속 글자, 자막, 워터마크, 로고, 인물 추가, 깜빡임', en: 'blurry, distorted face, deformed hands, extra fingers, face changing, outfit changing, on-screen text, subtitles, watermark, logo, extra people, flicker' };

/* 자막 언어 */
const SUB_LANGS = [['ko', '한국어'], ['en', '영어'], ['ja', '일본어'], ['es', '스페인어'], ['pt', '포르투갈어'], ['id', '인도네시아어'], ['th', '태국어'], ['vi', '베트남어'], ['hi', '힌디어'], ['ar', '아랍어'], ['fr', '프랑스어'], ['de', '독일어'], ['zh', '중국어']];

/* 안내: 히트 공식 / 제작 가이드 / 채널 운영 */
const INFO = [
  { id:'formula', name:'히트 공식', icon:'flame', items:[
    ['첫 3초에 굴욕이나 위기를 던진다', '세계적으로 터진 숏드라마는 인사나 배경 설명 없이 사건 한가운데서 시작합니다. 누군가 공개적으로 모욕당하는 장면은 "저 사람이 어떻게 갚아 줄까"라는 질문을 만듭니다.', '실전: 1샷은 악역의 독한 대사와 얼굴 급속 줌으로 엽니다.'],
    ['분노를 쌓고, 한 번에 터뜨린다', '시청자는 악역이 선을 넘을수록 더 큰 보상을 기대합니다. 2샷까지 쌓고 4~5샷에서 정체 공개와 대가로 풉니다. 쌓는 구간이 길면 이탈하고, 짧으면 통쾌함이 약해집니다.', '실전: 30초 한 편 기준 쌓기 10초, 단서 5초, 터뜨리기 10초, 끊기 5초.'],
    ['신분이 뒤집히는 그림을 보여 준다', '가장 많이 반복되는 장면은 무시하던 사람이 고개를 숙이는 순간입니다. 말로 설명하지 않고 허리 숙인 비서, 굳은 얼굴, 꺾이는 무릎으로 보여 줍니다.', '실전: 4샷은 로우앵글로 주인공을 크게, 5샷은 악역 얼굴 클로즈업.'],
    ['구경꾼의 반응이 통쾌함을 키운다', '주변 사람들의 놀란 표정과 수군거림은 시청자의 감정을 대신 표현해 줍니다. 히트작에는 반응 컷이 거의 빠지지 않습니다.', '실전: 5샷에 구경꾼 반응 컷을 넣거나, 5샷 뒤에 2초짜리 반응 컷을 추가합니다.'],
    ['대사는 짧고 인용하고 싶게', '한 샷에 한 줄, 5초 안에 끝나는 대사가 댓글과 공유를 부릅니다. 반전 대사는 호칭 하나로 끝나는 경우가 많습니다.', '예: "회장님, 왜 여기 계십니까!"'],
    ['매 편을 궁금한 곳에서 끊는다', '숏드라마의 수익과 조회수는 다음 화로 넘어가는 비율에서 나옵니다. 사건이 풀린 직후 새 인물이나 더 큰 비밀을 한 컷 보여 주고 끊습니다.', '실전: 6샷은 대사 없이 의미심장한 등장 하나로 끝냅니다.'],
    ['악역은 밉게, 주인공은 품위 있게', '주인공이 같이 소리 지르면 통쾌함이 줄어듭니다. 침착한 주인공과 요란한 악역의 대비가 클수록 반전이 큽니다.', '실전: 주인공 대사는 낮고 짧게, 악역 대사는 크고 빠르게.'],
    ['제목은 사건을 그대로 말한다', '히트작 제목은 은유가 아니라 상황 요약입니다. 누가 누구에게 무엇을 했는지가 제목에 들어갑니다.', '예: "청소부를 무시한 본부장", "The Janitor They Mocked"'],
    ['한 시리즈는 한 가지 통쾌함만 판다', '채널이 여러 감정을 섞으면 시청자가 무엇을 기대할지 모릅니다. 주제 하나로 시리즈를 이어 가면 다음 편을 예측하며 기다립니다.', '실전: 같은 주제 대본 10편을 한 시리즈로 묶어 EP 번호를 붙입니다.']
  ]},
  { id:'make', name:'제작 가이드', icon:'film', items:[
    ['전체 순서', '① 대본을 고르고 고칩니다. ② 인물 탭에서 전신 이미지 프롬프트를 복사해 그록이나 챗GPT에서 인물 이미지를 만듭니다. ③ 그 이미지를 클링의 참조 이미지(Elements)로 등록합니다. ④ 영상 탭의 샷별 프롬프트로 5초 영상을 만듭니다. ⑤ 편집 앱에서 이어 붙이고 자막 파일을 넣습니다.', '한 편은 6샷, 약 30초입니다.'],
    ['인물 이미지는 전신·정면·단색 배경으로', '참조 이미지가 깔끔할수록 영상에서 얼굴과 옷이 유지됩니다. 전신 1장과 얼굴 클로즈업 1장을 같은 인물로 만들어 두면 안정적입니다.', '옷을 바꾸고 싶으면 인물 설명에서 복장만 고치고 프롬프트를 다시 만드세요.'],
    ['같은 인물은 같은 이미지로', '샷마다 인물 이미지를 새로 만들면 얼굴이 달라집니다. 한 번 만든 인물 이미지를 모든 샷에서 참조로 씁니다.', '시리즈 전체에서 주인공 이미지는 하나만 씁니다.'],
    ['첫 프레임 이미지를 먼저 만들면 구도가 고정된다', '샷마다 "첫 프레임 프롬프트"로 장면 스틸을 만들고, 클링의 이미지→영상에 넣으면 구도와 배경이 흔들리지 않습니다. 이때 영상 프롬프트에는 움직임과 대사만 적으면 됩니다.', '이미지에 이미 보이는 것을 다시 설명하지 않습니다.'],
    ['한 샷에는 동작 하나, 카메라 움직임 하나', '5초 안에 큰 동작과 격한 카메라 이동을 함께 넣으면 화면이 깨집니다. 이 앱의 대본은 샷마다 동작 하나로 쓰여 있습니다.', '10초가 필요하면 샷을 둘로 나누세요.'],
    ['대사와 립싱크', '클링 최신 모델은 프롬프트에 적은 대사를 음성으로 만들고 입 모양을 맞춥니다. 국내용은 한국어, 해외용은 영어 대사가 프롬프트에 들어갑니다. 쓰는 모델이 음성을 지원하지 않으면 별도 음성 도구로 더빙하세요.', '지원 언어와 길이 제한은 모델마다 다르니 클링 화면에서 확인하세요.'],
    ['멀티샷으로 한 번에 만들기', '멀티샷을 지원하는 모델에서는 "멀티샷 프롬프트"를 통째로 넣어 여러 샷을 한 번에 만들 수 있습니다. 길이 제한이 15초인 모델은 앞 3샷, 뒤 3샷으로 나눈 프롬프트를 쓰세요.', '결과가 흔들리면 샷별 생성으로 돌아갑니다.'],
    ['생성이 거부될 때', '폭력, 흉기, 노출, 실존 인물, 브랜드 로고가 들어가면 거부되기 쉽습니다. 이 앱의 대본은 지위와 증거로 응징하도록 쓰여 있지만, 수정하다가 거부되면 해당 표현을 순화하세요.', '예: "때린다" → "손을 뿌리친다", "밀친다" → "막아선다"'],
    ['세로 9:16, 자막은 화면 가운데 아래', '숏폼 화면은 아래쪽과 오른쪽에 버튼이 겹칩니다. 자막은 화면 아래 4분의 1 지점보다 위에 둡니다.', '자막 탭에서 SRT 파일을 내보내 편집 앱에 넣습니다.']
  ]},
  { id:'channel', name:'채널 운영', icon:'road', items:[
    ['새 채널은 천천히 시작한다', '만든 지 얼마 안 된 채널이 하루에 많은 영상을 한꺼번에 올리면 스팸으로 분류되어 노출이 막힐 수 있습니다. 처음 1~2주는 하루 1~2편, 일정한 시간에 올리는 편이 안전합니다.', '기준: 첫 2주 하루 1~2편 → 반응이 잡히면 하루 2~3편. 한 번에 몰아서 올리지 않습니다.'],
    ['한 채널에는 한 가지 주제', '채널이 무엇을 주는지 알고리즘과 시청자 모두 빨리 알아야 합니다. 처음 30편은 같은 주제(예: 정체 숨긴 재벌)로 올리세요.', '다른 주제는 반응을 본 뒤 시리즈를 따로 만들어 시험합니다.'],
    ['국내용과 해외용 채널은 분리한다', '언어가 섞인 채널은 어느 나라 시청자에게 보여 줄지 정해지지 않습니다. 한국어 채널과 영어 채널을 따로 만들고, 같은 대본을 각 언어판으로 올립니다.', '이 앱의 상단 국내용·해외용 전환이 이 구분에 맞춰져 있습니다.'],
    ['시리즈로 묶고 번호를 붙인다', '제목 끝에 EP.1, EP.2를 붙이고 재생목록으로 묶으면 다음 편으로 이어 보는 비율이 올라갑니다. 고정 댓글에 다음 편 예고 한 줄을 적습니다.', '한 편이 터지면 같은 설정의 속편을 바로 올립니다.'],
    ['AI로 만든 영상임을 표시한다', '유튜브, 틱톡, 인스타그램은 사실처럼 보이는 AI 생성 영상에 표시를 요구합니다. 업로드 화면의 "변경되거나 합성된 콘텐츠" 항목을 켜세요. 표시하지 않으면 제재를 받을 수 있습니다.', '플랫폼 정책은 자주 바뀌니 업로드 전에 공식 안내를 확인하세요.'],
    ['반복적인 대량 생산 콘텐츠로 보이지 않게', '틀만 같고 내용이 거의 같은 영상을 대량으로 올리면 수익 창출이 거절될 수 있습니다. 대본을 그대로 쓰지 말고 인물, 배경, 대사를 내 것으로 고치세요.', '같은 대본을 여러 채널에 그대로 올리지 않습니다.'],
    ['남의 영상·음악·작품을 가져오지 않는다', '다른 숏드라마의 장면, 대사, 제목을 그대로 쓰면 삭제와 채널 경고로 이어집니다. 음악은 플랫폼이 제공하는 음원이나 사용 허가가 있는 음원만 씁니다.', '히트작에서는 공식(구조)만 배우고 내용은 새로 씁니다.'],
    ['실존 인물과 브랜드를 쓰지 않는다', '유명인의 얼굴, 실제 회사 이름과 로고는 초상권·상표권 문제가 됩니다. 인물은 가상의 인물로, 회사는 가상의 이름으로 만듭니다.', '인물 이미지를 만들 때 "누구와 닮게"라고 쓰지 않습니다.'],
    ['처음 100편은 지표를 본다', '조회수보다 시청 지속 시간과 다음 편으로 넘어간 비율을 봅니다. 10편 단위로 가장 잘된 편의 훅과 주제를 다음 10편에 반영합니다.', '첫 3초 이탈이 크면 1샷의 대사와 구도를 바꿉니다.'],
    ['같은 영상을 여러 플랫폼에 올릴 때', '쇼츠, 릴스, 틱톡에 함께 올리면 도달이 넓어집니다. 다른 플랫폼의 워터마크가 찍힌 파일은 노출이 줄 수 있으니 원본 파일을 올리세요.', '플랫폼마다 제목과 해시태그를 조금씩 다르게 씁니다.'],
    ['수익화 조건은 공식 안내로 확인한다', '수익 창출 조건(구독자 수, 조회수, 지역)은 플랫폼과 시기에 따라 달라집니다. 채널을 만들 때 각 플랫폼의 현재 조건을 확인해 두세요.', '조건을 채우기 전에도 시리즈 팬을 모으는 데 집중합니다.']
  ]}
];

/* 업로드 전 점검표 */
const CHECKLIST = [
  '1샷이 인사나 설명 없이 갈등으로 시작한다', '악역의 대사가 충분히 밉다', '주인공은 침착하다', '4샷에서 정체·진실이 한 문장으로 드러난다',
  '5샷에 악역의 무너지는 표정이 있다', '6샷이 궁금증으로 끊긴다', '모든 샷의 인물 얼굴과 옷이 같다', '자막이 화면 버튼에 가리지 않는다',
  '제목이 사건을 그대로 말한다', '시리즈 번호(EP)를 붙였다', 'AI 생성 콘텐츠 표시를 켰다', '실존 인물·브랜드·남의 음악이 없다'
];

/* 히트작 벤치마킹 기본 주소 (설정에서 바꿀 수 있다) */
const HITS_URL_DEFAULT = 'https://raw.githubusercontent.com/happyfamily1984/shorts-script-maker/main/hits/hits.json';
