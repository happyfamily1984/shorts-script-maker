'use strict';
/* ---------- 기본 도구 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const FMT = Object.fromEntries(FORMATS.map(f => [f.id, f]));
const HOOK = Object.fromEntries(HOOKS.map(h => [h.id, h]));
const CTA = Object.fromEntries(CTAS.map(c => [c.id, c]));
const APP_VERSION = '1.0.0';

const store = {
  get(k, d) { try { const v = localStorage.getItem('ssm.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ssm.' + k, JSON.stringify(v)); } catch (e) {} }
};
let settings = Object.assign({ theme: 'system', cps: 6, stage: 0, checks: [] }, store.get('settings', {}));
let scripts = store.get('scripts', null);
const saveScripts = () => store.set('scripts', scripts);
const saveSettings = () => { store.set('settings', settings); applyTheme(); };
function applyTheme() {
  const r = document.documentElement;
  if (settings.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
}

const ICON = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tool: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'
};
const ic = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- 한글 조사 ---------- */
function josa(word, j) {
  const pairs = { '을': ['을', '를'], '이': ['이', '가'], '은': ['은', '는'], '과': ['과', '와'], '으로': ['으로', '로'] };
  const p = pairs[j]; if (!p) return j;
  const ch = String(word).trim().replace(/[^가-힣0-9a-zA-Z]+$/, '').slice(-1);
  let batchim = false, code = ch.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) { const jong = (code - 0xAC00) % 28; batchim = jong !== 0; if (j === '으로' && jong === 8) batchim = false; }
  else if (/[0-9]/.test(ch)) batchim = /[013678]/.test(ch);
  else batchim = /[lmnrLMNR]/.test(ch);
  return batchim ? p[0] : p[1];
}
const fill = (tpl, ctx) => tpl.replace(/\{(\w+)(?::([^}]+))?\}/g, (_, k, j) => {
  const v = ctx[k] ?? ''; return j ? v + josa(v, j) : v;
});

/* ---------- 시간 계산 ---------- */
const spoken = t => String(t || '').replace(/\([^)]*\)/g, '').replace(/[〔〕\s.,!?…~"'·:;\-]/g, '');
const est = t => spoken(t).length / settings.cps;
const tc = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + (Number.isInteger(r) ? r : r.toFixed(1)); };
const fmtSec = s => (Math.round(s * 10) / 10) + '초';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dateStr = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };

/* ---------- 대본 생성 ---------- */
function makeCtx(o) {
  const ti = o.tone === 1 ? 1 : 0, t = (o.topic || '').trim();
  return {
    ti, t, who: (o.who || '').trim() || '초보자',
    p1: (o.p1 || '').trim() || '〔포인트 1〕', p2: (o.p2 || '').trim() || '〔포인트 2〕', p3: (o.p3 || '').trim() || '〔포인트 3〕',
    gain: (o.gain || '').trim() || (t + josa(t, '은') + (ti ? ' 이것부터 하면 돼' : ' 이것부터 하면 됩니다')).replace(/[.]$/, '')
  };
}
function generate(o) {
  const cat = CAT[o.cat], f = FMT[o.format], ctx = makeCtx(o), ti = ctx.ti;
  const hookId = o.hook && o.hook !== 'auto' ? o.hook : cat.hook;
  const ctaId = o.cta && o.cta !== 'auto' ? o.cta : STAGE_META[o.stage].cta;
  const len = o.len, hookSec = len <= 20 ? 2 : 3, rest = len - hookSec;
  const sumP = f.beats.reduce((a, b) => a + (b.p || 0), 0);
  let used = hookSec;
  const beats = f.beats.map((b, i) => {
    let sec, say, cap, type = 'body';
    if (b.hook) { type = 'hook'; sec = hookSec; say = fill(HOOK[hookId].tpl[ti], ctx); cap = ctx.t; }
    else {
      sec = Math.max(1.5, Math.round(rest * b.p / sumP * 2) / 2);
      if (i === f.beats.length - 1) sec = Math.max(1.5, len - used);
      used += i === f.beats.length - 1 ? 0 : sec;
      if (b.cta) { type = 'cta'; say = fill(CTA[ctaId].tpl[ti], ctx); cap = CTA[ctaId].name; }
      else { say = fill(b.tpl[ti], ctx); cap = fill(b.cap || '', ctx); }
    }
    return { k: b.k, type, sec, say, cap, shot: b.shot || '' };
  });
  const seed = [...ctx.t].reduce((a, c) => a + c.charCodeAt(0), 0);
  const titles = Array.from({ length: 5 }, (_, i) => fill(TITLES[(seed + i * 5) % TITLES.length], ctx));
  const tags = [...new Set([...cat.tags.slice(0, 3), ...ctx.t.split(/\s+/).filter(w => w.length > 1).slice(0, 2)])].map(x => '#' + x.replace(/[^가-힣0-9a-zA-Z]/g, ''));
  return {
    id: uid(), cat: o.cat, format: o.format, hook: hookId, cta: ctaId, len, tone: ti, stage: o.stage,
    title: titles[0], topic: ctx.t, input: { who: o.who || '', p1: o.p1 || '', p2: o.p2 || '', p3: o.p3 || '', gain: o.gain || '' },
    beats, titles, tags, pin: ti ? `너는 ${ctx.t} 어떻게 하고 있어?` : `여러분은 ${ctx.t} 어떻게 하고 계세요?`,
    memo: '', fav: false, created: Date.now(), updated: Date.now()
  };
}
function scoreOf(s) {
  const h = s.beats.find(b => b.type === 'hook') || s.beats[0], c = s.beats.filter(b => b.type === 'cta').pop();
  const total = s.beats.reduce((a, b) => a + est(b.say), 0), all = s.beats.map(b => b.say).join(' ');
  const longest = Math.max(0, ...all.split(/[.?!]\s*/).map(x => spoken(x).length));
  const items = [
    [est(h.say) <= 3.3, '훅이 3초 안에 읽힌다', `지금 ${fmtSec(est(h.say))}. 길면 단어를 줄이세요.`],
    [/[0-9?]|마세요|하지 마|절대|아직도|왜|결론|직접|손해|의외/.test(h.say), '훅에 숫자·질문·경고가 있다', '첫 문장에 궁금증을 만드는 장치를 넣으세요.'],
    [!/안녕|반갑/.test(all), '인사말로 시작하지 않는다', '인사와 자기소개는 빼는 편이 좋습니다.'],
    [total <= s.len * 1.05 && total >= s.len * 0.55, '읽기 시간이 목표 길이에 맞는다', total > s.len ? `읽는 데 ${fmtSec(total)}, 목표 ${s.len}초. 문장을 줄이세요.` : `읽는 데 ${fmtSec(total)}, 목표 ${s.len}초. 내용을 보태거나 길이를 줄이세요.`],
    [s.beats.every(b => est(b.say) <= b.sec + 0.6), '구간마다 시간이 넘치지 않는다', '빨간 시간으로 표시된 구간의 문장을 줄이세요.'],
    [!/〔/.test(all), '빈칸을 모두 채웠다', '〔포인트〕 자리에 내 내용을 넣으세요.'],
    [longest <= 38, '한 문장이 한 호흡에 읽힌다', `가장 긴 문장이 ${longest}자입니다. 둘로 나누세요.`],
    [s.beats.every(b => (b.cap || '').length <= 16), '자막이 짧다', '자막은 한 줄 12자 안팎이 읽기 좋습니다.'],
    [s.beats.every(b => (b.shot || '').trim()), '모든 구간에 장면 지시가 있다', '무엇을 화면에 보여 줄지 적어 두세요.'],
    [!!c && est(c.say) <= 4.2, '마무리 요청이 한 문장이다', '마지막은 짧게 끝내야 완주율이 유지됩니다.']
  ].map(([ok, label, tip]) => ({ ok, label, tip }));
  return { total, items, score: Math.round(items.filter(i => i.ok).length / items.length * 100) };
}

