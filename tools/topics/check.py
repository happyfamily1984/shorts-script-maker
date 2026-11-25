import json, re, sys
import os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data') + '/'
N = {'list3': 3, 'problem': 4, 'before': 4, 'story': 4, 'myth': 4, 'howto': 5, 'versus': 4, 'test': 5, 'pov': 3, 'review': 5, 'routine': 4, 'news': 4, 'quiz': 3, 'recap': 4}
LEN = {'info': 30, 'money': 45, 'food': 30, 'eat': 30, 'beauty': 30, 'fit': 30, 'story': 45, 'vlog': 30, 'game': 30, 'tech': 45, 'grow': 30, 'kids': 45, 'travel': 30, 'pet': 20, 'media': 60, 'shop': 30}
RANGE = {20: (70, 105), 30: (120, 165), 45: (180, 240), 60: (240, 320)}
cat = sys.argv[1]
data = json.load(open(D + cat + '.json'))
lo, hi = RANGE[LEN[cat]]
errs, warn, titles, flows = [], [], set(), {}
chars = lambda t: len(re.sub(r'\s|[.,!?…~"\'·:;()\-]', '', re.sub(r'\([^)]*\)', '', t)))
for i, t in enumerate(data):
    tag = f'#{i+1} {t[0] if t else ""}'
    if not isinstance(t, list) or len(t) < 3 or not all(isinstance(x, str) and x.strip() for x in t):
        errs.append(f'{tag}: 형식 오류 (빈 문자열 또는 배열 아님)'); continue
    title, flow, hook, lines = t[0], t[1], t[2], t[3:]
    if flow not in N: errs.append(f'{tag}: 없는 흐름 {flow}'); continue
    flows[flow] = flows.get(flow, 0) + 1
    if len(lines) != N[flow]: errs.append(f'{tag}: {flow}는 구간 대사 {N[flow]}개여야 하는데 {len(lines)}개')
    if title in titles: errs.append(f'{tag}: 제목 중복')
    titles.add(title)
    if len(title) > 28: warn.append(f'{tag}: 제목이 김 ({len(title)}자)')
    h = chars(hook)
    if h > 24: errs.append(f'{tag}: 훅이 김 ({h}자, 22자 이하)')
    total = h + sum(chars(l) for l in lines)
    if total > hi * 1.12: errs.append(f'{tag}: 전체 {total}자, 한도 {hi}자 초과')
    elif total < lo * 0.8: errs.append(f'{tag}: 전체 {total}자, 최소 {lo}자에 한참 못 미침')
    if re.search(r'안녕|반갑', hook): errs.append(f'{tag}: 훅에 인사말')
n = len(data)
pass
top = max(flows.values()) if flows else 0
if len(flows) < 4: errs.append(f'흐름 종류 {len(flows)}개, 4개 이상 필요')
if n and top / n > 0.42: errs.append(f'한 흐름이 {top}/{n}개로 너무 많음')
print(f'{cat}: 주제 {n}개, 흐름 {flows}')
for w in warn[:10]: print('주의', w)
for e in errs: print('오류', e)
print(f'오류 {len(errs)}개')
