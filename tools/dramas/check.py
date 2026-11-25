"""숏드라마 대본 파일 검사. 사용: python3 check.py <파일...> [--min N]"""
import json, re, sys

CAMS = {'cu', 'ms', 'ws', 'pi', 'cz', 'ots', 'low', 'trk', 'rx', 'slo'}
ROLES = {'H', 'V', 'A', 'X'}
BAN_KO = ['피를', '피가', '칼로', '칼을', '총을', '총으로', '죽여', '죽이', '살인', '자살', '시체', '마약', '알몸', '벗기', '성폭', '뺨을 때', '뺨을 친', '따귀']
BAN_EN = [r'\bblood', r'\bknife', r'\bgun\b', r'\bkill', r'\bmurder', r'\bsuicide', r'\bcorpse', r'\bdrug', r'\bnaked', r'\bnude', r'\bslap', r'\bstab', r'\bshoot', r'\bsex']
HANGUL = re.compile('[가-힣]')
words = lambda s: len(s.split())


def check_script(s, tag, errs, titles):
    if not (isinstance(s, list) and len(s) == 6): errs.append(f'{tag}: 대본 배열은 6칸이어야 함'); return
    tk, te, lk, le, chars, shots = s
    for name, v in (('한국어 제목', tk), ('영어 제목', te), ('한국어 줄거리', lk), ('영어 줄거리', le)):
        if not isinstance(v, str) or not v.strip(): errs.append(f'{tag}: {name} 비어 있음'); return
    tag = f'{tag} "{tk}"'
    if tk in titles: errs.append(f'{tag}: 제목 중복')
    titles.add(tk)
    if len(tk) > 24: errs.append(f'{tag}: 한국어 제목 {len(tk)}자 (22자 이내)')
    if words(te) > 9: errs.append(f'{tag}: 영어 제목 {words(te)}단어 (8단어 이내)')
    if len(lk) > 70: errs.append(f'{tag}: 한국어 줄거리 {len(lk)}자 (60자 이내)')
    if words(le) > 30: errs.append(f'{tag}: 영어 줄거리 {words(le)}단어 (25단어 이내)')
    if HANGUL.search(te + le): errs.append(f'{tag}: 영어 제목·줄거리에 한글')
    if not HANGUL.search(tk) or not HANGUL.search(lk): errs.append(f'{tag}: 한국어 제목·줄거리에 한글 없음')
    if not (isinstance(chars, list) and 2 <= len(chars) <= 4): errs.append(f'{tag}: 인물은 2~4명'); return
    roles = []
    for i, c in enumerate(chars):
        if not (isinstance(c, list) and len(c) == 5 and all(isinstance(x, str) and x.strip() for x in c)): errs.append(f'{tag}: 인물 {i} 형식 오류(5칸 문자열)'); return
        r, nk, ne, dk, de = c
        if r not in ROLES: errs.append(f'{tag}: 인물 {i} 역할코드 {r}')
        roles.append(r)
        if HANGUL.search(ne + de): errs.append(f'{tag}: 인물 {i} 영어 칸에 한글')
        if not HANGUL.search(dk): errs.append(f'{tag}: 인물 {i} 한국어 외형에 한글 없음')
        if len(dk) > 52: errs.append(f'{tag}: 인물 {i} 한국어 외형 {len(dk)}자 (45자 이내)')
        if words(de) > 24: errs.append(f'{tag}: 인물 {i} 영어 외형 {words(de)}단어 (20단어 이내)')
        if len(dk) < 12 or words(de) < 6: errs.append(f'{tag}: 인물 {i} 외형이 너무 짧음(나이대·성별·머리·옷·인상)')
    if 'H' not in roles or 'V' not in roles: errs.append(f'{tag}: H와 V가 모두 있어야 함')
    if not (isinstance(shots, list) and len(shots) == 6): errs.append(f'{tag}: 샷은 정확히 6개 (지금 {len(shots) if isinstance(shots, list) else "?"})'); return
    cams, spoken = [], 0
    for i, sh in enumerate(shots):
        t = f'{tag} 샷{i + 1}'
        if not (isinstance(sh, list) and len(sh) == 8): errs.append(f'{t}: 8칸이어야 함'); continue
        pk, pe, ak, ae, sp, dk, de, cam = sh
        if not all(isinstance(x, str) for x in (pk, pe, ak, ae, dk, de, cam)) or not isinstance(sp, int): errs.append(f'{t}: 자료형 오류'); continue
        if not (pk.strip() and pe.strip() and ak.strip() and ae.strip()): errs.append(f'{t}: 장소·화면 묘사 비어 있음')
        if cam not in CAMS: errs.append(f'{t}: 카메라코드 {cam}')
        cams.append(cam)
        if sp == -1:
            if dk or de: errs.append(f'{t}: 화자 -1인데 대사가 있음')
        elif not (0 <= sp < len(chars)): errs.append(f'{t}: 화자번호 {sp} 범위 밖')
        else:
            spoken += 1
            if not dk.strip() or not de.strip(): errs.append(f'{t}: 화자가 있는데 대사 비어 있음')
        if len(dk) > 32: errs.append(f'{t}: 한국어 대사 {len(dk)}자 (28자 이내)')
        if words(de) > 16: errs.append(f'{t}: 영어 대사 {words(de)}단어 (14단어 이내)')
        if len(ak) > 52: errs.append(f'{t}: 한국어 화면 묘사 {len(ak)}자 (45자 이내)')
        if words(ae) > 26: errs.append(f'{t}: 영어 화면 묘사 {words(ae)}단어 (22단어 이내)')
        if HANGUL.search(pe + ae + de): errs.append(f'{t}: 영어 칸에 한글')
        if not HANGUL.search(ak): errs.append(f'{t}: 한국어 화면 묘사에 한글 없음')
        for b in BAN_KO:
            if b in ak + dk: errs.append(f'{t}: 금지 표현 "{b}"')
        for b in BAN_EN:
            if re.search(b, (ae + ' ' + de).lower()): errs.append(f'{t}: 금지 표현 /{b}/')
    if spoken < 4: errs.append(f'{tag}: 대사 있는 샷이 {spoken}개 (4개 이상)')
    if cams and max(cams.count(c) for c in set(cams)) > 3: errs.append(f'{tag}: 같은 카메라코드가 4번 이상')


def main():
    args = sys.argv[1:]; mn = 0
    if '--min' in args: i = args.index('--min'); mn = int(args[i + 1]); del args[i:i + 2]
    errs, titles, n = [], set(), 0
    for f in args:
        try: data = json.load(open(f))
        except Exception as e: errs.append(f'{f}: JSON 오류 {e}'); continue
        if not isinstance(data, list): errs.append(f'{f}: 배열 아님'); continue
        for i, s in enumerate(data): check_script(s, f'{f.split("/")[-1]}#{i + 1}', errs, titles); n += 1
    if n < mn: errs.append(f'대본 {n}편, {mn}편 필요')
    for e in errs[:60]: print('오류', e)
    print(f'대본 {n}편, 오류 {len(errs)}개')
    return 1 if errs else 0


if __name__ == '__main__': sys.exit(main())
