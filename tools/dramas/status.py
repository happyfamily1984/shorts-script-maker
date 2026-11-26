"""주제별 대본 수와 다음에 쓸 파일 이름을 보여 준다. 사용: python3 tools/dramas/status.py"""
import glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
THEMES = [l[3:].split(' — ')[0].strip() for l in open(os.path.join(HERE, 'THEMES.md'), encoding='utf-8') if l.startswith('## ')]
GOAL = 100
total = 0
print(f'{"주제":<10}{"대본":>6}{"남음":>6}   다음 파일')
for t in THEMES:
    files = sorted(glob.glob(os.path.join(HERE, 'data', f'{t}_*.json')))
    n = 0
    for f in files:
        try: n += len(json.load(open(f, encoding='utf-8')))
        except Exception: pass
    total += n
    letters = {re.match(rf'{t}_([A-Z])_\d+\.json', os.path.basename(f)).group(1) for f in files if re.match(rf'{t}_([A-Z])_\d+\.json', os.path.basename(f))}
    nxt = next(c for c in 'CDEFGHIJKLMNOPQRSTUVWXYZ' if c not in letters)
    left = max(0, GOAL - n)
    print(f'{t:<10}{n:>6}{left:>6}   ' + (f'data/{t}_{nxt}_1.json ~ {t}_{nxt}_{-(-left // 10)}.json' if left else '완료'))
print(f'합계 {total}편 / 목표 {GOAL * len(THEMES)}편')
