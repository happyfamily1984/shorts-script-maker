'use strict';
/* ---------- 기본 도구 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const FMT = Object.fromEntries(FORMATS.map(f => [f.id, f]));
const HOOK = Object.fromEntries(HOOKS.map(h => [h.id, h]));
const CTA = Object.fromEntries(CTAS.map(c => [c.id, c]));
const APP_VERSION = '1.4.0';

const store = {
  get(k, d) { try { const v = localStorage.getItem('ssm.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ssm.' + k, JSON.stringify(v)); } catch (e) {} }
};
let settings = Object.assign({ theme: 'light', cps: 6, stage: 0, checks: [], sort: 'pop', myCats: [] }, store.get('settings', {}));
let scripts = store.get('scripts', null);
const saveScripts = () => store.set('scripts', scripts);
const saveSettings = () => { store.set('settings', settings); applyTheme(); };
function applyTheme() {
  const r = document.documentElement;
  if (settings.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
  const dk = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  try { if (window.AndroidBridge && window.AndroidBridge.setDark) window.AndroidBridge.setDark(dk); } catch (e) {}
}

const ICON = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  book: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tool: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  chart: '<path d="M3 20h18"/><rect x="5" y="12" width="3" height="6" rx="1"/><rect x="10.5" y="8" width="3" height="10" rx="1"/><rect x="16" y="4" width="3" height="14" rx="1"/>',
  chef: '<path d="M7 14a4 4 0 0 1-.6-7.9A5 5 0 0 1 12 3a5 5 0 0 1 5.6 3.1A4 4 0 0 1 17 14v6H7z"/><path d="M7 17h10"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  sparkle: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  laugh: '<circle cx="12" cy="12" r="9"/><path d="M8 13.5a4.5 4.5 0 0 0 8 0z"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  game: '<path d="M6 8h12a4 4 0 0 1 4 4v1a3.5 3.5 0 0 1-6.3 2.1L15 14H9l-.7 1.1A3.5 3.5 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 10.5v3M5.5 12h3M16 11h.01M18 13h.01"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  rocket: '<path d="M12 3c3.5 2 5 5.5 5 9.5L15 16H9l-2-3.5C7 8.5 8.5 5 12 3z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M9 16l-2.5 3.5M15 16l2.5 3.5M12 17v4"/>',
  baby: '<circle cx="12" cy="12.5" r="8.5"/><path d="M9 15a3.5 3.5 0 0 0 6 0M9 11h.01M15 11h.01M12 4a2 2 0 0 0 2 2"/>',
  plane: '<path d="M21 4l-7.5 16-3-7-7-3z"/><path d="M10.5 13L21 4"/>',
  paw: '<circle cx="6.5" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="17.5" cy="10" r="1.8"/><path d="M12 11.5c-3 0-5.5 3.5-5.5 6 0 1.5 1.5 2 3 1.5l2.5-.8 2.5.8c1.5.5 3 0 3-1.5 0-2.5-2.5-6-5.5-6z"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  more: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  caption: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  scene: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  clapper: '<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 10l-.5-3.2L18.3 4l.6 3.2L4 10M8.5 6l2 3M13.5 5l2 3"/>',
  road: '<path d="M5 20L9.5 4M19 20L14.5 4M12 6v2M12 11v2M12 16v2"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  flame: '<path d="M12 21a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9h10M7 12.5h6"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  hash: '<path d="M5 9h15M4 15h15M10 3L8 21M16 3l-2 18"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  exit: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 8l-4 4 4 4M6 12h10"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;

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
function shortCap(t) {
  let c = String(t || '').replace(/[〔〕]/g, '').split(/[.!?…,]/)[0].trim();
  if (c.length > 14) { c = c.slice(0, 13); const sp = c.lastIndexOf(' '); if (sp > 5) c = c.slice(0, sp); }
  return c;
}
function generate(o) {
  const cat = CAT[o.cat], f = FMT[o.format], ctx = makeCtx(o), ti = ctx.ti;
  let hookId = o.hook && o.hook !== 'auto' ? o.hook : cat.hook;
  if ((!o.hook || o.hook === 'auto') && hookId === 'result' && ['review', 'news', 'myth'].includes(o.format)) hookId = 'proof';
  const ctaId = o.cta && o.cta !== 'auto' ? o.cta : STAGE_META[o.stage].cta;
  const ready = Array.isArray(o.lines);
  let len = o.len, hookSec = len <= 20 ? 2 : 3, rest = len - hookSec, li = 0;
  const sumP = f.beats.reduce((a, b) => a + (b.p || 0), 0);
  let used = hookSec;
  let beats = f.beats.map((b, i) => {
    let sec, say, cap, type = 'body';
    if (b.hook) { type = 'hook'; sec = hookSec; say = ready ? o.hookLine : fill(HOOK[hookId].tpl[ti], ctx); cap = ready ? shortCap(o.title || ctx.t) : ctx.t; }
    else if (ready && !b.cta) { say = o.lines[li++] || ''; cap = b.cap && !b.cap.includes('{') ? b.cap : shortCap(say); sec = 0; }
    else {
      sec = Math.max(1.5, Math.round(rest * b.p / sumP * 2) / 2);
      if (i === f.beats.length - 1) sec = Math.max(1.5, len - used);
      used += i === f.beats.length - 1 ? 0 : sec;
      if (b.cta) { type = 'cta'; say = fill(CTA[ctaId].tpl[ti], ctx); cap = CTA[ctaId].name; }
      else { say = fill(b.tpl[ti], ctx); cap = fill(b.cap || '', ctx); }
    }
    return { k: b.k, type, sec, say, cap, shot: b.shot || '' };
  });
  if (ready) {
    beats.forEach(b => { b.sec = Math.max(b.type === 'hook' ? 2 : 1.5, Math.ceil(est(b.say) * 2) / 2 + (b.type === 'hook' ? 0 : .5)); });
    len = beats.reduce((a, b) => a + b.sec, 0);
  }
  const seed = [...ctx.t].reduce((a, c) => a + c.charCodeAt(0), 0);
  const titles = Array.from({ length: 5 }, (_, i) => fill(TITLES[(seed + i * 5) % TITLES.length], ctx));
  if (o.title) titles.unshift(o.title), titles.pop();
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
window.onNativeSaved = ok => toast(ok ? '파일로 저장했습니다' : '저장하지 않았습니다');
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
function closeLayer() { if (aiToken) { aiToken.cancel = true; aiToken = null; } overlays.pop(); $('#layer').innerHTML = ''; layerActs = {}; }
let layerActs = {};
function dialog(title, body, acts) {
  layerActs = {};
  layer(`<div class="dialog" role="alertdialog" aria-label="${esc(title)}"><span class="di">${ic(/종료/.test(title) ? 'exit' : /삭제/.test(title) ? 'trash' : 'info')}</span><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}<div class="acts">${acts.map(([l, fn, c], i) => { layerActs['d' + i] = fn; return `<button class="btn ${c || ''}" data-lact="d${i}">${esc(l)}</button>`; }).join('')}</div></div>`, true);
}
function sheet(title, rows) {
  layerActs = {};
  layer(`<div class="sheet"><h3>${esc(title)}</h3><div class="list">${rows.map(([l, sub, fn], i) => { layerActs['s' + i] = fn; return `<button class="row" data-lact="s${i}"><span class="grow"><b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="chev">${ic('chevron')}</span></button>`; }).join('')}</div></div>`);
}
$('#layer').addEventListener('click', e => {
  if (e.target.id === 'layer') return closeLayer();
  const b = e.target.closest('[data-lact]'); if (!b) return;
  const fn = layerActs[b.dataset.lact]; closeLayer(); if (fn) fn();
});
let toastT;
function toast(m) { const t = $('#toast'); t.innerHTML = ic('checkc') + esc(m); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900); }

/* ---------- 공통 조각 ---------- */
const CICON = { info: 'bulb', money: 'chart', food: 'chef', eat: 'pin', beauty: 'sparkle', fit: 'bolt', story: 'laugh', vlog: 'camera', game: 'game', tech: 'cpu', grow: 'rocket', kids: 'baby', travel: 'plane', pet: 'paw', media: 'film', shop: 'bag' };
let artN = 0;
function art(icon, h = 218) {
  const n = ++artN, bars = [[14, 58, 24], [25, 46, 44], [36, 38, 60], [47, 50, 36], [58, 42, 52]];
  return `<svg class="art" viewBox="0 0 170 130" aria-hidden="true"><defs>
  <linearGradient id="ag${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 95% 72%)"/><stop offset="1" stop-color="hsl(${h + 14} 88% 50%)"/></linearGradient>
  <radialGradient id="ab${n}"><stop offset="0" stop-color="hsl(${h} 95% 80%)" stop-opacity=".75"/><stop offset="1" stop-color="hsl(${h} 95% 80%)" stop-opacity="0"/></radialGradient></defs>
  <circle cx="108" cy="62" r="64" fill="url(#ab${n})"/>
  <g fill="hsl(${h} 90% 70%)" opacity=".5">${bars.map(([x, y, hh]) => `<rect x="${x}" y="${y}" width="7" height="${hh}" rx="3.5"/>`).join('')}</g>
  <ellipse cx="114" cy="118" rx="44" ry="8" fill="hsl(${h} 60% 50%)" opacity=".16"/>
  <rect x="74" y="20" width="80" height="80" rx="27" fill="url(#ag${n})"/>
  <rect x="81" y="25" width="66" height="30" rx="16" fill="#fff" opacity=".24"/>
  <g transform="translate(90 36) scale(2)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g>
  <path d="M155 12l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFC53D"/>
  <path d="M68 14l1.7 3.8 3.8 1.7-3.8 1.7L68 25l-1.7-3.8-3.8-1.7 3.8-1.7z" fill="#FFC53D" opacity=".85"/></svg>`;
}
const tlBar = s => `<div class="tl" aria-hidden="true">${s.beats.map(b => `<i class="${b.type === 'hook' ? 'h' : b.type === 'cta' ? 'c' : ''}" style="flex:${b.sec}"></i>`).join('')}</div>`;
const glyph = (c, big) => `<span class="glyph${big ? ' big' : ''}" style="--h:${c.hue}">${ic(CICON[c.id])}</span>`;
const chev = `<span class="chev">${ic('chevron')}</span>`;
const h2 = (icon, text, right = '') => `<h2 class="h2"><span class="hi">${ic(icon)}</span>${text}<span class="sp"></span>${right}</h2>`;
const scriptRow = (s, extra) => `<div class="row" role="button" tabindex="0" data-act="open" data-id="${s.id}">${extra || glyph(CAT[s.cat])}<span class="grow"><b>${esc(s.title)}</b><small>${CAT[s.cat].name} · ${FMT[s.format].name} · ${s.len}초 · ${dateStr(s.updated)}</small></span>${s.sample ? '<span class="tag pur">예시</span>' : ''}${extra ? '' : `<button class="ib sm star ${s.fav ? 'on' : ''}" data-act="fav" data-id="${s.id}" aria-label="즐겨찾기">${ic('star')}</button><button class="ib sm" data-act="rowMenu" data-id="${s.id}" aria-label="더보기">${ic('more')}</button>`}</div>`;
const stepsOf = f => `<span class="steps">${f.beats.map(b => `<span>${b.k}</span>`).join('')}</span>`;
const seg = (name, opts, val) => `<div class="seg" role="group">${opts.map(([v, l, i]) => `<button data-act="set" data-k="${name}" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${i ? ic(i) : ''}${l}</button>`).join('')}</div>`;
const pageHead = o => `<div class="phead"><div class="ph-t">${o.eyebrow ? `<span class="eyebrow">${ic(o.eicon || 'sparkle')}${o.eyebrow}</span>` : ''}${o.title ? `<h2>${o.title}</h2>` : ''}${o.lead ? `<p>${o.lead}</p>` : ''}</div>${art(o.icon, o.hue)}</div>`;