/* ---------- 내보내기 형식 ---------- */
const metaLine = s => `분야: ${CAT[s.cat].name} · 흐름: ${FMT[s.format].name} · 길이: ${s.len}초 · 단계: ${STAGE_META[s.stage].name}`;
function spans(s) { let t = 0; return s.beats.map(b => { const a = t; t += b.sec; return [a, t]; }); }
function toText(s) {
  const sp = spans(s);
  return [`[${s.title}]`, metaLine(s), '────────────────',
    ...s.beats.map((b, i) => `${tc(sp[i][0])}–${tc(sp[i][1])}  ${b.k}\n말: ${b.say}\n자막: ${b.cap || '-'}\n장면: ${b.shot || '-'}\n`),
    '────────────────', '제목 후보', ...s.titles.map(t => '- ' + t), '', '해시태그: ' + s.tags.join(' '), '고정 댓글: ' + s.pin,
    s.memo ? '\n메모: ' + s.memo : ''].join('\n').trim() + '\n';
}
const toSay = s => s.beats.map(b => b.say).join('\n');
function toCue(s) {
  const sp = spans(s), c = x => String(x || '-').replace(/\|/g, '/').replace(/\n/g, ' ');
  return [`# ${s.title}`, '', metaLine(s), '', '| 시간 | 구간 | 말 | 자막 | 장면 |', '|---|---|---|---|---|',
    ...s.beats.map((b, i) => `| ${tc(sp[i][0])}–${tc(sp[i][1])} | ${b.k} | ${c(b.say)} | ${c(b.cap)} | ${c(b.shot)} |`),
    '', '## 제목 후보', ...s.titles.map(t => '- ' + t), '', '## 해시태그', s.tags.join(' '), '', '## 고정 댓글', s.pin, ''].join('\n');
}
function toSrt(s) {
  const f = x => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, se = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(se).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  return spans(s).map(([a, b], i) => `${i + 1}\n${f(a)} --> ${f(b)}\n${s.beats[i].say.replace(/\([^)]*\)\s*/g, '')}\n`).join('\n');
}
const EXPORTS = [
  { id: 'txt', name: '대본 텍스트', sub: '시간·말·자막·장면이 모두 담긴 글', ext: 'txt', mime: 'text/plain', one: toText, join: '\n\n════════════════\n\n' },
  { id: 'say', name: '대사만', sub: '읽을 문장만 줄바꿈으로', ext: 'txt', mime: 'text/plain', one: s => `[${s.title}]\n${toSay(s)}\n`, join: '\n\n' },
  { id: 'cue', name: '촬영 큐시트', sub: '표로 정리된 마크다운 문서', ext: 'md', mime: 'text/markdown', one: toCue, join: '\n\n---\n\n' },
  { id: 'srt', name: '자막 파일 (SRT)', sub: '편집 앱에 바로 넣는 자막, 한 편씩', ext: 'srt', mime: 'application/x-subrip', one: toSrt, single: true },
  { id: 'json', name: '백업 파일 (JSON)', sub: '다른 기기로 옮기거나 복원할 때', ext: 'json', mime: 'application/json', all: list => JSON.stringify({ app: 'shorts-script-maker', version: 1, scripts: list }, null, 2) }
];
function buildExport(fmt, list) {
  if (fmt.all) return fmt.all(list);
  if (list.length === 1) return fmt.one(list[0]);
  const groups = {}; list.forEach(s => (groups[s.cat] = groups[s.cat] || []).push(s));
  return Object.entries(groups).map(([c, arr]) => `■ ${CAT[c].name} (${arr.length}편)\n\n` + arr.map(fmt.one).join(fmt.join)).join(fmt.join);
}
const Native = {
  has: () => typeof window.AndroidBridge !== 'undefined',
  share(title, text) {
    if (this.has()) return window.AndroidBridge.shareText(title, text);
    if (navigator.share) return navigator.share({ title, text }).catch(() => {});
    copyText(text, '공유를 지원하지 않아 복사했습니다');
  },
  save(name, mime, text) {
    if (this.has()) return window.AndroidBridge.saveFile(name, mime, text);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); toast('파일로 저장했습니다');
  },
  exit() { if (this.has()) window.AndroidBridge.exitApp(); else { exiting = true; history.go(-2); } }
};
window.onNativeSaved = ok => toast(ok ? '다운로드 폴더에 저장했습니다' : '저장하지 못했습니다');
function copyText(text, msg = '복사했습니다') {
  const done = () => toast(msg);
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}

/* ---------- 화면 전환과 뒤로가기 ---------- */
let stack = [{ v: 'home', p: {} }], overlays = [], exiting = false;
let draft = null, dirty = false, sel = null, form = null, promptTimer = null;
const cur = () => stack[stack.length - 1];
function go(v, p = {}, replace = false) {
  if (replace) stack.pop();
  stack.push({ v, p }); render(true);
}
function tab(v) { stack = v === 'home' ? [{ v: 'home', p: {} }] : [{ v: 'home', p: {} }, { v, p: {} }]; sel = null; render(true); }
function pop() { if (stack.length > 1) stack.pop(); render(true); }
function onBack() {
  if (overlays.length) return closeLayer();
  const c = cur();
  if (c.v === 'prompter') { stopPrompter(); return pop(); }
  if (c.v === 'library' && sel) { sel = null; return render(); }
  if (c.v === 'editor' && dirty) {
    return dialog('수정한 내용을 저장할까요?', '저장하지 않으면 바뀐 내용이 사라집니다.', [
      ['저장 안 함', () => { dirty = false; draft = null; pop(); }], ['저장', () => { saveDraft(); pop(); }, 'pri']]);
  }
  if (stack.length > 1) return pop();
  dialog('앱을 종료하겠습니까?', '', [['아니오', null], ['예', () => Native.exit(), 'pri']]);
}
window.onAndroidBack = onBack;
history.pushState({ ssm: 1 }, '');
window.addEventListener('popstate', () => { if (exiting) return; history.pushState({ ssm: 1 }, ''); onBack(); });

