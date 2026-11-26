/* 자동 입력 기본 순서. 저장소 kling/flow.json, grok/flow.json, pickle/flow.json 과 같은 내용 */
'use strict';
const KLING_FLOW_DEFAULT = {
 "version": "1.9-partial",
 "verified": false,
 "note": "홈 '창작 시작'은 스크린샷으로, 만들기 화면은 2026-11-26 화면 기록(kling.ai.video.chat)으로 확인: 사진 추가 id kling_omni_asset_add, 모드 '비디오 생성·4.0'(omni_edit_preview_cur_model), 길이·화질 omni_edit_ratio_value, 생성 버튼 id omni_edit_preview_submit(글자 없이 크레딧 숫자만). 사진 고르기 화면, 생성 뒤 애셋 화면은 아직 추측. 2026-11-26 기록 3: '창작 시작' 뒤 화면('기본 창작')은 입력칸이 접힌 상태(omni_edit_preview_text)라 눌러서 펼쳐야 '+'와 프롬프트 칸이 나온다. 같은 화면 위쪽에 작품 목록('작품 없음')이 있다. 기록 4: 클링이 이미 '기본 창작' 화면에서 열리면 '창작 시작'이 없다. 만들기 화면 표시는 id omni_edit_preview_submit(접힘·펼침 모두 있음). 기록 5: 사진을 고르면 '사용' 버튼(글자 '사용', 아래쪽 넓은 버튼)이 있는 확인 화면이 뜬다. 사진은 한 장씩: + → 사진 → 사용 을 장수만큼 반복. 사진 목록 화면 자체는 아직 기록 없음(추측). 스크린샷(2026-11-26): 사진 고르기는 '갤러리' 탭, 첫 칸은 '카메라 촬영', 그 뒤로 최신 사진 순. 여러 장 동그라미 선택 후 아래 초록 '완료 N' 버튼(글자에 숫자가 붙음). 넣은 사진은 '이미지 1', '이미지 2'로 표시됨. 모델 '비디오 생성·4.0'은 1080p·10s 150크레딧, '2.5 Turbo'는 720p·5s 15크레딧(스타트/엔드 프레임 방식). 스크린샷 2: 사진을 누르면 '사용' 화면 → 사용 누르면 한 장 추가. 샷마다 사진이 쌓여(이미지 1~4) 앞 샷 사진을 먼저 지워야 함(카드 오른쪽 위 X, 약 x0.18 y0.308). 쓰기로 한 모델: '비디오 생성·01' 720p·5s 30크레딧(여러 장 참조 가능). 0.9: 캡처는 상태바·내비게이션 바가 잘려 비율 좌표가 어긋남 → X는 첫 사진 카드(kling_omni_asset_card) 안 상대 위치(오른쪽 위 0.81, 0.19)로 누름. 기록 6: 모델 글자는 '비디오 생성·O1'(영문 O). 0크레딧 표시 대신 '생성' 글자(omni_submit_btn_text)가 보일 때도 있음. 1080p 선택 가능. 기록 7: 사진 목록 화면 확인 — 첫 칸 '카메라 촬영'(ksa_take_photo_layout), 사진마다 선택 동그라미 media_pick_num_area, 아래 '완료 N'(kling_picker_done_button). 앱은 인물 사진을 1번이 가장 최근이 되게 저장하므로 동그라미를 앞에서부터 장수만큼 누르면 이미지 1, 2… 순서가 된다. 사진 자체(media_preview)를 누르면 '사용' 미리보기 화면이 뜨므로 쓰지 않는다. 기록 8: '갤러리 ⌄'(iv_arrow)를 누르면 앨범 목록(label: Recent, Screenshots, Pictures, Camera, Download…)이 뜬다. 앨범 이름은 사진 폴더 이름. 앱은 인물 사진을 Pictures/SDMRef 에만 저장하고(예전 것은 지움) 'SDMRef' 앨범을 열어 고른다. 기록 9: '⌄'(iv_arrow)는 눌리는 칸이 아니라 클릭 동작을 보내면 '갤러리' 탭만 눌림 → 화살표 위치를 직접 탭(tapIn). 기록 10: 생성 뒤 클링이 영상 상세 화면(뒤로 kling_detail_page_back, 아래 '다운로드'·'발표')으로 넘어갈 수 있음 → 샷마다 먼저 만들기 화면으로 돌아온다. 1.5: 화질·길이(omni_edit_ratio_edit)를 눌러 '720p', '5s', '9:16'을 직접 고른다(사용자 캡처의 설정 창). 그래도 아니면 멈춘다. 1.6: 화질·길이 글자가 줄여 표시될 때가 있어(예: 720p가 안 보임) 비싼 값('1080', '10s')이 보일 때만 바꾸고, 그래도 보이면 멈춘다. 기록 14: 생성 결과는 '기본 창작' 화면 목록에 쌓인다. 항목마다 프롬프트 첫머리(tv_prompt, 예 '[샷 4/6')와 그 아래 영상(kling_video_container), 다 만들어지면 표지(kiv_video_cover)가 생긴다. 최신이 아래. 영상을 누르면 상세 화면('다운로드' tv_text). 기록 15: 클링 홈('창작 시작', 아래 탭 '애셋'). 내려받기 시작 때 홈이면 '창작 시작'으로 목록 화면으로. 펼친 입력칸은 뒤로가기 대신 왼쪽 위 닫기(kling_edit_close_btn)로 접는다. 1.9: 영상 화면을 열면 자동 재생되며 아래 '다운로드' 줄이 늦게 뜬다 → 다운로드 버튼을 최대 10초 기다린 뒤에만 '아직 만드는 중'으로 본다.",
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
   "say": "만들기 화면으로 돌아가기",
   "find": {
    "id": "omni_edit_preview_submit"
   },
   "timeout": 2500,
   "steps": [
    {
     "do": "click",
     "say": "영상 화면 닫기",
     "find": {
      "id": "kling_detail_page_back"
     },
     "timeout": 1500,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1500
    },
    {
     "do": "unless",
     "say": "만들기 화면 확인",
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
      }
     ]
    },
    {
     "do": "waitFor",
     "say": "만들기 화면 확인",
     "find": {
      "id": "omni_edit_preview_submit"
     },
     "timeout": 4000,
     "fail": "클링 만들기 화면으로 돌아가지 못했습니다"
    }
   ]
  },
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
   "do": "when",
   "say": "화질·길이 확인",
   "find": {
    "id": "omni_edit_ratio_value",
    "any": [
     "1080",
     "10s",
     "10초"
    ]
   },
   "timeout": 2000,
   "steps": [
    {
     "do": "click",
     "say": "화질·길이 설정 열기",
     "find": {
      "id": "omni_edit_ratio_edit"
     },
     "timeout": 4000
    },
    {
     "do": "wait",
     "ms": 1500
    },
    {
     "do": "click",
     "say": "720p 고르기",
     "find": {
      "any": [
       "=720p"
      ]
     },
     "timeout": 3000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 500
    },
    {
     "do": "click",
     "say": "5초 고르기",
     "find": {
      "any": [
       "=5s",
       "=5초"
      ]
     },
     "timeout": 3000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 500
    },
    {
     "do": "click",
     "say": "9:16 고르기",
     "find": {
      "any": [
       "=9:16"
      ]
     },
     "timeout": 3000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 500
    },
    {
     "do": "back",
     "say": "설정 닫기"
    },
    {
     "do": "wait",
     "ms": 1500
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
    }
   ]
  },
  {
   "do": "waitGone",
   "say": "길이 확인 (720p · 5s)",
   "find": {
    "id": "omni_edit_ratio_value",
    "any": [
     "1080",
     "10s",
     "10초"
    ]
   },
   "timeout": 2000,
   "fail": "클링 화질·길이가 1080p나 10초로 되어 있습니다. 크레딧이 더 들어서 멈췄습니다. 클링에서 720p · 5s로 바꾼 뒤 다시 시작하세요"
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
   "do": "click",
   "say": "사진 넣기(+) 누르기",
   "find": {
    "id": "kling_omni_asset_add"
   },
   "orTap": {
    "x": 0.13,
    "y": 0.336
   },
   "timeout": 5000,
   "if": "imageCount"
  },
  {
   "do": "waitFor",
   "say": "사진 목록 여는 중",
   "find": {
    "id": "media_pick_num_area"
   },
   "timeout": 8000,
   "if": "imageCount"
  },
  {
   "do": "tapIn",
   "say": "앨범 목록 열기",
   "find": {
    "id": "iv_arrow"
   },
   "rx": 0.5,
   "ry": 0.5,
   "timeout": 4000,
   "if": "imageCount"
  },
  {
   "do": "wait",
   "ms": 1200,
   "if": "imageCount"
  },
  {
   "do": "scrollTo",
   "say": "SDMRef 앨범 찾기",
   "find": {
    "id": "label",
    "any": [
     "=SDMRef"
    ]
   },
   "max": 6,
   "if": "imageCount",
   "fail": "클링 앨범 목록에서 'SDMRef'를 찾지 못했습니다. 다른 사진이 들어가지 않도록 멈췄습니다"
  },
  {
   "do": "click",
   "say": "SDMRef 앨범 열기",
   "find": {
    "id": "label",
    "any": [
     "=SDMRef"
    ]
   },
   "timeout": 3000,
   "if": "imageCount"
  },
  {
   "do": "waitFor",
   "say": "인물 사진 목록 여는 중",
   "find": {
    "id": "media_pick_num_area"
   },
   "timeout": 6000,
   "if": "imageCount"
  },
  {
   "do": "wait",
   "ms": 800,
   "if": "imageCount"
  },
  {
   "do": "clickEach",
   "say": "방금 저장한 인물 사진 고르기",
   "find": {
    "id": "media_pick_num_area"
   },
   "count": "${imageCount}",
   "gap": 600,
   "timeout": 6000,
   "if": "imageCount"
  },
  {
   "do": "wait",
   "ms": 800,
   "if": "imageCount"
  },
  {
   "do": "click",
   "say": "완료 누르기",
   "find": {
    "id": "kling_picker_done_button"
   },
   "orTap": {
    "x": 0.865,
    "y": 0.808
   },
   "timeout": 5000,
   "if": "imageCount"
  },
  {
   "do": "wait",
   "ms": 2500,
   "if": "imageCount"
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
   "do": "when",
   "say": "목록 화면으로",
   "find": {
    "id": "kling_detail_page_back"
   },
   "timeout": 1500,
   "steps": [
    {
     "do": "click",
     "say": "영상 화면 닫기",
     "find": {
      "id": "kling_detail_page_back"
     },
     "timeout": 2000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1500
    }
   ]
  },
  {
   "do": "unless",
   "say": "만들기 화면으로 돌아가기",
   "find": {
    "id": "omni_edit_preview_submit"
   },
   "timeout": 2500,
   "steps": [
    {
     "do": "click",
     "say": "영상 화면 닫기",
     "find": {
      "id": "kling_detail_page_back"
     },
     "timeout": 1500,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1500
    },
    {
     "do": "unless",
     "say": "만들기 화면 확인",
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
      }
     ]
    },
    {
     "do": "waitFor",
     "say": "만들기 화면 확인",
     "find": {
      "id": "omni_edit_preview_submit"
     },
     "timeout": 4000,
     "fail": "클링 만들기 화면으로 돌아가지 못했습니다"
    }
   ]
  },
  {
   "do": "when",
   "say": "입력칸 접기",
   "find": {
    "id": "kling_omni_asset_add"
   },
   "timeout": 1200,
   "steps": [
    {
     "do": "click",
     "say": "입력칸 닫기",
     "find": {
      "id": "kling_edit_close_btn"
     },
     "timeout": 2000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1200
    }
   ]
  },
  {
   "do": "waitFor",
   "say": "작품 목록 확인",
   "find": {
    "id": "tv_prompt"
   },
   "timeout": 15000,
   "fail": "클링 작품 목록을 찾지 못했습니다"
  }
 ],
 "collect": [
  {
   "do": "repeat",
   "say": "${shot}번째 영상이 다 만들어지길 기다리는 중",
   "count": "60",
   "steps": [
    {
     "do": "unless",
     "say": "${shot}번째 영상 열기",
     "find": {
      "id": "tv_text",
      "any": [
       "=다운로드",
       "=Download"
      ]
     },
     "timeout": 3000,
     "steps": [
      {
       "do": "when",
       "say": "목록 화면으로",
       "find": {
        "id": "kling_detail_page_back"
       },
       "timeout": 1500,
       "steps": [
        {
         "do": "click",
         "say": "영상 화면 닫기",
         "find": {
          "id": "kling_detail_page_back"
         },
         "timeout": 2000,
         "optional": true
        },
        {
         "do": "wait",
         "ms": 1500
        }
       ]
      },
      {
       "do": "swipe",
       "say": "목록 맨 아래로",
       "x1": 0.5,
       "y1": 0.75,
       "x2": 0.5,
       "y2": 0.25,
       "ms": 250,
       "optional": true
      },
      {
       "do": "swipe",
       "say": "목록 맨 아래로",
       "x1": 0.5,
       "y1": 0.75,
       "x2": 0.5,
       "y2": 0.25,
       "ms": 250,
       "optional": true
      },
      {
       "do": "wait",
       "ms": 800
      },
      {
       "do": "scrollTo",
       "say": "${shot}번째 영상 찾기",
       "find": {
        "id": "tv_prompt",
        "text": "${tag}",
        "index": -1
       },
       "up": true,
       "max": 8,
       "optional": true
      },
      {
       "do": "tapIn",
       "say": "${shot}번째 영상 열기",
       "find": {
        "id": "tv_prompt",
        "text": "${tag}",
        "index": -1
       },
       "rx": 0.15,
       "ry": 1.0,
       "dy": 150,
       "timeout": 3000,
       "optional": true
      },
      {
       "do": "wait",
       "ms": 3000
      },
      {
       "do": "unless",
       "say": "아직 만드는 중 · 잠시 뒤 다시 확인",
       "find": {
        "id": "tv_text",
        "any": [
         "=다운로드",
         "=Download"
        ]
       },
       "timeout": 10000,
       "steps": [
        {
         "do": "when",
         "say": "목록 화면으로",
         "find": {
          "id": "kling_detail_page_back"
         },
         "timeout": 1500,
         "steps": [
          {
           "do": "click",
           "say": "영상 화면 닫기",
           "find": {
            "id": "kling_detail_page_back"
           },
           "timeout": 2000,
           "optional": true
          },
          {
           "do": "wait",
           "ms": 1500
          }
         ]
        },
        {
         "do": "wait",
         "ms": 8000
        }
       ]
      }
     ]
    }
   ]
  },
  {
   "do": "click",
   "say": "${shot}번째 영상 내려받기",
   "find": {
    "id": "tv_text",
    "any": [
     "=다운로드",
     "=Download"
    ]
   },
   "timeout": 5000,
   "fail": "클링 영상이 10분 넘게 다 만들어지지 않았습니다. 나중에 원클릭을 다시 누르면 내려받기만 합니다"
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
   "ms": 5000
  },
  {
   "do": "when",
   "say": "목록 화면으로",
   "find": {
    "id": "kling_detail_page_back"
   },
   "timeout": 1500,
   "steps": [
    {
     "do": "click",
     "say": "영상 화면 닫기",
     "find": {
      "id": "kling_detail_page_back"
     },
     "timeout": 2000,
     "optional": true
    },
    {
     "do": "wait",
     "ms": 1500
    }
   ]
  },
  {
   "do": "wait",
   "ms": 1000
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
 "version": "0.5",
 "verified": false,
 "note": "2026-11-26 사용자 화면 기록(ai.x.grok) 두 장으로 확인: 채팅 화면(입력칸 id chat_text_input, '새 채팅 시작하기', 결과 이미지 'Generated Image'), 이미지 화면('닫기', '다운로드', '공유'). 그록이 이미지 화면에서 열려도 닫고 채팅으로 돌아간다. 0.4: 장면 이미지 여러 장을 한 번에 만들 수 있게 샷마다 새 채팅을 연다. 0.5: 프롬프트가 길면 결과 이미지가 화면 밖에 있어 못 찾음 → 기다리는 동안 '아래로 스크롤' 버튼·위로 쓸기로 맨 아래를 보이게 한다.",
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
   "do": "repeat",
   "say": "이미지가 만들어지길 기다리는 중",
   "count": "40",
   "steps": [
    {
     "do": "unless",
     "say": "이미지가 만들어지길 기다리는 중",
     "find": {
      "desc": "Generated Image"
     },
     "timeout": 3500,
     "steps": [
      {
       "do": "click",
       "say": "아래로 스크롤",
       "find": {
        "any": [
         "아래로 스크롤",
         "Scroll to bottom"
        ]
       },
       "timeout": 500,
       "optional": true
      },
      {
       "do": "swipe",
       "say": "아래로 내리기",
       "x1": 0.5,
       "y1": 0.62,
       "x2": 0.5,
       "y2": 0.3,
       "ms": 300,
       "optional": true
      }
     ]
    }
   ]
  },
  {
   "do": "waitFor",
   "say": "이미지 확인",
   "find": {
    "desc": "Generated Image"
   },
   "timeout": 5000,
   "fail": "그록 이미지가 3분 안에 나오지 않았습니다. 그록에서 생성이 됐는지 확인하세요"
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