/* 분야 정렬·추천 */
const SORTS = [['pop', '조회수순', 'flame'], ['rpm', '수익순', 'chart'], ['ease', '쉬운순', 'bolt'], ['base', '기본순', 'grid']];
const SORT_NOTE = { pop: '조회수와 시청자 규모가 큰 분야부터 보여 줍니다.', rpm: '광고 단가와 수익화가 유리한 분야부터 보여 줍니다.', ease: '혼자, 폰 하나로 시작하기 쉬운 분야부터 보여 줍니다.', base: '기본 순서입니다.' };
const M = id => CAT_METRICS[id];
function sortedCats(by = settings.sort) {
  const mine = settings.myCats, arr = CATEGORIES.slice();
  if (by !== 'base') arr.sort((a, b) => (M(b.id)[by] - M(a.id)[by]) || (M(b.id).pop - M(a.id).pop) || (M(b.id).rpm - M(a.id).rpm) || (M(b.id).ease - M(a.id).ease));
  const rank = {}; arr.forEach((c, i) => rank[c.id] = i + 1);
  return { list: [...arr.filter(c => mine.includes(c.id)), ...arr.filter(c => !mine.includes(c.id))], rank };
}
const metricTags = m => [m.pop >= 4 && '조회수 높음', m.rpm >= 4 && '광고 단가 높음', m.ease >= 4 && '시작 쉬움', m.comp >= 4 && '경쟁 적음', !m.face && '얼굴 없이 가능'].filter(Boolean);
const dots = v => `<span class="dots" aria-label="5점 중 ${v}점">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</span>`;
const TRAITS = [['kids', '아이를 키워요'], ['money', '돈 관리에 관심 많아요'], ['fit', '운동을 꾸준히 해요'], ['media', '책·영화를 즐겨 봐요'], ['story', '이야기를 재밌게 해요'], ['shop', '물건 사기 전 비교를 잘해요'], ['grow', '공부·자기계발을 해요'], ['info', '생활 꿀팁을 잘 알아요']];
function recommend(p) {
  const goal = p.goal || 'views', face = p.face ?? 1, place = p.place ?? 0, tr = p.tr || [];
  const W = { views: { pop: 3, rpm: .5, ease: 1, comp: 1 }, money: { pop: 1, rpm: 3, ease: 1, comp: 1 }, long: { pop: 1, rpm: 1, ease: 2, comp: 2 } }[goal];
  const max = Object.values(W).reduce((a, w) => a + w * 5, 0) + 4;
  const bonus = { kids: 'kids', money: 'money', fit: 'fit', media: 'media', story: 'story', shop: 'shop', grow: 'grow', info: 'info' };
  return CATEGORIES.map(c => {
    const m = M(c.id); let s = Object.entries(W).reduce((a, [k, w]) => a + m[k] * w, 0);
    if (!face && m.face) s -= 5;
    if (!place && m.out) s -= 5;
    if (bonus[c.id] && tr.includes(bonus[c.id])) s += 4;
    if (c.id === 'kids' && !tr.includes('kids')) s -= 4;
    return { c, m, s, pct: Math.max(5, Math.min(99, Math.round(s / max * 100))) };
  }).sort((a, b) => b.s - a.s);
}

/* ---------- 대본 주제 ---------- */
const HAS_TOPICS = typeof TOPICS !== 'undefined';
const topicsOf = id => (HAS_TOPICS && TOPICS[id]) || [];
const TOPIC_COUNT = CATEGORIES.reduce((a, c) => a + topicsOf(c.id).length, 0);
const doneTopics = () => new Set(scripts.map(s => s.fromTopic).filter(Boolean));
function topicRow(cat, i, showCat, done) {
  const t = topicsOf(cat)[i], c = CAT[cat], key = cat + ':' + i;
  return `<div class="row trow" role="button" tabindex="0" data-act="openTopic" data-cat="${cat}" data-i="${i}">${glyph(c)}<span class="grow"><b>${esc(t[0])}</b><small>${showCat ? c.name + ' · ' : ''}${FMT[t[1]].name} · “${esc(t[2])}”</small></span>${done && done.has(key) ? '<span class="tag ok">작성함</span>' : ''}${chev}</div>`;
}
function openTopic(cat, i) {
  const t = topicsOf(cat)[i]; if (!t) return;
  draft = generate({ cat, format: t[1], topic: t[0], title: t[0], hookLine: t[2], lines: t.slice(3), tone: 0, stage: settings.stage, hook: 'auto', cta: 'auto', len: CAT[cat].len });
  draft.fromTopic = cat + ':' + i; dirty = true; go('editor');
}
function dailyTopics(n, seed) {
  const cats = settings.myCats.length ? settings.myCats : sortedCats().list.slice(0, 8).map(c => c.id), out = [];
  const day = Math.floor(Date.now() / 864e5) + (seed || 0) * 7;
  for (let k = 0; out.length < n && k < n * 6; k++) {
    const cat = cats[(day + k) % cats.length], list = topicsOf(cat); if (!list.length) continue;
    const i = (day * 13 + k * 29) % list.length; if (!out.some(([c, j]) => c === cat && j === i)) out.push([cat, i]);
  }
  return out;
}