function layer(html, center) {
  const L = $('#layer'); L.className = center ? 'center' : ''; L.innerHTML = html; overlays.push(1);
}
function closeLayer() { overlays.pop(); $('#layer').innerHTML = ''; layerActs = {}; }
let layerActs = {};
function dialog(title, body, acts) {
  layerActs = {};
  layer(`<div class="dialog" role="alertdialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}<div class="acts">${acts.map(([l, fn, c], i) => { layerActs['d' + i] = fn; return `<button class="btn ${c || ''}" data-lact="d${i}">${esc(l)}</button>`; }).join('')}</div></div>`, true);
}
function sheet(title, rows) {
  layerActs = {};
  layer(`<div class="sheet"><h3>${esc(title)}</h3><div class="list">${rows.map(([l, sub, fn], i) => { layerActs['s' + i] = fn; return `<button class="row" data-lact="s${i}"><span class="grow"><b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="chev">›</span></button>`; }).join('')}</div></div>`);
}
$('#layer').addEventListener('click', e => {
  if (e.target.id === 'layer') return closeLayer();
  const b = e.target.closest('[data-lact]'); if (!b) return;
  const fn = layerActs[b.dataset.lact]; closeLayer(); if (fn) fn();
});
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900); }

/* ---------- 공통 조각 ---------- */
const tlBar = s => `<div class="tl" aria-hidden="true">${s.beats.map(b => `<i class="${b.type === 'hook' ? 'h' : b.type === 'cta' ? 'c' : ''}" style="flex:${b.sec}"></i>`).join('')}</div>`;
const glyph = c => `<span class="glyph" style="--h:${c.hue}">${c.glyph}</span>`;
const scriptRow = (s, extra = '') => `<button class="row" data-act="open" data-id="${s.id}">${extra || glyph(CAT[s.cat])}<span class="grow"><b>${esc(s.title)}</b><small>${CAT[s.cat].name} · ${FMT[s.format].name} · ${s.len}초 · ${dateStr(s.updated)}</small></span>${s.fav ? '<span class="star">★</span>' : ''}${s.sample ? '<span class="tag">예시</span>' : ''}</button>`;
const stepsOf = f => `<span class="steps">${f.beats.map(b => `<span>${b.k}</span>`).join('')}</span>`;
const seg = (name, opts, val) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="set" data-k="${name}" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;

/* ---------- 화면들 ---------- */
const V = {};
V.home = () => {
  const st = STAGE_META[settings.stage], recent = [...scripts].sort((a, b) => b.updated - a.updated).slice(0, 3);
  const day = Math.floor(Date.now() / 864e5), h = HOOKS[day % HOOKS.length], c = CATEGORIES[day % CATEGORIES.length];
  return { nav: 'home', top: `<div class="brand" style="flex:1;padding-left:8px"><i class="rec"></i>쇼츠 대본메이커</div><button class="ib" data-act="go" data-v="settings" aria-label="설정">${ic('gear')}</button>`,
    html: `
    <section class="hero">
      <h2>첫 <em>3초</em>부터<br>마지막 문장까지.</h2>
      <div class="go"><input class="in" id="quick" placeholder="오늘 찍을 주제 (예: 자취방 곰팡이 제거)" enterkeyhint="go" maxlength="40"><button class="btn pri" data-act="quick">만들기</button></div>
    </section>
    <section class="sec"><h2>내 채널 단계</h2>
      <div class="card stagebox">${seg('stage', STAGE_META.map(s => [s.id, s.name]), settings.stage)}
        <p><b>${st.range} · ${st.key}</b><br>${st.focus}</p></div>
    </section>
    <section class="sec"><h2>분야별 흐름과 성장 로드맵</h2>
      <div class="cats">${CATEGORIES.map(c => `<button class="cat" data-act="go" data-v="category" data-id="${c.id}">${glyph(c)}${c.name}</button>`).join('')}</div>
    </section>
    <section class="sec"><h2>최근 대본 <button data-act="tab" data-v="library">전체 보기</button></h2>
      ${recent.length ? `<div class="list">${recent.map(s => scriptRow(s)).join('')}</div>` : `<div class="card empty"><b>아직 대본이 없습니다</b>위에 주제를 적고 만들기를 눌러 보세요.</div>`}
    </section>
    <section class="sec"><h2>오늘의 훅</h2>
      <div class="card"><span class="tag a">${h.name}</span><p class="quote">“${esc(c.hooks[day % c.hooks.length])}”</p><p class="hint">${h.why}</p>
      <button class="btn sm" style="margin-top:12px" data-act="useHook" data-id="${h.id}">이 훅으로 대본 만들기</button></div>
    </section>` };
};

