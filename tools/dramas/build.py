"""tools/dramas/data/*.json 을 모아 www/js/dramas.js 를 만든다. 형식이 틀린 대본은 뺀다."""
import glob, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'www', 'js', 'dramas.js')
ORDER = ['hidden', 'gapjil', 'guardian', 'affair', 'comeback', 'inlaws', 'bully', 'divorce', 'karma', 'scam', 'master', 'heir', 'rebirth', 'contract', 'credit', 'family', 'makeover', 'frame', 'audition', 'test', 'rider', 'gender']
SIDED = {'gender': {'M', 'F'}}  # 파일 이름 글자를 입장으로 쓰는 주제


def ok(s):
    return (isinstance(s, list) and len(s) in (6, 7) and all(isinstance(x, str) and x.strip() for x in s[:4]) and isinstance(s[4], list) and 2 <= len(s[4]) <= 4
            and all(isinstance(c, list) and len(c) == 5 for c in s[4]) and isinstance(s[5], list) and len(s[5]) == 6
            and all(isinstance(x, list) and len(x) == 8 and isinstance(x[4], int) and -1 <= x[4] < len(s[4]) for x in s[5]))


out, total = {}, 0
for t in ORDER:
    good, seen, bad = [], set(), 0
    for f in sorted(glob.glob(os.path.join(HERE, 'data', t + '_*.json'))):
        try: data = json.load(open(f))
        except Exception: bad += 1; continue
        side = os.path.basename(f).split('_')[1]
        for s in data:
            if ok(s) and s[0] not in seen:
                seen.add(s[0])
                good.append(s + [{'side': side}] if side in SIDED.get(t, ()) else s)
            else: bad += 1
    out[t] = good; total += len(good)
    print(f'{t}: {len(good)}편' + (f' (제외 {bad})' if bad else ''))
with open(OUT, 'w') as fp:
    fp.write('/* 주제별 숏드라마 대본. tools/dramas/data 에서 build.py 로 생성한다. 직접 고치지 않는다.\n   [한국어 제목, 영어 제목, 한국어 줄거리, 영어 줄거리, 인물[], 샷[]] */\n')
    fp.write("'use strict';\nconst DRAMAS = {\n")
    fp.write(',\n'.join(f'  {t}: [\n' + ',\n'.join('    ' + json.dumps(s, ensure_ascii=False, separators=(',', ':')) for s in out[t]) + '\n  ]' for t in ORDER))
    fp.write('\n};\n')
print('합계', total)