/* ---------- AI (Gemini) ---------- */
const AI_DEFAULT_MODEL = 'gemini-2.5-flash';
const aiKeys = () => String(settings.aiKeys || '').split(/[,\s\n]+/).map(k => k.trim()).filter(Boolean);
const aiModel = () => String(settings.aiModel || AI_DEFAULT_MODEL).replace(/^models\//, '').trim() || AI_DEFAULT_MODEL;
const maskKey = k => k.length > 10 ? k.slice(0, 4) + '…' + k.slice(-4) : '••••';
const httpWait = {}, keyRest = {};
window.__nativeHttp = (id, status, text) => { const f = httpWait[id]; delete httpWait[id]; if (f) f({ status, text }); };
function httpReq(url, { method = 'GET', headers = {}, body = '' } = {}) {
  if (Native.has() && window.AndroidBridge.http) return new Promise(res => { const id = uid(); httpWait[id] = res; window.AndroidBridge.http(id, url, method, JSON.stringify(headers), body || ''); });
  return fetch(url, { method, headers, body: body || undefined }).then(async r => ({ status: r.status, text: await r.text() }), () => ({ status: 0, text: '' }));
}
function aiErr(r, ki) {
  let msg = ''; try { msg = JSON.parse(r.text).error.message || ''; } catch (e) {}
  const who = `${ki + 1}번 키`;
  if (r.status === 0) return '인터넷에 연결되지 않았습니다. 연결을 확인하고 다시 시도하세요.';
  if (r.status === 400 && /API key/i.test(msg)) return `${who}가 올바르지 않습니다.`;
  if (r.status === 429) return `${who}의 사용 한도가 찼습니다.`;
  if (r.status === 403) return `${who}에 이 API 사용 권한이 없습니다.`;
  if (r.status === 404) return `모델 "${aiModel()}"을 찾을 수 없습니다. 설정에서 모델 목록을 불러와 다른 모델을 고르세요.`;
  if (r.status >= 500) return 'Gemini 서버가 혼잡합니다. 잠시 후 다시 시도하세요.';
  return `${who} 요청 실패 (${r.status}) ${msg.slice(0, 80)}`;
}
const AI_SYS = `너는 유튜브 쇼츠 대본 전문 작가다. 조회수가 터지는 쇼츠의 원리를 반드시 지킨다.
- 첫 문장은 3초 안에 읽히고 궁금증을 만든다 (숫자, 질문, 경고, 결과 먼저 보여 주기 중 하나).
- 인사, 자기소개, 채널 소개는 쓰지 않는다. 한 영상에는 약속 하나만 담는다.
- 한 문장은 한 호흡에 읽히게 짧게 쓴다. 같은 표현을 구간끼리 반복하지 않는다.
- 뻔한 말 대신 구체적인 숫자, 사례, 감각 표현을 쓴다. 확실하지 않은 수치나 사실은 지어내지 말고 일반적인 표현을 쓴다.
- 자막(cap)은 화면에 띄울 핵심어로 12자 이내, 장면(shot)은 촬영·편집 지시로 20자 안팎으로 쓴다.
- 마지막 구간은 시청자에게 행동 하나만 짧게 요청하고, 가능하면 첫 문장으로 자연스럽게 이어지게 한다.
- 한국어로만 쓰고 JSON만 출력한다.`;
async function gemini(prompt, schema, token) {
  const keys = aiKeys(); if (!keys.length) throw new Error('설정에서 Gemini API 키를 먼저 넣어 주세요.');
  const body = JSON.stringify({ systemInstruction: { parts: [{ text: AI_SYS }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, responseMimeType: 'application/json', responseSchema: schema } });
  const start = (settings.aiNext || 0) % keys.length, errs = [], now = Date.now();
  const order = keys.map((_, i) => (start + i) % keys.length).sort((a, b) => ((keyRest[keys[a]] || 0) > now) - ((keyRest[keys[b]] || 0) > now));
  for (const ki of order) {
    if (token.cancel) throw new Error('cancel');
    const r = await httpReq(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(aiModel())}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': keys[ki] }, body });
    if (r.status === 200) {
      settings.aiNext = (ki + 1) % keys.length; saveSettings();
      let text = ''; try { text = JSON.parse(r.text).candidates[0].content.parts.map(p => p.text || '').join(''); } catch (e) {}
      text = text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '');
      try { return JSON.parse(text); } catch (e) { errs.push('AI 응답을 읽지 못했습니다. 다시 시도하세요.'); continue; }
    }
    errs.push(aiErr(r, ki));
    if (r.status === 429) keyRest[keys[ki]] = Date.now() + 60e3;
    else if (r.status === 400 || r.status === 403) keyRest[keys[ki]] = Date.now() + 600e3;
    if (r.status === 404 || r.status === 0) break;
  }
  throw new Error(errs.length > 1 ? `모든 키가 실패했습니다.\n${errs.join('\n')}` : errs[0]);
}
const S_STR = { type: 'STRING' }, S_BEAT = { type: 'OBJECT', properties: { say: S_STR, cap: S_STR, shot: S_STR }, required: ['say', 'cap', 'shot'] };
function aiContext(s) {
  const c = CAT[s.cat], f = FMT[s.format], st = STAGE_META[s.stage], h = HOOK[s.hook], ct = CTA[s.cta], inp = s.input || {};
  return `주제: ${s.topic}
분야: ${c.name} (${c.why})
스크립트 흐름: ${f.name} (${f.sum})
타깃 시청자: ${inp.who || '주제에 맞게 판단'}
핵심 포인트: 1) ${inp.p1 || '직접 채울 것'} 2) ${inp.p2 || '직접 채울 것'} 3) ${inp.p3 || '직접 채울 것'}
시청자가 얻는 것: ${inp.gain || '직접 정할 것'}
말투: ${s.tone ? '반말 (친구에게 말하듯)' : '존댓말 (~요 체)'}
채널 단계: ${st.name}, ${st.focus}
훅 유형: ${h.name} (${h.why})
마무리 유형: ${ct.name} (${ct.why})
목표 길이: ${s.len}초, 초당 약 ${settings.cps}자로 읽음
추가 요청: ${(s.aiReq || '').trim() || '없음'}`;
}
const beatLine = (b, i) => `${i + 1}. ${b.k} (${fmtSec(b.sec)}, 대사 최대 ${Math.max(6, Math.floor(b.sec * settings.cps))}자)`;
const draftLines = s => s.beats.map((b, i) => `${i + 1}. [${b.k}] ${b.say} / 자막: ${b.cap} / 장면: ${b.shot}`).join('\n');
let aiToken = null;
function aiRun(label, job, apply) {
  if (!aiKeys().length) return dialog('Gemini API 키가 필요합니다', '설정에서 키를 넣으면 AI로 대본을 쓸 수 있습니다.', [['닫기', null], ['설정 열기', () => go('settings'), 'pri']]);
  const token = { cancel: false }; aiToken = token; layerActs = { c0: () => { token.cancel = true; } };
  layer(`<div class="dialog" role="alertdialog" aria-label="${esc(label)}"><span class="spin" aria-hidden="true"></span><h3>${esc(label)}</h3><p>Gemini · ${esc(aiModel())}<br>보통 10~30초 걸립니다.</p><div class="acts"><button class="btn" data-lact="c0">취소</button></div></div>`, true);
  job(token).then(res => { if (token.cancel) return; aiToken = null; closeLayer(); apply(res); },
    e => { if (token.cancel) return; aiToken = null; closeLayer(); dialog('AI 생성에 실패했습니다', e.message, [['닫기', null], ['설정 열기', () => go('settings')]]); });
}
function aiWriteAll() {
  const s = draft;
  aiRun('AI가 대본을 쓰는 중', token => gemini(`${aiContext(s)}

아래 구간의 순서와 개수(${s.beats.length}개)를 그대로 지켜 각 구간의 say(읽을 대사), cap(화면 자막), shot(촬영·편집 지시)을 써라. 대사는 구간별 글자 수 한도를 넘기지 마라.
${s.beats.map(beatLine).join('\n')}

titles에는 쇼츠 제목 5개 (40자 이내, 앞쪽에 검색어), tags에는 해시태그 4~5개 (# 포함), pin에는 댓글을 부르는 고정 댓글 질문 1개를 써라.

현재 초안 (참고만 하고 더 좋게 바꿔라):
${draftLines(s)}`, { type: 'OBJECT', properties: { beats: { type: 'ARRAY', items: S_BEAT }, titles: { type: 'ARRAY', items: S_STR }, tags: { type: 'ARRAY', items: S_STR }, pin: S_STR }, required: ['beats', 'titles', 'tags', 'pin'] }, token),
  r => {
    if (!Array.isArray(r.beats) || !r.beats.length) return toast('AI 응답이 비어 있습니다');
    draft._undo = JSON.stringify({ beats: draft.beats, titles: draft.titles, tags: draft.tags, pin: draft.pin, title: draft.title });
    r.beats.slice(0, draft.beats.length).forEach((nb, i) => { const b = draft.beats[i]; b.say = String(nb.say || b.say).trim(); b.cap = String(nb.cap || '').trim(); b.shot = String(nb.shot || b.shot).trim(); });
    if (Array.isArray(r.titles) && r.titles.length) { draft.titles = r.titles.slice(0, 5).map(String); draft.title = draft.titles[0]; }
    if (Array.isArray(r.tags) && r.tags.length) draft.tags = r.tags.slice(0, 5).map(t => '#' + String(t).replace(/^#+/, '').replace(/\s+/g, ''));
    if (r.pin) draft.pin = String(r.pin);
    draft.ai = true; dirty = true; render(); toast('AI가 대본을 썼습니다');
  });
}
function aiRewriteBeat(i) {
  const s = draft, b = s.beats[i];
  aiRun(`AI가 "${b.k}" 구간을 쓰는 중`, token => gemini(`${aiContext(s)}

전체 대본:
${draftLines(s)}

이 중 ${i + 1}번 구간 "${b.k}" (${fmtSec(b.sec)}, 대사 최대 ${Math.max(6, Math.floor(b.sec * settings.cps))}자)만 서로 다른 방향으로 3가지 다시 써라. 앞뒤 구간과 자연스럽게 이어져야 하고 다른 구간의 표현을 반복하지 마라.`,
  { type: 'OBJECT', properties: { options: { type: 'ARRAY', items: S_BEAT } }, required: ['options'] }, token),
  r => {
    const opts = (r.options || []).filter(o => o && o.say).slice(0, 3);
    if (!opts.length) return toast('AI 응답이 비어 있습니다');
    sheet(`${b.k} · 마음에 드는 안을 고르세요`, opts.map((o, n) => [`${n + 1}안 · ${o.say}`, `자막: ${o.cap || '-'} · 장면: ${o.shot || '-'}`, () => { b.say = String(o.say).trim(); b.cap = String(o.cap || b.cap).trim(); b.shot = String(o.shot || b.shot).trim(); dirty = true; render(); toast(`${n + 1}안으로 바꿨습니다`); }]));
  });
}
async function aiTest() {
  const keys = aiKeys(); if (!keys.length) return toast('API 키를 먼저 넣어 주세요');
  const box = $('#aiStatus'); if (box) box.innerHTML = `<span class="spin sm"></span> 키 ${keys.length}개 확인 중…`;
  const lines = []; let models = [];
  for (let i = 0; i < keys.length; i++) {
    const r = await httpReq('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': keys[i] } });
    if (r.status === 200) {
      lines.push([true, `${i + 1}번 키 ${maskKey(keys[i])} 사용 가능`]);
      if (!models.length) try { models = JSON.parse(r.text).models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, '')).filter(n => /^gemini/.test(n) && !/(embed|image|tts|audio|live|vision|aqa|robotics|computer)/i.test(n)); } catch (e) {}
    } else lines.push([false, `${i + 1}번 키 ${maskKey(keys[i])}: ${aiErr(r, i)}`]);
  }
  settings.aiModels = models.slice(0, 16);
  if (models.length && !models.includes(aiModel())) settings.aiModel = models.find(n => n === AI_DEFAULT_MODEL) || models.find(n => /flash/.test(n) && !/lite|preview|exp/.test(n)) || models[0];
  settings.aiCheck = lines; saveSettings(); render();
  const ok = lines.filter(l => l[0]).length; toast(ok ? `키 ${keys.length}개 중 ${ok}개 사용 가능` : '사용 가능한 키가 없습니다');
}

