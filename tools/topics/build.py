import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data') + '/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'www', 'js', 'topics.js')
N = {'list3': 3, 'problem': 4, 'before': 4, 'story': 4, 'myth': 4, 'howto': 5, 'versus': 4, 'test': 5, 'pov': 3, 'review': 5, 'routine': 4, 'news': 4, 'quiz': 3, 'recap': 4}
ORDER = ['info', 'money', 'food', 'eat', 'beauty', 'fit', 'story', 'vlog', 'game', 'tech', 'grow', 'kids', 'travel', 'pet', 'media', 'shop']
out, total = {}, 0
for c in ORDER:
    f = D + c + '.json'
    if not os.path.exists(f): print(c, '없음'); continue
    good, bad, seen = [], 0, set()
    for t in json.load(open(f)):
        ok = isinstance(t, list) and len(t) >= 3 and all(isinstance(x, str) and x.strip() for x in t) and t[1] in N and len(t) - 3 == N[t[1]] and t[0] not in seen
        if ok: seen.add(t[0]); good.append([x.strip() for x in t])
        else: bad += 1
    out[c] = good; total += len(good)
    print(f'{c}: {len(good)}개' + (f' (제외 {bad})' if bad else ''))
with open(OUT, 'w') as fp:
    fp.write('/* 분야별 완성 대본 주제: [제목, 흐름id, 훅, 구간 대사...]. 훅과 구간 대사는 존댓말, 마무리는 앱이 채널 단계에 맞춰 붙인다. */\n')
    fp.write("'use strict';\nconst TOPICS = {\n")
    fp.write(',\n'.join(f'  {c}: [\n' + ',\n'.join('    ' + json.dumps(t, ensure_ascii=False) for t in out[c]) + '\n  ]' for c in out))
    fp.write('\n};\n')
print('합계', total)
