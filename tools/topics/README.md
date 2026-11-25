# 대본 주제 데이터

앱의 "대본 주제"는 `data/<분야id>.json`이 원본이고, `www/js/topics.js`는 여기서 만들어지는 결과물이다. topics.js를 직접 고치지 않는다.

## 주제 추가 순서
1. `SPEC.md` 규격대로 `data/<분야id>.json` 배열 끝에 새 주제를 이어 붙인다. 기존 제목과 겹치지 않게 한다.
2. `python3 tools/topics/check.py <분야id>` 로 오류 0개를 확인한다.
3. `python3 tools/topics/build.py` 로 `www/js/topics.js`를 다시 만든다.
4. 앱 버전(`www/js/app.js`의 APP_VERSION, `android/app/build.gradle`의 versionCode/versionName)을 올리고 APK를 빌드한다.

분야id: info money food eat beauty fit story vlog game tech grow kids travel pet media shop