/* ---------- 화면들 ---------- */
const V = {};
V.home = () => {
  const st = STAGE_META[settings.stage], recent = [...scripts].sort((a, b) => b.updated - a.updated).slice(0, 3);
  const day = Math.floor(Date.now() / 864e5), h = HOOKS[day % HOOKS.length], c = CATEGORIES[day % CATEGORIES.length], cats = sortedCats();
  return { nav: 'home', top: `<div class="brand"><img src="img/icon.png" alt="">쇼츠 대본메이커</div><button class="ib" data-act="go" data-v="settings" aria-label="설정">${ic('gear')}</button>`,
    html: `
    <section class="hero card">
      <div class="ph-t"><span class="eyebrow">${ic('flame')}완성 대본 ${TOPIC_COUNT.toLocaleString()}개</span><h2>분야만 고르면<br><em>대본</em>이 나와요.</h2></div>${art('mic', 218)}
      <div class="go"><div class="search grow1">${ic('search')}<input class="in" id="quick" type="search" placeholder="주제 검색 (예: 곰팡이, 전세, 스쿼트)" enterkeyhint="search" maxlength="40"></div><button class="btn pri" data-act="quick">찾기</button></div>
      <button class="linkbtn" data-act="tab" data-v="create">${ic('edit')}원하는 주제가 없으면 직접 만들기</button>
    </section>
    <section class="sec">${h2('sparkle', '오늘 찍기 좋은 주제', `<button class="pbtn" data-act="reshuffle">${ic('layers')}다른 주제</button>`)}
      <div class="list">${(() => { const d = doneTopics(); return dailyTopics(5, cur().p.seed).map(([c, i]) => topicRow(c, i, true, d)).join(''); })()}</div>
      <p class="hint">${settings.myCats.length ? '☆ 고정한 내 분야에서 골랐습니다.' : '조회수가 잘 나오는 분야에서 골랐습니다. 분야 화면에서 ☆로 내 분야를 고정하면 그 분야 위주로 나옵니다.'} 누르면 완성된 대본이 열리고, 고쳐서 저장하면 됩니다.</p>
    </section>
    <section class="sec">${h2('road', '내 채널 단계')}
      <div class="card stagebox">${seg('stage', STAGE_META.map(s => [s.id, s.name]), settings.stage)}
        <p><b>${st.range} · ${st.key}</b>${st.focus}</p></div>
    </section>
    <section class="sec">${h2('layers', '분야 고르기', `<button class="pbtn blue" data-act="go" data-v="pick">${ic('target')}분야 추천받기</button>`)}
      <div class="chips">${SORTS.map(([v, l, i]) => `<button class="chip ${settings.sort === v ? 'on' : ''}" data-act="set" data-k="sort" data-v="${v}">${ic(i)}${l}</button>`).join('')}</div>
      <div class="card"><div class="cats">${cats.list.map(c => `<button class="cat" data-act="go" data-v="category" data-id="${c.id}"><span class="gw">${glyph(c, 1)}${settings.myCats.includes(c.id) ? `<span class="mine" title="내 분야">${ic('star')}</span>` : settings.sort !== 'base' ? `<span class="rk num ${cats.rank[c.id] <= 3 ? 'top' : ''}">${cats.rank[c.id]}</span>` : ''}</span>${c.name}<small class="cnt num">대본 ${topicsOf(c.id).length}</small></button>`).join('')}</div>
        <p class="hint" style="margin-top:16px">${SORT_NOTE[settings.sort]} 순위는 일반적인 경향을 바탕으로 한 추정치이며, 분야 화면에서 ☆를 누른 내 분야는 맨 앞에 옵니다.</p></div>
    </section>
    <section class="sec">${h2('clock', '최근 대본', `<button class="pbtn" data-act="tab" data-v="library">전체 보기${ic('chevron')}</button>`)}
      ${recent.length ? `<div class="list">${recent.map(s => scriptRow(s)).join('')}</div>` : `<div class="card empty"><b>아직 대본이 없습니다</b>위에 주제를 적고 만들기를 눌러 보세요.</div>`}
    </section>
    <section class="sec">${h2('crown', '오늘의 훅')}
      <div class="card"><span class="tag a">${ic('flame')}${h.name}</span><p class="quote">“${esc(c.hooks[day % c.hooks.length])}”</p><p class="hint">${h.why}</p>
      <button class="btn sm blue" style="margin-top:14px" data-act="useHook" data-id="${h.id}">${ic('edit')}이 훅으로 대본 만들기</button></div>
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
    ${pageHead({ eyebrow: '새 대본', title: '무엇을 찍을까요?', lead: '주제와 흐름만 고르면 시간별 대본이 나옵니다.', icon: 'clapper', hue: 222 })}
    <div class="field"><label for="f_topic">${ic('edit')}주제</label><input class="in" id="f_topic" data-f="topic" value="${esc(form.topic)}" placeholder="예: 자취방 곰팡이 제거" maxlength="40"></div>
    <div class="sec"><span class="lab">${ic('layers')}분야</span><div class="chips">${sortedCats().list.map(x => `<button class="chip ${x.id === form.cat ? 'on' : ''}" style="--h:${x.hue}" data-act="set" data-k="cat" data-v="${x.id}">${ic(CICON[x.id])}${x.name}</button>`).join('')}</div></div>
    <div class="sec">${h2('clapper', '스크립트 흐름', `<button class="pbtn" data-act="allFlows">${showAll ? '추천만 보기' : '전체 14개 보기'}</button>`)}
      <div class="list">${(showAll ? order : rec.includes(form.format) ? rec : [form.format, ...rec]).map(id => { const f = FMT[id], r = c.flows.find(x => x[0] === id), on = id === form.format;
        return `<button class="flow ${on ? 'on' : ''}" data-act="set" data-k="format" data-v="${id}"><span class="fh"><b>${f.name}</b>${r ? `<span class="tag a">${ic('flame')}이 분야 추천</span>` : ''}</span><small>${r ? esc(r[1]) + ' · ' : ''}${f.sum}</small>${stepsOf(f)}${on ? `<span class="okc">${ic('check')}</span>` : ''}</button>`; }).join('')}</div></div>
    <div class="sec"><span class="lab">${ic('crown')}첫 문장 (훅)</span><div class="chips"><button class="chip ${form.hook === 'auto' ? 'on' : ''}" data-act="set" data-k="hook" data-v="auto">${ic('sparkle')}자동 · ${HOOK[c.hook].name}</button>${HOOKS.map(h => `<button class="chip ${h.id === form.hook ? 'on' : ''}" data-act="set" data-k="hook" data-v="${h.id}">${h.name}</button>`).join('')}</div>
      <div class="card" style="padding:14px 16px"><span class="tag">미리 보기</span><p style="margin:8px 0 0;font-weight:650;font-size:15.5px">${esc(fill(HOOK[form.hook === 'auto' ? c.hook : form.hook].tpl[form.tone], makeCtx(Object.assign({}, form, { topic: form.topic || '주제' }))))}</p></div></div>
    <div class="sec"><span class="lab">${ic('clock')}길이</span>${seg('len', [[15, '15초'], [20, '20초'], [30, '30초'], [45, '45초'], [60, '60초']], form.len)}<p class="hint">${c.name} 분야는 ${c.len}초 안팎이 다루기 좋습니다.</p></div>
    <div class="sec"><span class="lab">${ic('chat')}말투</span>${seg('tone', [[0, '존댓말'], [1, '반말']], form.tone)}</div>
    <div class="sec"><span class="lab">${ic('road')}채널 단계</span>${seg('fstage', STAGE_META.map(s => [s.id, s.name]), form.stage)}<p class="hint">${STAGE_META[form.stage].focus}</p></div>
    <div class="sec"><span class="lab">${ic('target')}마무리</span><div class="chips"><button class="chip ${form.cta === 'auto' ? 'on' : ''}" data-act="set" data-k="cta" data-v="auto">${ic('sparkle')}자동 · ${CTA[STAGE_META[form.stage].cta].name}</button>${CTAS.map(x => `<button class="chip ${x.id === form.cta ? 'on' : ''}" data-act="set" data-k="cta" data-v="${x.id}">${x.name}</button>`).join('')}</div></div>
    <details class="more" ${form.p1 || form.who ? 'open' : ''}><summary>${ic('list')}내용 미리 채우기</summary><div class="body">
      <p class="hint">비워 두면 대본에 〔포인트〕 빈칸이 생기고, 편집 화면에서 채울 수 있습니다.</p>
      <div class="field"><label for="f_who">누가 보는 영상인가요</label><input class="in" id="f_who" data-f="who" value="${esc(form.who)}" placeholder="예: 자취생"></div>
      ${[1, 2, 3].map(i => `<div class="field"><label for="f_p${i}">핵심 포인트 ${i}</label><input class="in" id="f_p${i}" data-f="p${i}" value="${esc(form['p' + i])}" placeholder="${['원인, 첫 번째 방법, 3위 등', '해결책, 두 번째 방법, 2위 등', '결과, 가장 중요한 것, 1위 등'][i - 1]}"></div>`).join('')}
      <div class="field"><label for="f_gain">시청자가 얻는 것 한 줄</label><input class="in" id="f_gain" data-f="gain" value="${esc(form.gain)}" placeholder="예: 곰팡이는 말리는 게 먼저예요"></div>
    </div></details>
    <div class="sticky">${aiKeys().length ? `<button class="btn" data-act="generate">${ic('list')}공식으로</button><button class="btn pri" data-act="generateAi">${ic('sparkle')}AI로 대본 생성</button>` : `<button class="btn pri block" data-act="generate">${ic('sparkle')}대본 생성</button>`}</div>` };
};

