/* 자동 입력 기본 순서. 저장소 kling/flow.json, grok/flow.json, pickle/flow.json 과 같은 내용 */
'use strict';
const KLING_FLOW_DEFAULT = {
 "version": "1.0-partial",
 "verified": false,
 "note": "홈 '창작 시작'은 스크린샷으로, 만들기 화면은 2026-11-26 화면 기록(kling.ai.video.chat)으로 확인: 사진 추가 id kling_omni_asset_add, 모드 '비디오 생성·4.0'(omni_edit_preview_cur_model), 길이·화질 omni_edit_ratio_value, 생성 버튼 id omni_edit_preview_submit(글자 없이 크레딧 숫자만). 사진 고르기 화면, 생성 뒤 애셋 화면은 아직 추측. 2026-11-26 기록 3: '창작 시작' 뒤 화면('기본 창작')은 입력칸이 접힌 상태(omni_edit_preview_text)라 눌러서 펼쳐야 '+'와 프롬프트 칸이 나온다. 같은 화면 위쪽에 작품 목록('작품 없음')이 있다. 기록 4: 클링이 이미 '기본 창작' 화면에서 열리면 '창작 시작'이 없다. 만들기 화면 표시는 id omni_edit_preview_submit(접힘·펼침 모두 있음). 기록 5: 사진을 고르면 '사용' 버튼(글자 '사용', 아래쪽 넓은 버튼)이 있는 확인 화면이 뜬다. 사진은 한 장씩: + → 사진 → 사용 을 장수만큼 반복. 사진 목록 화면 자체는 아직 기록 없음(추측). 스크린샷(2026-11-26): 사진 고르기는 '갤러리' 탭, 첫 칸은 '카메라 촬영', 그 뒤로 최신 사진 순. 여러 장 동그라미 선택 후 아래 초록 '완료 N' 버튼(글자에 숫자가 붙음). 넣은 사진은 '이미지 1', '이미지 2'로 표시됨. 모델 '비디오 생성·4.0'은 1080p·10s 150크레딧, '2.5 Turbo'는 720p·5s 15크레딧(스타트/엔드 프레임 방식). 스크린샷 2: 사진을 누르면 '사용' 화면 → 사용 누르면 한 장 추가. 샷마다 사진이 쌓여(이미지 1~4) 앞 샷 사진을 먼저 지워야 함(카드 오른쪽 위 X, 약 x0.18 y0.308). 쓰기로 한 모델: '비디오 생성·01' 720p·5s 30크레딧(여러 장 참조 가능). 0.9: 캡처는 상태바·내비게이션 바가 잘려 비율 좌표가 어긋남 → X는 첫 사진 카드(kling_omni_asset_card) 안 상대 위치(오른쪽 위 0.81, 0.19)로 누름. 기록 6: 모델 글자는 '비디오 생성·O1'(영문 O). 0크레딧 표시 대신 '생성' 글자(omni_submit_btn_text)가 보일 때도 있음. 1080p 선택 가능.",
 "package": "kling.ai.video.chat",
 "after": 900,
 "start": [
  {
   "do": "launch",
   "say": "클링 앱 여는 중"
  },
  {
   "do": "wait",
   "ms": 3500
  },
  {
   "do": "unless",
   "say": "만들기 화면인지 확인",
   "find": {
    "id": "omni_edit_preview_submit"
   },
   "timeout": 2500,
   "steps": [
    {
     "do": "click",
     "say": "창작 시작 누르기",
     "find": {
      "any": [
       "창작 시작",
       "Create",
       "Start creating"
      ]
     },
     "timeout": 4000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 2000
    },
    {
     "do": "unless",
     "say": "만들기 화면인지 확인",
     "find": {
      "id": "omni_edit_preview_submit"
     },
     "timeout": 2000,
     "steps": [
      {
       "do": "back",
       "say": "이전 화면으로"
      },
      {
       "do": "wait",
       "ms": 1500
      },
      {
       "do": "click",
       "say": "창작 시작 누르기",
       "find": {
        "any": [
         "창작 시작",
         "Create",
         "Start creating"
        ]
       },
       "timeout": 4000,
       "optional": true
      },
      {
       "do": "wait",
       "ms": 2000
      },
      {
       "do": "unless",
       "say": "만들기 화면인지 확인",
       "find": {
        "id": "omni_edit_preview_submit"
       },
       "timeout": 2000,
       "steps": [
        {
         "do": "back",
         "say": "이전 화면으로"
        },
        {
         "do": "wait",
         "ms": 1500
        },
        {
         "do": "click",
         "say": "창작 시작 누르기",
         "find": {
          "any": [
           "창작 시작",
           "Create",
           "Start creating"
          ]
         },
         "timeout": 6000
        },
        {
         "do": "wait",
         "ms": 2000
        }
       ]
      }
     ]
    }
   ]
  }
 ],
 "shot": [
  {
   "do": "unless",
   "say": "동영상 모드인지 확인",
   "find": {
    "any": [
     "동영상 생성",
     "영상 생성",
     "비디오 생성",
     "Video Generation",
     "AI Video"
    ]
   },
   "timeout": 1500,
   "steps": [
    {
     "do": "click",
     "say": "모드 메뉴 열기",
     "find": {
      "any": [
       "이미지 생성",
       "Image Generation"
      ]
     },
     "timeout": 5000
    },
    {
     "do": "wait",
     "ms": 1200
    },
    {
     "do": "click",
     "say": "동영상 생성 고르기",
     "find": {
      "any": [
       "동영상 생성",
       "영상 생성",
       "비디오 생성",
       "동영상",
       "Video"
      ]
     },
     "timeout": 5000
    },
    {
     "do": "wait",
     "ms": 1500
    }
   ]
  },
  {
   "do": "unless",
   "say": "입력칸 펼치기",
   "find": {
    "id": "kling_omni_asset_add"
   },
   "timeout": 1500,
   "steps": [
    {
     "do": "click",
     "say": "입력칸 누르기",
     "find": {
      "id": "omni_edit_preview_text"
     },
     "orTap": {
      "x": 0.5,
      "y": 0.885
     },
     "timeout": 5000
    },
    {
     "do": "wait",
     "ms": 1500
    }
   ]
  },
  {
   "do": "waitFor",
   "say": "모델 확인 (비디오 생성·01)",
   "find": {
    "id": "omni_edit_preview_cur_model",
    "any": [
     "O1",
     "01",
     "o1"
    ]
   },
   "timeout": 3000,
   "fail": "클링 모델이 '비디오 생성·01'이 아닙니다. 클링에서 모델을 01로 바꾼 뒤 다시 시작하세요 (비싼 모델로 크레딧이 낭비되지 않게 멈췄습니다)"
  },
  {
   "do": "waitFor",
   "say": "길이 확인 (720p · 5s)",
   "find": {
    "id": "omni_edit_ratio_value",
    "text": "720p",
    "any": [
     "5s",
     "5초"
    ]
   },
   "timeout": 3000,
   "fail": "클링 화질·길이가 '720p · 5s'가 아닙니다. 1080p나 10초는 크레딧이 더 듭니다. 클링에서 720p · 5s로 바꾼 뒤 다시 시작하세요"
  },
  {
   "do": "repeat",
   "say": "앞 샷 사진 지우기",
   "count": "9",
   "steps": [
    {
     "do": "unless",
     "say": "앞 샷 사진 지우기",
     "find": {
      "id": "kling_omni_asset_add",
      "area": [
       0,
       0,
       0.22,
       1
      ]
     },
     "timeout": 700,
     "steps": [
      {
       "do": "tapIn",
       "say": "사진 X 누르기",
       "find": {
        "id": "kling_omni_asset_card",
        "index": 0
       },
       "rx": 0.81,
       "ry": 0.19,
       "timeout": 2000
      },
      {
       "do": "wait",
       "ms": 700
      }
     ]
    }
   ]
  },
  {
   "do": "repeat",
   "say": "사진 넣기",
   "count": "${imageCount}",
   "if": "imageCount",
   "steps": [
    {
     "do": "click",
     "say": "사진 넣기(+) 누르기",
     "find": {
      "id": "kling_omni_asset_add"
     },
     "orTap": {
      "x": 0.13,
      "y": 0.336
     },
     "timeout": 5000
    },
    {
     "do": "wait",
     "ms": 2000
    },
    {
     "do": "click",
     "say": "방금 저장한 사진 고르기",
     "find": {
      "cls": "ImageView",
      "area": [
       0,
       0.12,
       1,
       0.95
      ],
      "minW": 60,
      "index": "${rk}"
     },
     "timeout": 8000
    },
    {
     "do": "wait",
     "ms": 1800
    },
    {
     "do": "click",
     "say": "사용 누르기",
     "find": {
      "any": [
       "=사용",
       "=Use",
       "완료",
       "=확인",
       "=선택",
       "=추가",
       "Done",
       "=OK"
      ]
     },
     "orTap": {
      "x": 0.5,
      "y": 0.88
     },
     "timeout": 6000
    },
    {
     "do": "wait",
     "ms": 2200
    }
   ]
  },
  {
   "do": "setText",
   "say": "프롬프트 입력",
   "find": {
    "editable": true,
    "pkg": "kling.ai.video.chat"
   },
   "value": "${prompt}",
   "timeout": 8000
  },
  {
   "do": "click",
   "say": "생성 누르기",
   "find": {
    "id": "omni_edit_preview_submit"
   },
   "timeout": 6000,
   "if": "autoGenerate",
   "orTap": {
    "x": 0.85,
    "y": 0.586
   }
  },
  {
   "do": "wait",
   "ms": 3500,
   "if": "autoGenerate"
  }
 ],
 "between": [
  {
   "do": "wait",
   "ms": 1500
  }
 ],
 "end": [],
 "collectStart": [
  {
   "do": "wait",
   "ms": 2000
  },
  {
   "do": "click",
   "say": "애셋 화면 열기",
   "find": {
    "any": [
     "=애셋",
     "=Assets",
     "=내 작품",
     "=My Creations"
    ]
   },
   "timeout": 4000,
   "optional": true
  },
  {
   "do": "wait",
   "ms": 2500
  },
  {
   "do": "waitGone",
   "say": "영상이 모두 만들어지길 기다리는 중 (몇 분 걸립니다)",
   "find": {
    "any": [
     "생성 중",
     "대기 중",
     "Generating",
     "Queued",
     "Processing"
    ]
   },
   "timeout": 1200000
  }
 ],
 "collect": [
  {
   "do": "click",
   "say": "${shot}번째 영상 열기",
   "find": {
    "cls": "ImageView",
    "minW": 120,
    "area": [
     0,
     0.12,
     1,
     0.9
    ],
    "index": "${ri}"
   },
   "timeout": 8000
  },
  {
   "do": "wait",
   "ms": 2000
  },
  {
   "do": "click",
   "say": "${shot}번째 영상 내려받기",
   "find": {
    "any": [
     "다운로드",
     "저장",
     "Download",
     "Save"
    ]
   },
   "timeout": 8000
  },
  {
   "do": "wait",
   "ms": 4000
  },
  {
   "do": "click",
   "say": "워터마크 없이 받기 고르기",
   "find": {
    "any": [
     "워터마크 없음",
     "워터마크 없이",
     "Without watermark",
     "No watermark"
    ]
   },
   "timeout": 2500,
   "optional": true
  },
  {
   "do": "wait",
   "ms": 3000
  },
  {
   "do": "back",
   "say": "목록으로",
   "optional": true
  },
  {
   "do": "wait",
   "ms": 1500
  }
 ],
 "collectEnd": [
  {
   "do": "returnApp",
   "say": "숏드라마 메이커로 돌아가 영상 합치기"
  }
 ]
};
const GROK_FLOW_DEFAULT = {
 "version": "0.4",
 "verified": false,
 "note": "2026-11-26 사용자 화면 기록(ai.x.grok) 두 장으로 확인: 채팅 화면(입력칸 id chat_text_input, '새 채팅 시작하기', 결과 이미지 'Generated Image'), 이미지 화면('닫기', '다운로드', '공유'). 그록이 이미지 화면에서 열려도 닫고 채팅으로 돌아간다. 0.4: 장면 이미지 여러 장을 한 번에 만들 수 있게 샷마다 새 채팅을 연다.",
 "package": "ai.x.grok",
 "after": 900,
 "start": [
  {
   "do": "launch",
   "say": "그록 앱 여는 중"
  },
  {
   "do": "wait",
   "ms": 3500
  },
  {
   "do": "unless",
   "say": "채팅 화면 확인",
   "find": {
    "id": "chat_text_input"
   },
   "timeout": 2500,
   "steps": [
    {
     "do": "click",
     "say": "이미지 화면 닫기",
     "find": {
      "any": [
       "=닫기",
       "=Close"
      ]
     },
     "timeout": 2000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1200
    },
    {
     "do": "unless",
     "say": "채팅 화면 확인",
     "find": {
      "id": "chat_text_input"
     },
     "timeout": 2000,
     "steps": [
      {
       "do": "back",
       "say": "이전 화면으로"
      },
      {
       "do": "wait",
       "ms": 1200
      }
     ]
    }
   ]
  },
  {
   "do": "wait",
   "ms": 1500
  }
 ],
 "shot": [
  {
   "do": "click",
   "say": "새 채팅 열기",
   "find": {
    "any": [
     "새 채팅 시작하기",
     "새 채팅",
     "New chat",
     "New Chat"
    ]
   },
   "timeout": 4000,
   "optional": true
  },
  {
   "do": "wait",
   "ms": 1500
  },
  {
   "do": "setText",
   "say": "이미지 프롬프트 입력",
   "find": {
    "id": "chat_text_input"
   },
   "value": "${prompt}",
   "timeout": 10000
  },
  {
   "do": "wait",
   "ms": 600
  },
  {
   "do": "click",
   "say": "보내기 누르기",
   "find": {
    "any": [
     "보내기",
     "전송",
     "Send",
     "Submit"
    ]
   },
   "timeout": 5000
  },
  {
   "do": "wait",
   "ms": 4000
  },
  {
   "do": "waitFor",
   "say": "이미지가 만들어지길 기다리는 중",
   "find": {
    "desc": "Generated Image"
   },
   "timeout": 150000
  },
  {
   "do": "wait",
   "ms": 4000
  },
  {
   "do": "click",
   "say": "만들어진 이미지 열기",
   "find": {
    "desc": "Generated Image",
    "index": -1
   },
   "timeout": 5000
  },
  {
   "do": "wait",
   "ms": 2000
  },
  {
   "do": "click",
   "say": "이미지 다운로드",
   "find": {
    "any": [
     "=다운로드",
     "=Download",
     "=저장",
     "=Save"
    ]
   },
   "timeout": 8000
  },
  {
   "do": "wait",
   "ms": 3500
  },
  {
   "do": "click",
   "say": "이미지 화면 닫기",
   "find": {
    "any": [
     "=닫기",
     "=Close"
    ]
   },
   "timeout": 3000,
   "optional": true
  },
  {
   "do": "wait",
   "ms": 800
  }
 ],
 "between": [],
 "end": [
  {
   "do": "returnApp",
   "say": "숏드라마 메이커로 돌아가기"
  }
 ]
};
const PICKLE_FLOW_DEFAULT = {
 "version": "0.1-guess",
 "verified": false,
 "note": "피클 채팅 화면(아래 '메시지 보내기' 입력칸, 마이크·전화 버튼)은 사용자 스크린샷으로 확인함. 보내기 버튼 위치는 추측.",
 "package": "",
 "after": 800,
 "start": [
  {
   "do": "launch",
   "say": "피클 앱 여는 중"
  },
  {
   "do": "wait",
   "ms": 3000
  }
 ],
 "shot": [
  {
   "do": "setText",
   "say": "지시문 입력",
   "find": {
    "editable": true
   },
   "value": "${prompt}",
   "timeout": 8000
  },
  {
   "do": "wait",
   "ms": 800
  },
  {
   "do": "click",
   "say": "보내기 누르기",
   "find": {
    "any": [
     "=보내기",
     "=전송",
     "=Send",
     "메시지 전송"
    ]
   },
   "orTap": {
    "x": 0.895,
    "y": 0.893
   },
   "timeout": 3000
  },
  {
   "do": "wait",
   "ms": 1500
  }
 ],
 "between": [],
 "end": []
};