function newForm(p = {}) {
  form = Object.assign({ topic: '', cat: 'info', format: null, hook: 'auto', cta: 'auto', len: null, tone: 0, stage: settings.stage, who: '', p1: '', p2: '', p3: '', gain: '' }, p);
  if (!form.format) form.format = CAT[form.cat].flows[0][0];
  if (!form.len) form.len = CAT[form.cat].len;
}
V.create = () => {
  if (!form) newForm();
  const c = CAT[form.cat], rec = c.flows.map(f => f[0]), order = [...rec, ...FORMATS.map(f => f.id).filter(id => !rec.includes(id))];
  const showAll = cur().p.all;
  return { nav: 'create', title: '대본 만들기', back: true, flush: true, html: `
    <div class="field"><label for="f_topic">주제</label><input class="in" id="f_topic" data-f="topic" value="${esc(form.topic)}" placeholder="예: 자취방 곰팡이 제거" maxlength="40"></div>
    <div class="sec"><span class="lab">분야</span><div class="chips">${CATEGORIES.map(x => `<button class="chip ${x.id === form.cat ? 'on' : ''}" data-act="set" data-k="cat" data-v="${x.id}">${x.name}</button>`).join('')}</div></div>
    <div class="sec"><h2>스크립트 흐름 <button data-act="allFlows">${showAll ? '추천만 보기' : '전체 14개 보기'}</button></h2>
      <div class="list">${(showAll ? order : rec.includes(form.format) ? rec : [form.format, ...rec]).map(id => { const f = FMT[id], r = c.flows.find(x => x[0] === id);
        return `<button class="flow ${id === form.format ? 'on' : ''}" data-act="set" data-k="format" data-v="${id}"><span><b>${f.name}</b> ${r ? '<span class="tag a">이 분야 추천</span>' : ''}</span><small>${r ? esc(r[1]) + ' · ' : ''}${f.sum}</small>${stepsOf(f)}</button>`; }).join('')}</div></div>
    <div class="sec"><span class="lab">첫 문장 (훅)</span><div class="chips"><button class="chip ${form.hook === 'auto' ? 'on' : ''}" data-act="set" data-k="hook" data-v="auto">자동 · ${HOOK[c.hook].name}</button>${HOOKS.map(h => `<button class="chip ${h.id === form.hook ? 'on' : ''}" data-act="set" data-k="hook" data-v="${h.id}">${h.name}</button>`).join('')}</div>
      <p class="hint">${esc(fill(HOOK[form.hook === 'auto' ? c.hook : form.hook].tpl[form.tone], makeCtx(Object.assign({}, form, { topic: form.topic || '주제' }))))}</p></div>
    <div class="sec"><span class="lab">길이</span>${seg('len', [[15, '15초'], [20, '20초'], [30, '30초'], [45, '45초'], [60, '60초']], form.len)}<p class="hint">${c.name} 분야는 ${c.len}초 안팎이 다루기 좋습니다.</p></div>
    <div class="sec"><span class="lab">말투</span>${seg('tone', [[0, '존댓말'], [1, '반말']], form.tone)}</div>
    <div class="sec"><span class="lab">채널 단계</span>${seg('fstage', STAGE_META.map(s => [s.id, s.name]), form.stage)}<p class="hint">${STAGE_META[form.stage].focus}</p></div>
    <div class="sec"><span class="lab">마무리</span><div class="chips"><button class="chip ${form.cta === 'auto' ? 'on' : ''}" data-act="set" data-k="cta" data-v="auto">자동 · ${CTA[STAGE_META[form.stage].cta].name}</button>${CTAS.map(x => `<button class="chip ${x.id === form.cta ? 'on' : ''}" data-act="set" data-k="cta" data-v="${x.id}">${x.name}</button>`).join('')}</div></div>
    <details class="more" ${form.p1 || form.who ? 'open' : ''}><summary>내용 미리 채우기</summary><div class="body">
      <p class="hint">비워 두면 대본에 〔포인트〕 빈칸이 생기고, 편집 화면에서 채울 수 있습니다.</p>
      <div class="field"><label for="f_who">누가 보는 영상인가요</label><input class="in" id="f_who" data-f="who" value="${esc(form.who)}" placeholder="예: 자취생"></div>
      ${[1, 2, 3].map(i => `<div class="field"><label for="f_p${i}">핵심 포인트 ${i}</label><input class="in" id="f_p${i}" data-f="p${i}" value="${esc(form['p' + i])}" placeholder="${['원인, 첫 번째 방법, 3위 등', '해결책, 두 번째 방법, 2위 등', '결과, 가장 중요한 것, 1위 등'][i - 1]}"></div>`).join('')}
      <div class="field"><label for="f_gain">시청자가 얻는 것 한 줄</label><input class="in" id="f_gain" data-f="gain" value="${esc(form.gain)}" placeholder="예: 곰팡이는 말리는 게 먼저예요"></div>
    </div></details>
    <div class="sticky"><button class="btn pri block" data-act="generate">대본 생성</button></div>` };
};

function beatCard(b, i, sp) {
  const e = est(b.say), over = e > b.sec + 0.6;
  return `<div class="beat ${b.type === 'hook' ? 'h' : b.type === 'cta' ? 'c' : ''}" data-i="${i}">
    <div class="tc num"><b>${tc(sp[0])}</b>${fmtSec(b.sec)}</div>
    <div class="box"><div class="hd"><b>${esc(b.k)}</b><span class="tag ${over ? 'a' : 'ok'} num" data-est>읽기 ${fmtSec(e)}</span>${b.type === 'hook' ? '<button data-act="swapHook">다른 훅</button>' : b.type === 'cta' ? '<button data-act="swapCta">다른 마무리</button>' : '<button data-act="beatMenu">더보기</button>'}</div>
      <textarea rows="1" data-b="say" aria-label="${esc(b.k)} 대사">${esc(b.say)}</textarea>
      <div class="sub"><span>자막</span><input data-b="cap" value="${esc(b.cap)}" placeholder="화면에 띄울 글자" aria-label="자막"><span>장면</span><input data-b="shot" value="${esc(b.shot)}" placeholder="무엇을 보여 줄지" aria-label="장면"></div>
    </div></div>`;
}
V.editor = () => {
  const s = draft, sc = scoreOf(s), sp = spans(s), st = STAGE_META[s.stage];
  return { title: CAT[s.cat].name + ' · ' + FMT[s.format].name, back: true, flush: true,
    acts: `<button class="ib" data-act="exportOne" aria-label="내보내기">${ic('share')}</button>`,
    html: `
    <div class="sec"><input class="titlein" data-s="title" value="${esc(s.title)}" aria-label="대본 제목">
      <div>${tlBar(s)}<div class="tlmeta num"><span>0:00 훅</span><span>본론</span><span>마무리 ${tc(s.len)}</span></div></div>
      <div class="stat num"><div><b>${s.len}초</b><small>목표 길이</small></div><div class="${sc.total > s.len * 1.05 ? 'bad' : ''}" id="stTotal"><b>${fmtSec(sc.total)}</b><small>읽기 시간</small></div><div id="stScore"><b>${sc.score}점</b><small>완성도</small></div></div>
    </div>
    <div class="sec" id="beats">${s.beats.map((b, i) => beatCard(b, i, sp[i])).join('')}
      <button class="btn sm" data-act="addBeat">구간 추가</button></div>
    <div class="sec"><h2>완성도 점검</h2><div class="card score"><ul id="scoreList">${scoreList(sc)}</ul></div></div>
    <div class="sec"><h2>${st.name} 단계 조언</h2><div class="card"><p style="margin:0">${st.focus}</p><p class="hint" style="margin-top:8px">${CAT[s.cat].name}: ${CAT[s.cat].stages[s.stage].content}</p></div></div>
    <div class="sec"><h2>제목 후보</h2><div class="card kv">${s.titles.map((t, i) => `<div class="item"><p>${esc(t)}</p><button data-act="useTitle" data-i="${i}">제목으로</button></div>`).join('')}</div></div>
    <div class="sec"><h2>올릴 때 쓸 것</h2><div class="card kv">
      <div class="item"><p><span class="lab">해시태그</span><br>${esc(s.tags.join(' '))}</p><button data-act="copy" data-t="${esc(s.tags.join(' '))}">복사</button></div>
      <div class="item"><p><span class="lab">고정 댓글</span><br>${esc(s.pin)}</p><button data-act="copy" data-t="${esc(s.pin)}">복사</button></div></div></div>
    <div class="field"><label for="memo">메모</label><textarea class="in" id="memo" rows="2" data-s="memo" placeholder="촬영 장소, 준비물 등">${esc(s.memo)}</textarea></div>
    <div class="sticky"><button class="btn" data-act="prompter">프롬프터</button><button class="btn" data-act="copySay">대사 복사</button><button class="btn pri" data-act="save">저장</button></div>` };
};
const scoreList = sc => sc.items.map(i => `<li><span class="m ${i.ok ? '' : 'x'}"></span><span>${i.label}${i.ok ? '' : `<small>${i.tip}</small>`}</span></li>`).join('');
function refreshEditor() {
  const sc = scoreOf(draft);
  $('#stTotal').className = sc.total > draft.len * 1.05 ? 'bad' : ''; $('#stTotal b').textContent = fmtSec(sc.total);
  $('#stScore b').textContent = sc.score + '점'; $('#scoreList').innerHTML = scoreList(sc);
  $$('#beats .beat').forEach((el, i) => { const b = draft.beats[i], e = est(b.say), t = $('[data-est]', el); t.textContent = '읽기 ' + fmtSec(e); t.className = 'tag num ' + (e > b.sec + 0.6 ? 'a' : 'ok'); });
}
function saveDraft() {
  draft.updated = Date.now(); delete draft.sample;
  const i = scripts.findIndex(x => x.id === draft.id);
  if (i >= 0) scripts[i] = draft; else scripts.unshift(draft);
  saveScripts(); dirty = false; toast(`${CAT[draft.cat].name} 보관함에 저장했습니다`);
}
function openScript(id) { const s = scripts.find(x => x.id === id); if (!s) return; draft = JSON.parse(JSON.stringify(s)); dirty = false; go('editor'); }