function beatCard(b, i, sp) {
  const e = est(b.say), over = e > b.sec + 0.6, cls = b.type === 'hook' ? 'h' : b.type === 'cta' ? 'c' : '';
  return `<div class="beat ${cls}" data-i="${i}">
    <div class="tc num"><span class="pdot">${ic('play')}</span><b>${tc(sp[0])}</b><small>${fmtSec(b.sec)}</small></div>
    <div class="box card"><div class="hd"><span class="pill">${esc(b.k)}</span><span class="sp"></span><span class="tag ${over ? 'a' : 'ok'} num" data-est>${ic('clock')}${fmtSec(e)}</span>${b.type === 'hook' ? '<button class="pbtn" data-act="swapHook">다른 훅</button>' : b.type === 'cta' ? '<button class="pbtn" data-act="swapCta">다른 마무리</button>' : ''}<button class="ib sm" data-act="beatMenu" aria-label="${esc(b.k)} 메뉴">${ic('more')}</button></div>
      <textarea rows="1" class="ag" data-b="say" aria-label="${esc(b.k)} 대사" placeholder="여기에 대사를 적으세요">${esc(b.say)}</textarea>
      <div class="sub"><span>${ic('caption')}자막</span><input data-b="cap" value="${esc(b.cap)}" placeholder="화면에 띄울 글자" aria-label="자막"><span>${ic('scene')}장면</span><input data-b="shot" value="${esc(b.shot)}" placeholder="무엇을 보여 줄지" aria-label="장면"></div>
    </div></div>`;
}
V.editor = () => {
  const s = draft, sc = scoreOf(s), sp = spans(s), st = STAGE_META[s.stage];
  return { title: CAT[s.cat].name + ' · ' + FMT[s.format].name, back: true, flush: true,
    acts: `<button class="ib" data-act="exportOne" aria-label="내보내기">${ic('share')}</button>`,
    html: `
    <div class="ehead"><div class="tline"><span class="playdot">${ic('play')}</span><textarea class="titlein ag" rows="1" data-s="title" aria-label="대본 제목">${esc(s.title)}</textarea></div>${art('mic', 218)}</div>
    <div>${tlBar(s)}<div class="tlmeta num"><span>0:00 훅</span><span>본론</span><span>마무리 ${tc(s.len)}</span></div></div>
    <div class="stats num"><div class="stat t1"><span class="v">${ic('target')}${s.len}초</span><small>목표 길이</small></div><div class="stat t2 ${sc.total > s.len * 1.05 ? 'bad' : ''}" id="stTotal"><span class="v">${ic('clock')}<b>${fmtSec(sc.total)}</b></span><small>읽기 시간</small></div><div class="stat t3" id="stScore"><span class="v">${ic('checkc')}<b>${sc.score}점</b></span><small>완성도</small></div></div>
    <div class="card aicard"><div class="aih"><span class="glyph" style="--h:262">${ic('sparkle')}</span><span class="grow"><b>AI로 대본 쓰기</b><small>${aiKeys().length ? `Gemini · ${esc(aiModel())} · 키 ${aiKeys().length}개` : '설정에서 Gemini API 키를 넣으면 쓸 수 있습니다'}</small></span>${s.ai ? `<span class="tag pur">${ic('sparkle')}AI 작성</span>` : ''}</div>
      ${aiKeys().length ? `<input class="in" id="ai_req" data-s="aiReq" value="${esc(s.aiReq || '')}" placeholder="추가 요청 (선택) 예: 더 웃기게, 가게 이름 넣어서">` : ''}
      <div class="aiacts">${s._undo ? `<button class="btn sm" data-act="aiUndo">${ic('back')}AI 전으로</button>` : ''}<button class="btn sm blue" data-act="${aiKeys().length ? 'aiWrite' : 'settings'}">${ic('sparkle')}${aiKeys().length ? 'AI로 전체 대본 쓰기' : 'API 키 넣으러 가기'}</button></div>
      ${aiKeys().length ? `<p class="hint">구간별로 다시 쓰려면 각 구간의 ⋮ 메뉴를 누르세요.</p>` : ''}</div>
    <div class="sec beats" id="beats">${s.beats.map((b, i) => beatCard(b, i, sp[i])).join('')}
      <button class="btn sm" data-act="addBeat">${ic('plus')}구간 추가</button></div>
    <div class="sec">${h2('checkc', '완성도 점검')}<div class="card score"><ul id="scoreList">${scoreList(sc)}</ul></div></div>
    <div class="sec">${h2('road', st.name + ' 단계 조언')}<div class="card advice">${glyph(CAT[s.cat])}<div><p>${st.focus}</p><p class="hint" style="margin-top:6px">${CAT[s.cat].name}: ${CAT[s.cat].stages[s.stage].content}</p></div></div></div>
    <div class="sec">${h2('edit', '제목 후보')}<div class="card kv">${s.titles.map((t, i) => `<div class="item"><p>${esc(t)}</p><button class="pbtn blue" data-act="useTitle" data-i="${i}">제목으로</button></div>`).join('')}</div></div>
    <div class="sec">${h2('hash', '올릴 때 쓸 것')}<div class="card kv">
      <div class="item"><p><span class="lab">해시태그</span>${esc(s.tags.join(' '))}</p><button class="pbtn" data-act="copy" data-t="${esc(s.tags.join(' '))}">${ic('copy')}복사</button></div>
      <div class="item"><p><span class="lab">고정 댓글</span>${esc(s.pin)}</p><button class="pbtn" data-act="copy" data-t="${esc(s.pin)}">${ic('copy')}복사</button></div></div></div>
    <div class="field"><label for="memo">${ic('caption')}메모</label><textarea class="in" id="memo" rows="2" data-s="memo" placeholder="촬영 장소, 준비물 등">${esc(s.memo)}</textarea></div>
    <div class="sticky"><button class="btn" data-act="prompter">${ic('screen')}프롬프터</button><button class="btn" data-act="copySay">${ic('copy')}대사 복사</button><button class="btn pri" data-act="save">${ic('check')}저장</button></div>` };
};
const scoreList = sc => sc.items.map(i => `<li><span class="m ${i.ok ? '' : 'x'}">${ic(i.ok ? 'check' : 'x')}</span><span>${i.label}${i.ok ? '' : `<small>${i.tip}</small>`}</span></li>`).join('');
function refreshEditor() {
  const sc = scoreOf(draft);
  $('#stTotal').classList.toggle('bad', sc.total > draft.len * 1.05); $('#stTotal b').textContent = fmtSec(sc.total);
  $('#stScore b').textContent = sc.score + '점'; $('#scoreList').innerHTML = scoreList(sc);
  $$('#beats .beat').forEach((el, i) => { const b = draft.beats[i], e = est(b.say), t = $('[data-est]', el); t.innerHTML = ic('clock') + fmtSec(e); t.className = 'tag num ' + (e > b.sec + 0.6 ? 'a' : 'ok'); });
}
function saveDraft() {
  draft.updated = Date.now(); delete draft.sample;
  const i = scripts.findIndex(x => x.id === draft.id);
  if (i >= 0) scripts[i] = draft; else scripts.unshift(draft);
  saveScripts(); dirty = false; toast(`${CAT[draft.cat].name} 보관함에 저장했습니다`);
}
function openScript(id) { const s = scripts.find(x => x.id === id); if (!s) return; draft = JSON.parse(JSON.stringify(s)); dirty = false; go('editor'); }

