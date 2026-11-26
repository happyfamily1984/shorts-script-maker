/* 자동 입력 기본 순서. 저장소 kling/flow.json, grok/flow.json 과 같은 내용 */
'use strict';
const KLING_FLOW_DEFAULT = {
 "version": "0.2-partial",
 "verified": false,
 "note": "홈 '창작 시작'과 만들기 화면(+, 프롬프트 칸, 모드 '이미지 생성·4.0', '생성')은 사용자 스크린샷으로 확인함. 모드 메뉴, 사진 고르기 화면, 생성 뒤 화면은 아직 추측.",
 "package": "",
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
   "do": "click",
   "say": "창작 시작 누르기",
   "find": {
    "any": [
     "창작 시작",
     "Create",
     "Start creating"
    ]
   },
   "timeout": 10000
  },
  {
   "do": "wait",
   "ms": 2000
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
   "do": "click",
   "say": "사진 넣기(+) 누르기",
   "find": {
    "any": [
     "=+",
     "업로드",
     "이미지 추가",
     "참고 이미지",
     "Upload",
     "Add"
    ]
   },
   "orTap": {
    "x": 0.13,
    "y": 0.336
   },
   "timeout": 3000,
   "if": "imageCount"
  },
  {
   "do": "wait",
   "ms": 1800,
   "if": "imageCount"
  },
  {
   "do": "clickEach",
   "say": "방금 저장한 사진 고르기",
   "find": {
    "cls": "ImageView",
    "area": [
     0,
     0.12,
     1,
     0.95
    ],
    "minW": 60
   },
   "count": "${imageCount}",
   "timeout": 8000,
   "if": "imageCount"
  },
  {
   "do": "click",
   "say": "사진 선택 마치기",
   "find": {
    "any": [
     "=완료",
     "=추가",
     "=확인",
     "=선택",
     "=Done",
     "=Add",
     "=Select",
     "=OK"
    ]
   },
   "timeout": 5000,
   "optional": true,
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
    "editable": true
   },
   "value": "${prompt}",
   "timeout": 8000
  },
  {
   "do": "click",
   "say": "생성 누르기",
   "find": {
    "any": [
     "=생성",
     "=생성하기",
     "=Generate"
    ]
   },
   "timeout": 6000,
   "if": "autoGenerate"
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
 "end": []
};
const GROK_FLOW_DEFAULT = {
 "version": "0.1-guess",
 "verified": false,
 "note": "그록 앱 화면을 보지 않고 쓴 추측 순서. 화면 기록 파일을 받으면 실제 버튼에 맞춰 고친다.",
 "package": "",
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
   "do": "click",
   "say": "새 대화 열기",
   "find": {
    "any": [
     "새 대화",
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
   "ms": 1200
  }
 ],
 "shot": [
  {
   "do": "setText",
   "say": "이미지 프롬프트 입력",
   "find": {
    "editable": true
   },
   "value": "${prompt}",
   "timeout": 10000
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
    "cls": "ImageView",
    "minW": 180,
    "area": [
     0,
     0.08,
     1,
     0.92
    ]
   },
   "timeout": 120000
  },
  {
   "do": "wait",
   "ms": 2500
  },
  {
   "do": "click",
   "say": "만들어진 이미지 열기",
   "find": {
    "cls": "ImageView",
    "minW": 180,
    "area": [
     0,
     0.08,
     1,
     0.92
    ],
    "index": -1
   },
   "timeout": 5000
  },
  {
   "do": "wait",
   "ms": 1500
  },
  {
   "do": "click",
   "say": "이미지 저장",
   "find": {
    "any": [
     "다운로드",
     "저장",
     "Download",
     "Save"
    ]
   },
   "timeout": 6000
  },
  {
   "do": "wait",
   "ms": 3000
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