V.category = p => {
  const c = CAT[p.id], t = p.tab || 'flow';
  let body = '';
  if (t === 'flow') body = `<div class="list">${c.flows.map(([id, name]) => { const f = FMT[id]; return `<div class="flow"><b>${esc(name)}</b><small>${f.name} · ${f.sum}</small>${stepsOf(f)}<span><button class="btn sm" data-act="startFlow" data-cat="${c.id}" data-id="${id}">이 흐름으로 만들기</button></span></div>`; }).join('')}</div>
    <p class="hint">이 분야에서 널리 쓰이는 구성입니다. 채널 반응을 보며 하나를 골라 반복하세요.</p>`;
  if (t === 'road') body = `<div class="road">${c.stages.map((s, i) => { const m = STAGE_META[i]; return `<div class="st ${i === settings.stage ? 'on' : ''}"><div class="rail"><span class="dot num">${i + 1}</span>${i < 2 ? '<span class="line"></span>' : ''}</div><div class="bd"><h3>${m.name}<small>${m.range}</small>${i === settings.stage ? ' <span class="tag a">지금</span>' : ''}</h3><p class="hint">${m.key}</p>
      <div class="card" style="margin-top:10px"><dl style="margin:0" class="roaddl"><dt>목표</dt><dd>${s.goal}</dd><dt>콘텐츠</dt><dd>${s.content}</dd><dt>볼 지표</dt><dd>${s.kpi}</dd><dt>바꿀 점</dt><dd>${s.shift}</dd></dl></div></div></div>`; }).join('')}</div>`;
  if (t === 'hook') body = `<div class="list">${c.hooks.map(h => `<div class="row"><span class="grow" style="white-space:normal"><b style="white-space:normal">${esc(h)}</b></span><button class="btn sm" data-act="copy" data-t="${esc(h)}">복사</button></div>`).join('')}</div>
    <p class="hint">추천 훅 유형: ${HOOK[c.hook].name}. ${HOOK[c.hook].why}</p>`;
  return { title: c.name, back: true, html: `
    <p class="lead">${c.why}</p>
    <div class="chips wrap"><span class="tag">추천 길이 ${c.len}초</span>${c.tags.map(x => `<span class="tag">#${x}</span>`).join('')}</div>
    ${seg('ctab', [['flow', '스크립트 흐름'], ['road', '성장 로드맵'], ['hook', '훅 예시']], t)}
    ${body}
    <button class="btn ink block" data-act="startFlow" data-cat="${c.id}" data-id="${c.flows[0][0]}">${c.name} 대본 만들기</button>` };
};

V.learn = p => {
  const t = p.tab || 'principle', tabs = [...LEARN.map(l => [l.id, l.name]), ['hooks', '훅 공식']];
  let body;
  if (t === 'hooks') body = `<div class="list">${HOOKS.map(h => `<div class="art"><h3>${h.name}</h3><p>${h.why}</p><div class="ex">${esc(fill(h.tpl[0], makeCtx({ topic: '아침 루틴' })))}</div><span><button class="btn sm" data-act="useHook" data-id="${h.id}">이 훅으로 만들기</button></span></div>`).join('')}</div>
    <h2 style="margin:6px 0 0;font-size:16px">마무리 공식</h2><div class="list">${CTAS.map(c => `<div class="art"><h3>${c.name}</h3><p>${c.why}</p><div class="ex">${esc(fill(c.tpl[0], { t: '아침 루틴' }))}</div></div>`).join('')}</div>`;
  else body = `<div class="list">${LEARN.find(l => l.id === t).items.map(([h, d, ex]) => `<div class="art"><h3>${h}</h3><p>${d}</p><div class="ex">${ex}</div></div>`).join('')}</div>`;
  return { nav: 'learn', title: '터지는 쇼츠의 원리', html: `<div class="chips">${tabs.map(([id, n]) => `<button class="chip ${id === t ? 'on' : ''}" data-act="ltab" data-v="${id}">${n}</button>`).join('')}</div>${body}` };
};

V.library = p => {
  const q = (p.q || '').trim(), catF = p.cat || null;
  let list = scripts.filter(s => (!catF || s.cat === catF) && (!q || (s.title + s.topic + toSay(s)).includes(q)) && (!p.fav || s.fav));
  list.sort((a, b) => b.updated - a.updated);
  const counts = {}; scripts.forEach(s => counts[s.cat] = (counts[s.cat] || 0) + 1);
  if (sel) return { nav: 'library', title: `${sel.size}개 선택`, back: true, acts: `<button class="tb" data-act="selAll">전체 선택</button>`, html: `
    <div class="list">${list.map(s => scriptRow(s, `<span class="ck ${sel.has(s.id) ? 'on' : ''}"></span>`)).join('')}</div>
    <div class="sticky"><button class="btn" data-act="selDelete">삭제</button><button class="btn" data-act="selMove">분야 이동</button><button class="btn pri" data-act="selExport">내보내기</button></div>`, flush: true };
  const folders = CATEGORIES.filter(c => counts[c.id]);
  return { nav: 'library', title: '보관함', acts: scripts.length ? `<button class="tb" data-act="selStart">선택</button>` : '', html: `
    <input class="in" id="lq" type="search" placeholder="제목이나 대사로 찾기" value="${esc(q)}" aria-label="검색">
    <div class="chips"><button class="chip ${!catF && !p.fav ? 'on' : ''}" data-act="lcat" data-v="">전체 ${scripts.length}</button><button class="chip ${p.fav ? 'on' : ''}" data-act="lfav">★ 즐겨찾기</button>${folders.map(c => `<button class="chip ${catF === c.id ? 'on' : ''}" data-act="lcat" data-v="${c.id}">${c.name} ${counts[c.id]}</button>`).join('')}</div>
    ${!catF && !q && !p.fav && folders.length > 1 ? `<div class="sec"><h2>분야별 보관</h2><div class="list">${folders.map(c => `<button class="row" data-act="lcat" data-v="${c.id}">${glyph(c)}<span class="grow"><b>${c.name}</b><small>대본 ${counts[c.id]}편</small></span><span class="chev">›</span></button>`).join('')}</div></div>` : ''}
    <div class="sec"><h2>${catF ? CAT[catF].name : p.fav ? '즐겨찾기' : '모든 대본'} <button data-act="exportShown">${list.length ? '이 목록 내보내기' : ''}</button></h2>
    ${list.length ? `<div class="list">${list.map(s => scriptRow(s)).join('')}</div><p class="hint">대본을 길게 누르면 여러 개를 골라 한 번에 내보낼 수 있습니다.</p>` : `<div class="card empty"><b>${scripts.length ? '찾는 대본이 없습니다' : '보관된 대본이 없습니다'}</b>${scripts.length ? '검색어나 분야를 바꿔 보세요.' : '대본을 만들고 저장하면 분야별로 모입니다.'}</div>`}</div>` };
};

const TOOLS = [
  ['hookgen', '훅 생성기', '주제 하나로 첫 문장 18가지'], ['titlegen', '제목 생성기', '주제 하나로 제목 12가지'],
  ['angle', '주제 확장기', '한 주제를 12가지 각도로'], ['diag', '대본 진단', '써 둔 대본의 길이와 약점 확인'],
  ['check', '업로드 전 점검표', '올리기 전 12가지 확인'], ['learn', '원리와 기법', '터지는 쇼츠의 원리 모아 보기']
];
V.tools = () => ({ nav: 'tools', title: '도구', html: `<div class="list">${TOOLS.map(([id, n, d]) => `<button class="row" data-act="${id === 'learn' ? 'tab' : 'go'}" data-v="${id}"><span class="grow"><b>${n}</b><small>${d}</small></span><span class="chev">›</span></button>`).join('')}</div>
  <div class="sec"><h2>분야 바로 가기</h2><div class="chips wrap">${CATEGORIES.map(c => `<button class="chip" data-act="go" data-v="category" data-id="${c.id}">${c.name}</button>`).join('')}</div></div>` });

const genTool = (title, id, ph, make) => p => {
  const t = (p.t || '').trim(), tone = p.tone || 0, out = t ? make(makeCtx({ topic: t, who: p.who, tone }), tone) : [];
  return { title, back: true, html: `
    <div class="field"><label for="g_t">주제</label><input class="in" id="g_t" data-p="t" value="${esc(p.t || '')}" placeholder="${ph}"></div>
    <div class="field"><label for="g_w">누가 보는 영상인가요 (선택)</label><input class="in" id="g_w" data-p="who" value="${esc(p.who || '')}" placeholder="예: 직장인"></div>
    ${id !== 'titlegen' ? seg('ptone', [[0, '존댓말'], [1, '반말']], tone) : ''}
    <button class="btn pri block" data-act="rerender">만들기</button>
    ${out.length ? `<div class="list">${out.map(([tag, text, act]) => `<div class="row"><span class="grow" style="white-space:normal"><small>${tag}</small><b style="white-space:normal">${esc(text)}</b></span>${act || `<button class="btn sm" data-act="copy" data-t="${esc(text)}">복사</button>`}</div>`).join('')}</div>` : `<p class="hint">주제를 적고 만들기를 누르세요.</p>`}` };
};
V.hookgen = genTool('훅 생성기', 'hookgen', '예: 전세 계약', (ctx, tone) => HOOKS.map(h => [h.name, fill(h.tpl[tone], ctx), `<button class="btn sm" data-act="hookTo" data-id="${h.id}">대본으로</button>`]));
V.titlegen = genTool('제목 생성기', 'titlegen', '예: 전세 계약', ctx => TITLES.map((t, i) => ['제목 ' + (i + 1), fill(t, ctx)]));
V.angle = genTool('주제 확장기', 'angle', '예: 전세 계약', ctx => ANGLES.map(([n, t]) => [n, fill(t, ctx)]));

V.diag = p => {
  const text = p.text || ''; let res = '';
  if (text.trim()) {
    const sents = text.split(/[.?!\n]+/).map(x => x.trim()).filter(Boolean), first = sents[0] || '', total = est(text);
    const longest = Math.max(...sents.map(x => spoken(x).length)), fill_ = (text.match(/그래서|사실|약간|진짜|이제|그니까|그러니까|여러분/g) || []).length;
    const rows = [
      [true, `읽기 시간 ${fmtSec(total)} · ${spoken(text).length}자 · ${sents.length}문장`, total > 60 ? '60초를 넘습니다. 쇼츠 하나에는 약속 하나만 남기세요.' : `초당 ${settings.cps}자 기준입니다.`],
      [est(first) <= 3.3, '첫 문장이 3초 안에 읽힌다', `지금 ${fmtSec(est(first))}입니다.`],
      [/[0-9?]|마세요|하지 마|절대|아직도|왜/.test(first), '첫 문장에 숫자·질문·경고가 있다', '궁금증을 만드는 장치를 넣어 보세요.'],
      [!/안녕|반갑/.test(first), '인사말로 시작하지 않는다', '인사는 빼고 바로 본론으로.'],
      [longest <= 38, '문장이 한 호흡에 읽힌다', `가장 긴 문장이 ${longest}자입니다.`],
      [fill_ <= 2, '군더더기 말이 적다', `그래서·사실·진짜 같은 말이 ${fill_}번 나옵니다.`],
      [/구독|댓글|저장|공유|좋아요|다음 편/.test(text), '마무리 요청이 있다', '원하는 행동 하나를 한 문장으로 요청하세요.']
    ];
    res = `<div class="card score"><ul>${rows.map(([ok, l, tip], i) => `<li><span class="m ${ok ? '' : 'x'}"></span><span>${l}${!ok || i === 0 ? `<small>${tip}</small>` : ''}</span></li>`).join('')}</ul></div>`;
  }
  return { title: '대본 진단', back: true, html: `<div class="field"><label for="d_t">대본 붙여넣기</label><textarea class="in" id="d_t" rows="8" data-p="text" placeholder="써 둔 대본을 여기에 붙여 넣으세요.">${esc(text)}</textarea></div><button class="btn pri block" data-act="rerender">진단하기</button>${res}` };
};
V.check = () => ({ title: '업로드 전 점검표', back: true, html: `<p class="lead">${settings.checks.length} / ${CHECKLIST.length} 확인</p><div class="list">${CHECKLIST.map((c, i) => `<button class="row" data-act="check" data-i="${i}"><span class="ck ${settings.checks.includes(i) ? 'on' : ''}"></span><span class="grow"><b style="white-space:normal">${c}</b></span></button>`).join('')}</div><button class="btn block" data-act="checkReset">모두 지우기</button>` });

V.settings = () => ({ title: '설정', back: true, html: `
  <div class="sec"><span class="lab">화면 테마</span>${seg('theme', [['system', '기기 설정'], ['light', '밝게'], ['dark', '어둡게']], settings.theme)}</div>
  <div class="sec"><span class="lab">말하는 속도</span>${seg('cps', [[5, '차분하게'], [6, '보통'], [7, '빠르게']], settings.cps)}<p class="hint">초당 ${settings.cps}자로 읽기 시간을 계산합니다.</p></div>
  <div class="sec"><span class="lab">내 채널 단계</span>${seg('stage', STAGE_META.map(s => [s.id, s.name]), settings.stage)}</div>
  <div class="sec"><h2>백업</h2><div class="list">
    <button class="row" data-act="backup"><span class="grow"><b>모든 대본 백업하기</b><small>대본 ${scripts.length}편을 파일 하나로 저장</small></span><span class="chev">›</span></button>
    <button class="row" data-act="restore"><span class="grow"><b>백업 파일 불러오기</b><small>같은 대본은 건너뛰고 새 대본만 추가</small></span><span class="chev">›</span></button></div></div>
  <div class="sec"><h2>정보</h2><div class="list">
    <button class="row" data-act="go" data-v="privacy"><span class="grow"><b>개인정보 처리방침</b></span><span class="chev">›</span></button>
    <div class="row"><span class="grow"><b>버전</b></span><span class="chev num">${APP_VERSION}</span></div></div></div>` });
V.privacy = () => ({ title: '개인정보 처리방침', back: true, html: `<div class="card" style="display:flex;flex-direction:column;gap:10px">
  <p style="margin:0">쇼츠 대본메이커는 개인정보를 수집하지 않습니다.</p>
  <p style="margin:0">작성한 대본과 설정은 이 기기 안에만 저장되며 서버로 전송되지 않습니다. 앱을 삭제하면 함께 지워집니다.</p>
  <p style="margin:0">내보내기와 공유는 사용자가 직접 선택한 곳으로만 전달됩니다.</p>
  <p style="margin:0">문의: happyfamily1984.3@gmail.com</p></div>` });

/* ---------- 프롬프터 ---------- */
let pr = { size: 34, speed: 3, on: false };
V.prompter = () => ({ raw: true, html: `<div class="prompter"><div class="guide"></div><div class="scr" id="scr" style="font-size:${pr.size}px">${draft.beats.map(b => `<p><small>${esc(b.k)}</small>${esc(b.say)}</p>`).join('')}</div>
  <div class="ctl"><button data-act="back">닫기</button><button data-act="prSize" data-d="-4" aria-label="글자 작게">가−</button><button data-act="prSize" data-d="4" aria-label="글자 크게">가+</button><button data-act="prSpeed" aria-label="속도">속도 ${pr.speed}</button><button class="play" data-act="prPlay">${pr.on ? '멈춤' : '시작'}</button></div></div>` });
function stopPrompter() { pr.on = false; cancelAnimationFrame(promptTimer); }
function runPrompter() {
  let last = performance.now(), acc = 0;
  const step = now => { if (!pr.on) return; const el = $('#scr'); if (!el) return stopPrompter();
    acc += (now - last) / 1000 * pr.speed * 14; last = now; const d = Math.floor(acc); if (d) { el.scrollTop += d; acc -= d; }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) { pr.on = false; return render(); }
    promptTimer = requestAnimationFrame(step); };
  promptTimer = requestAnimationFrame(step);
}

/* ---------- 그리기 ---------- */
const NAV = [['home', '홈', 'home'], ['learn', '원리', 'book'], ['create', '만들기', 'plus'], ['library', '보관함', 'folder'], ['tools', '도구', 'tool']];
function render(resetScroll) {
  const c = cur(), r = V[c.v](c.p), view = $('#view'), keep = view.scrollTop;
  const raw = !!r.raw;
  $('#top').hidden = raw; $('#nav').hidden = raw || !!r.back;
  $('#top').innerHTML = r.top || `${r.back ? `<button class="ib" data-act="back" aria-label="뒤로">${ic('back')}</button>` : ''}<h1>${esc(r.title || '')}</h1>${r.acts || ''}`;
  view.className = r.flush ? 'flush' : ''; view.innerHTML = r.html;
  $('#nav').innerHTML = NAV.map(([v, l, i]) => v === 'create' ? `<button class="nav make" data-act="tab" data-v="create" aria-label="대본 만들기"><span>${ic(i)}</span><em>${l}</em></button>` : `<button class="nav ${r.nav === v ? 'on' : ''}" data-act="tab" data-v="${v}">${ic(i)}${l}</button>`).join('');
  view.scrollTop = resetScroll ? 0 : keep;
  $$('.beat textarea', view).forEach(autoGrow);
}
const autoGrow = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };

/* ---------- 내보내기 흐름 ---------- */
function exportFlow(list, label) {
  if (!list.length) return toast('내보낼 대본이 없습니다');
  const fmts = EXPORTS.filter(f => !(f.single && list.length > 1));
  sheet(`${label} 내보내기`, fmts.map(f => [f.name, f.sub, () => {
    const text = buildExport(f, list), name = `쇼츠대본_${label.replace(/[^가-힣0-9a-zA-Z]+/g, '_').slice(0, 20)}_${dateStr().replace(/\./g, '')}.${f.ext}`;
    sheet(f.name, [['공유하기', '메신저, 메일, 메모 앱으로 보내기', () => Native.share(label, text)], ['파일로 저장', name, () => Native.save(name, f.mime, text)], ['복사하기', '클립보드에 복사', () => copyText(text)]]);
  }]));
}
function importBackup(text) {
  try {
    const data = JSON.parse(text), arr = Array.isArray(data) ? data : data.scripts; if (!Array.isArray(arr)) throw 0;
    const ids = new Set(scripts.map(s => s.id)); let n = 0;
    arr.forEach(s => { if (s && s.id && !ids.has(s.id) && CAT[s.cat] && FMT[s.format] && Array.isArray(s.beats)) { scripts.push(s); n++; } });
    saveScripts(); toast(n ? `대본 ${n}편을 불러왔습니다` : '새로 추가할 대본이 없습니다'); render();
  } catch (e) { toast('백업 파일을 읽지 못했습니다'); }
}
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => importBackup(r.result); r.readAsText(f); e.target.value = ''; });

/* ---------- 이벤트 ---------- */
const A = {
  back: () => onBack(),
  go: d => go(d.v, d.id ? { id: d.id } : {}),
  tab: d => { if (d.v === 'create') { if (!form) newForm(); return go('create'); } tab(d.v); },
  quick: () => { const t = $('#quick').value.trim(); newForm({ topic: t }); go('create'); },
  useHook: d => { newForm(Object.assign({}, form && form.topic ? form : {}, { hook: d.id })); go('create'); },
  hookTo: d => { const p = cur().p; newForm({ topic: p.t || '', who: p.who || '', tone: p.tone || 0, hook: d.id }); go('create'); },
  startFlow: d => { newForm({ cat: d.cat, format: d.id, topic: form ? form.topic : '' }); go('create'); },
  allFlows: () => { cur().p.all = !cur().p.all; render(); },
  set: d => {
    const k = d.k, v = /^\d+$/.test(d.v) ? +d.v : d.v;
    if (k === 'stage') { settings.stage = v; saveSettings(); }
    else if (k === 'theme' || k === 'cps') { settings[k] = v; saveSettings(); }
    else if (k === 'ctab') cur().p.tab = v;
    else if (k === 'ptone') cur().p.tone = v;
    else if (k === 'fstage') form.stage = v;
    else if (k === 'cat') { form.cat = v; form.format = CAT[v].flows[0][0]; form.len = CAT[v].len; }
    else form[k] = v;
    render();
  },
  generate: () => {
    if (!form.topic.trim()) { toast('주제를 적어 주세요'); $('#f_topic').focus(); return; }
    draft = generate(form); dirty = true; form = null; go('editor', {}, true);
  },
  open: d => { if (sel) { sel.has(d.id) ? sel.delete(d.id) : sel.add(d.id); return render(); } openScript(d.id); },
  save: () => { saveDraft(); render(); },
  copy: d => copyText(d.t),
  copySay: () => copyText(toSay(draft), '대사를 복사했습니다'),
  exportOne: () => exportFlow([draft], draft.title),
  prompter: () => { pr.on = false; go('prompter'); },
  useTitle: d => { draft.title = draft.titles[+d.i]; dirty = true; render(); toast('제목을 바꿨습니다'); },
  swapHook: () => { const i = HOOKS.findIndex(h => h.id === draft.hook), h = HOOKS[(i + 1) % HOOKS.length]; draft.hook = h.id;
    draft.beats.find(b => b.type === 'hook').say = fill(h.tpl[draft.tone], makeCtx(Object.assign({ topic: draft.topic, tone: draft.tone }, draft.input))); dirty = true; render(); toast(h.name); },
  swapCta: () => { const i = CTAS.findIndex(h => h.id === draft.cta), c = CTAS[(i + 1) % CTAS.length]; draft.cta = c.id; const b = draft.beats.filter(x => x.type === 'cta').pop();
    b.say = fill(c.tpl[draft.tone], { t: draft.topic }); b.cap = c.name; dirty = true; render(); toast(c.name); },
  beatMenu: (d, el) => { const i = +el.closest('.beat').dataset.i, b = draft.beats[i];
    sheet(b.k, [['1초 늘리기', `지금 ${fmtSec(b.sec)}`, () => { b.sec += 1; draft.len += 1; dirty = true; render(); }], ['1초 줄이기', '', () => { if (b.sec > 1.5) { b.sec -= 1; draft.len -= 1; dirty = true; } render(); }],
      ['위로 옮기기', '', () => { if (i > 1) { draft.beats.splice(i - 1, 0, draft.beats.splice(i, 1)[0]); dirty = true; } render(); }], ['이 구간 삭제', '', () => { draft.len -= b.sec; draft.beats.splice(i, 1); dirty = true; render(); }]]); },
  addBeat: () => { const i = draft.beats.length - (draft.beats[draft.beats.length - 1].type === 'cta' ? 1 : 0); draft.beats.splice(i, 0, { k: '추가 구간', type: 'body', sec: 3, say: '', cap: '', shot: '' }); draft.len += 3; dirty = true; render(); },
  ltab: d => { cur().p.tab = d.v; render(true); },
  lcat: d => { const p = cur().p; p.cat = d.v || null; p.fav = false; render(true); },
  lfav: () => { const p = cur().p; p.fav = !p.fav; p.cat = null; render(true); },
  selStart: () => { sel = new Set(); render(); },
  selAll: () => { const all = $$('#view [data-act="open"]').map(e => e.dataset.id); sel = new Set(sel.size === all.length ? [] : all); render(); },
  selDelete: () => { if (!sel.size) return toast('대본을 선택하세요'); dialog(`대본 ${sel.size}편을 삭제할까요?`, '삭제한 대본은 되돌릴 수 없습니다.', [['취소', null], ['삭제', () => { scripts = scripts.filter(s => !sel.has(s.id)); saveScripts(); sel = null; render(); toast('삭제했습니다'); }, 'pri']]); },
  selMove: () => { if (!sel.size) return toast('대본을 선택하세요'); sheet('어느 분야로 옮길까요', CATEGORIES.map(c => [c.name, '', () => { scripts.forEach(s => { if (sel.has(s.id)) s.cat = c.id; }); saveScripts(); sel = null; render(); toast(`${c.name}(으)로 옮겼습니다`); }])); },
  selExport: () => { if (!sel.size) return toast('대본을 선택하세요'); exportFlow(scripts.filter(s => sel.has(s.id)), `선택 ${sel.size}편`); },
  exportShown: () => { const ids = $$('#view [data-act="open"]').map(e => e.dataset.id), p = cur().p; exportFlow(scripts.filter(s => ids.includes(s.id)), p.cat ? CAT[p.cat].name : '전체'); },
  rerender: () => render(),
  check: d => { const i = +d.i, a = settings.checks; a.includes(i) ? a.splice(a.indexOf(i), 1) : a.push(i); saveSettings(); render(); },
  checkReset: () => { settings.checks = []; saveSettings(); render(); },
  backup: () => exportFlow(scripts, '전체'),
  restore: () => $('#importFile').click(),
  prSize: d => { pr.size = Math.min(64, Math.max(22, pr.size + +d.d)); $('#scr').style.fontSize = pr.size + 'px'; },
  prSpeed: (d, el) => { pr.speed = pr.speed % 6 + 1; el.textContent = '속도 ' + pr.speed; },
  prPlay: (d, el) => { pr.on = !pr.on; el.textContent = pr.on ? '멈춤' : '시작'; if (pr.on) runPrompter(); else stopPrompter(); }
};
document.addEventListener('click', e => {
  if (e.target.closest('#layer')) return;
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (pressFired) { pressFired = false; return; }
  const fn = A[el.dataset.act]; if (fn) fn(el.dataset, el);
});
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.f) form[d.f] = t.value;
  else if (d.p) cur().p[d.p] = t.value;
  else if (d.s) { draft[d.s] = t.value; dirty = true; }
  else if (d.b) { draft.beats[+t.closest('.beat').dataset.i][d.b] = t.value; dirty = true; if (t.tagName === 'TEXTAREA') autoGrow(t); refreshEditor(); }
  else if (t.id === 'lq') { cur().p.q = t.value; clearTimeout(t._t); t._t = setTimeout(() => { render(); const n = $('#lq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 350); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'quick') A.quick(); if (e.key === 'Escape') onBack(); });
/* 보관함에서 길게 누르면 선택 모드 */
let pressT, pressFired = false;
document.addEventListener('pointerdown', e => {
  pressFired = false;
  const row = e.target.closest('[data-act="open"]'); if (!row || cur().v !== 'library' || sel) return;
  pressT = setTimeout(() => { pressFired = true; sel = new Set([row.dataset.id]); render(); if (navigator.vibrate) navigator.vibrate(15); }, 480);
});
['pointerup', 'pointercancel', 'pointermove'].forEach(n => document.addEventListener(n, e => { if (n !== 'pointermove' || Math.abs(e.movementY) > 3) clearTimeout(pressT); }));

/* ---------- 시작 ---------- */
applyTheme();
if (scripts === null) {
  const s = generate(Object.assign({ tone: 0, stage: 0 }, SAMPLE)); s.sample = true; s.title = '자취방 곰팡이, 이것만은 하지 마세요';
  scripts = [s]; saveScripts();
}
render(true);