V.category = p => {
  const c = CAT[p.id], t = p.tab || (topicsOf(c.id).length ? 'topics' : 'flow');
  let body = '';
  if (t === 'topics') {
    const all = topicsOf(c.id), ff = p.ff || '', d = doneTopics(), fl = [...new Set(all.map(x => x[1]))];
    const groups = fl.map(f => all.map((x, i) => i).filter(i => all[i][1] === f)), mixed = [];
    for (let r = 0; mixed.length < all.length; r++) groups.forEach(g => { if (g[r] !== undefined) mixed.push(g[r]); });
    const idx = ff ? all.map((x, i) => i).filter(i => all[i][1] === ff) : mixed;
    body = `<div class="chips"><button class="chip ${!ff ? 'on' : ''}" data-act="set" data-k="p_ff" data-v="">전체 ${all.length}</button>${fl.map(f => `<button class="chip ${ff === f ? 'on' : ''}" data-act="set" data-k="p_ff" data-v="${f}">${FMT[f].name} ${all.filter(x => x[1] === f).length}</button>`).join('')}</div>
      <div class="list">${idx.map(i => topicRow(c.id, i, false, d)).join('')}</div>
      <p class="hint">주제를 누르면 훅부터 마무리까지 완성된 대본이 열립니다. 내 경험에 맞게 고치고 저장하세요.</p>`;
  }
  if (t === 'flow') body = `<div class="list">${c.flows.map(([id, name], n) => { const f = FMT[id]; return `<div class="artc"><div class="ah"><span class="no num">${n + 1}</span><h3>${esc(name)}</h3></div><p>${f.name} · ${f.sum}</p>${stepsOf(f)}<span><button class="pbtn blue" data-act="startFlow" data-cat="${c.id}" data-id="${id}">${ic('edit')}이 흐름으로 만들기</button></span></div>`; }).join('')}</div>
    <p class="hint">이 분야에서 널리 쓰이는 구성입니다. 채널 반응을 보며 하나를 골라 반복하세요.</p>`;
  if (t === 'road') body = `<div class="road">${c.stages.map((s, i) => { const m = STAGE_META[i], txt = `[${c.name} ${m.name}] 목표: ${s.goal} / 콘텐츠: ${s.content} / 볼 지표: ${s.kpi} / 바꿀 점: ${s.shift}`;
    return `<div class="st s${i}"><div class="rail"><span class="dot num">${i + 1}</span>${i === settings.stage ? '<span class="now">지금</span>' : ''}</div>
      <div class="card stc"><h3>${m.name}<small>${m.range}</small></h3><p class="hint" style="margin-top:-6px">${m.key}</p>
      <dl><dt>목표</dt><dd>${s.goal}</dd><dt>콘텐츠</dt><dd>${s.content}</dd><dt>볼 지표</dt><dd>${s.kpi}</dd><dt>바꿀 점</dt><dd>${s.shift}</dd></dl>
      <div class="stacts"><button class="pbtn" data-act="copy" data-t="${esc(txt)}">${ic('copy')}복사</button>${i === settings.stage ? '' : `<button class="pbtn" data-act="setStage" data-v="${i}">${ic('check')}내 단계로</button>`}<button class="pbtn blue" data-act="startStage" data-cat="${c.id}" data-v="${i}">${ic('edit')}이 단계 대본</button></div></div></div>`; }).join('')}</div>`;
  if (t === 'hook') body = `<div class="list">${c.hooks.map(h => `<div class="row"><span class="glyph" style="--h:${c.hue}">${ic('crown')}</span><span class="grow"><b style="white-space:normal">${esc(h)}</b></span><button class="pbtn" data-act="copy" data-t="${esc(h)}">${ic('copy')}복사</button></div>`).join('')}</div>
    <div class="card"><span class="tag a">${ic('flame')}추천 훅 · ${HOOK[c.hook].name}</span><p style="margin:10px 0 0">${HOOK[c.hook].why}</p></div>`;
  const m = M(c.id), mine = settings.myCats.includes(c.id), pr = sortedCats('pop').rank[c.id];
  return { title: c.name, back: true, acts: `<button class="ib star ${mine ? 'on' : ''}" data-act="myCat" data-id="${c.id}" aria-label="${mine ? '내 분야에서 빼기' : '내 분야로 고정'}">${ic('star')}</button>`, html: `
    ${pageHead({ lead: c.why, icon: CICON[c.id], hue: c.hue })}
    <div class="chips">${[['topics', `대본 주제 ${topicsOf(c.id).length}`, 'list'], ['flow', '스크립트 흐름', 'clapper'], ['road', '분석·로드맵', 'star'], ['hook', '훅 예시', 'crown']].filter(x => x[0] !== 'topics' || topicsOf(c.id).length).map(([v, l, i]) => `<button class="chip ${t === v ? 'on' : ''}" data-act="set" data-k="ctab" data-v="${v}">${ic(i)}${l}</button>`).join('')}</div>
    <div class="card metric" ${t === 'road' ? '' : 'hidden'}><div class="mhd"><span class="tag ${pr <= 3 ? 'a' : ''}">${ic('flame')}조회수 순위 ${pr}위 / ${CATEGORIES.length}</span>${mine ? `<span class="tag warn">${ic('star')}내 분야</span>` : ''}</div>
      ${[['pop', '조회수·시청자'], ['rpm', '수익성 (광고 단가)'], ['ease', '시작 쉬움'], ['comp', '경쟁 여유']].map(([k, l]) => `<div class="mrow"><span>${l}</span>${dots(m[k])}</div>`).join('')}
      <p class="hint">${m.note}</p></div>
    <div class="chips wrap" ${t === 'road' ? '' : 'hidden'}><span class="chip hash">${ic('clock')}추천 길이 ${c.len}초</span>${c.tags.map(x => `<span class="chip hash">#${x}</span>`).join('')}</div>

    ${body}
    <button class="btn pri block" data-act="startFlow" data-cat="${c.id}" data-id="${c.flows[0][0]}">${ic('sparkle')}${c.name} 대본 만들기</button>` };
};

V.browse = p => {
  const q = (p.q || '').trim(), cf = p.cat || '', d = doneTopics(), res = [];
  for (const c of sortedCats().list) {
    if (cf && c.id !== cf) continue;
    topicsOf(c.id).forEach((t, i) => { if (!q || t.join(' ').includes(q)) res.push([c.id, i]); });
  }
  const shown = res.slice(0, 150);
  return { title: '대본 주제 찾기', back: true, html: `
    <div class="search">${ic('search')}<input class="in" id="bq" type="search" data-q="1" placeholder="주제나 단어로 찾기" value="${esc(q)}" aria-label="주제 검색">${q ? `<button class="ib sm" data-act="bclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    <div class="chips"><button class="chip ${!cf ? 'on' : ''}" data-act="set" data-k="p_cat" data-v="">전체</button>${sortedCats().list.map(c => `<button class="chip ${cf === c.id ? 'on' : ''}" style="--h:${c.hue}" data-act="set" data-k="p_cat" data-v="${c.id}">${ic(CICON[c.id])}${c.name}</button>`).join('')}</div>
    <div class="sec">${h2('list', `${q ? `“${esc(q)}” ` : ''}${res.length}개`)}
    ${shown.length ? `<div class="list">${shown.map(([c, i]) => topicRow(c, i, true, d)).join('')}</div>${res.length > shown.length ? `<p class="hint">앞의 ${shown.length}개만 보여 줍니다. 검색어나 분야로 좁혀 보세요.</p>` : ''}`
      : `<div class="card empty"><b>맞는 주제가 없습니다</b>다른 단어로 찾거나, 직접 주제를 넣어 만들어 보세요.<div style="margin-top:14px"><button class="btn sm blue" data-act="quickMake" data-q="${esc(q)}">${ic('edit')}“${esc(q)}”로 직접 만들기</button></div></div>`}</div>` };
};

V.pick = p => {
  const goal = p.goal || 'views', face = p.face ?? 1, place = p.place ?? 0, tr = p.tr || [], res = recommend(p).slice(0, 5);
  return { title: '분야 추천받기', back: true, html: `
    ${pageHead({ eyebrow: '나에게 맞는 분야', eicon: 'target', title: '어떤 분야가 좋을까요?', lead: '목표와 촬영 여건을 고르면 바로 아래에 맞는 분야가 정렬됩니다.', icon: 'target', hue: 350 })}
    <div class="sec"><span class="lab">${ic('flame')}가장 원하는 것</span>${seg('p_goal', [['views', '빠른 조회수'], ['money', '수익'], ['long', '오래 가는 채널']], goal)}</div>
    <div class="sec"><span class="lab">${ic('camera')}얼굴 노출</span>${seg('p_face', [[1, '괜찮아요'], [0, '안 할래요']], face)}</div>
    <div class="sec"><span class="lab">${ic('check')}해당하는 것 (여러 개 선택)</span><div class="chips wrap">${TRAITS.map(([v, l]) => `<button class="chip ${tr.includes(v) ? 'on' : ''}" data-act="ptr" data-v="${v}">${tr.includes(v) ? ic('check') : ''}${l}</button>`).join('')}</div></div>
    <div class="sec">${h2('crown', '추천 분야 TOP 5')}
      <div class="list">${res.map((r, i) => { const mine = settings.myCats.includes(r.c.id); return `<div class="row" role="button" tabindex="0" data-act="go" data-v="category" data-id="${r.c.id}"><span class="rk num inline ${i < 3 ? 'top' : ''}">${i + 1}</span>${glyph(r.c)}<span class="grow"><b>${r.c.name}</b><span class="tagline">${metricTags(r.m).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</span></span><span class="pct num">${r.pct}%</span><button class="ib sm star ${mine ? 'on' : ''}" data-act="myCat" data-id="${r.c.id}" aria-label="내 분야로 고정">${ic('star')}</button></div>`; }).join('')}</div>
      <p class="hint">%는 고른 조건에 대한 적합도입니다. 일반적인 경향을 바탕으로 한 추천이니 내 채널 반응을 보며 조정하세요. ☆를 누르면 홈 맨 앞에 고정됩니다.</p></div>
    <button class="btn pri block" data-act="startFlow" data-cat="${res[0].c.id}" data-id="${res[0].c.flows[0][0]}">${ic('sparkle')}1위 ${res[0].c.name} 대본 만들기</button>` };
};

V.learn = p => {
  const t = p.tab || 'principle', tabs = [...LEARN.map(l => [l.id, l.name]), ['hooks', '훅 공식']];
  const tIcon = { principle: 'bulb', retention: 'target', edit: 'camera', title: 'hash', hooks: 'crown' };
  let body;
  if (t === 'hooks') body = `<div class="list">${HOOKS.map((h, n) => `<div class="artc"><div class="ah"><span class="no num">${n + 1}</span><h3>${h.name}</h3></div><p>${h.why}</p><div class="ex">${ic('bulb')}<span>${esc(fill(h.tpl[0], makeCtx({ topic: '아침 루틴' })))}</span></div><span><button class="pbtn blue" data-act="useHook" data-id="${h.id}">${ic('edit')}이 훅으로 만들기</button></span></div>`).join('')}</div>
    ${h2('target', '마무리 공식')}<div class="list">${CTAS.map((c, n) => `<div class="artc"><div class="ah"><span class="no num">${n + 1}</span><h3>${c.name}</h3></div><p>${c.why}</p><div class="ex">${ic('bulb')}<span>${esc(fill(c.tpl[0], { t: '아침 루틴' }))}</span></div></div>`).join('')}</div>`;
  else body = `<div class="list">${LEARN.find(l => l.id === t).items.map(([h, d, ex], n) => `<div class="artc"><div class="ah"><span class="no num">${n + 1}</span><h3>${h}</h3></div><p>${d}</p><div class="ex">${ic('bulb')}<span>${ex}</span></div></div>`).join('')}</div>`;
  return { nav: 'learn', title: '터지는 쇼츠의 원리', ticon: 'book', html: `${pageHead({ eyebrow: '원리와 기법', eicon: 'flame', lead: '조회수가 나오는 영상에는 공통된 구조가 있습니다. 하나씩 대본에 적용해 보세요.', icon: 'rocket', hue: 262 })}
    <div class="chips">${tabs.map(([id, n]) => `<button class="chip ${id === t ? 'on' : ''}" data-act="ltab" data-v="${id}">${ic(tIcon[id])}${n}</button>`).join('')}</div>${body}` };
};

V.library = p => {
  const q = (p.q || '').trim(), catF = p.cat || null;
  let list = scripts.filter(s => (!catF || s.cat === catF) && (!q || (s.title + s.topic + toSay(s)).includes(q)) && (!p.fav || s.fav));
  list.sort((a, b) => b.updated - a.updated);
  const counts = {}; scripts.forEach(s => counts[s.cat] = (counts[s.cat] || 0) + 1);
  if (sel) return { nav: 'library', title: `${sel.size}개 선택`, back: true, flush: true, acts: `<button class="tb" data-act="selAll">${ic('check')}전체 선택</button>`, html: `
    <div class="list">${list.map(s => scriptRow(s, `<span class="ck ${sel.has(s.id) ? 'on' : ''}">${ic('check')}</span>`)).join('')}</div>
    <div class="sticky"><button class="btn" data-act="selDelete">${ic('trash')}삭제</button><button class="btn" data-act="selMove">${ic('folder')}이동</button><button class="btn pri" data-act="selExport">${ic('share')}내보내기</button></div>` };
  const folders = CATEGORIES.filter(c => counts[c.id]);
  return { nav: 'library', title: '보관함', ticon: 'folder', big: true, acts: scripts.length ? `<button class="tb" data-act="selStart">${ic('check')}선택</button>` : '', html: `
    <div class="search">${ic('search')}<input class="in" id="lq" type="search" placeholder="제목이나 대사로 찾기" value="${esc(q)}" aria-label="검색">${q ? `<button class="ib sm" data-act="lclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    <div class="chips"><button class="chip ${!catF && !p.fav ? 'on' : ''}" data-act="lcat" data-v="">${ic('grid')}전체 ${scripts.length}</button><button class="chip ${p.fav ? 'on' : ''}" style="--h:40" data-act="lfav">${ic('star')}즐겨찾기</button>${folders.map(c => `<button class="chip ${catF === c.id ? 'on' : ''}" style="--h:${c.hue}" data-act="lcat" data-v="${c.id}">${ic(CICON[c.id])}${c.name} ${counts[c.id]}</button>`).join('')}</div>
    ${!catF && !q && !p.fav && folders.length > 1 ? `<div class="card fold">${h2('folder', '분야별 보관')}<div class="rows">${folders.map(c => `<button class="row" data-act="lcat" data-v="${c.id}">${glyph(c)}<span class="grow"><b>${c.name}</b><small>대본 ${counts[c.id]}편</small></span>${chev}</button>`).join('')}</div></div>` : ''}
    <div class="sec">${h2('clock', catF ? CAT[catF].name : p.fav ? '즐겨찾기' : '모든 대본', list.length ? `<button class="pbtn blue" data-act="exportShown">${ic('share')}이 목록 내보내기</button>` : '')}
    ${list.length ? `<div class="list">${list.map(s => scriptRow(s)).join('')}</div><p class="hintpill">${ic('info')}대본을 길게 누르면 여러 개를 골라 한 번에 내보낼 수 있습니다.</p>` : `<div class="card empty"><b>${scripts.length ? '찾는 대본이 없습니다' : '보관된 대본이 없습니다'}</b>${scripts.length ? '검색어나 분야를 바꿔 보세요.' : '대본을 만들고 저장하면 분야별로 모입니다.'}</div>`}</div>` };
};

const TOOLS = [
  ['hookgen', '훅 생성기', '주제 하나로 첫 문장 18가지', 'crown', 350], ['titlegen', '제목 생성기', '주제 하나로 제목 12가지', 'edit', 218],
  ['angle', '주제 확장기', '한 주제를 12가지 각도로', 'layers', 262], ['diag', '대본 진단', '써 둔 대본의 길이와 약점', 'checkc', 150],
  ['check', '업로드 점검표', '올리기 전 12가지 확인', 'list', 28], ['learn', '원리와 기법', '터지는 쇼츠의 원리 모음', 'book', 196]
];
V.tools = () => ({ nav: 'tools', title: '도구', ticon: 'tool', big: true, html: `${pageHead({ eyebrow: '대본 작업 도구', eicon: 'tool', lead: '훅과 제목을 뽑고, 써 둔 대본을 진단하고, 올리기 전에 점검하세요.', icon: 'bolt', hue: 28 })}
  <div class="toolgrid">${TOOLS.map(([id, n, d, i, h]) => `<button class="card tool" data-act="${id === 'learn' ? 'tab' : 'go'}" data-v="${id}"><span class="glyph" style="--h:${h}">${ic(i)}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
  <div class="sec">${h2('layers', '분야 바로 가기')}<div class="chips wrap">${CATEGORIES.map(c => `<button class="chip" style="--h:${c.hue}" data-act="go" data-v="category" data-id="${c.id}">${ic(CICON[c.id])}${c.name}</button>`).join('')}</div></div>` });

const genTool = (title, id, icon, hue, ph, make) => p => {
  const t = (p.t || '').trim(), tone = p.tone || 0, out = t ? make(makeCtx({ topic: t, who: p.who, tone }), tone) : [];
  return { title, back: true, html: `${pageHead({ lead: { hookgen: '주제 하나를 넣으면 18가지 훅 공식으로 첫 문장을 만듭니다.', titlegen: '검색과 클릭을 부르는 제목 공식 12가지로 제목을 뽑습니다.', angle: '같은 주제도 각도를 바꾸면 새 영상이 됩니다.' }[id], icon, hue })}
    <div class="field"><label for="g_t">${ic('edit')}주제</label><input class="in" id="g_t" data-p="t" value="${esc(p.t || '')}" placeholder="${ph}"></div>
    <div class="field"><label for="g_w">${ic('target')}누가 보는 영상인가요 (선택)</label><input class="in" id="g_w" data-p="who" value="${esc(p.who || '')}" placeholder="예: 직장인"></div>
    ${id !== 'titlegen' ? seg('ptone', [[0, '존댓말'], [1, '반말']], tone) : ''}
    <button class="btn pri block" data-act="rerender">${ic('sparkle')}만들기</button>
    ${out.length ? `<div class="list">${out.map(([tag, text, act]) => `<div class="row"><span class="grow"><small>${tag}</small><b style="white-space:normal">${esc(text)}</b></span>${act || `<button class="pbtn" data-act="copy" data-t="${esc(text)}">${ic('copy')}복사</button>`}</div>`).join('')}</div>` : `<p class="hint">주제를 적고 만들기를 누르세요.</p>`}` };
};
V.hookgen = genTool('훅 생성기', 'hookgen', 'crown', 350, '예: 전세 계약', (ctx, tone) => HOOKS.map(h => [h.name, fill(h.tpl[tone], ctx), `<button class="pbtn blue" data-act="hookTo" data-id="${h.id}">대본으로</button>`]));
V.titlegen = genTool('제목 생성기', 'titlegen', 'edit', 218, '예: 전세 계약', ctx => TITLES.map((t, i) => ['제목 ' + (i + 1), fill(t, ctx)]));
V.angle = genTool('주제 확장기', 'angle', 'layers', 262, '예: 전세 계약', ctx => ANGLES.map(([n, t]) => [n, fill(t, ctx)]));

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
    res = `<div class="card score"><ul>${rows.map(([ok, l, tip], i) => `<li><span class="m ${ok ? '' : 'x'}">${ic(ok ? 'check' : 'x')}</span><span>${l}${!ok || i === 0 ? `<small>${tip}</small>` : ''}</span></li>`).join('')}</ul></div>`;
  }
  return { title: '대본 진단', back: true, html: `${pageHead({ lead: '써 둔 대본을 붙여 넣으면 길이와 약한 곳을 찾아 줍니다.', icon: 'checkc', hue: 150 })}<div class="field"><label for="d_t">${ic('caption')}대본 붙여넣기</label><textarea class="in" id="d_t" rows="8" data-p="text" placeholder="써 둔 대본을 여기에 붙여 넣으세요.">${esc(text)}</textarea></div><button class="btn pri block" data-act="rerender">${ic('checkc')}진단하기</button>${res}` };
};
V.check = () => ({ title: '업로드 전 점검표', back: true, html: `${pageHead({ eyebrow: `${settings.checks.length} / ${CHECKLIST.length} 확인`, eicon: 'check', lead: '올리기 전에 하나씩 눌러 확인하세요.', icon: 'list', hue: 28 })}<div class="list">${CHECKLIST.map((c, i) => `<button class="row" data-act="check" data-i="${i}"><span class="ck ${settings.checks.includes(i) ? 'on' : ''}">${ic('check')}</span><span class="grow"><b style="white-space:normal">${c}</b></span></button>`).join('')}</div><button class="btn block" data-act="checkReset">${ic('trash')}모두 지우기</button>` });

const setRow = (icon, hue, title, sub, act, right = chev) => `<button class="row" data-act="${act}"><span class="glyph" style="--h:${hue}">${ic(icon)}</span><span class="grow"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${right}</button>`;
V.settings = () => ({ title: '설정', back: true, html: `
  <div class="sec"><span class="lab">${ic('sun')}화면 테마</span>${seg('theme', [['light', '밝게'], ['dark', '어둡게'], ['system', '기기 설정']], settings.theme)}</div>
  <div class="sec"><span class="lab">${ic('mic')}말하는 속도</span>${seg('cps', [[5, '차분하게'], [6, '보통'], [7, '빠르게']], settings.cps)}<p class="hint">초당 ${settings.cps}자로 읽기 시간을 계산합니다.</p></div>
  <div class="sec"><span class="lab">${ic('road')}내 채널 단계</span>${seg('stage', STAGE_META.map(s => [s.id, s.name]), settings.stage)}</div>
  <div class="sec">${h2('sparkle', 'AI 대본 (Gemini)')}<div class="card aibox">
    <div class="field"><label for="ai_keys">${ic('shield')}API 키 <span class="tag">${aiKeys().length}개</span></label><textarea class="in mono" id="ai_keys" rows="3" data-set="aiKeys" placeholder="AIza... , AIza... (쉼표로 여러 개)" autocomplete="off" autocapitalize="off" spellcheck="false">${esc(settings.aiKeys || '')}</textarea></div>
    <p class="hint">쉼표로 여러 개를 넣으면 요청마다 번갈아 쓰고, 한도가 찼거나 막힌 키는 건너뛰고 다음 키로 넘어갑니다. 키는 aistudio.google.com 에서 발급받을 수 있습니다.</p>
    <div class="field"><label for="ai_model">${ic('cpu')}모델</label><input class="in mono" id="ai_model" data-set="aiModel" value="${esc(aiModel())}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    ${(settings.aiModels || []).length ? `<div class="chips wrap">${settings.aiModels.map(m => `<button class="chip ${m === aiModel() ? 'on' : ''}" data-act="aiPick" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}
    <div class="aiacts"><button class="btn sm" data-act="aiClear">${ic('trash')}키 지우기</button><button class="btn sm blue" data-act="aiTest">${ic('checkc')}키 확인·모델</button></div>
    <div id="aiStatus" class="aistat">${(settings.aiCheck || []).map(([ok, t]) => `<div class="${ok ? 'ok' : 'bad'}">${ic(ok ? 'checkc' : 'x')}<span>${esc(t)}</span></div>`).join('')}</div>
    <p class="hint">키는 이 기기에만 저장되며, AI 기능을 쓸 때 대본 내용과 함께 Google Gemini API로만 전송됩니다.</p></div></div>
  <div class="sec">${h2('shield', '백업')}<div class="list">
    ${setRow('download', 218, '모든 대본 백업하기', `대본 ${scripts.length}편을 파일 하나로 저장`, 'backup')}
    ${setRow('folder', 150, '백업 파일 불러오기', '같은 대본은 건너뛰고 새 대본만 추가', 'restore')}</div></div>
  <div class="sec">${h2('info', '정보')}<div class="list">
    ${setRow('shield', 262, '개인정보 처리방침', '', 'privacy')}
    <div class="row"><span class="glyph" style="--h:196">${ic('info')}</span><span class="grow"><b>버전</b></span><span class="chev num">${APP_VERSION}</span></div></div></div>` });
V.privacy = () => ({ title: '개인정보 처리방침', back: true, html: `${pageHead({ lead: '쇼츠 대본메이커는 개인정보를 수집하지 않습니다.', icon: 'shield', hue: 262 })}<div class="card" style="display:flex;flex-direction:column;gap:10px">
  <p style="margin:0">작성한 대본, 설정, Gemini API 키는 이 기기 안에만 저장됩니다. 앱을 삭제하면 함께 지워집니다.</p>
  <p style="margin:0">AI 기능은 사용자가 직접 넣은 Gemini API 키로 동작합니다. AI 버튼을 누를 때만 대본 주제와 내용이 Google Gemini API로 전송되며, 이 전송에는 Google의 약관과 개인정보 처리방침이 적용됩니다. 앱 제작자의 서버로는 아무것도 전송되지 않습니다.</p>
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
  $('#top').innerHTML = r.top || `${r.back ? `<button class="ib" data-act="back" aria-label="뒤로">${ic('back')}</button>` : ''}<h1 class="${r.big ? 'big' : ''}">${r.ticon ? `<span class="ticon">${ic(r.ticon)}</span>` : ''}${esc(r.title || '')}</h1>${r.acts || ''}`;
  view.className = r.flush ? 'flush' : ''; view.innerHTML = r.html;
  $('#nav').innerHTML = NAV.map(([v, l, i]) => v === 'create' ? `<button class="nav make" data-act="tab" data-v="create" aria-label="대본 만들기"><span>${ic(i)}</span><em>${l}</em></button>` : `<button class="nav ${r.nav === v ? 'on' : ''}" data-act="tab" data-v="${v}">${ic(i)}${l}</button>`).join('');
  view.scrollTop = resetScroll ? 0 : keep;
  $$('textarea.ag', view).forEach(autoGrow);
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
    arr.forEach(s => { if (s && s.id && !ids.has(s.id) && FMT[s.format] && Array.isArray(s.beats)) { if (!CAT[s.cat]) s.cat = 'info'; scripts.push(s); n++; } });
    saveScripts(); toast(n ? `대본 ${n}편을 불러왔습니다` : '새로 추가할 대본이 없습니다'); render();
  } catch (e) { toast('백업 파일을 읽지 못했습니다'); }
}
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => importBackup(r.result); r.readAsText(f); e.target.value = ''; });

/* ---------- 이벤트 ---------- */
const A = {
  back: () => onBack(),
  go: d => go(d.v, d.id ? { id: d.id } : {}),
  tab: d => { if (d.v === 'create') { if (!form) newForm(); return go('create'); } tab(d.v); },
  quick: () => { const t = $('#quick').value.trim(); go('browse', { q: t }); },
  quickMake: d => { newForm({ topic: d.q || '' }); go('create'); },
  openTopic: d => openTopic(d.cat, +d.i),
  reshuffle: () => { cur().p.seed = (cur().p.seed || 0) + 1; render(); },
  bclear: () => { cur().p.q = ''; render(); },
  useHook: d => { newForm(Object.assign({}, form && form.topic ? form : {}, { hook: d.id })); go('create'); },
  hookTo: d => { const p = cur().p; newForm({ topic: p.t || '', who: p.who || '', tone: p.tone || 0, hook: d.id }); go('create'); },
  startFlow: d => { newForm({ cat: d.cat, format: d.id, topic: form ? form.topic : '' }); go('create'); },
  allFlows: () => { cur().p.all = !cur().p.all; render(); },
  set: d => {
    const k = d.k, v = /^\d+$/.test(d.v) ? +d.v : d.v;
    if (k === 'stage') { settings.stage = v; saveSettings(); }
    else if (k === 'theme' || k === 'cps') { settings[k] = v; saveSettings(); }
    else if (k === 'sort') { settings.sort = v; saveSettings(); }
    else if (k.startsWith('p_')) cur().p[k.slice(2)] = v;
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
    sheet(b.k, [['AI로 이 구간 다시 쓰기', aiKeys().length ? '3가지 안 중에서 고르기' : '설정에서 Gemini API 키를 넣어야 합니다', () => aiRewriteBeat(i)], ['1초 늘리기', `지금 ${fmtSec(b.sec)}`, () => { b.sec += 1; draft.len += 1; dirty = true; render(); }], ['1초 줄이기', '', () => { if (b.sec > 1.5) { b.sec -= 1; draft.len -= 1; dirty = true; } render(); }],
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
  privacy: () => go('privacy'),
  settings: () => go('settings'),
  aiWrite: () => aiWriteAll(),
  aiUndo: () => { if (!draft._undo) return; Object.assign(draft, JSON.parse(draft._undo)); delete draft._undo; draft.ai = false; dirty = true; render(); toast('AI 전으로 되돌렸습니다'); },
  aiTest: () => aiTest(),
  aiPick: d => { settings.aiModel = d.v; saveSettings(); render(); toast(`모델을 ${d.v}로 바꿨습니다`); },
  aiClear: () => dialog('API 키를 모두 지울까요?', '이 기기에 저장된 키만 지워집니다.', [['취소', null], ['지우기', () => { settings.aiKeys = ''; settings.aiCheck = []; saveSettings(); render(); toast('키를 지웠습니다'); }, 'pri']]),
  generateAi: () => { if (!form.topic.trim()) { toast('주제를 적어 주세요'); $('#f_topic').focus(); return; } draft = generate(form); dirty = true; form = null; go('editor', {}, true); aiWriteAll(); },
  myCat: d => { const a = settings.myCats, on = a.includes(d.id); if (on) a.splice(a.indexOf(d.id), 1); else a.push(d.id); saveSettings(); render(); toast(on ? `${CAT[d.id].name}${josa(CAT[d.id].name, "을")} 내 분야에서 뺐습니다` : `${CAT[d.id].name}${josa(CAT[d.id].name, "을")} 내 분야로 고정했습니다`); },
  ptr: d => { const p = cur().p, a = p.tr = p.tr || []; a.includes(d.v) ? a.splice(a.indexOf(d.v), 1) : a.push(d.v); render(); },
  lclear: () => { cur().p.q = ''; render(); },
  setStage: d => { settings.stage = +d.v; saveSettings(); render(); toast(`내 단계를 ${STAGE_META[+d.v].name}로 바꿨습니다`); },
  startStage: d => { newForm({ cat: d.cat, stage: +d.v }); go('create'); },
  fav: d => { const s = scripts.find(x => x.id === d.id); if (!s) return; s.fav = !s.fav; saveScripts(); render(); toast(s.fav ? '즐겨찾기에 넣었습니다' : '즐겨찾기에서 뺐습니다'); },
  rowMenu: d => { const s = scripts.find(x => x.id === d.id); if (!s) return;
    sheet(s.title, [['열기', '대본 편집 화면으로', () => openScript(s.id)], [s.fav ? '즐겨찾기 해제' : '즐겨찾기', '', () => A.fav(d)],
      ['복제', '같은 내용으로 새 대본 만들기', () => { const c = JSON.parse(JSON.stringify(s)); c.id = uid(); c.title += ' (복사본)'; c.created = c.updated = Date.now(); delete c.sample; scripts.unshift(c); saveScripts(); render(); toast('복제했습니다'); }],
      ['내보내기', '공유, 파일 저장, 복사', () => exportFlow([s], s.title)],
      ['삭제', '되돌릴 수 없습니다', () => dialog('이 대본을 삭제할까요?', s.title, [['취소', null], ['삭제', () => { scripts = scripts.filter(x => x.id !== s.id); saveScripts(); render(); toast('삭제했습니다'); }, 'pri']])]]); },
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
  else if (d.set) { settings[d.set] = t.value; saveSettings(); }
  else if (d.s) { draft[d.s] = t.value; dirty = true; if (t.classList.contains('ag')) autoGrow(t); }
  else if (d.b) { draft.beats[+t.closest('.beat').dataset.i][d.b] = t.value; dirty = true; if (t.classList.contains('ag')) autoGrow(t); refreshEditor(); }
  else if (d.q) { cur().p.q = t.value; clearTimeout(t._t); const id = t.id; t._t = setTimeout(() => { render(); const n = $('#' + id); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350); }
  else if (t.id === 'lq') { cur().p.q = t.value; clearTimeout(t._t); t._t = setTimeout(() => { render(); const n = $('#lq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 350); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'quick') A.quick(); if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') { e.preventDefault(); e.target.click(); } if (e.key === 'Escape') onBack(); });
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
if (Array.isArray(scripts) && scripts.some(s => !CAT[s.cat])) { scripts.forEach(s => { if (!CAT[s.cat]) s.cat = 'info'; }); saveScripts(); }
settings.myCats = settings.myCats.filter(id => CAT[id]);
if (scripts === null) {
  const s = generate(Object.assign({ tone: 0, stage: 0 }, SAMPLE)); s.sample = true; s.title = '자취방 곰팡이, 이것만은 하지 마세요';
  scripts = [s]; saveScripts();
}
render(true);
