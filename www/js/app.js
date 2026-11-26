'use strict';
/* ---------- 기본 도구 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TH = Object.fromEntries(THEMES.map(t => [t.id, t]));
const APP_VERSION = '2.1.0';

const store = {
  get(k, d) { try { const v = localStorage.getItem('sdm.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sdm.' + k, JSON.stringify(v)); } catch (e) {} }
};
let settings = Object.assign({ theme: 'light', mode: 'kr', style: 'real', castKr: CAST_DEFAULT.kr, castEn: CAST_DEFAULT.en, checks: [], myThemes: [], aiKeys: '', aiModel: '', hitsUrl: '' }, store.get('settings', {}));
let projects = store.get('projects', []);
const saveProjects = () => store.set('projects', projects);
let charLib = store.get('chars', []);
const saveCharLib = () => store.set('chars', charLib);
/* 사진은 용량이 커서 IndexedDB 에 줄여서 저장한다. 인물에는 사진 id 만 둔다 */
const imgCache = {};
const IDB = (() => {
  let op;
  const open = () => op || (op = new Promise((res, rej) => { try { const r = indexedDB.open('sdm-images', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('img', mode), q = fn(t.objectStore('img')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  return { put: (k, v) => tx('readwrite', st => st.put(v, k)), get: k => tx('readonly', st => st.get(k)), del: k => tx('readwrite', st => st.delete(k)), keys: () => tx('readonly', st => st.getAllKeys()) };
})();
async function imgGet(id) { if (!id) return null; if (imgCache[id]) return imgCache[id]; try { const v = await IDB.get(id); if (v) imgCache[id] = v; return v || null; } catch (e) { return null; } }
const sessionImgs = new Set();
async function imgPut(dataUrl, id) { id = id || 'img_' + uid(); imgCache[id] = dataUrl; sessionImgs.add(id); await IDB.put(id, dataUrl); return id; }
function hydrateImgs(root) { $$('img[data-img]', root).forEach(el => imgGet(el.dataset.img).then(v => { if (v) el.src = v; else { const sl = el.closest('.slot'); if (sl) sl.classList.add('miss'); } })); }
function shrinkImage(file, max) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const sc = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.9)); }; im.onerror = () => rej(new Error('이미지를 읽지 못했습니다')); im.src = r.result; };
    r.onerror = () => rej(r.error); r.readAsDataURL(file);
  });
}
const usedImgIds = list => { const u = new Set(); list.forEach(p => (p.chars || []).forEach(c => { if (c.imgFull) u.add(c.imgFull); if (c.imgFace) u.add(c.imgFace); })); return u; };
async function gcImages() { try { const used = usedImgIds([...projects, { chars: charLib }, draft || {}]); for (const k of await IDB.keys()) if (!used.has(k) && !sessionImgs.has(k)) await IDB.del(k); } catch (e) {} }
const saveSettings = () => { store.set('settings', settings); applyTheme(); };
function applyTheme() {
  const r = document.documentElement;
  if (settings.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
  const dk = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  try { if (window.AndroidBridge && window.AndroidBridge.setDark) window.AndroidBridge.setDark(dk); } catch (e) {}
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dateStr = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const tc = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r; };
const words = t => String(t || '').trim().split(/\s+/).filter(Boolean).length;

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
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M16 6l3 3M14 8l2 2"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-2 0-4.5-.5-4.5-3S11 4 12 9zM12 9c2 0 4.5-.5 4.5-3S13 4 12 9z"/>',
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.5A6 6 0 0 1 21 20"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.700l1-1"/>',
  bike: '<circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M5.5 17l4-7h6l3 7M9.5 10L8 7H6M15.5 10l-1.5-4h3"/>',
  exit: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 8l-4 4 4 4M6 12h10"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;

/* ---------- 모드(국내용·해외용)와 대본 ---------- */
const MODE = () => settings.mode === 'en' ? 'en' : 'kr';
const isEn = () => MODE() === 'en';
const sfx = m => (m || MODE()) === 'kr' ? 'k' : 'e';
const dramasOf = id => (typeof DRAMAS !== 'undefined' && DRAMAS[id]) || [];
const DRAMA_COUNT = THEMES.reduce((a, t) => a + dramasOf(t.id).length, 0);

function toProject(s, theme, src) {
  const now = Date.now();
  return { id: uid(), theme, src: src || '', tk: s[0], te: s[1], lk: s[2], le: s[3],
    chars: s[4].map(c => ({ r: c[0], nk: c[1], ne: c[2], dk: c[3], de: c[4] })),
    shots: s[5].map(x => ({ pk: x[0], pe: x[1], ak: x[2], ae: x[3], sp: x[4], dk: x[5], de: x[6], cam: x[7], sec: 5 })),
    style: settings.style, ep: 1, subs: {}, over: {}, memo: '', fav: false, created: now, updated: now };
}
const blankProject = theme => toProject(['새 숏드라마', 'New Short Drama', '', '',
  [['H', '주인공', 'Hero', '', ''], ['V', '악역', 'Villain', '', '']],
  BEATS.map((b, i) => ['', '', '', '', -1, '', '', ['cz', 'ms', 'cu', 'low', 'cu', 'pi'][i]])], theme || 'hidden', '');
const T = (p, m) => p['t' + sfx(m)] || p.tk || p.te;
const LG = (p, m) => p['l' + sfx(m)] || p.lk || p.le;
const cname = (c, m) => c['n' + sfx(m)] || c.nk || c.ne;
const clook = (c, m) => c['d' + sfx(m)] || '';
const totalSec = p => p.shots.reduce((a, s) => a + (+s.sec || 5), 0);
const beatOf = (p, i) => BEATS[Math.min(BEATS.length - 1, p.shots.length === BEATS.length ? i : Math.round(i * (BEATS.length - 1) / Math.max(1, p.shots.length - 1)))];

/* ---------- 프롬프트 생성 ---------- */
function josa(word, j) {
  const pairs = { '을': ['을', '를'], '이': ['이', '가'], '은': ['은', '는'] }, p = pairs[j]; if (!p) return j;
  const ch = String(word).trim().slice(-1), code = ch.charCodeAt(0);
  const batchim = code >= 0xAC00 && code <= 0xD7A3 ? (code - 0xAC00) % 28 !== 0 : /[013678lmnrLMNR]/.test(ch);
  return batchim ? p[0] : p[1];
}

const castOf = m => String(m === 'kr' ? settings.castKr : settings.castEn).trim();
const styleOf = (p, m) => (STYLES[p.style] || STYLES.real)[m === 'kr' ? 1 : 2];
const MOODS = [
  ['긴장감 있는 공개적인 굴욕의 순간', 'Tense moment of public humiliation'],
  ['비웃음과 조롱 속에서도 주인공은 흔들리지 않는다', 'Mockery all around while the hero stays unshaken'],
  ['조용한 긴장, 무언가 뒤집히기 직전의 공기', 'Quiet tension, the air just before everything turns'],
  ['충격의 정적, 모두가 얼어붙는다', 'Stunned silence, everyone freezes'],
  ['통쾌한 순간, 악역의 표정이 무너진다', 'Satisfying payoff, the villain\'s composure collapses'],
  ['여운과 새로운 궁금증을 남기는 마지막 컷', 'A lingering final beat that leaves a new question']
];
const TONES = { H: ['낮고 침착하게, 단호하게', 'low, calm and firm'], V: ['거만하고 날카롭게', 'arrogant and sharp'], A: ['다급하고 공손하게', 'urgent and deferential'], X: ['놀란 목소리로', 'shocked'] };
const moodOf = (p, i, m) => MOODS[BEATS.indexOf(beatOf(p, i))][m === 'kr' ? 0 : 1];
function inShot(p, sh) {
  const idx = new Set();
  p.chars.forEach((c, i) => { if ((c.nk && (sh.ak || '').includes(c.nk)) || (c.ne && (sh.ae || '').includes(c.ne))) idx.add(i); });
  if (sh.sp >= 0 && p.chars[sh.sp]) idx.add(sh.sp);
  return [...idx].sort();
}
const refList = (p, ids, m, local) => ids.map((i, n) => { const no = local ? n + 1 : i + 1; return m === 'kr' ? `${cname(p.chars[i], m)} = 참조 이미지 ${no}` : `${cname(p.chars[i], m)} = reference image ${no}`; }).join(', ');
const legend = (p, m) => p.chars.map((c, i) => m === 'kr' ? `${cname(c, m)}(참조 이미지 ${i + 1}: ${castOf(m)} ${clook(c, m)})` : `${cname(c, m)} (reference image ${i + 1}: ${castOf(m)} ${clook(c, m)})`).join('; ');

function charPrompt(p, i, m, kind) {
  const c = p.chars[i], who = `${castOf(m)} ${clook(c, m)}`.trim(), st = styleOf(p, m);
  if (m === 'kr') return kind === 'face'
    ? `영상 제작용 인물 얼굴 기준 이미지.\n인물: ${who}.\n어깨 위 정면 얼굴 클로즈업, 자연스럽고 차분한 표정, 시선은 카메라.\n배경은 밝은 회색 단색, 부드럽고 고른 조명.\n${st}.\n9:16 세로. 글자·워터마크·로고 없음, 한 사람만.`
    : `영상 제작용 전신 캐릭터 기준 이미지.\n인물: ${who}.\n정면을 보고 똑바로 선 자세, 팔은 자연스럽게 내리고, 머리끝부터 신발까지 전신이 화면에 모두 보이게.\n복장은 설명 그대로, 로고나 글자 없음.\n배경은 밝은 회색 단색 스튜디오, 부드럽고 고른 조명.\n${st}.\n9:16 세로. 글자·워터마크 없음, 한 사람만.`;
  return kind === 'face'
    ? `Face reference image of a character for video production.\nCharacter: ${who}.\nFront-facing head-and-shoulders close-up, natural calm expression, eyes to camera.\nPlain light-gray background, soft even lighting.\nStyle: ${st}.\nVertical 9:16. No text, no watermark, no logos, one person only.`
    : `Full-body character reference image for video production.\nCharacter: ${who}.\nStanding straight and facing the camera, arms relaxed at the sides, the entire body visible from head to shoes.\nOutfit exactly as described, no logos or lettering.\nPlain light-gray studio background, soft even lighting.\nStyle: ${st}.\nVertical 9:16. No text, no watermark, one person only.`;
}
function framePrompt(p, i, m) {
  const sh = p.shots[i], ids = inShot(p, sh), cam = (CAMS[sh.cam] || CAMS.ms)[m === 'kr' ? 1 : 2], st = styleOf(p, m);
  if (m === 'kr') return `세로 9:16 드라마 스틸 컷 한 장 (샷 ${i + 1}의 첫 프레임).\n장소: ${sh.pk}.\n장면: ${sh.ak}.\n등장인물: ${ids.length ? refList(p, ids, m) : '없음'}.\n구도: ${cam}.\n분위기: ${moodOf(p, i, m)}.\n${st}.\n첨부한 인물 기준 이미지와 얼굴·머리·복장을 똑같이 유지한다. 화면 속 글자·자막·워터마크 없음.`;
  return `One vertical 9:16 cinematic drama still (first frame of shot ${i + 1}).\nLocation: ${sh.pe}.\nMoment: ${sh.ae}.\nCharacters: ${ids.length ? refList(p, ids, m) : 'none'}.\nFraming: ${cam}.\nMood: ${moodOf(p, i, m)}.\nStyle: ${st}.\nKeep faces, hair and outfits identical to the attached character reference images. No on-screen text, subtitles or watermark.`;
}
function klingPrompt(p, i, m, local) {
  const sh = p.shots[i], ids0 = inShot(p, sh), ids = Array.isArray(local) ? local : ids0, cam = (CAMS[sh.cam] || CAMS.ms)[m === 'kr' ? 1 : 2], st = styleOf(p, m), n = p.shots.length;
  const sp = sh.sp >= 0 ? p.chars[sh.sp] : null, line = m === 'kr' ? sh.dk : sh.de, tone = sp ? (TONES[sp.r] || TONES.X)[m === 'kr' ? 0 : 1] : '';
  if (m === 'kr') return `[샷 ${i + 1}/${n} · ${sh.sec || 5}초 · 세로 9:16]\n장소: ${sh.pk}.\n카메라: ${cam}.\n동작: ${sh.ak}.\n${sp && line ? `대사: ${cname(sp, m)}${josa(cname(sp, m), '이')} 한국어로 ${tone} 말한다. "${line}" 입 모양을 대사에 정확히 맞춘다.` : '대사 없음. 표정과 시선으로만 연기한다.'}\n분위기: ${moodOf(p, i, m)}.\n화면: ${st}.\n인물의 얼굴·머리·복장은 참조 이미지와 똑같이 유지한다${ids.length ? ` (${refList(p, ids, m, !!local)})` : ''}. 자막이나 화면 속 글자를 넣지 않는다.`;
  return `[Shot ${i + 1}/${n} · ${sh.sec || 5}s · vertical 9:16]\nLocation: ${sh.pe}.\nCamera: ${cam}.\nAction: ${sh.ae}.\n${sp && line ? `Dialogue: ${cname(sp, m)} says in English, ${tone}: "${line}" Lip-sync the line precisely.` : 'No dialogue. Acting through expression and eye contact only.'}\nMood: ${moodOf(p, i, m)}.\nLook: ${st}.\nKeep every character's face, hair and outfit identical to the reference images${ids.length ? ` (${refList(p, ids, m, !!local)})` : ''}. No subtitles and no on-screen text.`;
}
function multiPrompt(p, m, from, to) {
  const part = p.shots.slice(from, to), st = styleOf(p, m); let t = 0;
  const total = part.reduce((a, s) => a + (+s.sec || 5), 0);
  const lines = part.map((sh, k) => {
    const a = t; t += (+sh.sec || 5); const sp = sh.sp >= 0 ? p.chars[sh.sp] : null, line = m === 'kr' ? sh.dk : sh.de, cam = (CAMS[sh.cam] || CAMS.ms)[m === 'kr' ? 1 : 2];
    return m === 'kr'
      ? `샷 ${k + 1} (${a}~${t}초): ${sh.pk}. ${cam}. ${sh.ak}.${sp && line ? ` ${cname(sp, m)}${josa(cname(sp, m), '이')} 한국어로 말한다: "${line}"` : ' 대사 없음.'}`
      : `Shot ${k + 1} (${a}-${t}s): ${sh.pe}. ${cam}. ${sh.ae}.${sp && line ? ` ${cname(sp, m)} says in English: "${line}"` : ' No dialogue.'}`;
  });
  return m === 'kr'
    ? `세로 9:16 숏드라마, 총 ${total}초, ${part.length}개 샷으로 이어지는 한 편.\n화면: ${st}.\n인물: ${legend(p, m)}.\n모든 샷에서 인물의 얼굴·머리·복장을 똑같이 유지한다. 대사는 입 모양을 맞춘다. 자막이나 화면 속 글자 없음.\n\n${lines.join('\n')}`
    : `Vertical 9:16 short drama, ${total} seconds total, one continuous episode in ${part.length} shots.\nLook: ${st}.\nCharacters: ${legend(p, m)}.\nKeep every character's face, hair and outfit identical across all shots. Lip-sync all dialogue. No subtitles or on-screen text.\n\n${lines.join('\n')}`;
}
/* 수정한 프롬프트는 over 에 따로 보관한다 */
const PROMPTS = {
  c: (p, a, m) => charPrompt(p, +a[0], m, a[1]),
  f: (p, a, m) => framePrompt(p, +a[0], m),
  k: (p, a, m) => klingPrompt(p, +a[0], m),
  m: (p, a, m) => multiPrompt(p, m, +a[0], +a[1]),
  n: (p, a, m) => NEG[m]
};
function promptText(p, key, m) { m = m || MODE(); const ov = p.over && p.over[key + ':' + m]; if (ov != null) return ov; const a = key.split(':'); return PROMPTS[a[0]](p, a.slice(1), m); }
const promptBase = (p, key, m) => { const a = key.split(':'); return PROMPTS[a[0]](p, a.slice(1), m || MODE()); };

/* ---------- 자막·업로드·내보내기 ---------- */
function subLines(p, lang) { return lang === 'ko' ? p.shots.map(s => s.dk) : lang === 'en' ? p.shots.map(s => s.de) : (p.subs && p.subs[lang]) || null; }
function toSrt(p, lang) {
  const lines = subLines(p, lang); if (!lines) return '';
  const f = x => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), mi = Math.floor(ms / 60000) % 60, se = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  let t = 0, n = 0; const out = [];
  p.shots.forEach((s, i) => { const a = t; t += (+s.sec || 5); const tx = (lines[i] || '').trim(); if (tx) out.push(`${++n}\n${f(a + 0.4)} --> ${f(t - 0.3)}\n${tx}\n`); });
  return out.join('\n');
}
function uploadKit(p, m) {
  const th = TH[p.theme] || THEMES[0], ep = p.ep || 1;
  if (m === 'kr') return { title: `${T(p, m)} | EP.${ep}`, desc: `${LG(p, m)}\n\n다음 화가 궁금하다면 팔로우하고 기다려 주세요.\n\n#숏드라마 #참교육 #사이다 #${th.name.replace(/[^가-힣0-9a-zA-Z]/g, '')} #shortdrama`, pin: '이 장면 속 시원했다면 댓글에 "다음 화" 남겨 주세요!' };
  return { title: `${T(p, m)} | EP.${ep}`, desc: `${LG(p, m)}\n\nFollow for the next episode.\n\n#shortdrama #drama #${th.tags.join(' #')} #fyp`, pin: 'Comment "NEXT" if you want Part 2!' };
}
function toScriptText(p, m) {
  let t = 0;
  return [`[${T(p, m)}]`, LG(p, m), `주제: ${(TH[p.theme] || {}).name || ''} · ${p.shots.length}샷 · ${totalSec(p)}초 · ${m === 'kr' ? '국내용' : '해외용'}`, '────────────────', '등장인물',
    ...p.chars.map(c => `- ${cname(c, m)} (${ROLE_NAME[c.r] || ''}): ${clook(c, m)}`), '────────────────',
    ...p.shots.map((s, i) => { const a = t; t += (+s.sec || 5); const sp = s.sp >= 0 ? p.chars[s.sp] : null;
      return `${tc(a)}–${tc(t)}  샷 ${i + 1} · ${beatOf(p, i)[0]}\n장소: ${s['p' + sfx(m)]}\n화면: ${s['a' + sfx(m)]}\n대사: ${sp && s['d' + sfx(m)] ? `${cname(sp, m)}: ${s['d' + sfx(m)]}` : '-'}\n카메라: ${(CAMS[s.cam] || CAMS.ms)[0]}\n`; })].join('\n').trim() + '\n';
}
function toPack(p, m) {
  const k = uploadKit(p, m), half = Math.ceil(p.shots.length / 2), bar = '\n════════════════════\n';
  return [toScriptText(p, m), bar + '① 인물 이미지 프롬프트 (그록·챗GPT 등에 붙여넣기)\n',
    ...p.chars.map((c, i) => `▶ ${cname(c, m)} · 전신\n${promptText(p, `c:${i}:full`, m)}\n\n▶ ${cname(c, m)} · 얼굴\n${promptText(p, `c:${i}:face`, m)}\n`),
    bar + '② 샷별 프롬프트 (첫 프레임 이미지 → 클링 영상)\n',
    ...p.shots.map((s, i) => `▶ 샷 ${i + 1} 첫 프레임\n${promptText(p, `f:${i}`, m)}\n\n▶ 샷 ${i + 1} 클링 영상\n${promptText(p, `k:${i}`, m)}\n`),
    bar + '③ 클링 멀티샷 프롬프트\n', `▶ 전체\n${promptText(p, `m:0:${p.shots.length}`, m)}\n`, `▶ 앞부분\n${promptText(p, `m:0:${half}`, m)}\n`, `▶ 뒷부분\n${promptText(p, `m:${half}:${p.shots.length}`, m)}\n`,
    `▶ 제외 프롬프트\n${promptText(p, 'n', m)}\n`, bar + '④ 업로드\n', `제목: ${k.title}\n\n설명:\n${k.desc}\n\n고정 댓글: ${k.pin}\n`].join('\n');
}
const EXPORTS = [
  { id: 'pack', name: '제작 팩 전체', sub: '대본, 인물·샷·클링 프롬프트, 업로드 문구', ext: 'txt', mime: 'text/plain', one: p => toPack(p, MODE()), join: '\n\n████████████████████\n\n' },
  { id: 'script', name: '대본만', sub: '인물과 샷별 대본', ext: 'txt', mime: 'text/plain', one: p => toScriptText(p, MODE()), join: '\n\n════════════════\n\n' },
  { id: 'srt', name: '자막 파일 (SRT)', sub: '지금 모드의 언어, 한 편씩', ext: 'srt', mime: 'application/x-subrip', one: p => toSrt(p, isEn() ? 'en' : 'ko'), single: true },
  { id: 'json', name: '백업 파일 (JSON)', sub: '작업, 내 캐릭터, 첨부 사진까지. 다른 기기로 옮길 때', ext: 'json', mime: 'application/json', backup: true }
];
const buildExport = (fmt, list) => list.map(fmt.one).join(fmt.join || '\n\n');
async function buildBackup(list) {
  const images = {};
  for (const id of usedImgIds([...list, { chars: charLib }])) { const v = await imgGet(id); if (v) images[id] = v; }
  return JSON.stringify({ app: 'short-drama-maker', version: 3, projects: list, chars: charLib, images });
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
  shareImage(name, dataUrl) {
    if (this.has() && window.AndroidBridge.shareImage) return window.AndroidBridge.shareImage(name, dataUrl);
    fetch(dataUrl).then(r => r.blob()).then(b => { const f = new File([b], name, { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: name }).catch(() => {}); this.saveImage(name, dataUrl); }).catch(() => this.saveImage(name, dataUrl));
  },
  saveImage(name, dataUrl) {
    if (this.has() && window.AndroidBridge.saveImage) return window.AndroidBridge.saveImage(name, dataUrl);
    const a = document.createElement('a'); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('사진을 저장했습니다');
  },
  exit() { if (this.has()) window.AndroidBridge.exitApp(); else { exiting = true; history.go(-2); } }
};
window.onNativeSaved = ok => toast(ok ? '파일로 저장했습니다' : '저장하지 않았습니다');
function copyText(text, msg = '복사했습니다') {
  const done = () => toast(msg);
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
const fileName = (label, ext) => `숏드라마_${String(label).replace(/[^가-힣0-9a-zA-Z]+/g, '_').slice(0, 24)}_${dateStr().replace(/\./g, '')}.${ext}`;
function outSheet(title, text, name, mime, fileOnly) {
  const save = ['파일로 저장', name, () => Native.save(name, mime || 'text/plain', text)];
  sheet(title, fileOnly ? [save] : [['공유하기', '앱을 골라 보내기 (그록, 챗GPT, 메신저 등)', () => Native.share(title, text)], save, ['복사하기', '클립보드에 복사', () => copyText(text)]]);
}
function exportFlow(list, label) {
  if (!list.length) return toast('내보낼 대본이 없습니다');
  sheet(`${label} 내보내기`, EXPORTS.filter(f => !(f.single && list.length > 1)).map(f => [f.name, f.sub, () => f.backup
    ? buildBackup(list).then(t => outSheet(f.name, t, fileName(label, f.ext), f.mime, true))
    : outSheet(f.name, buildExport(f, list), fileName(label, f.ext), f.mime)]));
}

/* ---------- 화면 전환과 뒤로가기 ---------- */
let stack = [{ v: 'home', p: {} }], overlays = [], exiting = false;
let draft = null, dirty = false, sel = null, aiToken = null;
const cur = () => stack[stack.length - 1];
function go(v, p = {}, replace = false) { if (replace) stack.pop(); stack.push({ v, p }); render(true); }
function tab(v) { stack = v === 'home' ? [{ v: 'home', p: {} }] : [{ v: 'home', p: {} }, { v, p: {} }]; sel = null; render(true); }
function pop() { if (stack.length > 1) stack.pop(); render(true); }
function onBack() {
  if (overlays.length) return closeLayer();
  const c = cur();
  if (c.v === 'library' && sel) { sel = null; return render(); }
  if (c.v === 'editor' && dirty) {
    return dialog('수정한 내용을 저장할까요?', '저장하지 않으면 바뀐 내용이 사라집니다.', [
      ['저장 안 함', () => { dirty = false; draft = null; pop(); }], ['저장', () => { saveDraft(); pop(); }, 'pri']]);
  }
  if (stack.length > 1) return pop();
  dialog('앱을 종료하겠습니까?', '', [['아니오', null], ['예', () => Native.exit(), 'pri']]);
}
window.onAndroidBack = onBack;
history.pushState({ sdm: 1 }, '');
window.addEventListener('popstate', () => { if (exiting) return; history.pushState({ sdm: 1 }, ''); onBack(); });

let layerActs = {};
function layer(html, center) { const L = $('#layer'); L.className = center ? 'center' : ''; L.innerHTML = html; overlays.push(1); }
function closeLayer() { if (aiToken) { aiToken.cancel = true; aiToken = null; } overlays.pop(); $('#layer').innerHTML = ''; layerActs = {}; }
function dialog(title, body, acts) {
  layerActs = {};
  layer(`<div class="dialog" role="alertdialog" aria-label="${esc(title)}"><span class="di">${ic(/종료/.test(title) ? 'exit' : /삭제|지울/.test(title) ? 'trash' : 'info')}</span><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}<div class="acts">${acts.map(([l, fn, c], i) => { layerActs['d' + i] = fn; return `<button class="btn ${c || ''}" data-lact="d${i}">${esc(l)}</button>`; }).join('')}</div></div>`, true);
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
const AI_SYS = `You are a top short-drama (vertical micro-drama) screenwriter in the style of global hits on ReelShort and DramaBox. You write ORIGINAL scripts only; never copy an existing drama's title, names or dialogue.
Every script is exactly a sequence of 5-second shots following this hit formula: 1) HOOK: start mid-conflict with public humiliation and a cruel line. 2) ESCALATION: the villain crosses the line, the hero stays calm. 3) HINT: one small clue of the coming reversal. 4) REVEAL: the true identity or truth lands in one sentence. 5) PAYBACK: the villain's face collapses and pays a price. 6) CLIFFHANGER: one new question, then cut.
Rules: one visible action per shot, at most one short line per shot (Korean up to 28 characters, English up to 14 words). The villain is hateful, the hero dignified. Settings must work in any country. Payback comes through status, law, evidence or public exposure, never violence. No blood, weapons, sexual content, real people or real brands (AI video generators reject them).
Korean fields are natural Korean with Korean names; English fields are natural native English with Western names and contain no Korean. Character looks describe age range, gender, hair, outfit and impression without ethnicity. Output JSON only.`;
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
      settings.aiNext = (ki + 1) % keys.length; store.set('settings', settings);
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
const S_STR = { type: 'STRING' }, S_INT = { type: 'INTEGER' };
const S_CHAR = { type: 'OBJECT', properties: { r: S_STR, nk: S_STR, ne: S_STR, dk: S_STR, de: S_STR }, required: ['r', 'nk', 'ne', 'dk', 'de'] };
const S_SHOT = { type: 'OBJECT', properties: { pk: S_STR, pe: S_STR, ak: S_STR, ae: S_STR, sp: S_INT, dk: S_STR, de: S_STR, cam: S_STR }, required: ['pk', 'pe', 'ak', 'ae', 'sp', 'dk', 'de', 'cam'] };
const S_SCRIPT = { type: 'OBJECT', properties: { tk: S_STR, te: S_STR, lk: S_STR, le: S_STR, chars: { type: 'ARRAY', items: S_CHAR }, shots: { type: 'ARRAY', items: S_SHOT } }, required: ['tk', 'te', 'lk', 'le', 'chars', 'shots'] };
const AI_FIELDS = `JSON fields: tk/te = Korean/English title; lk/le = Korean/English one-line logline; chars[] = {r: role code H hero, V villain, A ally who reveals the truth, X other; nk/ne = Korean/English name; dk/de = Korean/English look and outfit}; shots[] = {pk/pe = Korean/English place; ak/ae = Korean/English visible action; sp = speaker index into chars or -1 for no line; dk/de = Korean/English line or empty; cam = one of ${Object.keys(CAMS).join(', ')}}.`;
const draftJson = p => JSON.stringify({ tk: p.tk, te: p.te, lk: p.lk, le: p.le, chars: p.chars, shots: p.shots.map(s => ({ pk: s.pk, pe: s.pe, ak: s.ak, ae: s.ae, sp: s.sp, dk: s.dk, de: s.de, cam: s.cam })) });
function applyScript(p, r) {
  if (!r || !Array.isArray(r.shots) || !r.shots.length) return false;
  ['tk', 'te', 'lk', 'le'].forEach(k => { if (r[k]) p[k] = String(r[k]); });
  if (Array.isArray(r.chars) && r.chars.length) p.chars = r.chars.slice(0, 4).map(c => ({ r: ROLE_NAME[c.r] ? c.r : 'X', nk: String(c.nk || ''), ne: String(c.ne || ''), dk: String(c.dk || ''), de: String(c.de || '') }));
  p.shots = r.shots.slice(0, 10).map(s => ({ pk: String(s.pk || ''), pe: String(s.pe || ''), ak: String(s.ak || ''), ae: String(s.ae || ''), sp: Number.isInteger(s.sp) && s.sp >= 0 && s.sp < p.chars.length ? s.sp : -1, dk: String(s.dk || ''), de: String(s.de || ''), cam: CAMS[s.cam] ? s.cam : 'ms', sec: 5 }));
  p.over = {}; p.subs = {}; return true;
}
function aiRun(label, job, apply) {
  if (!aiKeys().length) return dialog('Gemini API 키가 필요합니다', '설정에서 키를 넣으면 AI 기능을 쓸 수 있습니다.', [['닫기', null], ['설정 열기', () => go('settings'), 'pri']]);
  const token = { cancel: false }; layerActs = { c0: () => { token.cancel = true; } };
  layer(`<div class="dialog" role="alertdialog" aria-label="${esc(label)}"><span class="spin" aria-hidden="true"></span><h3>${esc(label)}</h3><p>Gemini · ${esc(aiModel())}\n보통 10~40초 걸립니다.</p><div class="acts"><button class="btn" data-lact="c0">취소</button></div></div>`, true);
  aiToken = token;
  job(token).then(res => { if (token.cancel) return; aiToken = null; closeLayer(); apply(res); },
    e => { if (token.cancel) return; aiToken = null; closeLayer(); dialog('AI 생성에 실패했습니다', e.message, [['닫기', null], ['설정 열기', () => go('settings')]]); });
}
function aiNew(themeId, idea) {
  const th = TH[themeId];
  aiRun('AI가 새 대본을 쓰는 중', token => gemini(`Write one original 6-shot short-drama script.\nTheme: ${th.en} (${th.name}). The satisfying payoff of this theme: ${th.punch}.\nCreator's idea (may be Korean): ${idea || 'none, invent a fresh premise'}.\n${AI_FIELDS}`, S_SCRIPT, token),
    r => { const p = blankProject(themeId); if (!applyScript(p, r)) return toast('AI 응답이 비어 있습니다'); p.ai = true; draft = p; dirty = true; go('editor', {}, cur().v === 'aiNew'); toast('AI가 대본을 썼습니다'); });
}
function aiRewriteAll() {
  const p = draft, th = TH[p.theme] || THEMES[0];
  aiRun('AI가 대본을 다시 쓰는 중', token => gemini(`Rewrite this short-drama script to be far more gripping while keeping the same premise, the same number of shots (${p.shots.length}) and the same characters unless the request says otherwise.\nTheme: ${th.en}. Payoff: ${th.punch}.\nCreator's request (may be Korean): ${(p.aiReq || '').trim() || 'none'}.\n${AI_FIELDS}\nCurrent script JSON:\n${draftJson(p)}`, S_SCRIPT, token),
    r => { const undo = draftJson(p); if (!applyScript(p, r)) return toast('AI 응답이 비어 있습니다'); p._undo = undo; p.ai = true; dirty = true; render(); toast('AI가 대본을 다시 썼습니다'); });
}
function aiShot(i) {
  const p = draft, sh = p.shots[i];
  aiRun(`AI가 샷 ${i + 1}을 다시 쓰는 중`, token => gemini(`Here is a short-drama script JSON:\n${draftJson(p)}\n\nRewrite ONLY shot ${i + 1} (role in the formula: ${beatOf(p, i)[1]}) in 3 clearly different ways. Keep continuity with the other shots and the same characters.\n${AI_FIELDS}`,
    { type: 'OBJECT', properties: { options: { type: 'ARRAY', items: S_SHOT } }, required: ['options'] }, token),
  r => {
    const opts = (r.options || []).filter(o => o && (o.ak || o.ae)).slice(0, 3); if (!opts.length) return toast('AI 응답이 비어 있습니다');
    const k = sfx();
    sheet(`샷 ${i + 1} · 마음에 드는 안을 고르세요`, opts.map((o, n) => [`${n + 1}안 · ${o['a' + k]}`, o['d' + k] ? `대사: ${o['d' + k]}` : '대사 없음', () => {
      Object.assign(sh, { pk: o.pk || sh.pk, pe: o.pe || sh.pe, ak: o.ak || sh.ak, ae: o.ae || sh.ae, dk: o.dk || '', de: o.de || '', sp: Number.isInteger(o.sp) && o.sp >= 0 && o.sp < p.chars.length ? o.sp : -1, cam: CAMS[o.cam] ? o.cam : sh.cam });
      ['f', 'k'].forEach(x => ['kr', 'en'].forEach(m => delete p.over[`${x}:${i}:${m}`])); dirty = true; render(); toast(`${n + 1}안으로 바꿨습니다`); }]));
  });
}
function aiSync() {
  const p = draft, from = MODE(), toName = from === 'kr' ? 'natural native English (Western names)' : 'natural Korean (Korean names)', f = sfx(from), t = from === 'kr' ? 'e' : 'k';
  const src = { title: p['t' + f], logline: p['l' + f], chars: p.chars.map(c => ({ name: c['n' + f], look: c['d' + f] })), shots: p.shots.map(s => ({ place: s['p' + f], action: s['a' + f], line: s['d' + f] })) };
  const S = { type: 'OBJECT', properties: { title: S_STR, logline: S_STR, chars: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: S_STR, look: S_STR }, required: ['name', 'look'] } }, shots: { type: 'ARRAY', items: { type: 'OBJECT', properties: { place: S_STR, action: S_STR, line: S_STR }, required: ['place', 'action', 'line'] } } }, required: ['title', 'logline', 'chars', 'shots'] };
  aiRun(from === 'kr' ? '한국어 내용을 영어판에 반영하는 중' : '영어 내용을 한국어판에 반영하는 중', token => gemini(`Adapt this short-drama script into ${toName}. Keep the same order and number of characters (${src.chars.length}) and shots (${src.shots.length}). Keep lines short and punchy; an empty line stays empty. Do not translate literally.\n${JSON.stringify(src)}`, S, token),
    r => {
      if (!r || !Array.isArray(r.shots)) return toast('AI 응답이 비어 있습니다');
      p['t' + t] = r.title || p['t' + t]; p['l' + t] = r.logline || p['l' + t];
      (r.chars || []).slice(0, p.chars.length).forEach((c, i) => { p.chars[i]['n' + t] = c.name || p.chars[i]['n' + t]; p.chars[i]['d' + t] = c.look || p.chars[i]['d' + t]; });
      r.shots.slice(0, p.shots.length).forEach((s, i) => { const sh = p.shots[i]; sh['p' + t] = s.place || sh['p' + t]; sh['a' + t] = s.action || sh['a' + t]; sh['d' + t] = sh['d' + f] ? (s.line || sh['d' + t]) : ''; });
      dirty = true; render(); toast(from === 'kr' ? '영어판에 반영했습니다' : '한국어판에 반영했습니다');
    });
}
function aiSubs(lang) {
  const p = draft, name = (SUB_LANGS.find(l => l[0] === lang) || [])[1] || lang;
  aiRun(`${name} 자막을 만드는 중`, token => gemini(`Translate these short-drama subtitle lines into the language with code "${lang}" (${name}). Natural, punchy subtitle style. Return exactly ${p.shots.length} items in the same order; an empty input stays an empty string.\nKorean: ${JSON.stringify(p.shots.map(s => s.dk))}\nEnglish: ${JSON.stringify(p.shots.map(s => s.de))}`,
    { type: 'OBJECT', properties: { lines: { type: 'ARRAY', items: S_STR } }, required: ['lines'] }, token),
    r => { if (!r || !Array.isArray(r.lines)) return toast('AI 응답이 비어 있습니다'); p.subs = p.subs || {}; p.subs[lang] = p.shots.map((s, i) => String(r.lines[i] || '')); dirty = true; render(); toast(`${name} 자막을 만들었습니다`); });
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

/* ---------- 히트작 벤치마킹 (깃허브 저장소에서 읽기) ---------- */
const hitsUrl = () => String(settings.hitsUrl || '').trim() || HITS_URL_DEFAULT;
const validScript = s => Array.isArray(s) && s.length === 6 && Array.isArray(s[4]) && s[4].length >= 2 && Array.isArray(s[5]) && s[5].length >= 3 && s[5].every(x => Array.isArray(x) && x.length === 8) && s[4].every(c => Array.isArray(c) && c.length === 5);
const validHit = h => h && typeof h.id === 'string' && validScript(h.script);
function allHits() {
  const map = new Map();
  ((typeof HITS_LOCAL !== 'undefined' && HITS_LOCAL.items) || []).filter(validHit).forEach(h => map.set(h.id, h));
  ((store.get('hits', {}).items) || []).filter(validHit).forEach(h => map.set(h.id, h));
  return [...map.values()];
}
async function fetchHits() {
  toast('저장소에서 불러오는 중…');
  const r = await httpReq(hitsUrl() + (hitsUrl().includes('?') ? '&' : '?') + 't=' + Date.now());
  if (r.status !== 200) return dialog('저장소를 읽지 못했습니다', r.status === 404 ? '주소에 파일이 없습니다. 저장소가 비공개이거나 파일이 아직 올라가지 않았을 수 있습니다. 아래 주소를 확인하세요.' : r.status === 0 ? '인터넷 연결을 확인하세요.' : `응답 코드 ${r.status}`, [['닫기', null]]);
  try {
    const data = JSON.parse(r.text), items = (Array.isArray(data) ? data : data.items || []).filter(validHit);
    store.set('hits', { items, updated: data.updated || '', fetched: Date.now() }); render(); toast(`벤치마킹 ${items.length}편을 불러왔습니다`);
  } catch (e) { dialog('파일 형식이 올바르지 않습니다', 'hits.json 이 올바른 JSON인지 확인하세요.', [['닫기', null]]); }
}
function researchPrompt(n, platform) {
  return `너는 숏드라마(세로형 마이크로 드라마) 시장 조사원이자 작가다. 아래 순서대로 작업해라.

[1] 조사
- ${platform || 'ReelShort, DramaBox, ShortMax, 유튜브 쇼츠, 틱톡'}에서 조회수 5천만~1억 이상으로 보도되었거나 플랫폼 인기 순위 최상위에 오른 숏드라마 ${n}편을 찾는다.
- 작품마다 제목, 플랫폼, 조회수·순위 근거(출처 주소 포함)를 확인한다. 확인하지 못한 수치는 지어내지 말고 "확인 불가"라고 적는다.

[2] 분석 (공식만 뽑는다)
- 작품마다 "왜 터졌는지"를 2~3문장으로 정리한다: 첫 3초 훅, 굴욕과 반전의 구조, 통쾌한 지점, 다음 화로 넘기는 방식.
- 원작의 대사, 인물 이름, 제목, 고유한 장면을 옮겨 적지 않는다. 구조와 공식만 가져온다.

[3] 새 대본 쓰기 (오리지널)
- 분석한 공식만 빌려서 인물, 직업, 배경, 대사, 제목이 모두 다른 새 6샷 대본을 한국어·영어로 쓴다. 원작과 나란히 놓았을 때 같은 작품으로 보이면 안 된다.
- 6샷 순서: 훅·굴욕 → 고조 → 복선 → 반전 공개 → 참교육 → 클리프행어. 샷마다 눈에 보이는 동작 하나, 대사는 한 줄(한국어 28자, 영어 14단어 이내).
- 피, 흉기, 성적 묘사, 실존 인물, 실제 브랜드는 쓰지 않는다(AI 영상 생성이 거부된다). 응징은 지위·법·증거·공개 망신으로 한다.
- 설정은 한국과 해외 어디서나 통해야 한다. 한국어 칸은 한국 이름, 영어 칸은 서양 이름을 쓴다.

[4] 저장 형식
깃허브 저장소의 hits/hits.json 파일에 있는 "items" 배열 끝에 아래 형식으로 추가한다. 기존 항목은 지우지 않는다. "updated"는 오늘 날짜로 바꾼다.
{
  "id": "영문-소문자-고유값",
  "src": { "title": "참고한 작품 제목", "platform": "플랫폼", "note": "조회수·순위 근거 한 줄", "url": "출처 주소" },
  "formula": "왜 터졌는지 분석 2~3문장 (한국어)",
  "theme": "${THEMES.map(t => t.id).join(' | ')} 중 하나",
  "script": [
    "한국어 제목", "English Title", "한국어 한 줄 줄거리", "English logline",
    [["H", "한국 이름", "English name", "한국어 외형·복장", "English look and outfit"], ["V", "…", "…", "…", "…"]],
    [["한국어 장소", "English place", "한국어 화면 묘사", "English visible action", 화자번호(인물 순번, 없으면 -1), "한국어 대사", "English line", "카메라코드"], … 정확히 6개]
  ]
}
- 역할코드: H 주인공, V 악역, A 조력자, X 기타. 카메라코드: ${Object.keys(CAMS).join(', ')}.
- 저장 전에 JSON 문법 오류가 없는지 확인한다.`;
}

/* ---------- 클링 자동 입력 (접근성 서비스) ---------- */
/* 저장된 순서가 앱에 든 기본 순서보다 오래됐으면 기본 순서를 쓴다 */
const newerFlow = (saved, def) => saved && Array.isArray(saved.shot) && (parseFloat(saved.version) || 0) >= (parseFloat(def.version) || 0) ? saved : def;
const flowNow = () => newerFlow(settings.klingFlow, KLING_FLOW_DEFAULT);
const grokFlow = () => newerFlow(settings.grokFlow, GROK_FLOW_DEFAULT);
const gInfo = () => { if (!Native.has() || !window.AndroidBridge.autoInfo) return null; try { return JSON.parse(window.AndroidBridge.autoInfo('grok', grokFlow().package || '')); } catch (e) { return null; } };
const pickleFlow = () => newerFlow(settings.pickleFlow, PICKLE_FLOW_DEFAULT);
const pInfo = () => { if (!Native.has() || !window.AndroidBridge.autoInfo) return null; try { return JSON.parse(window.AndroidBridge.autoInfo('pickle', pickleFlow().package || '')); } catch (e) { return null; } };
const flowUrl = () => String(settings.klingFlowUrl || '').trim() || KLING_FLOW_URL_DEFAULT;
const kInfo = () => { if (!Native.has() || !window.AndroidBridge.klingInfo) return null; try { return JSON.parse(window.AndroidBridge.klingInfo(flowNow().package || '')); } catch (e) { return null; } };
async function buildKlingJob(p, range) {
  const m = MODE(), pick = c => c.imgFull || c.imgFace, miss = new Set(), shots = [];
  const imgsFor = async ids => { const out = []; for (const i of ids) { const v = await imgGet(pick(p.chars[i])); if (v) out.push(v); else miss.add(cname(p.chars[i], m)); } return out; };
  if (range === 'multi') shots.push({ prompt: promptText(p, `m:0:${p.shots.length}`, m), images: await imgsFor(p.chars.map((c, i) => i)), sec: totalSec(p) });
  else for (const i of (range === 'all' ? p.shots.map((x, n) => n) : [+range])) {
    const ov = p.over && p.over[`k:${i}:${m}`];
    const ids = inShot(p, p.shots[i]), has = []; for (const c of ids) if (await imgGet(pick(p.chars[c]))) has.push(c);
    shots.push({ prompt: ov != null ? ov : klingPrompt(p, i, m, has), images: await imgsFor(ids), sec: p.shots[i].sec || 5 });
  }
  return { job: { shots, neg: promptText(p, 'n', m), mode: m }, miss: [...miss] };
}
function klingNeedSetup(info) {
  if (!Native.has()) return dialog('안드로이드 앱에서만 됩니다', '클링 자동 입력은 휴대폰에 설치한 앱에서 동작합니다.', [['닫기', null]]), true;
  if (!info || !info.on) return dialog('자동 입력을 켜 주세요', '접근성 설정 > 설치된 앱 > "숏드라마 메이커 · 자동 입력"을 켜야 합니다. 켜지지 않고 회색이면 앱 정보 > 오른쪽 위 ⋮ > "제한된 설정 허용"을 먼저 누르세요.', [['앱 정보', () => window.AndroidBridge.openAppInfo()], ['접근성 설정', () => window.AndroidBridge.openAccessibility(), 'pri']]), true;
  if (!info.pkg) return dialog('클링 앱을 찾지 못했습니다', '클링 앱이 설치되어 있는지 확인하세요.', [['닫기', null]]), true;
  return false;
}
function klingSend() {
  const p = draft, info = kInfo(); if (klingNeedSetup(info)) return;
  if (info.running) return toast('이미 자동 입력이 진행 중입니다');
  const go2 = range => buildKlingJob(p, range).then(({ job, miss }) => {
    const start = auto => { job.autoGenerate = auto; settings.klingAuto = auto; store.set('settings', settings); const r = window.AndroidBridge.startKling(JSON.stringify(job), JSON.stringify(flowNow())); if (r !== 'ok') dialog('자동 입력을 시작하지 못했습니다', r, [['닫기', null]]); };
    const confirm = () => dialog('클링에 자동으로 입력합니다', `${job.shots.length}개를 차례로 입력합니다. 진행 중에는 화면을 만지지 마세요. 멈추려면 위쪽 막대의 "중지"를 누르세요.${flowNow().verified ? '' : '\n\n아직 클링 화면에 완전히 맞춰지지 않은 순서라 중간에 멈출 수 있습니다. 멈추면 그 화면을 기록해 보내 주세요.'}`,
      [['입력만', () => start(false)], ['생성까지', () => start(true), 'pri']]);
    if (miss.length) dialog('사진이 없는 인물이 있습니다', `${miss.join(', ')}의 사진이 없습니다. 인물 탭에서 사진을 첨부하면 얼굴이 일정하게 나옵니다.`, [['취소', null], ['사진 없이 진행', confirm, 'pri']]);
    else confirm();
  });
  sheet('클링으로 보내기', [[`전체 ${p.shots.length}샷을 차례로`, '샷마다 사진·프롬프트를 넣고 생성', () => go2('all')], ['멀티샷 한 번에', '모든 샷을 한 프롬프트로 (멀티샷 지원 모델)', () => go2('multi')],
    ...p.shots.map((x, i) => [`${i + 1}번 샷만`, `${beatOf(p, i)[0]} · ${x['a' + sfx()] || ''}`, () => go2(i)])]);
}
async function fetchFlow() {
  toast('순서를 불러오는 중…');
  const got = [], bad = [];
  for (const [key, url, name] of [['klingFlow', flowUrl(), '클링'], ['grokFlow', String(settings.grokFlowUrl || '').trim() || GROK_FLOW_URL_DEFAULT, '그록'], ['pickleFlow', String(settings.pickleFlowUrl || '').trim() || PICKLE_FLOW_URL_DEFAULT, '피클']]) {
    const r = await httpReq(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
    try { if (r.status !== 200) throw r.status; const f = JSON.parse(r.text); if (!Array.isArray(f.shot)) throw 0; settings[key] = f; got.push(`${name} ${f.version || ''}`); }
    catch (e) { bad.push(`${name}: ${e === 404 ? '파일 없음 (저장소 비공개이거나 main 브랜치에 없음)' : e === 0 && r.status === 0 ? '인터넷 연결 확인' : '읽지 못함'}`); }
  }
  saveSettings(); render();
  if (bad.length) dialog(got.length ? '일부만 받았습니다' : '순서를 불러오지 못했습니다', [got.length ? '받음: ' + got.join(', ') : '', ...bad].filter(Boolean).join('\n'), [['닫기', null]]);
  else toast(`순서를 받았습니다: ${got.join(', ')}`);
}

/* ---------- 그록으로 인물 이미지 만들기 ---------- */
const GROK_PREFIX = { kr: '아래 설명대로 이미지 한 장을 만들어 줘.\n\n', en: 'Generate one image exactly as described below.\n\n' };
function grokMake(ctx, ref, kind) {
  const c = charTarget(ctx, ref); if (!c) return;
  if (!Native.has()) return dialog('안드로이드 앱에서만 됩니다', '그록 자동 생성은 휴대폰에 설치한 앱에서 동작합니다.', [['닫기', null]]);
  const info = gInfo();
  if (!info || !info.on) return dialog('자동 입력을 켜 주세요', '접근성 설정 > 설치된 앱 > "숏드라마 메이커 · 자동 입력"을 켜야 합니다. 회색으로 막혀 있으면 앱 정보 > ⋮ > "제한된 설정 허용"을 먼저 누르세요.', [['앱 정보', () => window.AndroidBridge.openAppInfo()], ['접근성 설정', () => window.AndroidBridge.openAccessibility(), 'pri']]);
  if (!info.pkg) return dialog('그록 앱을 찾지 못했습니다', '그록 앱이 설치되어 있는지 확인하세요.', [['닫기', null]]);
  if (info.running) return toast('이미 자동 입력이 진행 중입니다');
  if (!window.AndroidBridge.hasMediaPerm()) return dialog('사진 접근을 허용해 주세요', '그록이 저장한 이미지를 이 앱이 가져와 첨부하려면 사진 접근 권한이 필요합니다. "모두 허용"을 골라 주세요.', [['취소', null], ['허용하기', () => window.AndroidBridge.requestMediaPerm(), 'pri']]);
  const m = MODE(), prompt = GROK_PREFIX[m] + (ctx === 'd' ? promptText(draft, `c:${ref}:${kind}`, m) : charPrompt(libProj(c), 0, m, kind));
  dialog(`그록으로 ${KIND_NAME[kind]} 이미지 만들기`, `그록 앱을 열어 프롬프트를 넣고 이미지를 만든 뒤 저장하고 돌아옵니다. 진행 중에는 화면을 만지지 마세요.${grokFlow().verified ? '' : '\n\n아직 그록 화면에 맞춰지지 않은 순서라 중간에 멈출 수 있습니다. 멈추면 위쪽 막대의 "이 화면 기록"을 눌러 보내 주세요.'}`, [['취소', null], ['시작', () => {
    const pend = { ctx, ref: String(ref), kind, since: Date.now(), pid: draft ? draft.id : '' };
    store.set('pendingGrok', pend);
    const r = window.AndroidBridge.startAuto('grok', JSON.stringify({ shots: [{ prompt, images: [] }], doneMsg: '그록 이미지를 저장했습니다. 숏드라마 메이커로 돌아갑니다.' }), JSON.stringify(grokFlow()));
    if (r !== 'ok') { store.set('pendingGrok', null); dialog('그록 자동 생성을 시작하지 못했습니다', r, [['닫기', null]]); }
  }, 'pri']]);
}
async function grokCollect(manual) {
  const pend = store.get('pendingGrok', null); if (!pend || !Native.has()) return;
  const info = gInfo(); if (info && info.running) return;
  const url = window.AndroidBridge.latestImageSince(pend.since);
  const c = pend.ctx === 'd' ? (draft && draft.id === pend.pid ? draft.chars[+pend.ref] : null) : charLib.find(x => x.id === pend.ref);
  if (!url) {
    if (!manual) return dialog('그록 이미지를 찾지 못했습니다', `${info && info.status ? info.status + '\n\n' : ''}그록에서 이미지를 저장했다면 "다시 찾기"를 누르세요. 아니면 사진 칸을 눌러 직접 첨부하세요.`, [['그만두기', () => store.set('pendingGrok', null)], ['다시 찾기', () => grokCollect(true), 'pri']]);
    return toast('아직 새 이미지가 없습니다');
  }
  store.set('pendingGrok', null);
  if (!c) return toast('이미지를 받았지만 넣을 인물이 없습니다. 대본을 다시 열어 직접 첨부하세요');
  try {
    const id = await imgPut(await shrinkDataUrl(url, pend.kind === 'full' ? 1400 : 1000));
    c[pend.kind === 'full' ? 'imgFull' : 'imgFace'] = id;
    if (pend.ctx === 'd') dirty = true; else { c.updated = Date.now(); saveCharLib(); }
    render(); toast(`그록 이미지를 ${KIND_NAME[pend.kind]} 사진에 첨부했습니다`);
  } catch (e) { toast('이미지를 저장하지 못했습니다'); }
}
function shrinkDataUrl(url, max) {
  return fetch(url).then(r => r.blob()).then(b => shrinkImage(new File([b], 'grok.jpg', { type: b.type || 'image/jpeg' }), max));
}
const klingDumps = () => { if (!Native.has() || !window.AndroidBridge.readKlingDumps) return []; try { return JSON.parse(window.AndroidBridge.readKlingDumps() || '[]'); } catch (e) { return []; } };
let seenStatus = '', seenDumps = 0;
window.onAppResume = () => {
  if (store.get('pendingGrok', null)) setTimeout(() => grokCollect(false), 600);
  if (store.get('pipeline', null)) setTimeout(pipelineResume, 800);
  const info = kInfo(); if (!info) return;
  if (info.status && info.status !== seenStatus && !info.running) { seenStatus = info.status; toast(info.status.slice(0, 60)); }
  const d = klingDumps().length;
  if (d && d !== seenDumps) { seenDumps = d; dialog(`클링 화면 ${d}개를 기록했습니다`, '이 파일을 보내 주시면 자동 입력 순서를 클링 화면에 맞춰 고칠 수 있습니다.', [['나중에', null], ['파일로 저장', () => A.dumpOut(), 'pri']]); }
  if (cur().v === 'settings') render();
};

/* ---------- 완성 영상 (클립 모으기 → 자막 새기기 → 업로드) ---------- */
let asm = null;            /* 진행 중인 합치기 상태 { state, progress, uri, error } */
const thumbCache = {};
const finOf = p => (p.fin = p.fin || { clips: [], burn: true, lang: '', size: 58, pos: -0.62, out: '' });
const finLang = p => finOf(p).lang || (isEn() ? 'en' : 'ko');
const vThumb = uri => { if (thumbCache[uri] == null) { try { thumbCache[uri] = window.AndroidBridge.videoThumb(uri) || ''; } catch (e) { thumbCache[uri] = ''; } } return thumbCache[uri]; };
const needPhone = () => { if (Native.has() && window.AndroidBridge.assemble) return false; dialog('휴대폰 앱에서만 됩니다', '영상 모으기, 합치기, 업로드는 휴대폰에 설치한 앱에서 동작합니다.', [['닫기', null]]); return true; };
function findClips(p, since, need, auto) {
  let list = []; try { list = JSON.parse(window.AndroidBridge.listVideosSince(since) || '[]'); } catch (e) {}
  const f = finOf(p);
  if (!list.length) { if (!auto) dialog('새 영상을 찾지 못했습니다', '클링에서 영상을 내려받았는지 확인하세요. "직접 고르기"로 골라도 됩니다.', [['닫기', null], ['직접 고르기', () => A.pickClips(), 'pri']]); return 0; }
  f.clips = list.slice(-need || undefined).map(v => ({ uri: v.uri, name: v.name, dur: v.dur }));
  dirty = true; render(); return f.clips.length;
}
function startAssemble(p, auto) {
  if (needPhone()) return;
  const f = finOf(p); if (!f.clips.length) return toast('먼저 영상 클립을 모으세요');
  const lines = subLines(p, finLang(p)) || [], subs = f.clips.map((c, i) => f.burn ? (lines[i] || '') : '');
  const ok = window.AndroidBridge.assemble(JSON.stringify({ clips: f.clips.map(c => c.uri), subs, burn: f.burn, size: f.size, pos: f.pos, title: T(p) }));
  if (!ok) return toast('이미 영상을 만들고 있습니다');
  asm = { state: 'running', progress: 0, auto: !!auto, pid: p.id }; render();
}
window.onAssemble = o => {
  asm = Object.assign(asm || {}, o);
  const bar = $('#asmBar'), txt = $('#asmTxt');
  if (o.state === 'running' && bar) { bar.style.width = (o.progress || 0) + '%'; if (txt) txt.textContent = `영상 만드는 중… ${o.progress || 0}%`; return; }
  if (o.state === 'done') {
    const p = draft && draft.id === asm.pid ? draft : null;
    if (p) { finOf(p).out = o.uri; saveDraft(); }
    const auto = asm.auto; asm = null; render();
    if (auto && p) { if (settings.upWay === 'pickle') pickleUpload(p, true); else uploadOut(p); } else toast('완성 영상을 동영상 앱의 ShortDramaMaker 폴더에 저장했습니다');
    store.set('pipeline', null);
  } else if (o.state === 'error') { asm = null; render(); dialog('영상을 만들지 못했습니다', o.error || '', [['닫기', null]]); store.set('pipeline', null); }
  else if (o.state === 'cancelled') { asm = null; render(); toast('영상 만들기를 멈췄습니다'); }
};
function uploadOut(p) {
  const f = finOf(p); if (!f.out) return toast('먼저 완성 영상을 만드세요');
  const k = uploadKit(p, MODE());
  window.AndroidBridge.shareVideo(f.out, k.title, `${k.title}\n\n${k.desc}`);
  toast('제목·설명 복사됨 · AI 생성 표시를 켜세요');
}
/* ---------- 피클(텍스트로 지시하는 AI 에이전트 앱)에게 업로드 맡기기 ---------- */
const PLATS = [['yt', '유튜브 쇼츠'], ['tt', '틱톡'], ['ig', '인스타그램 릴스']];
const upPlats = () => { const v = (settings.upPlats || ['yt']).filter(x => PLATS.some(([id]) => id === x)); return v.length ? v : ['yt']; };
function pickleText(p) {
  const k = uploadKit(p, MODE()), names = upPlats().map(x => PLATS.find(([id]) => id === x)[1]);
  return [`방금 보낸 세로 영상(동영상 앱 > Movies/ShortDramaMaker 폴더의 가장 최근 "${T(p)}_assembled" 파일)을 ${names.join(', ')}에 올려 줘.`,
    '', `제목: ${k.title}`, '', '설명:', k.desc, '', `고정 댓글: ${k.pin}`, '',
    '지켜 줄 것:', '1. "AI 생성 콘텐츠(변경되거나 합성된 콘텐츠)" 표시를 꼭 켜 줘.', '2. 공개 범위는 "공개", 아동용 아님으로 해 줘.', '3. 올린 뒤 고정 댓글을 달아 줘.', '4. 끝나면 올라간 영상 링크를 알려 줘.'].join('\n');
}
function pickleUpload(p, auto) {
  if (needPhone()) return;
  const f = finOf(p); if (!f.out) return toast('먼저 완성 영상을 만드세요');
  const text = pickleText(p), via = window.AndroidBridge.shareToApp ? window.AndroidBridge.shareToApp('pickle', f.out, text) : 'noshare';
  if (via === 'ok') return toast('피클에 영상과 지시문을 보냈습니다 · 피클에서 보내기를 누르세요 (지시문은 복사도 됨)');
  if (via === 'noapp') return dialog('피클 앱을 찾지 못했습니다', '피클 앱이 설치되어 있는지 확인하세요. 지금은 업로드할 앱을 직접 고르는 창을 엽니다.', [['닫기', null], ['앱 고르기', () => uploadOut(p), 'pri']]);
  const info = pInfo();
  if (!info || !info.on) { Native.share('업로드 지시문', text); return toast('피클이 영상 공유를 받지 않습니다 · 지시문을 보내니 피클을 고르세요 (자동 입력을 켜면 바로 입력)'); }
  if (info.running) return toast('이미 자동 입력이 진행 중입니다');
  const r = window.AndroidBridge.startAuto('pickle', JSON.stringify({ shots: [{ prompt: text, images: [] }], doneMsg: '피클에 업로드 지시를 보냈습니다.' }), JSON.stringify(pickleFlow()));
  if (r !== 'ok') dialog('피클에 보내지 못했습니다', r, [['닫기', null]]);
  else if (!auto) toast('피클 채팅에 지시문을 입력합니다');
}
/* 원클릭: 클링 생성 → 영상 내려받기 → 돌아오면 합치기 → 업로드 창 */
function oneClick() {
  if (needPhone()) return;
  const p = draft, info = kInfo(); if (klingNeedSetup(info)) return;
  if (!window.AndroidBridge.hasMediaPerm()) return dialog('사진·동영상 접근을 허용해 주세요', '클링에서 내려받은 영상을 찾으려면 접근 권한이 필요합니다. "모두 허용"을 골라 주세요.', [['취소', null], ['허용하기', () => window.AndroidBridge.requestMediaPerm(), 'pri']]);
  buildKlingJob(p, 'all').then(({ job, miss }) => {
    const go1 = () => dialog('원클릭 제작을 시작합니다', `① 클링에 ${job.shots.length}개 샷을 넣고 생성합니다 (크레딧 사용)\n② 생성이 끝나면 영상을 내려받습니다 (몇 분 걸립니다)\n③ 이 앱으로 돌아와 영상을 잇고 자막을 새깁니다\n④ ${settings.upWay === 'pickle' ? '피클에게 영상과 업로드 지시를 보냅니다' : '업로드할 앱을 고르는 창을 엽니다'}\n\n진행 중에는 화면을 만지지 마세요.${flowNow().verified ? '' : '\n\n클링 순서가 아직 완전히 맞춰지지 않아 중간에 멈출 수 있습니다. 멈추면 그 단계부터 이 화면의 버튼으로 이어 하세요.'}`,
      [['취소', null], ['시작', () => {
        saveDraft();
        job.autoGenerate = true; job.collect = true;
        store.set('pipeline', { pid: p.id, since: Date.now(), n: job.shots.length });
        const r = window.AndroidBridge.startKling(JSON.stringify(job), JSON.stringify(flowNow()));
        if (r !== 'ok') { store.set('pipeline', null); dialog('시작하지 못했습니다', r, [['닫기', null]]); }
      }, 'pri']]);
    if (miss.length) dialog('사진이 없는 인물이 있습니다', `${miss.join(', ')}의 사진이 없습니다. 인물 탭에서 그록으로 만들거나 첨부하면 얼굴이 일정하게 나옵니다.`, [['취소', null], ['사진 없이 진행', go1, 'pri']]);
    else go1();
  });
}
function pipelineResume() {
  const pl = store.get('pipeline', null); if (!pl || !Native.has()) return;
  const info = kInfo(); if (info && info.running) return;
  if (!draft || draft.id !== pl.pid) { const pr = projects.find(x => x.id === pl.pid); if (!pr) return store.set('pipeline', null); draft = JSON.parse(JSON.stringify(pr)); dirty = false; stack = [{ v: 'home', p: {} }, { v: 'editor', p: { tab: 'finish' } }]; }
  else cur().p.tab = 'finish';
  const got = findClips(draft, pl.since, pl.n, true);
  if (got >= pl.n) return startAssemble(draft, true);
  render();
  dialog(`영상 ${got}/${pl.n}개를 찾았습니다`, '아직 생성 중이거나 내려받기가 멈췄을 수 있습니다.', [['그만두기', () => store.set('pipeline', null)], ['다시 찾기', pipelineResume], [got ? '찾은 것으로 계속' : '직접 고르기', () => { if (got) { store.set('pipeline', null); startAssemble(draft, true); } else A.pickClips(); }, 'pri']]);
}
window.onVideosPicked = uris => {
  if (!draft || !uris || !uris.length) return;
  const f = finOf(draft); f.clips = f.clips.concat(uris.map(u => ({ uri: u, name: decodeURIComponent(u.split('/').pop()), dur: 0 }))); dirty = true; render();
};
function tabFinish(p) {
  const f = finOf(p), lang = finLang(p), lines = subLines(p, lang), on = Native.has() && window.AndroidBridge.assemble, running = asm && asm.state === 'running';
  const clipRow = (c, i) => `<div class="row clip"><span class="cthumb">${on && vThumb(c.uri) ? `<img src="${vThumb(c.uri)}" alt="">` : ic('film')}</span><span class="grow"><b>샷 ${i + 1}${p.shots[i] ? ' · ' + beatOf(p, i)[0] : ''}</b><small>${esc(c.name || '')}${c.dur ? ` · ${Math.round(c.dur / 100) / 10}초` : ''}</small></span>
    <button class="ib sm" data-act="clipMove" data-i="${i}" data-d="-1" aria-label="위로">${ic('back')}</button><button class="ib sm" data-act="clipDel" data-i="${i}" aria-label="빼기">${ic('x')}</button></div>`;
  return `
    <div class="card aicard kling"><div class="aih"><span class="glyph" style="--h:350">${ic('bolt')}</span><span class="grow"><b>원클릭 제작</b><small>클링 생성 → 영상 내려받기 → 자막 넣어 합치기 → ${settings.upWay === 'pickle' ? '피클에게 업로드 맡기기' : '업로드 창'}까지</small></span>${flowNow().verified ? '' : '<span class="tag warn">시험 중</span>'}</div>
      <button class="btn pri block" data-act="oneClick" ${running ? 'disabled' : ''}>${ic('bolt')}원클릭 제작 시작</button>
      <p class="hint">중간에 멈추면 아래 ①~④를 하나씩 눌러 이어 할 수 있습니다. 인물 사진을 먼저 넣어 두면 얼굴이 일정하게 나옵니다.</p></div>
    <div class="sec">${h2('film', `① 영상 클립 ${f.clips.length}/${p.shots.length}`)}
      <div class="aiacts"><button class="btn sm blue" data-act="findClips">${ic('search')}방금 받은 영상 찾기</button><button class="btn sm" data-act="pickClips">${ic('folder')}직접 고르기</button></div>
      ${f.clips.length ? `<div class="list">${f.clips.map(clipRow).join('')}</div>` : '<p class="hint">클링에서 내려받은 영상을 찾거나 직접 골라 샷 순서대로 놓으세요. "방금 받은 영상 찾기"는 최근 30분 안에 저장된 영상을 오래된 것부터 가져옵니다.</p>'}</div>
    <div class="sec">${h2('caption', '② 자막')}
      ${seg('p_burn', [[1, '자막 넣기'], [0, '자막 없이']], f.burn ? 1 : 0)}
      ${f.burn ? `<div class="chips">${SUB_LANGS.filter(([id]) => subLines(p, id)).map(([id, n]) => `<button class="chip ${lang === id ? 'on' : ''}" data-act="finSet" data-k="lang" data-v="${id}">${n}</button>`).join('')}</div>
      ${seg('p_fsize', [[48, '작게'], [58, '보통'], [70, '크게']], f.size)}${seg('p_fpos', [['-0.62', '아래'], ['-0.3', '조금 위'], ['0', '가운데']], String(f.pos))}
      <p class="hint">${lines ? `샷마다 대사 한 줄이 그 클립 위에 새겨집니다. 예: "${esc((lines.find(Boolean) || '').slice(0, 30))}"` : '이 언어 자막이 없습니다. 자막·문구 탭에서 만드세요.'}</p>` : ''}</div>
    <div class="sec">${h2('bolt', '③ 완성 영상')}
      ${running ? `<div class="card asm"><span id="asmTxt">영상 만드는 중… ${asm.progress || 0}%</span><div class="pbar"><i id="asmBar" style="width:${asm.progress || 0}%"></i></div><button class="btn sm" data-act="asmCancel">${ic('x')}멈추기</button></div>`
        : `<button class="btn blue block" data-act="assemble">${ic('film')}${f.out ? '다시 만들기' : '완성 영상 만들기'}</button>`}
      ${f.out && !running ? `<div class="card done"><b>${ic('checkc')}완성 영상이 있습니다</b><small>동영상 앱 > ShortDramaMaker 폴더</small><div class="aiacts"><button class="btn sm" data-act="openOut">${ic('play')}열어 보기</button></div></div>` : ''}</div>
    <div class="sec">${h2('share', '④ 업로드')}
      <div class="seg">${[['share', '앱 직접 고르기'], ['pickle', '피클에게 맡기기']].map(([id, n]) => `<button class="${(settings.upWay || 'share') === id ? 'on' : ''}" data-act="upWay" data-v="${id}">${n}</button>`).join('')}</div>
      ${settings.upWay === 'pickle' ? `<div class="chips">${PLATS.map(([id, n]) => `<button class="chip ${upPlats().includes(id) ? 'on' : ''}" data-act="upPlat" data-v="${id}">${n}</button>`).join('')}</div>
      <button class="btn pri block" data-act="pickleUp" ${f.out ? '' : 'disabled'}>${ic('bolt')}피클에게 업로드 맡기기</button>
      <button class="btn sm" data-act="pickleCopy">${ic('copy')}지시문만 복사</button>
      <p class="hint">완성 영상과 업로드 지시문(제목·설명·해시태그·고정 댓글·AI 생성 표시·링크 보고)을 피클 앱으로 보냅니다. 피클이 공유를 받지 않으면 자동 입력으로 피클 채팅에 지시문을 넣고 보냅니다. 원클릭 제작도 끝에 이 방식으로 넘깁니다.</p>`
      : `<button class="btn pri block" data-act="uploadOut" ${f.out ? '' : 'disabled'}>${ic('share')}유튜브·틱톡·인스타로 보내기</button>
      <p class="hint">업로드할 앱을 고르면 완성 영상이 그 앱의 업로드 화면으로 넘어가고, 제목·설명·해시태그가 복사됩니다. 붙여넣은 뒤 "AI 생성 콘텐츠" 표시를 켜고 직접 올리세요. 하루 1~2편으로 시작하세요.</p>`}</div>`;
}

/* ---------- 공통 조각 ---------- */
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
const glyph = (t, big) => `<span class="glyph${big ? ' big' : ''}" style="--h:${t.hue}">${ic(t.icon)}</span>`;
const chev = `<span class="chev">${ic('chevron')}</span>`;
const h2 = (icon, text, right = '') => `<h2 class="h2"><span class="hi">${ic(icon)}</span>${text}<span class="sp"></span>${right}</h2>`;
const seg = (name, opts, val) => `<div class="seg" role="group">${opts.map(([v, l, i]) => `<button data-act="set" data-k="${name}" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${i ? ic(i) : ''}${l}</button>`).join('')}</div>`;
const pageHead = o => `<div class="phead"><div class="ph-t">${o.eyebrow ? `<span class="eyebrow">${ic(o.eicon || 'sparkle')}${o.eyebrow}</span>` : ''}${o.title ? `<h2>${o.title}</h2>` : ''}${o.lead ? `<p>${o.lead}</p>` : ''}</div>${art(o.icon, o.hue)}</div>`;
const modeSeg = () => `<div class="mode" role="group" aria-label="제작 대상">${[['kr', '국내용'], ['en', '해외용']].map(([v, l]) => `<button data-act="mode" data-v="${v}" class="${MODE() === v ? 'on' : ''}">${v === 'en' ? ic('globe') : ''}${l}</button>`).join('')}</div>`;
const doneSet = () => new Set(projects.map(p => p.src).filter(Boolean));
function dramaRow(theme, i, showTheme, done) {
  const s = dramasOf(theme)[i], t = TH[theme], k = isEn() ? 1 : 0;
  const side = t.sides && s[6] && s[6].side ? (t.sides.find(x => x[0] === s[6].side) || [])[1] : '';
  return `<div class="row trow" role="button" tabindex="0" data-act="openDrama" data-th="${theme}" data-i="${i}">${glyph(t)}<span class="grow"><b>${esc(s[k])}</b><small>${showTheme ? t.name + ' · ' : ''}${side ? side + ' · ' : ''}${esc(s[2 + k])}</small></span>${done && done.has(theme + ':' + i) ? '<span class="tag ok">작업함</span>' : ''}${chev}</div>`;
}
const projRow = (p, extra) => { const t = TH[p.theme] || THEMES[0]; return `<div class="row" role="button" tabindex="0" data-act="open" data-id="${p.id}">${extra || glyph(t)}<span class="grow"><b>${esc(T(p))}</b><small>${t.name} · ${p.shots.length}샷 · ${totalSec(p)}초 · ${dateStr(p.updated)}</small></span>${extra ? '' : `<button class="ib sm star ${p.fav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="즐겨찾기">${ic('star')}</button><button class="ib sm" data-act="rowMenu" data-id="${p.id}" aria-label="더보기">${ic('more')}</button>`}</div>`; };
function openDrama(theme, i) { const s = dramasOf(theme)[i]; if (!s) return; draft = toProject(s, theme, theme + ':' + i); dirty = true; go('editor'); }
function openProject(id) { const p = projects.find(x => x.id === id); if (!p) return; draft = JSON.parse(JSON.stringify(p)); dirty = false; go('editor'); }
function saveDraft() {
  draft.updated = Date.now(); const c = JSON.parse(JSON.stringify(draft)); delete c._undo;
  const i = projects.findIndex(x => x.id === c.id); if (i >= 0) projects[i] = c; else projects.unshift(c);
  saveProjects(); dirty = false; toast('보관함에 저장했습니다');
}
function dailyDramas(n, seed) {
  const ths = (settings.myThemes.length ? settings.myThemes : THEMES.map(t => t.id)).filter(id => dramasOf(id).length), out = [];
  if (!ths.length) return out;
  const day = Math.floor(Date.now() / 864e5) + (seed || 0) * 7;
  for (let k = 0; out.length < n && k < n * 6; k++) { const th = ths[(day * 3 + k * 7) % ths.length], list = dramasOf(th), i = (day * 13 + k * 29) % list.length; if (!out.some(([a, b]) => a === th && b === i)) out.push([th, i]); }
  return out;
}
const BAN_RE = /피를|칼로|총을|살인|blood|knife|\bgun\b|kill|murder|naked/i;
function scoreOf(p) {
  const m = MODE(), k = sfx(m), spoken = p.shots.filter(s => s.sp >= 0 && s['d' + k]).length, roles = p.chars.map(c => c.r), tot = totalSec(p);
  const lineOk = s => m === 'kr' ? (s.dk || '').length <= 30 : words(s.de) <= 15, actOk = s => m === 'kr' ? (s.ak || '').length <= 50 : words(s.ae) <= 24;
  const items = [
    [p.shots[0] && p.shots[0].sp >= 0 && !!p.shots[0]['d' + k], '1샷이 대사로 시작한다 (훅)', '첫 샷에 악역의 독한 대사를 넣으세요.'],
    [spoken >= Math.min(4, p.shots.length), '대사 있는 샷이 4개 이상이다', '대사가 너무 적으면 사건이 전달되지 않습니다.'],
    [p.shots.every(lineOk), '모든 대사가 5초 안에 끝난다', m === 'kr' ? '대사는 28자 이내로 줄이세요.' : '대사는 14단어 이내로 줄이세요.'],
    [p.shots.every(actOk), '샷마다 동작이 하나다', '화면 묘사가 길면 5초 영상에 담기지 않습니다.'],
    [roles.includes('H') && roles.includes('V'), '주인공과 악역이 있다', '인물 탭에서 역할을 정하세요.'],
    [p.shots.every(s => s['p' + k] && s['a' + k]), '모든 샷에 장소와 화면 묘사가 있다', '비어 있는 샷을 채우세요.'],
    [p.chars.every(c => (c['d' + k] || '').length >= (m === 'kr' ? 12 : 25)), '인물 외형 설명이 충분하다', '나이대, 성별, 머리, 옷, 인상을 적으세요.'],
    [p.shots.length >= 5 && p.shots.length <= 8, '샷이 5~8개다', '한 편은 6샷이 가장 안정적입니다.'],
    [tot >= 20 && tot <= 60, '전체 길이가 20~60초다', `지금 ${tot}초입니다.`],
    [!BAN_RE.test(p.shots.map(s => s.ak + s.ae + s.dk + s.de).join(' ')), '생성이 거부될 표현이 없다', '폭력·흉기·노출 표현을 순화하세요.']
  ].map(([ok, label, tip]) => ({ ok, label, tip }));
  return { items, score: Math.round(items.filter(i => i.ok).length / items.length * 100) };
}
const scoreList = sc => sc.items.map(i => `<li><span class="m ${i.ok ? '' : 'x'}">${ic(i.ok ? 'check' : 'x')}</span><span>${i.label}${i.ok ? '' : `<small>${i.tip}</small>`}</span></li>`).join('');
const KIND_NAME = { full: '전신', face: '얼굴' };
function imgSlot(ctx, ref, c, kind) {
  const id = c[kind === 'full' ? 'imgFull' : 'imgFace'], nm = esc(cname(c));
  return `<div class="slot ${kind}">${id
    ? `<button class="sthumb" data-act="viewImg" data-id="${id}" data-n="${nm}_${KIND_NAME[kind]}" aria-label="${nm} ${KIND_NAME[kind]} 사진 크게 보기"><img data-img="${id}" alt=""></button><div class="sacts"><button class="ib sm" data-act="attachImg" data-ctx="${ctx}" data-ref="${ref}" data-kind="${kind}" aria-label="사진 바꾸기">${ic('refresh')}</button><button class="ib sm" data-act="rmImg" data-ctx="${ctx}" data-ref="${ref}" data-kind="${kind}" aria-label="사진 빼기">${ic('trash')}</button></div>`
    : `<button class="sadd" data-act="attachImg" data-ctx="${ctx}" data-ref="${ref}" data-kind="${kind}">${ic('plus')}<b>${KIND_NAME[kind]} 사진</b><small>AI로 만든 이미지 첨부</small></button>`}<span class="slab">${KIND_NAME[kind]}</span></div>`;
}
const libProj = c => ({ style: settings.style, chars: [c], shots: [], over: {} });
const charFields = c => ({ r: c.r, nk: c.nk, ne: c.ne, dk: c.dk, de: c.de, imgFull: c.imgFull || '', imgFace: c.imgFace || '' });
const charTarget = (ctx, ref) => ctx === 'd' ? draft && draft.chars[+ref] : charLib.find(c => c.id === ref);
function swapName(p, from, to) {
  if (!from || !to || from === to) return;
  p.shots.forEach(s => ['ak', 'ae', 'dk', 'de', 'pk', 'pe'].forEach(f => { if (s[f]) s[f] = s[f].split(from).join(to); }));
  ['lk', 'le'].forEach(f => { if (p[f]) p[f] = p[f].split(from).join(to); });
}
function putLibChar(i, lc) {
  const p = draft, nc = Object.assign(charFields(lc), { libId: lc.id });
  if (i >= p.chars.length) { p.chars.push(nc); }
  else { const old = p.chars[i]; nc.r = old.r; swapName(p, old.nk, nc.nk); swapName(p, old.ne, nc.ne); p.chars[i] = nc; }
  p.over = {}; dirty = true; render(); toast(`${cname(nc)}${josa(cname(nc), '을')} 넣었습니다`);
}
const charCard = c => `<div class="card lchar" role="button" tabindex="0" data-act="go" data-v="char" data-id="${c.id}">
  <span class="lthumb">${c.imgFull || c.imgFace ? `<img data-img="${c.imgFull || c.imgFace}" alt="">` : ic('user')}</span>
  <b>${esc(cname(c))}</b><span class="tag ${c.r === 'V' ? 'a' : c.r === 'H' ? '' : 'pur'}">${ROLE_NAME[c.r] || '인물'}</span><small>${esc(clook(c) || c.dk || c.de)}</small></div>`;
function viewChar(p) {
  const c = charLib.find(x => x.id === p.id);
  if (!c) return { title: '내 캐릭터', back: true, html: '<div class="card empty"><b>캐릭터를 찾을 수 없습니다</b>삭제되었을 수 있습니다.</div>' };
  const f = (k, l, ph, ta) => `<div class="field"><label>${l}</label>${ta ? `<textarea class="in ag" rows="2" data-lc="${c.id}:${k}" placeholder="${ph}">${esc(c[k])}</textarea>` : `<input class="in" data-lc="${c.id}:${k}" value="${esc(c[k])}" placeholder="${ph}">`}</div>`;
  return { title: cname(c) || '내 캐릭터', back: true, acts: `${modeSeg()}<button class="ib" data-act="delLibChar" data-id="${c.id}" aria-label="캐릭터 삭제">${ic('trash')}</button>`, html: `
    <div class="slots big">${imgSlot('l', c.id, c, 'full')}${imgSlot('l', c.id, c, 'face')}</div>
    <div class="aiacts"><button class="btn sm grok" data-act="grokMake" data-ctx="l" data-ref="${c.id}" data-kind="full">${ic('sparkle')}그록으로 전신 생성</button><button class="btn sm grok" data-act="grokMake" data-ctx="l" data-ref="${c.id}" data-kind="face">${ic('sparkle')}그록으로 얼굴 생성</button></div>
    <div class="card ccard">
      <div class="field"><label>역할</label><select class="sel" data-lc="${c.id}:r">${Object.entries(ROLE_NAME).map(([r, n]) => `<option value="${r}" ${c.r === r ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      ${f('nk', '이름 (국내용)', '예: 서윤')}${f('ne', '이름 (해외용)', 'e.g. Grace')}
      ${f('dk', '외형·복장 (국내용 프롬프트)', '예: 30대 여성, 검은 롱코트, 긴 생머리, 차가운 눈빛', 1)}${f('de', '외형·복장 (해외용 프롬프트, 영어)', 'e.g. woman in her 30s, long black coat, ...', 1)}
      <div class="aiacts"><button class="btn sm blue" data-act="shareLibPrompt" data-id="${c.id}" data-kind="full">${ic('share')}전신 프롬프트</button><button class="btn sm" data-act="shareLibPrompt" data-id="${c.id}" data-kind="face">${ic('share')}얼굴 프롬프트</button></div>
      <p class="hint">지금 모드(${isEn() ? '해외용' : '국내용'})의 이름과 외형으로 프롬프트를 만듭니다. 고친 내용은 바로 저장됩니다.</p></div>` };
}
function promptBox(p, key, title) {
  const m = MODE(), ov = p.over && p.over[key + ':' + m] != null;
  return `<div class="pbox"><div class="ph"><b>${title}</b><span class="sp"></span>${ov ? `<button class="pbtn" data-act="resetP" data-k="${key}">${ic('refresh')}원래대로</button>` : ''}<button class="ib sm cpy" data-act="copyP" data-k="${key}" aria-label="복사" title="복사">${ic('copy')}</button><button class="pbtn blue" data-act="shareP" data-k="${key}" data-t="${title}">${ic('share')}내보내기</button></div>
    <textarea class="ag ptx" data-ov="${key}" spellcheck="false" aria-label="${title}">${esc(promptText(p, key, m))}</textarea>
    ${m === 'en' ? `<details class="kox"><summary>${ic('info')}한국어 설명 보기</summary><p>${esc(promptBase(p, key, 'kr'))}</p></details>` : ''}</div>`;
}

/* ---------- 화면들 ---------- */
const V = {};
V.char = viewChar;
V.home = p => {
  const recent = [...projects].sort((a, b) => b.updated - a.updated).slice(0, 3), d = doneSet(), daily = dailyDramas(5, p.seed);
  return { nav: 'home', top: `<div class="brand"><img src="img/icon.png" alt="">숏드라마 메이커</div>${modeSeg()}<button class="ib" data-act="go" data-v="settings" aria-label="설정">${ic('gear')}</button>`,
    html: `
    <section class="hero card">
      <div class="ph-t"><span class="eyebrow">${ic('flame')}완성 대본 ${DRAMA_COUNT.toLocaleString()}편</span><h2>30초 안에<br><em>도파민</em>이 터진다.</h2></div>${art('film', 350)}
      <div class="go"><div class="search grow1">${ic('search')}<input class="in" id="quick" type="search" placeholder="대본 검색 (예: 청소부, 결혼식, 면접)" enterkeyhint="search" maxlength="40"></div><button class="btn pri" data-act="quick">찾기</button></div>
      <p class="modehint">${ic(isEn() ? 'globe' : 'home')}${isEn() ? '<b>해외용</b> · 영어 프롬프트, 서양권 인물로 만듭니다. 프롬프트마다 한국어 설명이 붙습니다.' : '<b>국내용</b> · 한국어 프롬프트, 한국 인물로 만듭니다.'}</p>
    </section>
    <section class="sec">${h2('layers', '제작 순서')}
      <div class="card steps4">${[['list', '대본 고르기'], ['user', '인물 이미지'], ['film', '클링 영상'], ['caption', '자막·업로드']].map(([i, l], n) => `<div><span class="glyph" style="--h:${[350, 262, 218, 150][n]}">${ic(i)}</span><b>${n + 1}. ${l}</b></div>`).join('')}</div>
    </section>
    ${daily.length ? `<section class="sec">${h2('sparkle', '오늘 만들기 좋은 대본', `<button class="pbtn" data-act="reshuffle">${ic('refresh')}다른 대본</button>`)}
      <div class="list">${daily.map(([th, i]) => dramaRow(th, i, true, d)).join('')}</div></section>` : ''}
    ${[['flame', '도파민 주제', THEMES.filter(t => !t.group)], ['sparkle', '추가 주제', THEMES.filter(t => t.group === 'extra')]].filter(g => g[2].length).map(([icon, title, list]) => `<section class="sec">${h2(icon, `${title} ${list.length}`)}
      <div class="card"><div class="cats">${list.map(t => { const n = THEMES.indexOf(t); return `<button class="cat" data-act="go" data-v="theme" data-id="${t.id}"><span class="gw">${glyph(t, 1)}${settings.myThemes.includes(t.id) ? `<span class="mine">${ic('star')}</span>` : `<span class="rk num ${n < 3 ? 'top' : ''}">${n + 1}</span>`}</span>${t.name}<small class="cnt num">${dramasOf(t.id).length ? dramasOf(t.id).length + '편' : '준비 중'}</small></button>`; }).join('')}</div></div></section>`).join('')}
    <section class="sec">${h2('clock', '최근 작업', `<button class="pbtn" data-act="tab" data-v="library">전체 보기${ic('chevron')}</button>`)}
      ${recent.length ? `<div class="list">${recent.map(x => projRow(x)).join('')}</div>` : `<div class="card empty"><b>아직 작업한 대본이 없습니다</b>주제를 골라 대본을 열고 저장해 보세요.</div>`}
    </section>` };
};

V.theme = p => {
  const t = TH[p.id], all = dramasOf(t.id), q = (p.q || '').trim(), d = doneSet(), mine = settings.myThemes.includes(t.id);
  const sd = t.sides ? (p.side || '') : '', sideOf = s => (s[6] && s[6].side) || '';
  const idx = all.map((s, i) => i).filter(i => (!sd || sideOf(all[i]) === sd) && (!q || all[i].slice(0, 4).join(' ').toLowerCase().includes(q.toLowerCase())));
  return { title: t.name, back: true, acts: `${modeSeg()}<button class="ib star ${mine ? 'on' : ''}" data-act="myTheme" data-id="${t.id}" aria-label="내 주제로 고정">${ic('star')}</button>`, html: `
    ${pageHead({ eyebrow: t.en, eicon: 'globe', lead: `통쾌한 지점: ${t.punch}.`, icon: t.icon, hue: t.hue })}
    <div class="card formula"><b>${ic('flame')}이 주제의 6샷 공식</b><ol>${BEATS.map(b => `<li><span>${b[0]}</span>${b[2]}</li>`).join('')}</ol></div>
    <div class="search">${ic('search')}<input class="in" id="tq" type="search" data-q="1" placeholder="이 주제 안에서 찾기" value="${esc(q)}" aria-label="검색">${q ? `<button class="ib sm" data-act="qclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    ${t.sides ? `<div class="chips"><button class="chip ${!sd ? 'on' : ''}" data-act="set" data-k="p_side" data-v="">전체 ${all.length}</button>${t.sides.map(([v, l]) => `<button class="chip ${sd === v ? 'on' : ''}" data-act="set" data-k="p_side" data-v="${v}">${l} ${all.filter(x => sideOf(x) === v).length}</button>`).join('')}</div>` : ''}
    <div class="sec">${h2('list', `대본 ${idx.length}편`)}
      ${idx.length ? `<div class="list">${idx.map(i => dramaRow(t.id, i, false, d)).join('')}</div>` : `<div class="card empty"><b>${all.length ? '찾는 대본이 없습니다' : '대본을 준비 중입니다'}</b>${all.length ? '다른 단어로 찾아보세요.' : '곧 추가됩니다.'}</div>`}
      <p class="hint">대본을 누르면 인물, 샷, 프롬프트가 모두 채워진 작업 화면이 열립니다.</p></div>` };
};

V.browse = p => {
  const q = (p.q || '').trim().toLowerCase(), tf = p.th || '', d = doneSet(), res = [];
  for (const t of THEMES) { if (tf && t.id !== tf) continue; dramasOf(t.id).forEach((s, i) => { if (!q || s.slice(0, 4).join(' ').toLowerCase().includes(q)) res.push([t.id, i]); }); }
  const shown = res.slice(0, 150);
  return { title: '대본 찾기', back: true, acts: modeSeg(), html: `
    <div class="search">${ic('search')}<input class="in" id="bq" type="search" data-q="1" placeholder="제목이나 줄거리로 찾기" value="${esc(p.q || '')}" aria-label="대본 검색">${q ? `<button class="ib sm" data-act="qclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    <div class="chips"><button class="chip ${!tf ? 'on' : ''}" data-act="set" data-k="p_th" data-v="">전체</button>${THEMES.map(t => `<button class="chip ${tf === t.id ? 'on' : ''}" style="--h:${t.hue}" data-act="set" data-k="p_th" data-v="${t.id}">${ic(t.icon)}${t.name}</button>`).join('')}</div>
    <div class="sec">${h2('list', `${res.length}편`)}
    ${shown.length ? `<div class="list">${shown.map(([th, i]) => dramaRow(th, i, true, d)).join('')}</div>${res.length > shown.length ? `<p class="hint">앞의 ${shown.length}편만 보여 줍니다. 검색어나 주제로 좁혀 보세요.</p>` : ''}` : `<div class="card empty"><b>맞는 대본이 없습니다</b>다른 단어로 찾거나 AI로 새 대본을 만들어 보세요.<div style="margin-top:14px"><button class="btn sm blue" data-act="go" data-v="aiNew">${ic('sparkle')}AI로 새 대본 만들기</button></div></div>`}</div>` };
};

V.aiNew = p => {
  const th = p.th || 'hidden';
  return { title: 'AI로 새 대본', back: true, html: `
    ${pageHead({ eyebrow: 'Gemini', title: '아이디어 한 줄이면 됩니다', lead: '주제의 히트 공식에 맞춰 6샷 대본을 한국어·영어로 함께 씁니다.', icon: 'sparkle', hue: 262 })}
    <div class="sec"><span class="lab">${ic('flame')}주제</span><div class="chips wrap">${THEMES.map(t => `<button class="chip ${th === t.id ? 'on' : ''}" style="--h:${t.hue}" data-act="set" data-k="p_th" data-v="${t.id}">${ic(t.icon)}${t.name}</button>`).join('')}</div></div>
    <div class="field"><label for="ai_idea">${ic('edit')}아이디어 (비워도 됩니다)</label><textarea class="in" id="ai_idea" rows="3" data-p="idea" placeholder="예: 고급 식당에서 무시당한 배달원이 사실 그 건물 주인">${esc(p.idea || '')}</textarea></div>
    <button class="btn pri block" data-act="aiNewGo">${ic('sparkle')}${aiKeys().length ? '대본 만들기' : 'API 키 넣으러 가기'}</button>
    <button class="btn block" data-act="blankNew">${ic('edit')}빈 대본으로 직접 쓰기</button>` };
};

/* ----- 편집: 대본 / 인물 / 영상 / 자막·업로드 ----- */
const ETABS = [['script', '대본', 'list'], ['cast', '인물', 'user'], ['video', '영상', 'film'], ['sub', '자막·문구', 'caption'], ['finish', '완성', 'bolt']];
function shotCard(p, i, start) {
  const s = p.shots[i], k = sfx(), en = isEn(), b = beatOf(p, i), cls = i === 0 ? 'h' : i === p.shots.length - 1 ? 'c' : '';
  return `<div class="beat ${cls}" data-i="${i}">
    <div class="tc num"><span class="pdot">${ic('play')}</span><b>${tc(start)}</b><small>${s.sec || 5}초</small></div>
    <div class="box card"><div class="hd"><span class="pill">${i + 1} · ${b[0]}</span><span class="sp"></span><select class="sel" data-sf="${i}:cam" aria-label="카메라">${Object.entries(CAMS).map(([c, v]) => `<option value="${c}" ${s.cam === c ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><button class="ib sm" data-act="shotMenu" aria-label="샷 ${i + 1} 메뉴">${ic('more')}</button></div>
      <div class="frow"><span>${ic('pin')}장소</span><input data-sf="${i}:p${k}" value="${esc(s['p' + k])}" placeholder="${en ? 'e.g. corporate lobby' : '예: 회사 로비'}" aria-label="장소"></div>
      <textarea rows="1" class="ag" data-sf="${i}:a${k}" aria-label="화면 묘사" placeholder="${en ? 'One visible action' : '화면에 보이는 동작 하나'}">${esc(s['a' + k])}</textarea>
      ${en ? `<div class="ko"><span>한국어 설명</span><textarea rows="1" class="ag" data-sf="${i}:ak" aria-label="화면 묘사 한국어 설명">${esc(s.ak)}</textarea></div>` : ''}
      <div class="say"><select class="sel" data-sf="${i}:sp" aria-label="말하는 인물"><option value="-1">대사 없음</option>${p.chars.map((c, n) => `<option value="${n}" ${s.sp === n ? 'selected' : ''}>${esc(cname(c))}</option>`).join('')}</select>
        <textarea rows="1" class="ag line" data-sf="${i}:d${k}" aria-label="대사" placeholder="${en ? 'Line (max 14 words)' : '대사 (28자 이내)'}" ${s.sp < 0 ? 'disabled' : ''}>${esc(s['d' + k])}</textarea></div>
      ${en && s.sp >= 0 ? `<div class="ko"><span>대사 한국어</span><textarea rows="1" class="ag" data-sf="${i}:dk" aria-label="대사 한국어">${esc(s.dk)}</textarea></div>` : ''}
    </div></div>`;
}
function tabScript(p) {
  const sc = scoreOf(p), k = sfx(), en = isEn(); let t = 0;
  return `
    <div class="stats num"><div class="stat t1"><span class="v">${ic('film')}${p.shots.length}샷</span><small>샷 수</small></div><div class="stat t2"><span class="v">${ic('clock')}${totalSec(p)}초</span><small>전체 길이</small></div><div class="stat t3"><span class="v">${ic('checkc')}${sc.score}점</span><small>완성도</small></div></div>
    <div class="card aicard"><div class="aih"><span class="glyph" style="--h:262">${ic('sparkle')}</span><span class="grow"><b>AI로 다시 쓰기</b><small>${aiKeys().length ? `Gemini · ${esc(aiModel())} · 키 ${aiKeys().length}개` : '설정에서 Gemini API 키를 넣으면 쓸 수 있습니다'}</small></span>${p.ai ? `<span class="tag pur">AI 작성</span>` : ''}</div>
      ${aiKeys().length ? `<input class="in" id="ai_req" data-pf="aiReq" value="${esc(p.aiReq || '')}" placeholder="요청 (선택) 예: 배경을 병원으로, 반전을 더 세게">` : ''}
      <div class="aiacts">${p._undo ? `<button class="btn sm" data-act="aiUndo">${ic('back')}AI 전으로</button>` : ''}<button class="btn sm" data-act="${aiKeys().length ? 'aiSync' : 'settings'}">${ic('globe')}${en ? '한국어판에 반영' : '영어판에 반영'}</button><button class="btn sm blue" data-act="${aiKeys().length ? 'aiAll' : 'settings'}">${ic('sparkle')}${aiKeys().length ? '전체 다시 쓰기' : 'API 키 넣기'}</button></div>
      <p class="hint">${en ? '영어 칸이 프롬프트에 들어갑니다. 영어를 고친 뒤 "한국어판에 반영"을 누르면 한국어 설명도 맞춰집니다.' : '한국어 칸이 프롬프트에 들어갑니다. 해외용으로도 쓸 대본이면 고친 뒤 "영어판에 반영"을 누르세요.'}</p></div>
    <div class="sec beats" id="beats">${p.shots.map((s, i) => { const a = t; t += (+s.sec || 5); return shotCard(p, i, a); }).join('')}
      <button class="btn sm" data-act="addShot">${ic('plus')}샷 추가</button></div>
    <div class="sec">${h2('checkc', '완성도 점검')}<div class="card score"><ul>${scoreList(sc)}</ul></div></div>
    <div class="field"><label for="memo">${ic('caption')}메모</label><textarea class="in" id="memo" rows="2" data-pf="memo" placeholder="시리즈 계획, 다음 화 아이디어 등">${esc(p.memo || '')}</textarea></div>`;
}
function tabCast(p) {
  const k = sfx(), en = isEn(), open = cur().p.cp || {};
  return `
    <div class="card guide"><b>${ic('info')}인물 이미지 만드는 법</b><ol><li><b>원클릭:</b> "그록으로 전신 생성"을 누르면 그록 앱에서 이미지를 만들고 저장해 돌아와 사진 칸에 자동으로 넣습니다. (설정에서 자동 입력을 켜야 합니다)</li><li><b>직접:</b> "전신 프롬프트"로 그록·챗GPT에 보내 이미지를 만들고, 저장한 이미지를 사진 칸에 첨부합니다.</li><li>"내 캐릭터에 저장"을 누르면 설정과 사진이 앱에 남아 다른 대본에서도 불러올 수 있습니다.</li></ol>
      <button class="btn sm" data-act="loadChar">${ic('users')}내 캐릭터 불러오기${charLib.length ? ` (${charLib.length})` : ''}</button>
      <div class="frow wide"><span>${ic('globe')}인물 분위기</span><input data-set="${en ? 'castEn' : 'castKr'}" value="${esc(castOf(MODE()))}" aria-label="인물 분위기" placeholder="${en ? 'American' : '한국인'}"></div>
      <p class="hint">${en ? '해외용은 서양권 인물로 만듭니다. British, Latina처럼 바꿀 수 있습니다.' : '국내용은 한국 인물로 만듭니다.'} 모든 인물 프롬프트 앞에 붙습니다.</p></div>
    ${p.chars.map((c, i) => `<div class="card ccard" data-ci="${i}">
      <div class="chd"><span class="glyph" style="--h:${{ H: 218, V: 350, A: 150, X: 42 }[c.r] || 42}">${ic('user')}</span><input class="cname" data-cf="${i}:n${k}" value="${esc(c['n' + k])}" aria-label="이름" placeholder="${en ? 'Name' : '이름'}"><select class="sel" data-cf="${i}:r" aria-label="역할">${Object.entries(ROLE_NAME).map(([r, n]) => `<option value="${r}" ${c.r === r ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="ib sm" data-act="delChar" data-i="${i}" aria-label="인물 삭제">${ic('trash')}</button></div>
      <div class="field"><label>${ic('edit')}외형·복장 설명 ${en ? '(영어, 프롬프트에 그대로 들어갑니다)' : '(프롬프트에 그대로 들어갑니다)'}</label><textarea class="in ag" rows="2" data-cf="${i}:d${k}" placeholder="${en ? 'woman in her 30s, long black coat, ...' : '예: 30대 여성, 검은 롱코트, 긴 생머리, 차가운 눈빛'}">${esc(c['d' + k])}</textarea></div>
      ${en ? `<div class="ko"><span>한국어 설명</span><textarea rows="1" class="ag" data-cf="${i}:dk" aria-label="외형 한국어 설명">${esc(c.dk)}</textarea></div><div class="ko"><span>한국어 이름</span><input data-cf="${i}:nk" value="${esc(c.nk)}" aria-label="한국어 이름"></div>` : ''}
      <div class="aiacts"><button class="btn sm blue" data-act="genChar" data-i="${i}" data-kind="full">${ic('share')}전신 프롬프트</button><button class="btn sm" data-act="genChar" data-i="${i}" data-kind="face">${ic('share')}얼굴 프롬프트</button></div>
      <div class="slots">${imgSlot('d', i, c, 'full')}${imgSlot('d', i, c, 'face')}</div>
      <div class="aiacts"><button class="btn sm grok" data-act="grokMake" data-ctx="d" data-ref="${i}" data-kind="full">${ic('sparkle')}그록으로 전신 생성</button><button class="btn sm grok" data-act="grokMake" data-ctx="d" data-ref="${i}" data-kind="face">${ic('sparkle')}그록으로 얼굴 생성</button></div>
      <button class="btn sm ${c.libId ? '' : 'blue'}" data-act="saveChar" data-i="${i}">${ic(c.libId ? 'check' : 'download')}${c.libId ? '내 캐릭터에 저장됨 · 다시 저장' : '내 캐릭터에 저장'}</button>
      ${open[`${i}:full`] ? promptBox(p, `c:${i}:full`, `${esc(cname(c))} · 전신 이미지 프롬프트`) : ''}${open[`${i}:face`] ? promptBox(p, `c:${i}:face`, `${esc(cname(c))} · 얼굴 이미지 프롬프트`) : ''}
    </div>`).join('')}
    <div class="aiacts"><button class="btn sm" data-act="addChar">${ic('plus')}인물 추가</button><button class="btn sm" data-act="shareAllChars">${ic('share')}전신 프롬프트 모두 내보내기</button></div>`;
}
function tabVideo(p) {
  const vt = cur().p.vt || 'shot', half = Math.ceil(p.shots.length / 2), k = sfx(), info = kInfo();
  return `
    <div class="card aicard kling"><div class="aih"><span class="glyph" style="--h:350">${ic('bolt')}</span><span class="grow"><b>클링으로 보내기</b><small>${!Native.has() ? '휴대폰 앱에서 쓸 수 있습니다' : !info || !info.on ? '설정에서 클링 자동 입력을 켜야 합니다' : !info.pkg ? '클링 앱을 찾지 못했습니다' : `${esc(info.label || '클링')} 앱에 사진과 프롬프트를 자동으로 넣습니다`}</small></span>${flowNow().verified ? '' : '<span class="tag warn">시험 중</span>'}</div>
      <div class="aiacts"><button class="btn sm" data-act="klingSend">${ic('bolt')}클링에 입력만</button><button class="btn sm blue" data-act="goFinish">${ic('bolt')}원클릭 제작</button></div>
      <p class="hint">인물 탭에 첨부한 사진을 샷마다 골라 올리고, 지금 모드(${isEn() ? '해외용 영어' : '국내용 한국어'}) 프롬프트를 입력합니다. 켜는 방법과 순서 업데이트는 설정에 있습니다.</p></div>
    <div class="card guide"><b>${ic('film')}클링으로 영상 만드는 순서</b><ol><li>인물 탭에서 만든 인물 이미지를 클링의 참조 이미지(Elements)로 올립니다. 번호는 인물 순서와 같습니다: ${p.chars.map((c, i) => `${i + 1} = ${esc(cname(c))}`).join(', ')}.</li><li>샷마다 "첫 프레임 프롬프트"로 장면 이미지를 만들면 구도가 고정됩니다. (건너뛰어도 됩니다)</li><li>"클링 영상 프롬프트"를 붙여넣고 길이 5초, 비율 9:16으로 생성합니다.</li><li>6샷을 편집 앱에서 이어 붙이고 자막 탭의 자막 파일을 넣습니다.</li></ol></div>
    <div class="sec"><span class="lab">${ic('sparkle')}영상 스타일</span><div class="chips">${Object.entries(STYLES).map(([id, v]) => `<button class="chip ${(p.style || 'real') === id ? 'on' : ''}" data-act="pstyle" data-v="${id}">${v[0]}</button>`).join('')}</div></div>
    ${seg('p_vt', [['shot', '샷별 프롬프트', 'list'], ['multi', '멀티샷', 'layers']], vt)}
    ${vt === 'shot' ? p.shots.map((s, i) => `<div class="card vcard"><div class="vh"><span class="pill">${i + 1} · ${beatOf(p, i)[0]}</span><small>${esc(s['a' + k])}</small></div>${promptBox(p, `f:${i}`, '첫 프레임 이미지 프롬프트')}${promptBox(p, `k:${i}`, '클링 영상 프롬프트')}</div>`).join('')
      : `<p class="hint">멀티샷을 지원하는 클링 모델에 통째로 붙여넣습니다. 한 번에 만들 수 있는 길이가 짧은 모델은 앞부분과 뒷부분을 따로 만드세요.</p>
        <div class="card vcard">${promptBox(p, `m:0:${p.shots.length}`, `전체 ${p.shots.length}샷 · ${totalSec(p)}초`)}</div>
        <div class="card vcard">${promptBox(p, `m:0:${half}`, `앞부분 (샷 1~${half})`)}${promptBox(p, `m:${half}:${p.shots.length}`, `뒷부분 (샷 ${half + 1}~${p.shots.length})`)}</div>`}
    <div class="card vcard">${promptBox(p, 'n', '제외 프롬프트 (Negative prompt)')}</div>
    <button class="btn block" data-act="exportPack">${ic('share')}제작 팩 전체 내보내기</button>`;
}
function tabSub(p) {
  const sl = cur().p.sl || (isEn() ? 'en' : 'ko'), srt = toSrt(p, sl), has = !!subLines(p, sl), name = (SUB_LANGS.find(l => l[0] === sl) || [])[1], kit = uploadKit(p, MODE());
  return `
    <div class="sec">${h2('caption', '언어별 자막')}
      <div class="chips">${SUB_LANGS.map(([id, n]) => `<button class="chip ${sl === id ? 'on' : ''}" data-act="set" data-k="p_sl" data-v="${id}">${n}${subLines(p, id) ? '' : ' +'}</button>`).join('')}</div>
      ${has ? `<div class="card vcard"><div class="ph"><b>${name} 자막 (SRT)</b><span class="sp"></span><button class="pbtn" data-act="subOut" data-v="${sl}">${ic('share')}내보내기</button><button class="pbtn blue" data-act="copy" data-t="${esc(srt)}">${ic('copy')}복사</button></div><pre class="srt">${esc(srt) || '대사가 없습니다'}</pre></div>`
        : `<div class="card empty"><b>${name} 자막이 아직 없습니다</b>한국어·영어 대사를 바탕으로 AI가 번역합니다.<div style="margin-top:14px"><button class="btn sm blue" data-act="${aiKeys().length ? 'aiSubs' : 'settings'}" data-v="${sl}">${ic('sparkle')}${aiKeys().length ? `${name} 자막 만들기` : 'API 키 넣으러 가기'}</button></div></div>`}
      <p class="hint">한국어와 영어 자막은 대본에서 바로 나옵니다. "+" 표시가 붙은 언어는 Gemini로 번역합니다. 자막 시간은 샷 길이에 맞춰져 있습니다.</p></div>
    <div class="sec">${h2('share', `업로드 문구 (${isEn() ? '해외용' : '국내용'})`)}
      <div class="card kv"><div class="frow wide"><span>${ic('hash')}회차 (EP)</span><input type="number" min="1" max="999" data-pf="ep" value="${p.ep || 1}" aria-label="회차"></div>
        ${[['제목', kit.title], ['설명', kit.desc], ['고정 댓글', kit.pin]].map(([l, v]) => `<div class="item"><p><span class="lab">${l}</span><span class="pre">${esc(v)}</span></p><button class="pbtn" data-act="copy" data-t="${esc(v)}">${ic('copy')}복사</button></div>`).join('')}</div>
      <p class="hint">업로드할 때 AI 생성 콘텐츠 표시를 켜세요. 자세한 내용은 안내 메뉴의 채널 운영에 있습니다.</p></div>`;
}
V.editor = () => {
  const p = draft, t = TH[p.theme] || THEMES[0], et = cur().p.tab || 'script', k = sfx(), en = isEn();
  return { title: t.name, back: true, flush: true, acts: `${modeSeg()}<button class="ib" data-act="exportOne" aria-label="내보내기">${ic('share')}</button>`, html: `
    <div class="ehead"><div class="tline"><span class="playdot">${ic('play')}</span><textarea class="titlein ag" rows="1" data-pf="t${k}" aria-label="제목">${esc(p['t' + k])}</textarea></div>${art(t.icon, t.hue)}</div>
    <textarea class="logline ag" rows="1" data-pf="l${k}" aria-label="한 줄 줄거리" placeholder="${en ? 'One-line logline' : '한 줄 줄거리'}">${esc(p['l' + k])}</textarea>
    ${en ? `<div class="ko top"><span>한국어 제목·줄거리</span><p>${esc(p.tk)} · ${esc(p.lk)}</p></div>` : ''}
    <div class="chips etabs">${ETABS.map(([v, l, i]) => `<button class="chip ${et === v ? 'on' : ''}" data-act="set" data-k="p_tab" data-v="${v}">${ic(i)}${l}</button>`).join('')}</div>
    ${{ script: tabScript, cast: tabCast, video: tabVideo, sub: tabSub, finish: tabFinish }[et](p)}
    <div class="sticky"><button class="btn" data-act="exportOne">${ic('share')}내보내기</button><button class="btn pri" data-act="save">${ic('check')}저장</button></div>` };
};

V.hits = p => {
  const items = allHits(), meta = store.get('hits', {}), q = (p.q || '').trim().toLowerCase(), n = p.n || 10, k = isEn() ? 1 : 0;
  const list = items.filter(h => !q || (h.script.slice(0, 4).join(' ') + (h.formula || '') + ((h.src || {}).title || '')).toLowerCase().includes(q));
  const rp = researchPrompt(n, p.pf || '');
  return { nav: 'hits', title: '히트작 벤치마킹', ticon: 'trophy', big: true, acts: modeSeg(), html: `
    ${pageHead({ eyebrow: '세계 히트 숏드라마', eicon: 'globe', lead: '크게 터진 작품의 공식만 분석해 새로 쓴 대본입니다. 대사와 인물은 모두 새로 만든 것이라 그대로 제작할 수 있습니다.', icon: 'trophy', hue: 42 })}
    <div class="card guide"><b>${ic('link')}저장소에서 불러오기</b><p>깃허브 저장소의 hits.json 파일을 읽습니다. 저장소에 새 분석을 추가한 뒤 새로고침을 누르면 목록에 반영됩니다.</p>
      <div class="frow wide"><span>주소</span><input class="mono" data-set="hitsUrl" value="${esc(settings.hitsUrl || '')}" placeholder="${esc(HITS_URL_DEFAULT)}" aria-label="hits.json 주소" autocapitalize="off" spellcheck="false"></div>
      <div class="aiacts"><button class="btn sm blue" data-act="hitsFetch">${ic('refresh')}새로고침</button><button class="btn sm" data-act="hitsOut">${ic('share')}목록 내보내기</button></div>
      <p class="hint">${meta.fetched ? `마지막으로 불러온 날: ${dateStr(meta.fetched)} · ` : ''}비워 두면 기본 주소를 씁니다. 비공개 저장소는 읽을 수 없습니다.</p></div>
    <div class="search">${ic('search')}<input class="in" id="hq" type="search" data-q="1" placeholder="제목, 원작, 공식으로 찾기" value="${esc(p.q || '')}" aria-label="검색">${q ? `<button class="ib sm" data-act="qclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    <div class="sec">${h2('trophy', `벤치마킹 대본 ${list.length}편`)}
      ${list.length ? list.map(h => { const t = TH[h.theme] || THEMES[0], s = h.src || {}; return `<div class="card hit" role="button" tabindex="0" data-act="openHit" data-id="${esc(h.id)}"><div class="aih">${glyph(t)}<span class="grow"><b>${esc(h.script[k])}</b><small>${esc(h.script[2 + k])}</small></span>${chev}</div>
        ${s.title ? `<p class="src">${ic('film')}참고한 히트작: <b>${esc(s.title)}</b>${s.platform ? ` · ${esc(s.platform)}` : ''}${s.note ? ` · ${esc(s.note)}` : ''}</p>` : ''}${h.formula ? `<p class="fx">${ic('flame')}${esc(h.formula)}</p>` : ''}</div>`; }).join('')
        : `<div class="card empty"><b>${items.length ? '찾는 대본이 없습니다' : '아직 벤치마킹 대본이 없습니다'}</b>${items.length ? '다른 단어로 찾아보세요.' : '아래 조사 지시 프롬프트로 AI에게 조사를 시키고, 결과를 저장소에 넣은 뒤 새로고침을 누르세요.'}</div>`}</div>
    <div class="sec">${h2('edit', '조사 지시 프롬프트')}
      <div class="card guide"><p>이 프롬프트를 다른 AI(클로드, 챗GPT, 제미나이 등)에 붙여넣으면 히트작을 조사하고, 공식만 분석해, 새 대본을 저장소 형식으로 만들어 줍니다. 결과를 저장소의 hits/hits.json에 넣으세요.</p>
        <span class="lab">조사할 작품 수</span>${seg('p_n', [[5, '5편'], [10, '10편'], [20, '20편']], n)}
        <div class="frow wide"><span>플랫폼</span><input data-p="pf" value="${esc(p.pf || '')}" placeholder="비우면 ReelShort, DramaBox, 쇼츠, 틱톡" aria-label="조사할 플랫폼"></div>
        <textarea class="ptx tall" readonly aria-label="조사 지시 프롬프트">${esc(rp)}</textarea>
        <div class="aiacts"><button class="btn sm blue" data-act="copy" data-t="${esc(rp)}">${ic('copy')}복사하기</button><button class="btn sm" data-act="rpOut">${ic('share')}내보내기</button></div></div></div>` };
};

V.library = p => {
  const q = (p.q || '').trim().toLowerCase(), tf = p.th || '', lt = p.lt || 'proj';
  if (lt === 'char' && !sel) {
    const cl = charLib.filter(c => !q || [c.nk, c.ne, c.dk, c.de].join(' ').toLowerCase().includes(q)).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    return { nav: 'library', title: '보관함', ticon: 'folder', big: true, acts: modeSeg(), html: `
      ${seg('p_lt', [['proj', `작업 ${projects.length}`, 'list'], ['char', `내 캐릭터 ${charLib.length}`, 'users']], lt)}
      <div class="search">${ic('search')}<input class="in" id="cq" type="search" data-q="1" placeholder="이름이나 외형으로 찾기" value="${esc(p.q || '')}" aria-label="검색">${q ? `<button class="ib sm" data-act="qclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
      ${cl.length ? `<div class="lchars">${cl.map(charCard).join('')}</div>` : `<div class="card empty"><b>${charLib.length ? '찾는 캐릭터가 없습니다' : '저장한 캐릭터가 없습니다'}</b>${charLib.length ? '다른 단어로 찾아보세요.' : '대본의 인물 탭에서 "내 캐릭터에 저장"을 누르면 설정과 사진이 여기 모입니다.'}</div>`}
      <button class="btn block" data-act="newLibChar">${ic('plus')}새 캐릭터 만들기</button>` };
  }
  const list = projects.filter(x => (!tf || x.theme === tf) && (!p.fav || x.fav) && (!q || (x.tk + x.te + x.lk + x.le).toLowerCase().includes(q))).sort((a, b) => b.updated - a.updated);
  const counts = {}; projects.forEach(x => counts[x.theme] = (counts[x.theme] || 0) + 1);
  if (sel) return { nav: 'library', title: `${sel.size}개 선택`, back: true, flush: true, acts: `<button class="tb" data-act="selAll">${ic('check')}전체 선택</button>`, html: `
    <div class="list">${list.map(x => projRow(x, `<span class="ck ${sel.has(x.id) ? 'on' : ''}">${ic('check')}</span>`)).join('')}</div>
    <div class="sticky"><button class="btn" data-act="selDelete">${ic('trash')}삭제</button><button class="btn pri" data-act="selExport">${ic('share')}내보내기</button></div>` };
  return { nav: 'library', title: '보관함', ticon: 'folder', big: true, acts: `${modeSeg()}${projects.length ? `<button class="tb" data-act="selStart">${ic('check')}선택</button>` : ''}`, html: `
    ${seg('p_lt', [['proj', `작업 ${projects.length}`, 'list'], ['char', `내 캐릭터 ${charLib.length}`, 'users']], lt)}
    <div class="search">${ic('search')}<input class="in" id="lq" type="search" data-q="1" placeholder="제목이나 줄거리로 찾기" value="${esc(p.q || '')}" aria-label="검색">${q ? `<button class="ib sm" data-act="qclear" aria-label="검색어 지우기">${ic('x')}</button>` : ''}</div>
    <div class="chips"><button class="chip ${!tf && !p.fav ? 'on' : ''}" data-act="lth" data-v="">${ic('grid')}전체 ${projects.length}</button><button class="chip ${p.fav ? 'on' : ''}" style="--h:40" data-act="lfav">${ic('star')}즐겨찾기</button>${THEMES.filter(t => counts[t.id]).map(t => `<button class="chip ${tf === t.id ? 'on' : ''}" style="--h:${t.hue}" data-act="lth" data-v="${t.id}">${ic(t.icon)}${t.name} ${counts[t.id]}</button>`).join('')}</div>
    <div class="sec">${h2('clock', tf ? TH[tf].name : p.fav ? '즐겨찾기' : '모든 작업', list.length ? `<button class="pbtn blue" data-act="exportShown">${ic('share')}이 목록 내보내기</button>` : '')}
    ${list.length ? `<div class="list">${list.map(x => projRow(x)).join('')}</div><p class="hintpill">${ic('info')}길게 누르면 여러 개를 골라 한 번에 내보낼 수 있습니다.</p>` : `<div class="card empty"><b>${projects.length ? '찾는 작업이 없습니다' : '보관된 작업이 없습니다'}</b>${projects.length ? '검색어나 주제를 바꿔 보세요.' : '대본을 열고 저장하면 주제별로 모입니다.'}</div>`}</div>` };
};

V.info = p => {
  const t = p.tab || 'channel', sec = INFO.find(x => x.id === t);
  return { nav: 'info', title: '안내', ticon: 'book', big: true, html: `
    ${pageHead({ eyebrow: '시작 전에 읽기', eicon: 'info', lead: '채널을 안전하게 키우는 방법, 터지는 숏드라마의 공식, 클링 제작 순서를 정리했습니다.', icon: 'book', hue: 196 })}
    <div class="chips">${[INFO[2], INFO[0], INFO[1]].map(x => `<button class="chip ${x.id === t ? 'on' : ''}" data-act="set" data-k="p_tab" data-v="${x.id}">${ic(x.icon)}${x.name}</button>`).join('')}<button class="chip" data-act="go" data-v="check">${ic('list')}업로드 점검표</button></div>
    <div class="list">${sec.items.map(([h, d, ex], n) => `<div class="artc"><div class="ah"><span class="no num">${n + 1}</span><h3>${h}</h3></div><p>${d}</p><div class="ex">${ic('bulb')}<span>${ex}</span></div></div>`).join('')}</div>
    ${t === 'channel' ? '<p class="hint">플랫폼 정책과 수치는 자주 바뀝니다. 여기 적힌 내용은 일반적인 운영 원칙이며, 업로드 전에 각 플랫폼의 공식 안내를 확인하세요.</p>' : ''}` };
};
V.check = () => ({ title: '업로드 전 점검표', back: true, html: `${pageHead({ eyebrow: `${settings.checks.length} / ${CHECKLIST.length} 확인`, eicon: 'check', lead: '올리기 전에 하나씩 눌러 확인하세요.', icon: 'list', hue: 28 })}<div class="list">${CHECKLIST.map((c, i) => `<button class="row" data-act="check" data-i="${i}"><span class="ck ${settings.checks.includes(i) ? 'on' : ''}">${ic('check')}</span><span class="grow"><b style="white-space:normal">${c}</b></span></button>`).join('')}</div><button class="btn block" data-act="checkReset">${ic('trash')}모두 지우기</button>` });

const setRow = (icon, hue, title, sub, act, right = chev) => `<button class="row" data-act="${act}"><span class="glyph" style="--h:${hue}">${ic(icon)}</span><span class="grow"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${right}</button>`;
V.settings = () => ({ title: '설정', back: true, html: `
  <div class="sec"><span class="lab">${ic('globe')}제작 대상</span>${seg('mode', [['kr', '국내용 (한국어·한국 인물)'], ['en', '해외용 (영어·서양 인물)']], MODE())}</div>
  <div class="sec"><span class="lab">${ic('user')}인물 분위기</span><div class="card kv"><div class="frow wide"><span>국내용</span><input data-set="castKr" value="${esc(settings.castKr)}" aria-label="국내용 인물 분위기"></div><div class="frow wide"><span>해외용</span><input data-set="castEn" value="${esc(settings.castEn)}" aria-label="해외용 인물 분위기"></div></div><p class="hint">인물 이미지 프롬프트 앞에 붙는 말입니다. 해외용은 American, British, Latina 등으로 바꿀 수 있습니다.</p></div>
  <div class="sec"><span class="lab">${ic('sparkle')}기본 영상 스타일</span><div class="chips wrap">${Object.entries(STYLES).map(([id, v]) => `<button class="chip ${settings.style === id ? 'on' : ''}" data-act="set" data-k="style" data-v="${id}">${v[0]}</button>`).join('')}</div></div>
  <div class="sec"><span class="lab">${ic('sun')}화면 테마</span>${seg('theme', [['light', '밝게'], ['dark', '어둡게'], ['system', '기기 설정']], settings.theme)}</div>
  <div class="sec">${h2('sparkle', 'AI (Gemini)')}<div class="card aibox">
    <div class="field"><label for="ai_keys">${ic('shield')}API 키 <span class="tag">${aiKeys().length}개</span></label><textarea class="in mono" id="ai_keys" rows="3" data-set="aiKeys" placeholder="AIza... , AIza... (쉼표로 여러 개)" autocomplete="off" autocapitalize="off" spellcheck="false">${esc(settings.aiKeys || '')}</textarea></div>
    <p class="hint">쉼표로 여러 개를 넣으면 번갈아 쓰고, 한도가 찬 키는 건너뜁니다. 새 대본 쓰기, 다시 쓰기, 언어판 맞추기, 자막 번역에 씁니다.</p>
    <div class="field"><label for="ai_model">${ic('cpu')}모델</label><input class="in mono" id="ai_model" data-set="aiModel" value="${esc(aiModel())}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    ${(settings.aiModels || []).length ? `<div class="chips wrap">${settings.aiModels.map(m => `<button class="chip ${m === aiModel() ? 'on' : ''}" data-act="aiPick" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}
    <div class="aiacts"><button class="btn sm" data-act="aiClear">${ic('trash')}키 지우기</button><button class="btn sm blue" data-act="aiTest">${ic('checkc')}키 확인·모델</button></div>
    <div id="aiStatus" class="aistat">${(settings.aiCheck || []).map(([ok, t]) => `<div class="${ok ? 'ok' : 'bad'}">${ic(ok ? 'checkc' : 'x')}<span>${esc(t)}</span></div>`).join('')}</div>
    <p class="hint">키는 이 기기에만 저장되며, AI 기능을 쓸 때 대본 내용과 함께 Google Gemini API로만 전송됩니다.</p></div></div>
  <div class="sec">${h2('bolt', '자동 입력 (클링·그록·피클)')}${(() => { const info = kInfo(), gi = gInfo(), pi = pInfo(), f = flowNow(), g = grokFlow(), pf = pickleFlow(), nd = klingDumps().length, row = (ok, t) => `<div class="${ok ? 'ok' : 'bad'}">${ic(ok ? 'checkc' : 'x')}<span>${t}</span></div>`; return `<div class="card aibox">
    <div class="aistat">${Native.has() ? row(info && info.on, `접근성 서비스 ${info && info.on ? '켜짐' : '꺼짐'}`) + row(info && info.pkg, info && info.pkg ? `클링 앱: ${esc(info.label || info.pkg)}` : '클링 앱을 찾지 못함') + row(gi && gi.pkg, gi && gi.pkg ? `그록 앱: ${esc(gi.label || gi.pkg)}` : '그록 앱을 찾지 못함') + row(pi && pi.pkg, pi && pi.pkg ? `피클 앱: ${esc(pi.label || pi.pkg)}` : '피클 앱을 찾지 못함') + row(window.AndroidBridge.hasMediaPerm && window.AndroidBridge.hasMediaPerm(), '사진 접근 권한 (그록 이미지 가져오기)') : '<div class="bad">' + ic('x') + '<span>휴대폰 앱에서만 쓸 수 있습니다</span></div>'}
      <div class="${f.verified ? 'ok' : 'bad'}">${ic(f.verified ? 'checkc' : 'info')}<span>클링 순서 ${esc(f.version || '')}${f.verified ? '' : ' · 아직 일부만 맞춰짐'}</span></div>
      <div class="${g.verified ? 'ok' : 'bad'}">${ic(g.verified ? 'checkc' : 'info')}<span>그록 순서 ${esc(g.version || '')}${g.verified ? '' : ' · 아직 그록 화면에 맞춰지지 않음'}</span></div>
      <div class="${pf.verified ? 'ok' : 'bad'}">${ic(pf.verified ? 'checkc' : 'info')}<span>피클 순서 ${esc(pf.version || '')}${pf.verified ? '' : ' · 보내기 버튼 위치는 추측'}</span></div></div>
    ${Native.has() && window.AndroidBridge.hasMediaPerm && !window.AndroidBridge.hasMediaPerm() ? `<button class="btn sm" data-act="mediaPerm">${ic('shield')}사진 접근 허용하기</button>` : ''}
    <div class="aiacts"><button class="btn sm blue" data-act="openAcc">${ic('gear')}접근성 설정</button><button class="btn sm" data-act="openAppInfo">${ic('info')}앱 정보</button></div>
    <p class="hint">켜는 방법: 접근성 설정 > 설치된 앱 > "숏드라마 메이커 · 자동 입력" 켜기. 회색으로 막혀 있으면 앱 정보 > 오른쪽 위 ⋮ > "제한된 설정 허용"을 먼저 누르세요.</p>
    <div class="aiacts"><button class="btn sm" data-act="flowFetch">${ic('refresh')}순서 업데이트</button></div>
    <div class="aiacts"><button class="btn sm" data-act="inspect" data-t="kling">${ic('camera')}클링 화면 기록</button><button class="btn sm" data-act="inspect" data-t="grok">${ic('camera')}그록 화면 기록</button><button class="btn sm" data-act="inspect" data-t="pickle">${ic('camera')}피클 화면 기록</button></div>
    ${nd ? `<button class="btn sm blue" data-act="dumpOut">${ic('download')}기록한 화면 ${nd}개 파일로 저장</button>` : ''}
    <p class="hint">"화면 기록"을 누르면 그 앱이 열리고 위쪽에 막대가 뜹니다. 클링은 만들기 화면, 모드 메뉴, 사진 고르는 화면, 생성 뒤 화면에서, 그록은 첫 화면, 프롬프트를 보낸 뒤 이미지가 나온 화면, 이미지를 눌러 연 화면(저장 버튼이 보이는 화면), 피클은 채팅 화면(지시문을 입력한 상태)에서 각각 "이 화면 기록"을 누른 뒤 "끝내기"를 누르세요. 누를 때마다 내 파일 > 다운로드 > ShortDramaMaker 폴더의 kling_screens_….json 파일에 자동 저장되니, 그 파일을 보내 주시면 순서를 맞춰 드립니다.</p>
    <p class="hint">클링 앱 화면을 대신 누르는 기능이라 클링 앱이 업데이트되면 멈출 수 있고, 클링 이용약관상 자동 조작이 문제가 될 수 있습니다. 본인 계정에서 본인 책임으로 쓰세요.</p></div>`; })()}</div>
  <div class="sec">${h2('shield', '백업')}<div class="list">
    ${setRow('download', 218, '모든 작업 백업하기', `작업 ${projects.length}편을 파일 하나로 저장`, 'backup')}
    ${setRow('folder', 150, '백업 파일 불러오기', '같은 작업은 건너뛰고 새 작업만 추가', 'restore')}</div></div>
  <div class="sec">${h2('info', '정보')}<div class="list">
    ${setRow('shield', 262, '개인정보 처리방침', '', 'privacy')}
    <div class="row"><span class="glyph" style="--h:196">${ic('info')}</span><span class="grow"><b>버전</b></span><span class="chev num">${APP_VERSION}</span></div></div></div>` });
V.privacy = () => ({ title: '개인정보 처리방침', back: true, html: `${pageHead({ lead: '숏드라마 메이커는 개인정보를 수집하지 않습니다.', icon: 'shield', hue: 262 })}<div class="card" style="display:flex;flex-direction:column;gap:10px">
  <p style="margin:0">작성한 대본, 설정, Gemini API 키는 이 기기 안에만 저장됩니다. 앱을 삭제하면 함께 지워집니다.</p>
  <p style="margin:0">AI 기능은 사용자가 직접 넣은 Gemini API 키로 동작합니다. AI 버튼을 누를 때만 대본 내용이 Google Gemini API로 전송되며, 이 전송에는 Google의 약관과 개인정보 처리방침이 적용됩니다.</p>
  <p style="margin:0">히트작 벤치마킹의 새로고침은 설정된 깃허브 주소에서 공개 파일을 읽어 올 뿐, 기기의 정보를 보내지 않습니다. 앱 제작자의 서버로는 아무것도 전송되지 않습니다.</p>
  <p style="margin:0">문의: happyfamily1984.3@gmail.com</p></div>` });

/* ---------- 그리기 ---------- */
const NAV = [['home', '홈', 'home'], ['hits', '히트작', 'trophy'], ['aiNew', '만들기', 'plus'], ['library', '보관함', 'folder'], ['info', '안내', 'book']];
function render(resetScroll) {
  const c = cur(), r = V[c.v](c.p), view = $('#view'), keep = view.scrollTop;
  $('#nav').hidden = !!r.back;
  $('#top').innerHTML = r.top || `${r.back ? `<button class="ib" data-act="back" aria-label="뒤로">${ic('back')}</button>` : ''}<h1 class="${r.big ? 'big' : ''}">${r.ticon ? `<span class="ticon">${ic(r.ticon)}</span>` : ''}${esc(r.title || '')}</h1>${r.acts || ''}`;
  view.className = r.flush ? 'flush' : ''; view.innerHTML = r.html;
  $('#nav').innerHTML = NAV.map(([v, l, i]) => v === 'aiNew' ? `<button class="nav make" data-act="make" aria-label="새 대본 만들기"><span>${ic(i)}</span><em>${l}</em></button>` : `<button class="nav ${r.nav === v ? 'on' : ''}" data-act="tab" data-v="${v}">${ic(i)}${l}</button>`).join('');
  view.scrollTop = resetScroll ? 0 : keep;
  $$('textarea.ag', view).forEach(autoGrow);
  hydrateImgs(view);
}
const autoGrow = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };

function importBackup(text) {
  try {
    const data = JSON.parse(text), arr = Array.isArray(data) ? data : data.projects; if (!Array.isArray(arr)) throw 0;
    const ids = new Set(projects.map(p => p.id)), cids = new Set(charLib.map(c => c.id)); let n = 0, m = 0;
    arr.forEach(p => { if (p && p.id && !ids.has(p.id) && Array.isArray(p.shots) && Array.isArray(p.chars)) { if (!TH[p.theme]) p.theme = 'hidden'; projects.push(p); n++; } });
    (data.chars || []).forEach(c => { if (c && c.id && !cids.has(c.id)) { charLib.push(c); m++; } });
    Object.entries(data.images || {}).forEach(([id, v]) => { if (typeof v === 'string' && v.startsWith('data:image')) imgPut(v, id).catch(() => {}); });
    saveProjects(); saveCharLib(); toast(n || m ? `작업 ${n}편, 캐릭터 ${m}명을 불러왔습니다` : '새로 추가할 내용이 없습니다'); render();
  } catch (e) { toast('백업 파일을 읽지 못했습니다'); }
}
let pendingImg = null;
$('#imgFile').addEventListener('change', async e => {
  const f = e.target.files[0], d = pendingImg; e.target.value = ''; pendingImg = null; if (!f || !d) return;
  try {
    const c = charTarget(d.ctx, d.ref); if (!c) return;
    const id = await imgPut(await shrinkImage(f, d.kind === 'full' ? 1400 : 1000));
    c[d.kind === 'full' ? 'imgFull' : 'imgFace'] = id;
    if (d.ctx === 'd') touch(); else { c.updated = Date.now(); saveCharLib(); }
    render(); toast(`${KIND_NAME[d.kind]} 사진을 첨부했습니다`);
  } catch (err) { dialog('사진을 저장하지 못했습니다', String(err.message || err), [['닫기', null]]); }
});
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => importBackup(r.result); r.readAsText(f); e.target.value = ''; });

/* ---------- 동작 ---------- */
const touch = () => { dirty = true; };
const A = {
  back: () => onBack(),
  go: d => go(d.v, d.id ? { id: d.id } : {}),
  tab: d => tab(d.v),
  mode: d => { settings.mode = d.v; saveSettings(); render(); toast(d.v === 'en' ? '해외용: 영어 프롬프트, 서양권 인물' : '국내용: 한국어 프롬프트, 한국 인물'); },
  make: () => sheet('새 대본 만들기', [['주제에서 고르기', `완성 대본 ${DRAMA_COUNT.toLocaleString()}편에서 찾기`, () => go('browse')], ['AI로 새 대본 쓰기', '아이디어 한 줄로 6샷 대본 만들기', () => go('aiNew')], ['빈 대본으로 시작', '처음부터 직접 쓰기', () => A.blankNew()], ['히트작 벤치마킹', '세계 히트작의 공식으로 쓴 대본', () => tab('hits')]]),
  quick: () => go('browse', { q: $('#quick').value.trim() }),
  reshuffle: () => { cur().p.seed = (cur().p.seed || 0) + 1; render(); },
  qclear: () => { cur().p.q = ''; render(); },
  openDrama: d => openDrama(d.th, +d.i),
  open: d => { if (sel) { sel.has(d.id) ? sel.delete(d.id) : sel.add(d.id); return render(); } openProject(d.id); },
  openHit: d => { const h = allHits().find(x => x.id === d.id); if (!h) return; draft = toProject(h.script, TH[h.theme] ? h.theme : 'hidden', 'hit:' + h.id); draft.memo = h.src && h.src.title ? `벤치마킹 참고: ${h.src.title}${h.formula ? '\n공식: ' + h.formula : ''}` : ''; dirty = true; go('editor'); },
  myTheme: d => { const a = settings.myThemes, on = a.includes(d.id); if (on) a.splice(a.indexOf(d.id), 1); else a.push(d.id); saveSettings(); render(); toast(on ? '내 주제에서 뺐습니다' : '내 주제로 고정했습니다'); },
  set: d => {
    const k = d.k, v = /^-?\d+$/.test(d.v) ? +d.v : d.v;
    if (k === 'mode') return A.mode({ v });
    if (k === 'theme' || k === 'style') { settings[k] = v; saveSettings(); }
    else if (k === 'p_burn' && draft) { finOf(draft).burn = !!v; dirty = true; }
    else if (k === 'p_fsize' && draft) { finOf(draft).size = +v; dirty = true; }
    else if (k === 'p_fpos' && draft) { finOf(draft).pos = parseFloat(d.v); dirty = true; }
    else if (k.startsWith('p_')) cur().p[k.slice(2)] = v;
    render(k === 'p_tab');
  },
  aiNewGo: () => { if (!aiKeys().length) return go('settings'); const p = cur().p; aiNew(p.th || 'hidden', (p.idea || '').trim()); },
  blankNew: () => { draft = blankProject((cur().p && cur().p.th) || 'hidden'); dirty = true; go('editor', {}, cur().v === 'aiNew'); },
  save: () => { saveDraft(); render(); },
  copy: d => copyText(d.t),
  settings: () => go('settings'),
  privacy: () => go('privacy'),
  exportOne: () => exportFlow([draft], T(draft)),
  exportPack: () => outSheet('제작 팩', toPack(draft, MODE()), fileName(T(draft), 'txt')),
  pstyle: d => { draft.style = d.v; touch(); render(); },
  genChar: d => { const key = `${d.i}:${d.kind}`, o = cur().p.cp = cur().p.cp || {}; o[key] = 1; render(); Native.share(`${cname(draft.chars[+d.i])} · ${KIND_NAME[d.kind]} 이미지 프롬프트`, promptText(draft, `c:${d.i}:${d.kind}`)); },
  shareAllChars: () => Native.share('인물 전신 이미지 프롬프트', draft.chars.map((c, i) => `[${cname(c)}]\n${promptText(draft, `c:${i}:full`)}`).join('\n\n')),
  attachImg: d => { pendingImg = d; $('#imgFile').click(); },
  rmImg: d => { const c = charTarget(d.ctx, d.ref); if (!c) return; c[d.kind === 'full' ? 'imgFull' : 'imgFace'] = ''; if (d.ctx === 'd') touch(); else { c.updated = Date.now(); saveCharLib(); } render(); toast('사진을 뺐습니다'); },
  viewImg: d => imgGet(d.id).then(v => {
    if (!v) return toast('사진을 찾을 수 없습니다');
    layerActs = { i0: () => Native.shareImage(`${d.n}.jpg`, v), i1: () => Native.saveImage(`${d.n}.jpg`, v) };
    layer(`<div class="imgview"><img src="${v}" alt="${esc(d.n)}"><div class="acts"><button class="btn" data-lact="x">${ic('x')}닫기</button><button class="btn" data-lact="i1">${ic('download')}저장</button><button class="btn pri" data-lact="i0">${ic('share')}내보내기</button></div></div>`, true);
  }),
  saveChar: d => {
    const c = draft.chars[+d.i], ex = c.libId && charLib.find(x => x.id === c.libId), now = Date.now();
    if (ex) Object.assign(ex, charFields(c), { updated: now }); else { const lc = Object.assign({ id: 'ch_' + uid(), created: now, updated: now }, charFields(c)); charLib.unshift(lc); c.libId = lc.id; touch(); }
    saveCharLib(); render(); toast(ex ? '내 캐릭터를 업데이트했습니다' : '내 캐릭터에 저장했습니다');
  },
  loadChar: () => {
    if (!charLib.length) return dialog('저장한 캐릭터가 없습니다', '인물 카드의 "내 캐릭터에 저장"을 누르면 다음부터 여기서 불러올 수 있습니다.', [['닫기', null]]);
    sheet('불러올 캐릭터', charLib.map(lc => [`${cname(lc)} · ${ROLE_NAME[lc.r] || '인물'}${lc.imgFull || lc.imgFace ? ' · 사진 있음' : ''}`, clook(lc) || lc.dk, () =>
      sheet(`${cname(lc)}${josa(cname(lc), '을')} 어디에 넣을까요?`, [...draft.chars.map((c, i) => [`${cname(c)} 자리에 넣기`, `${ROLE_NAME[c.r]} · 대본 속 이름도 바뀝니다`, () => putLibChar(i, lc)]),
        ...(draft.chars.length < 4 ? [['새 인물로 추가', '', () => putLibChar(draft.chars.length, lc)]] : [])])]));
  },
  newLibChar: () => { const now = Date.now(), lc = { id: 'ch_' + uid(), r: 'H', nk: '새 캐릭터', ne: 'New Character', dk: '', de: '', imgFull: '', imgFace: '', created: now, updated: now }; charLib.unshift(lc); saveCharLib(); go('char', { id: lc.id }); },
  delLibChar: d => dialog('이 캐릭터를 삭제할까요?', '대본에 이미 넣은 인물은 그대로 남습니다.', [['취소', null], ['삭제', () => { charLib = charLib.filter(c => c.id !== d.id); saveCharLib(); pop(); toast('삭제했습니다'); }, 'pri']]),
  shareLibPrompt: d => { const c = charLib.find(x => x.id === d.id); if (c) Native.share(`${cname(c)} · ${KIND_NAME[d.kind]} 이미지 프롬프트`, charPrompt(libProj(c), 0, MODE(), d.kind)); },
  copyP: d => copyText(promptText(draft, d.k), '프롬프트를 복사했습니다'),
  shareP: d => Native.share(d.t || '프롬프트', promptText(draft, d.k)),
  resetP: d => { delete draft.over[d.k + ':' + MODE()]; touch(); render(); },
  addChar: () => { if (draft.chars.length >= 4) return toast('인물은 4명까지입니다'); draft.chars.push({ r: 'X', nk: '새 인물', ne: 'New Character', dk: '', de: '' }); touch(); render(); },
  delChar: d => { const i = +d.i; if (draft.chars.length <= 2) return toast('인물은 최소 2명입니다'); dialog('이 인물을 삭제할까요?', cname(draft.chars[i]), [['취소', null], ['삭제', () => { draft.chars.splice(i, 1); draft.shots.forEach(s => { if (s.sp === i) { s.sp = -1; s.dk = s.de = ''; } else if (s.sp > i) s.sp--; }); draft.over = {}; touch(); render(); }, 'pri']]); },
  addShot: () => { if (draft.shots.length >= 10) return toast('샷은 10개까지입니다'); draft.shots.splice(Math.max(1, draft.shots.length - 1), 0, { pk: '', pe: '', ak: '', ae: '', sp: -1, dk: '', de: '', cam: 'ms', sec: 5 }); draft.over = {}; touch(); render(); },
  shotMenu: (d, el) => { const i = +el.closest('.beat').dataset.i, s = draft.shots[i], mv = n => { draft.shots.splice(i + n, 0, draft.shots.splice(i, 1)[0]); draft.over = {}; touch(); render(); };
    sheet(`샷 ${i + 1} · ${beatOf(draft, i)[0]}`, [['AI로 이 샷 다시 쓰기', aiKeys().length ? '3가지 안 중에서 고르기' : '설정에서 Gemini API 키를 넣어야 합니다', () => aiShot(i)],
      [`길이 ${s.sec === 10 ? '5초로' : '10초로'} 바꾸기`, `지금 ${s.sec || 5}초`, () => { s.sec = s.sec === 10 ? 5 : 10; touch(); render(); }],
      ['위로 옮기기', '', () => { if (i > 0) mv(-1); }], ['아래로 옮기기', '', () => { if (i < draft.shots.length - 1) mv(1); }],
      ['이 샷 삭제', '', () => { if (draft.shots.length <= 3) return toast('샷은 최소 3개입니다'); draft.shots.splice(i, 1); draft.over = {}; touch(); render(); }]]); },
  aiAll: () => aiRewriteAll(),
  aiSync: () => aiSync(),
  aiSubs: d => aiSubs(d.v),
  aiUndo: () => { if (!draft._undo) return; applyScript(draft, JSON.parse(draft._undo)); delete draft._undo; draft.ai = false; touch(); render(); toast('AI 전으로 되돌렸습니다'); },
  aiTest: () => aiTest(),
  aiPick: d => { settings.aiModel = d.v; saveSettings(); render(); toast(`모델을 ${d.v}로 바꿨습니다`); },
  aiClear: () => dialog('API 키를 모두 지울까요?', '이 기기에 저장된 키만 지워집니다.', [['취소', null], ['지우기', () => { settings.aiKeys = ''; settings.aiCheck = []; saveSettings(); render(); toast('키를 지웠습니다'); }, 'pri']]),
  subOut: d => outSheet('자막 파일', toSrt(draft, d.v), fileName(T(draft) + '_' + d.v, 'srt'), 'application/x-subrip'),
  hitsFetch: () => fetchHits(),
  oneClick: () => oneClick(),
  goFinish: () => { cur().p.tab = 'finish'; render(true); },
  findClips: () => { if (needPhone()) return; if (!window.AndroidBridge.hasMediaPerm()) return dialog('동영상 접근을 허용해 주세요', '내려받은 영상을 찾으려면 접근 권한이 필요합니다.', [['취소', null], ['허용하기', () => window.AndroidBridge.requestMediaPerm(), 'pri']]); const pl = store.get('pipeline', null); const n = findClips(draft, pl && pl.pid === draft.id ? pl.since : Date.now() - 30 * 60e3, draft.shots.length, false); if (n) toast(`영상 ${n}개를 가져왔습니다`); },
  pickClips: () => { if (!needPhone()) window.AndroidBridge.pickVideos(); },
  clipMove: d => { const a = finOf(draft).clips, i = +d.i; if (i > 0) { a.splice(i - 1, 0, a.splice(i, 1)[0]); dirty = true; render(); } },
  clipDel: d => { finOf(draft).clips.splice(+d.i, 1); dirty = true; render(); },
  finSet: d => { finOf(draft)[d.k] = d.v; dirty = true; render(); },
  assemble: () => startAssemble(draft, false),
  asmCancel: () => window.AndroidBridge.cancelAssemble(),
  openOut: () => window.AndroidBridge.openVideo(finOf(draft).out),
  uploadOut: () => { if (!needPhone()) uploadOut(draft); },
  upWay: d => { settings.upWay = d.v; saveSettings(); render(); },
  upPlat: d => { const v = upPlats(), on = v.includes(d.v); settings.upPlats = on ? v.filter(x => x !== d.v) : v.concat(d.v); if (!settings.upPlats.length) settings.upPlats = [d.v]; saveSettings(); render(); },
  pickleUp: () => pickleUpload(draft, false),
  pickleCopy: () => copyText(pickleText(draft)),
  klingSend: () => klingSend(),
  openAcc: () => { if (Native.has()) window.AndroidBridge.openAccessibility(); else toast('휴대폰 앱에서만 됩니다'); },
  openAppInfo: () => { if (Native.has()) window.AndroidBridge.openAppInfo(); else toast('휴대폰 앱에서만 됩니다'); },
  flowFetch: () => fetchFlow(),
  inspect: d => { const info = kInfo(); if (!Native.has() || !info || !info.on) return klingNeedSetup(info); window.AndroidBridge.clearKlingDumps(); seenDumps = 0; const t = ['grok', 'pickle'].includes(d.t) ? d.t : 'kling'; const r = window.AndroidBridge.startAutoInspect(t, (t === 'grok' ? grokFlow() : t === 'pickle' ? pickleFlow() : flowNow()).package || ''); if (r !== 'ok') toast(r); },
  grokMake: d => grokMake(d.ctx, d.ref, d.kind),
  mediaPerm: () => window.AndroidBridge.requestMediaPerm(),
  dumpOut: () => { const d = klingDumps(); if (!d.length) return toast('기록한 화면이 없습니다'); Native.save(`kling_screens_${dateStr().replace(/\./g, '')}.json`, 'application/json', JSON.stringify({ app: 'short-drama-maker', flow: flowNow().version, screens: d })); },
  hitsOut: () => outSheet('벤치마킹 목록', JSON.stringify({ version: 1, updated: dateStr().replace(/\./g, '-'), items: allHits() }, null, 2), 'hits.json', 'application/json'),
  rpOut: () => outSheet('조사 지시 프롬프트', researchPrompt(cur().p.n || 10, cur().p.pf || ''), fileName('조사지시프롬프트', 'txt')),
  lth: d => { const p = cur().p; p.th = d.v || ''; p.fav = false; render(true); },
  lfav: () => { const p = cur().p; p.fav = !p.fav; p.th = ''; render(true); },
  fav: d => { const p = projects.find(x => x.id === d.id); if (!p) return; p.fav = !p.fav; saveProjects(); render(); toast(p.fav ? '즐겨찾기에 넣었습니다' : '즐겨찾기에서 뺐습니다'); },
  rowMenu: d => { const p = projects.find(x => x.id === d.id); if (!p) return;
    sheet(T(p), [['열기', '작업 화면으로', () => openProject(p.id)], [p.fav ? '즐겨찾기 해제' : '즐겨찾기', '', () => A.fav(d)],
      ['복제', '같은 내용으로 새 작업 만들기 (다음 화용)', () => { const c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.ep = (p.ep || 1) + 1; c.created = c.updated = Date.now(); projects.unshift(c); saveProjects(); render(); toast('복제했습니다'); }],
      ['내보내기', '제작 팩, 대본, 자막, 백업', () => exportFlow([p], T(p))],
      ['삭제', '되돌릴 수 없습니다', () => dialog('이 작업을 삭제할까요?', T(p), [['취소', null], ['삭제', () => { projects = projects.filter(x => x.id !== p.id); saveProjects(); render(); toast('삭제했습니다'); }, 'pri']])]]); },
  selStart: () => { sel = new Set(); render(); },
  selAll: () => { const all = $$('#view [data-act="open"]').map(e => e.dataset.id); sel = new Set(sel.size === all.length ? [] : all); render(); },
  selDelete: () => { if (!sel.size) return toast('작업을 선택하세요'); dialog(`작업 ${sel.size}편을 삭제할까요?`, '삭제한 작업은 되돌릴 수 없습니다.', [['취소', null], ['삭제', () => { projects = projects.filter(p => !sel.has(p.id)); saveProjects(); sel = null; render(); toast('삭제했습니다'); }, 'pri']]); },
  selExport: () => { if (!sel.size) return toast('작업을 선택하세요'); exportFlow(projects.filter(p => sel.has(p.id)), `선택 ${sel.size}편`); },
  exportShown: () => { const ids = $$('#view [data-act="open"]').map(e => e.dataset.id); exportFlow(projects.filter(p => ids.includes(p.id)), '보관함'); },
  check: d => { const i = +d.i, a = settings.checks; a.includes(i) ? a.splice(a.indexOf(i), 1) : a.push(i); saveSettings(); render(); },
  checkReset: () => { settings.checks = []; saveSettings(); render(); },
  backup: () => exportFlow(projects, '전체'),
  restore: () => $('#importFile').click()
};
let pressT, pressFired = false;
document.addEventListener('click', e => {
  if (e.target.closest('#layer')) return;
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (pressFired) { pressFired = false; return; }
  if (el.tagName !== 'BUTTON' && e.target.closest('input,textarea,select')) return;
  const fn = A[el.dataset.act]; if (fn) fn(el.dataset, el);
});
function onField(e) {
  const t = e.target, d = t.dataset, isSel = t.tagName === 'SELECT';
  const grow = () => { if (t.classList.contains('ag')) autoGrow(t); };
  if (d.pf) { draft[d.pf] = d.pf === 'ep' ? Math.max(1, parseInt(t.value) || 1) : t.value; touch(); grow(); if (d.pf === 'ep' && e.type === 'change') render(); }
  else if (d.sf) { const [i, f] = d.sf.split(':'), s = draft.shots[+i]; s[f] = f === 'sp' ? +t.value : t.value; if (f === 'sp' && s.sp < 0) s.dk = s.de = ''; ['f', 'k'].forEach(x => ['kr', 'en'].forEach(m => delete draft.over[`${x}:${i}:${m}`])); touch(); grow(); if (isSel) render(); }
  else if (d.lc) { const [id, f] = d.lc.split(':'), c = charLib.find(x => x.id === id); if (c) { c[f] = t.value; c.updated = Date.now(); saveCharLib(); } grow(); if (isSel) render(); }
  else if (d.cf) { const [i, f] = d.cf.split(':'); draft.chars[+i][f] = t.value; touch(); grow(); if (isSel) render(); }
  else if (d.ov) { draft.over[d.ov + ':' + MODE()] = t.value; touch(); grow(); }
  else if (d.set) { settings[d.set] = t.value; store.set('settings', settings); }
  else if (d.p) cur().p[d.p] = t.value;
  else if (d.q) { cur().p.q = t.value; clearTimeout(t._t); const id = t.id; t._t = setTimeout(() => { render(); const n = $('#' + id); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 350); }
}
document.addEventListener('input', onField);
document.addEventListener('change', e => { if (e.target.dataset.pf === 'ep') onField(e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'quick') A.quick();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape') onBack();
});
document.addEventListener('pointerdown', e => {
  pressFired = false;
  const row = e.target.closest('[data-act="open"]'); if (!row || cur().v !== 'library' || sel) return;
  pressT = setTimeout(() => { pressFired = true; sel = new Set([row.dataset.id]); render(); if (navigator.vibrate) navigator.vibrate(15); }, 480);
});
['pointerup', 'pointercancel', 'pointermove'].forEach(n => document.addEventListener(n, e => { if (n !== 'pointermove' || Math.abs(e.movementY) > 3) clearTimeout(pressT); }));

/* ---------- 시작 ---------- */
applyTheme();
render(true);
setTimeout(gcImages, 3000);
