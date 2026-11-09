'use strict';
/* Pete's Notes: offline-first notes app with Supabase sync */

const SUPABASE_URL = 'https://ehvtvpfhcfwfukllixtu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ovVh5sgipXnyND4F0puuRQ_VrwHinip';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'petesnotes-auth' } });

/* ================= icons ================= */
const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  all: sv('<rect x="4" y="3" width="16" height="18" rx="3.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  pin: sv('<path d="M9 4h6l-1 6 4 3v1H6v-1l4-3z"/><path d="M12 14v6"/>'),
  pinfill: sv('<path d="M9 4h6l-1 6 4 3v1H6v-1l4-3z" fill="currentColor"/><path d="M12 14v6"/>'),
  check: sv('<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.3"/>'),
  trash: sv('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
  compose: sv('<path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.5 3.5a2 2 0 0 1 3 3L12 15l-4 1 1-4z"/>'),
  side: sv('<rect x="3" y="4" width="18" height="16" rx="3.5"/><path d="M9 4v16"/>'),
  back: sv('<path d="M15 5l-7 7 7 7"/>', 'stroke-width="2.3"'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>', 'stroke-width="2.1"'),
  list: sv('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>'),
  table: sv('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M3.5 10h17M3.5 14.5h17M10 5v14"/>'),
  quote: sv('<path d="M5 6v12M9 8h10M9 12h10M9 16h6"/>'),
  cal: sv('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  clip: sv('<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5"/>'),
  lock: sv('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.1"'),
  chev: sv('<path d="M9 5l7 7-7 7"/>', 'stroke-width="2.4"'),
  sort: sv('<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M14 6h7M14 11h5M14 16h3"/>'),
  file: sv('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  camera: sv('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.6"/>'),
  spark: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
  globe: sv('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"/>'),
  close: sv('<path d="M6 6l12 12M18 6L6 18"/>', 'stroke-width="2.1"'),
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>'
};

/* ================= small helpers ================= */
const $ = id => document.getElementById(id);
const app = $('app'), side = $('side'), list = $('list'), editor = $('editor'), gate = $('gate');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uuid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();
const clamp01 = x => Math.max(0, Math.min(1, x));
const narrow = () => matchMedia('(max-width:720px)').matches;
const drawerMode = () => matchMedia('(max-width:1080px)').matches;
const safeName = s => String(s || 'file').replace(/[^\w.\-]+/g, '_').slice(-80);
const b64 = u8 => { let s = ''; u8.forEach(b => s += String.fromCharCode(b)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const ENT = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const stripHTML = h => String(h || '').replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, e => ENT[e] || ' ').replace(/\s+/g, ' ').trim();
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };

function when(t, long) {
  const d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - new Date(t).setHours(0, 0, 0, 0)) / 864e5);
  const time = d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  if (long) return d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + time;
  if (diff <= 0) return time;
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-IE', { weekday: 'long' });
  if (d.getFullYear() === today.getFullYear()) return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ================= local database (IndexedDB) ================= */
const idb = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('petes-notes', 1);
    r.onupgradeneeded = () => { const d = r.result; ['notebooks', 'notes', 'atts', 'meta', 'blobs'].forEach(s => d.objectStoreNames.contains(s) || d.createObjectStore(s)); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = async (s, mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction(s, mode); const req = fn(t.objectStore(s)); t.oncomplete = () => res(req && 'result' in req ? req.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
  return {
    get: (s, k) => run(s, 'readonly', st => st.get(k)),
    put: (s, k, v) => run(s, 'readwrite', st => st.put(v, k)),
    del: (s, k) => run(s, 'readwrite', st => st.delete(k)),
    clear: s => run(s, 'readwrite', st => st.clear()),
    all: s => run(s, 'readonly', st => st.getAll()),
    putMany: async (s, arr) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction(s, 'readwrite'); const st = t.objectStore(s); arr.forEach(v => st.put(v, v.id)); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  };
})();

const DB = { notebooks: new Map(), notes: new Map(), atts: new Map() };
let uid = null;
const persistQ = { notebooks: new Map(), notes: new Map(), atts: new Map() };
let persistTimer;
function persist(k, rec) { persistQ[k].set(rec.id, rec); clearTimeout(persistTimer); persistTimer = setTimeout(flushPersist, 300); }
async function flushPersist() {
  for (const k of Object.keys(persistQ)) {
    const recs = [...persistQ[k].values()]; persistQ[k].clear();
    if (recs.length) await idb.putMany(k, recs.map(r => { const c = { ...r }; delete c._plain; return c; })).catch(() => {});
  }
}
function markDirty(k, rec) { rec._dirty = 1; rec._v = (rec._v || 0) + 1; persist(k, rec); scheduleSync(); }
function edited(n) { n.updated_at = nowISO(); markDirty('notes', n); }

/* ================= locked notebook (encrypted on this device) ================= */
const VAULT = '__vault__';
let vaultKey = null, lockTimer = null;
const vaultRec = () => { for (const n of DB.notes.values()) if (n.source_id === VAULT && !n.deleted_at) return n; return null; };
async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function enc(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))); return 'v1:' + b64(iv) + ':' + b64(new Uint8Array(ct)); }
async function dec(key, s) { const [, iv, ct] = s.split(':'); const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct)); return JSON.parse(new TextDecoder().decode(pt)); }
async function encBlob(blob) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vaultKey, await blob.arrayBuffer()); return new Blob([iv, new Uint8Array(ct)], { type: 'application/octet-stream' }); }
async function decBlob(blob, mime) { const buf = new Uint8Array(await blob.arrayBuffer()); const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, vaultKey, buf.slice(12)); return new Blob([pt], { type: mime || 'application/octet-stream' }); }
async function createVault(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iter = 310000;
  const key = await deriveKey(pass, salt, iter);
  const check = await enc(key, { check: 'petes-notes' });
  const v = { id: uuid(), notebook_id: null, title: '', body: '', cipher: JSON.stringify({ salt: b64(salt), iter, check }), job: '', tags: [], pinned: false, source_url: '', source_id: VAULT, created_at: nowISO(), updated_at: nowISO(), deleted_at: null };
  DB.notes.set(v.id, v); markDirty('notes', v);
  vaultKey = key; armLock();
}
async function unlockVault(pass) {
  const v = vaultRec(); if (!v) return false;
  const p = JSON.parse(v.cipher);
  const key = await deriveKey(pass, unb64(p.salt), p.iter);
  try { await dec(key, p.check); } catch (_) { return false; }
  vaultKey = key; await decryptAll(); armLock(); return true;
}
async function decryptAll() {
  if (!vaultKey) return;
  for (const n of DB.notes.values()) if (isLocked(n) && !n._plain) { try { n._plain = await dec(vaultKey, n.cipher); } catch (_) { n._plain = { title: 'Could not unlock this note', body: '' }; } }
}
function lockVault() {
  vaultKey = null; clearTimeout(lockTimer);
  DB.notes.forEach(n => delete n._plain);
  for (const [id, url] of blobURLs) { const a = DB.atts.get(id); if (a && a.path.endsWith('.enc')) { URL.revokeObjectURL(url); blobURLs.delete(id); } }
  const cur = DB.notes.get(ui.current);
  if (cur && isLocked(cur)) { ui.current = null; renderEditor(); if (narrow()) goBack(); }
  renderAll();
}
function armLock() { clearTimeout(lockTimer); if (vaultKey) lockTimer = setTimeout(() => { lockVault(); toast('Locked notebook locked'); }, 10 * 60e3); }
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => vaultKey && armLock(), { passive: true }));
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else { if (vaultKey && Date.now() - hiddenAt > 3 * 60e3) lockVault(); sync(); }
});

const isLocked = n => !!n.cipher && n.source_id !== VAULT;
const nTitle = n => isLocked(n) ? (n._plain ? n._plain.title : 'Locked note') : n.title;
const nBody = n => isLocked(n) ? (n._plain ? n._plain.body : '') : n.body;
const nbLocked = id => { const b = DB.notebooks.get(id); return !!(b && b.locked); };

/* ================= sync with Supabase ================= */
const TABLES = [['notebooks', 'notebooks'], ['notes', 'notes'], ['attachments', 'atts']];
const FIELDS = {
  notebooks: ['id', 'parent_id', 'name', 'color', 'sort_by', 'locked', 'position', 'created_at', 'deleted_at'],
  notes: ['id', 'notebook_id', 'title', 'body', 'cipher', 'job', 'tags', 'pinned', 'source_url', 'source_id', 'created_at', 'updated_at', 'deleted_at'],
  attachments: ['id', 'note_id', 'filename', 'mime', 'size', 'path', 'source_id', 'created_at', 'deleted_at']
};
let syncing = false, syncAgain = false, syncTimer, meta = { pull: {}, lastSync: 0 };
const pick = (o, ks) => { const r = {}; ks.forEach(k => r[k] = o[k] === undefined ? null : o[k]); return r; };
function scheduleSync(ms = 2000) { clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms); }
let syncStatus = { state: 'idle', msg: '' };
function setSync(state, msg = '') { syncStatus = { state, msg }; const el = $('syncline'); if (el) el.outerHTML = syncHTML(); }
function syncHTML() {
  const s = syncStatus.state;
  const dirty = [...DB.notes.values()].filter(n => n._dirty).length;
  const txt = s === 'busy' ? 'Syncing…' : s === 'off' ? `Offline · ${dirty ? dirty + ' change' + (dirty > 1 ? 's' : '') + ' waiting' : 'everything saved here'}` : s === 'err' ? 'Sync problem · ' + esc(syncStatus.msg) : meta.lastSync ? 'Synced ' + when(meta.lastSync) : 'Not synced yet';
  return `<div class="sync ${s === 'busy' ? 'busy' : s === 'off' ? 'off' : s === 'err' ? 'err' : ''}" id="syncline"><i></i>${txt}</div>`;
}
async function uploadPending() {
  for (const a of DB.atts.values()) {
    if (!a._pendingUpload) continue;
    const blob = await idb.get('blobs', a.id).catch(() => null);
    if (!blob) { a._pendingUpload = 0; continue; }
    const { error } = await sb.storage.from('attachments').upload(a.path, blob, { upsert: true, contentType: a.mime || undefined });
    if (error) throw error;
    a._pendingUpload = 0; markDirty('atts', a);
  }
}
async function sync() {
  if (!uid) return;
  if (syncing) { syncAgain = true; return; }
  if (!navigator.onLine) { setSync('off'); return; }
  syncing = true; setSync('busy');
  let changed = false;
  try {
    await uploadPending();
    for (const [t, k] of TABLES) {
      const dirty = [...DB[k].values()].filter(r => r._dirty && !r._pendingUpload);
      for (let i = 0; i < dirty.length; i += 150) {
        const batch = dirty.slice(i, i + 150), vers = batch.map(r => r._v);
        const { data, error } = await sb.from(t).upsert(batch.map(r => pick(r, FIELDS[t]))).select('id,modified_at');
        if (error) throw error;
        const mod = new Map((data || []).map(d => [d.id, d.modified_at]));
        batch.forEach((r, j) => { if (mod.has(r.id)) r.modified_at = mod.get(r.id); if (r._v === vers[j]) r._dirty = 0; persist(k, r); });
      }
    }
    for (const [t, k] of TABLES) {
      const since = meta.pull[t] || '1970-01-01T00:00:00Z'; let max = since;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from(t).select('*').gte('modified_at', since).order('modified_at').order('id').range(from, from + 999);
        if (error) throw error;
        for (const row of data) {
          if (row.modified_at > max) max = row.modified_at;
          const loc = DB[k].get(row.id);
          if (loc && (loc._dirty || loc._pendingUpload)) continue;
          if (loc && loc.modified_at === row.modified_at) continue;
          const rec = { ...row };
          if (loc && loc._plain && loc.cipher === row.cipher) rec._plain = loc._plain;
          else if (vaultKey && isLocked(rec)) { try { rec._plain = await dec(vaultKey, rec.cipher); } catch (_) {} }
          DB[k].set(row.id, rec); persist(k, rec); changed = true;
        }
        if (data.length < 1000) break;
      }
      meta.pull[t] = max;
    }
    meta.lastSync = Date.now(); idb.put('meta', 'sync', meta).catch(() => {});
    setSync('idle');
  } catch (e) {
    console.error(e);
    const m = String(e.message || e);
    setSync(/fetch|network|Failed/i.test(m) ? 'off' : 'err', m.slice(0, 60));
    if (/JWT|token|auth/i.test(m)) { const { data } = await sb.auth.getSession(); if (!data.session) showSignIn('Please sign in again.'); }
  } finally {
    syncing = false;
    if (changed) remoteRefresh();
    if (syncAgain) { syncAgain = false; scheduleSync(500); }
  }
}
function remoteRefresh() {
  renderSide(); renderList();
  const n = DB.notes.get(ui.current);
  const editing = editor.contains(document.activeElement);
  if (!n || n.deleted_at) { if (ui.current && !editing) { ui.current = null; renderEditor(); } }
  else if (!editing && $('ttl') && (nTitle(n) !== $('ttl').textContent.trim() || nBody(n) !== serializeBody())) renderEditor(true);
}
setInterval(() => document.hidden || sync(), 45e3);
addEventListener('online', () => sync());
addEventListener('offline', () => setSync('off'));

/* ================= motion engine (springs) ================= */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
class Spring {
  constructor(v, apply, scale = 1) { this.v = v; this.vel = 0; this.target = v; this.apply = apply; this.scale = scale; this.raf = 0; apply(v); }
  set(v) { this.stop(); this.v = this.target = v; this.vel = 0; this.apply(v); }
  hold(v) { this.stop(); this.v = v; this.vel = 0; this.apply(v); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  to(target, { damping = 1, response = .38, velocity, done } = {}) {
    this.target = target; this.done = done;
    if (velocity !== undefined) this.vel = velocity;
    if (reduced.matches) { this.set(target); done && done(); return this; }
    this.k = Math.pow(2 * Math.PI / response, 2); this.c = 4 * Math.PI * damping / response;
    if (!this.raf) {
      let last = performance.now();
      const step = t => {
        const dt = Math.min(.05, (t - last) / 1000); last = t;
        const n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
        for (let i = 0; i < n; i++) { const a = -this.k * (this.v - this.target) - this.c * this.vel; this.vel += a * h; this.v += this.vel * h; }
        if (Math.abs(this.vel) < .02 * this.scale && Math.abs(this.v - this.target) < .002 * this.scale) {
          this.v = this.target; this.vel = 0; this.apply(this.v); this.raf = 0;
          const d = this.done; this.done = null; d && d(); return;
        }
        this.apply(this.v); this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    return this;
  }
}
const project = (v, d = .998) => (v / 1000) * d / (1 - d);
const rubber = (x, dim, c = .55) => (x * dim * c) / (dim + c * Math.abs(x));
let suppressClick = false;
function track(e, el, axis, h) {
  const sx = e.clientX, sy = e.clientY, id = e.pointerId; let on = false; const hist = [];
  const mv = ev => {
    if (ev.pointerId !== id) return;
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!on) {
      if (Math.hypot(dx, dy) < 8) return;
      const horiz = Math.abs(dx) > Math.abs(dy);
      if ((axis === 'x') !== horiz || (h.allow && !h.allow(dx, dy))) { cleanup(); h.abort && h.abort(); return; }
      on = true; suppressClick = true; try { el.setPointerCapture(id); } catch (_) {}
      h.start && h.start();
    }
    const d = axis === 'x' ? dx : dy;
    hist.push([ev.timeStamp, d]); while (hist.length > 2 && ev.timeStamp - hist[0][0] > 100) hist.shift();
    h.move(d); ev.preventDefault();
  };
  const up = ev => {
    if (ev.pointerId !== id) return; cleanup();
    if (!on) { h.abort && h.abort(); return; }
    let v = 0; if (hist.length > 1) { const a = hist[0], b = hist[hist.length - 1]; if (b[0] > a[0]) v = (b[1] - a[1]) / (b[0] - a[0]) * 1000; }
    h.end(hist.length ? hist[hist.length - 1][1] : 0, v);
  };
  const cleanup = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
}

/* ================= theme ================= */
const THEMES = ['light', 'dark', 'system'];
let theme = store.get('petesnotes-theme', 'system');
const root = document.documentElement;
function applyTheme() {
  if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name=theme-color]').forEach(m => { m.content = dark ? '#06070b' : '#eceef5'; m.removeAttribute('media'); });
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ================= view state ================= */
const ui = { filter: 'all', tag: null, q: '', current: null, pane: 'list', drawer: false, limit: 150 };
let collapsed = new Set(store.get('petesnotes-collapsed', []));
const visibleNote = n => !n.deleted_at && n.source_id !== VAULT;
const childrenOf = id => [...DB.notebooks.values()].filter(b => !b.deleted_at && (b.parent_id || null) === id).sort((a, b) => (a.position - b.position) || a.name.localeCompare(b.name));
const nbIdsUnder = id => { const out = [id]; childrenOf(id).forEach(c => out.push(...nbIdsUnder(c.id))); return out; };
const book = id => DB.notebooks.get(id) || { name: 'No notebook', color: '#8e8e93' };
const openTasks = n => { const b = nBody(n); return b.includes('class="check"') && /<li(?![^>]*done)/.test(b); };
const plainCache = new Map();
function plain(n) { const key = n.updated_at + (n._plain ? '1' : '0'); const c = plainCache.get(n.id); if (c && c.k === key) return c.t; const t = stripHTML(nBody(n)); plainCache.set(n.id, { k: key, t }); return t; }

function sortKey() {
  if (DB.notebooks.has(ui.filter)) return DB.notebooks.get(ui.filter).sort_by || 'edited';
  return store.get('petesnotes-sort-' + ui.filter, 'edited');
}
function visible() {
  let ns = [...DB.notes.values()].filter(n => n.source_id !== VAULT);
  if (ui.filter === 'trash') ns = ns.filter(n => n.deleted_at);
  else {
    ns = ns.filter(n => !n.deleted_at);
    if (!vaultKey) ns = ns.filter(n => !isLocked(n) || DB.notebooks.has(ui.filter));
    if (ui.filter === 'pinned') ns = ns.filter(n => n.pinned);
    else if (ui.filter === 'todo') ns = ns.filter(openTasks);
    else if (DB.notebooks.has(ui.filter)) { const ids = new Set(nbIdsUnder(ui.filter)); ns = ns.filter(n => ids.has(n.notebook_id)); }
  }
  if (ui.tag) ns = ns.filter(n => (n.tags || []).includes(ui.tag));
  if (ui.q) { const q = ui.q.toLowerCase(); ns = ns.filter(n => (nTitle(n) + ' ' + (n.tags || []).join(' ') + ' ' + (n.job || '') + ' ' + plain(n)).toLowerCase().includes(q)); }
  const sk = sortKey();
  const cmp = sk === 'title' ? (a, b) => nTitle(a).localeCompare(nTitle(b)) : sk === 'created' ? (a, b) => b.created_at.localeCompare(a.created_at) : (a, b) => b.updated_at.localeCompare(a.updated_at);
  return ns.sort((a, b) => (ui.filter !== 'trash' && (b.pinned - a.pinned)) || cmp(a, b));
}
const filterName = () => ({ all: 'All Notes', pinned: 'Pinned', todo: 'Open Tasks', trash: 'Recently Deleted' }[ui.filter] || book(ui.filter).name);

/* ================= sidebar ================= */
let thumbS, pillS, pillPlaced = false;
function buildSide() {
  side.innerHTML = `
    <div class="scroll" id="sscroll"><div class="large">Pete's Notes</div><div id="sideMain"></div></div>
    <div class="sidefoot">
      <h3>Appearance</h3>
      <div class="seg" role="radiogroup" aria-label="Theme"><span class="thumb" id="thumb"></span>
        ${THEMES.map(m => `<button role="radio" data-theme-set="${m}" aria-checked="${theme === m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
      <div id="syncwrap">${syncHTML()}</div>
      <div class="row2"><button class="glass press" id="importBtn">Import</button><button class="glass press" id="clipBtn">Clipper</button><button class="glass press" id="signOutBtn">Sign out</button></div>
    </div>`;
  thumbS = new Spring(THEMES.indexOf(theme), i => $('thumb').style.transform = `translateX(${i * 100}%)`, 1);
  pillS = new Spring(0, y => { const p = $('pill'); if (p) p.style.transform = `translate3d(0,${y}px,0)`; }, 100);
}
function renderSide() {
  if (!$('sideMain')) return;
  const live = [...DB.notes.values()].filter(visibleNote);
  const shown = vaultKey ? live : live.filter(n => !isLocked(n));
  const countNb = id => { const ids = new Set(nbIdsUnder(id)); return live.filter(n => ids.has(n.notebook_id)).length; };
  const c = f => f === 'all' ? shown.length : f === 'pinned' ? shown.filter(n => n.pinned).length : f === 'todo' ? shown.filter(openTasks).length : f === 'trash' ? [...DB.notes.values()].filter(n => n.deleted_at && n.source_id !== VAULT).length : countNb(f);
  const cell = (f, glyph, name, extra = '', cls = '') => `<button class="cell ${cls} ${ui.filter === f ? 'on' : ''}" data-f="${f}">${extra}<span class="glyph">${glyph}</span><span class="name">${esc(name)}</span><span class="count">${c(f)}</span></button>`;
  const nbCells = (parent, depth) => childrenOf(parent).map(b => {
    const kids = childrenOf(b.id), open = !collapsed.has(b.id);
    const chev = kids.length ? `<span class="chev ${open ? 'open' : ''}" data-toggle="${b.id}">${I.chev}</span>` : '';
    const glyph = `<i class="dot" style="background:${esc(b.color)}"></i>`;
    const lockI = b.locked ? `<span class="lock">${vaultKey ? '' : I.lock}</span>` : '';
    return cell(b.id, glyph, b.name, chev, depth ? 'child' : '').replace('<span class="count">', lockI + '<span class="count">') + (kids.length && open ? nbCells(b.id, depth + 1) : '');
  }).join('');
  const tags = [...new Set(shown.flatMap(n => n.tags || []))].sort();
  $('sideMain').innerHTML = `<span class="selpill" id="pill"></span>
    <div class="group">${cell('all', I.all, 'All Notes')}${cell('pinned', I.pin, 'Pinned')}${cell('todo', I.check, 'Open Tasks')}</div>
    <div class="group"><div class="grouphead"><h3>Notebooks</h3><button class="mini press" id="newNb" aria-label="New notebook">${I.plus}</button></div>${nbCells(null, 0)}</div>
    ${tags.length ? `<div class="group"><h3>Tags</h3><div class="tagcloud">${tags.map(t => `<button class="chip glass press ${ui.tag === t ? 'on' : ''}" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>` : ''}
    <div class="group">${cell('trash', I.trash, 'Recently Deleted')}</div>`;
  const on = $('sideMain').querySelector('.cell.on');
  const pill = $('pill');
  if (on) {
    const y = on.getBoundingClientRect().top - $('sideMain').getBoundingClientRect().top;
    pill.hidden = false; pillS.apply(pillS.v);
    if (!pillPlaced || side.offsetParent === null) { pillS.set(y); pillPlaced = true; } else pillS.to(y, { damping: .86, response: .36 });
  } else pill.hidden = true;
  const sw = $('syncwrap'); if (sw) sw.innerHTML = syncHTML();
}

/* ================= note list ================= */
const rowSprings = new Map();
let openRow = null;
const ACTW = 156;
function buildList() {
  list.innerHTML = `
    <div class="bar"><div class="edge"></div>
      <button class="gbtn glass press showside" id="openSide" aria-label="Show notebooks">${I.side}</button>
      <div class="inline" id="linline"></div><span></span>
      <div class="listtools"><button class="gbtn glass press" id="askBtn" aria-label="Ask your notes">${I.spark}</button><button class="gbtn glass press" id="sortBtn" aria-label="Sort and options">${I.more}</button>
      <button class="gbtn glass tint press" id="newNote" aria-label="New note">${I.compose}</button></div>
    </div>
    <div class="scroll" id="lscroll">
      <div class="large" id="ltitle"></div>
      <label class="search glass">${I.search}<input id="q" type="search" placeholder="Search notes, tags, job numbers" autocomplete="off"></label>
      <div id="rows"></div>
    </div>`;
}
function rowHTML(n) {
  const b = book(n.notebook_id), locked = isLocked(n);
  const preview = locked && !n._plain ? '' : (plain(n).slice(0, 140) || 'No additional text');
  return `<div class="rowwrap ${ui.current === n.id && !narrow() ? 'on' : ''}" data-id="${n.id}">
    <div class="ract">${ui.filter === 'trash'
      ? `<button class="act a-pin" data-act="restore">${I.back}Restore</button>`
      : `<button class="act a-pin" data-act="pin">${n.pinned ? I.pin : I.pinfill}${n.pinned ? 'Unpin' : 'Pin'}</button>`}<button class="act a-del" data-act="del">${I.trash}Delete</button></div>
    <div class="row" role="button" tabindex="0">
      <div class="t">${esc(nTitle(n) || 'New Note')}</div>
      <div class="m"><time>${when(sortKey() === 'created' ? n.created_at : n.updated_at)}</time><span>${locked && !n._plain ? `<span class="lockedbadge">${I.lock} Locked</span>` : esc(preview)}</span></div>
      <div class="f"><span class="nb"><i style="background:${esc(b.color)}"></i>${esc(b.name)}</span>${n.job ? `<span class="job">${esc(n.job)}</span>` : ''}</div>
    </div></div>`;
}
function applyRow(id, x) {
  const w = list.querySelector(`.rowwrap[data-id="${id}"]`); if (!w) return;
  w.querySelector('.row').style.transform = Math.abs(x) > .1 ? `translate3d(${x}px,0,0)` : '';
  w.querySelector('.ract').style.width = Math.max(0, -x) + 'px';
}
const rowSpring = id => { if (!rowSprings.has(id)) rowSprings.set(id, new Spring(0, x => applyRow(id, x), 100)); return rowSprings.get(id); };
function closeRow(id) { if (!id) return; rowSpring(id).to(0, { damping: 1, response: .34 }); if (openRow === id) openRow = null; }

function lockPaneHTML() {
  const exists = !!vaultRec();
  return `<div class="lockpane"><div class="big">${I.lock}</div>
    <h2>${exists ? 'This notebook is locked' : 'Set a password for locked notes'}</h2>
    <p>${exists ? 'Enter your notes password to open it.' : 'Notes in this notebook are encrypted on your device before they sync. Nobody can recover this password if you forget it, so keep a copy somewhere safe.'}</p>
    <form id="vaultForm" autocomplete="off">
      <label class="field"><span>Password</span><input type="password" id="vp1" autocomplete="${exists ? 'current-password' : 'new-password'}" required minlength="${exists ? 1 : 8}"></label>
      ${exists ? '' : '<label class="field"><span>Confirm password</span><input type="password" id="vp2" autocomplete="new-password" required></label>'}
      <button class="primary press" type="submit">${exists ? 'Unlock' : 'Create password'}</button>
      <div class="msgline" id="vmsg"></div>
    </form></div>`;
}
function renderList({ enter = false } = {}) {
  if (!$('rows')) return;
  rowSprings.forEach(s => s.stop()); rowSprings.clear(); openRow = null;
  $('ltitle').innerHTML = esc(filterName()) + (ui.tag ? `<small>#${esc(ui.tag)}</small>` : '');
  $('linline').textContent = filterName();
  const rowsEl = $('rows'), sc = $('lscroll'), keep = sc.scrollTop;
  if (nbLocked(ui.filter) && !vaultKey) { rowsEl.innerHTML = lockPaneHTML(); return; }
  const before = {};
  rowsEl.querySelectorAll('.rowwrap').forEach(w => before[w.dataset.id] = w.getBoundingClientRect().top);
  const had = Object.keys(before).length > 0;
  const ns = visible(), total = ns.length, shownNs = ns.slice(0, ui.limit);
  const pinned = ui.filter === 'trash' ? [] : shownNs.filter(n => n.pinned), rest = shownNs.filter(n => ui.filter === 'trash' || !n.pinned);
  const empty = DB.notes.size === 0 || [...DB.notes.values()].every(n => n.source_id === VAULT)
    ? `<div class="empty"><b style="display:block;color:var(--fg);font-size:18px;margin-bottom:6px">Welcome to Pete's Notes</b>Bring your notes across from Joplin, or start writing.<br><br><button class="gbtn glass tint press" id="emptyImport" style="padding:0 18px">Import notes</button></div>`
    : `<div class="empty">${ui.q ? `No notes match “${esc(ui.q)}”.` : ui.filter === 'trash' ? 'Nothing deleted recently.' : 'No notes here yet.<br>Tap the pencil to write one.'}</div>`;
  rowsEl.innerHTML =
    (total === 0 ? empty : '') +
    (pinned.length ? `<div class="sectionlabel">${I.pinfill} Pinned</div>${pinned.map(rowHTML).join('')}` : '') +
    (rest.length ? `${pinned.length ? '<div class="sectionlabel">Notes</div>' : ''}${rest.map(rowHTML).join('')}` : '') +
    (total > ui.limit ? `<button class="more-rows press" id="moreRows">Show more (${total - ui.limit} left)</button>` : '') +
    (total ? `<div class="listfoot">${total} note${total > 1 ? 's' : ''}</div>` : '');
  sc.scrollTop = keep;
  const wraps = rowsEl.querySelectorAll('.rowwrap');
  if (wraps.length > 220) return;
  let k = 0;
  wraps.forEach(w => {
    const id = w.dataset.id;
    if (!enter && id in before) {
      const dy = before[id] - w.getBoundingClientRect().top;
      if (Math.abs(dy) > 1 && Math.abs(dy) < 1500) new Spring(dy, y => w.style.transform = Math.abs(y) > .2 ? `translate3d(0,${y}px,0)` : '', 100).to(0, { damping: .88, response: .44 });
    } else if (enter || had) {
      const i = k++; if (i > 14) return;
      w.style.opacity = 0;
      const s = new Spring(0, p => { w.style.opacity = clamp01(p); w.style.transform = p < .999 ? `translate3d(0,${(1 - p) * 16}px,0) scale(${.97 + .03 * p})` : ''; }, 1);
      setTimeout(() => s.to(1, { damping: 1, response: .5 }), i * 24);
    }
  });
}

/* ================= editor ================= */
const navS = new Spring(0, applyNav, 1);
let docS = null, tbS = null;
function applyNav(p) {
  if (!narrow()) { editor.style.transform = list.style.transform = editor.style.visibility = ''; list.style.setProperty('--dim', 0); return; }
  const W = app.clientWidth;
  editor.style.transform = `translate3d(${(1 - p) * W}px,0,0)`;
  editor.style.visibility = p <= .0005 ? 'hidden' : '';
  list.style.transform = `translate3d(${-Math.max(0, p) * W * .28}px,0,0)`;
  list.style.setProperty('--dim', clamp01(p) * .16);
}
function propsHTML(n) {
  const b = book(n.notebook_id);
  return `<button class="prop press" id="nbBtn"><i style="background:${esc(b.color)}"></i>${esc(b.name)}${b.locked ? ' ' + I.lock.replace('<svg', '<svg width="12" height="12"') : ''}</button>
    <label class="prop" title="Job number">Job <input id="job" inputmode="numeric" maxlength="7" placeholder="0000000" value="${esc(n.job || '')}"></label>
    ${(n.tags || []).map(t => `<button class="prop tag press" data-rmtag="${esc(t)}" title="Remove tag">#${esc(t)} ×</button>`).join('')}
    <label class="prop tag">+ <input id="addtag" placeholder="add tag"></label>`;
}
const PURIFY = { ADD_ATTR: ['data-att', 'target'], FORBID_TAGS: ['style', 'form', 'iframe', 'object', 'embed'], FORBID_ATTR: ['style'] };
function renderEditor(quiet) {
  const n = DB.notes.get(ui.current);
  if (!n || (isLocked(n) && !n._plain)) { editor.innerHTML = `<div class="blank"><div><b>No note selected</b>Pick a note from the list, or start a new one.</div></div>`; return; }
  const trash = !!n.deleted_at;
  editor.innerHTML = `
    <div class="bar"><div class="edge"></div>
      <button class="gbtn glass press back" id="back">${I.back}<span>${esc(filterName())}</span></button>
      <div class="inline" id="einline">${esc(nTitle(n) || 'New Note')}</div><span></span>
      <div class="gcluster glass">${trash ? '' : `<button class="cbtn press ${n.pinned ? 'pinned' : ''}" id="pinBtn" aria-label="${n.pinned ? 'Unpin' : 'Pin'} note">${n.pinned ? I.pinfill : I.pin}</button>`}<button class="cbtn press" id="moreBtn" aria-label="More">${I.more}</button></div>
    </div>
    <div class="scroll" id="escroll">
      <div class="doc" id="doc">
        <div class="meta" id="meta">${trash ? 'Deleted · ' : ''}Edited ${when(n.updated_at, true)}<br>Created ${when(n.created_at, true)}</div>
        <div class="ttl" id="ttl" contenteditable="${!trash}" spellcheck="true">${esc(nTitle(n))}</div>
        <div class="props" id="props">${propsHTML(n)}</div>
        <div class="body" id="body" contenteditable="${!trash}" spellcheck="true">${DOMPurify.sanitize(nBody(n), PURIFY)}</div>
        ${n.source_url ? `<p style="margin-top:24px;font-size:13px;color:var(--muted)">Clipped from <a href="${esc(n.source_url)}" target="_blank" rel="noopener" style="color:var(--accent);word-break:break-all">${esc(n.source_url)}</a></p>` : ''}
      </div>
    </div>
    ${trash ? '' : `<div class="toolbar glass" id="tb" role="toolbar" aria-label="Formatting">
      <button data-cmd="h2" title="Heading">Aa</button>
      <button data-cmd="bold" title="Bold" style="font-weight:800">B</button>
      <button data-cmd="italic" title="Italic" style="font-style:italic;font-family:var(--serif)">I</button>
      <span class="sep"></span>
      <button data-cmd="check" title="Checklist">${I.check}</button>
      <button data-cmd="ul" title="Bulleted list">${I.list}</button>
      <button data-cmd="quote" title="Quote">${I.quote}</button>
      <button data-cmd="table" title="Table">${I.table}</button>
      <button data-cmd="date" title="Insert today's date">${I.cal}</button>
      <button data-cmd="scan" title="Scan a document">${I.camera}</button>
      <button data-cmd="attach" title="Attach a photo or file">${I.clip}</button>
    </div>`}`;
  resolveAtts($('body'));
  if (quiet) return;
  const doc = $('doc'), tb = $('tb');
  if (!narrow()) { docS && docS.stop(); docS = new Spring(0, p => { doc.style.opacity = clamp01(p); doc.style.transform = p < .999 ? `translate3d(0,${(1 - p) * 14}px,0)` : ''; }, 1).to(1, { damping: 1, response: .42 }); }
  if (tb) {
    tbS && tbS.stop();
    tbS = new Spring(0, p => { tb.style.opacity = clamp01(p); tb.style.transform = `translateX(-50%) translate3d(0,${(1 - p) * 26}px,0) scale(${.86 + .14 * p})`; }, 1);
    setTimeout(() => tbS.to(1, { damping: .78, response: .45 }), narrow() ? 140 : 60);
  }
}
function serializeBody() {
  const b = $('body'); if (!b) return '';
  const c = b.cloneNode(true);
  c.querySelectorAll('img[data-att]').forEach(i => i.removeAttribute('src'));
  c.querySelectorAll('a[data-att]').forEach(a => { a.setAttribute('href', '#'); a.removeAttribute('target'); a.removeAttribute('download'); });
  return c.innerHTML;
}

/* ---------- attachments ---------- */
const blobURLs = new Map();
async function attURL(a) {
  if (blobURLs.has(a.id)) return blobURLs.get(a.id);
  let blob = await idb.get('blobs', a.id).catch(() => null);
  if (!blob) {
    const { data, error } = await sb.storage.from('attachments').download(a.path);
    if (error) throw error;
    blob = data; idb.put('blobs', a.id, blob).catch(() => {});
  }
  if (a.path.endsWith('.enc')) { if (!vaultKey) throw new Error('locked'); blob = await decBlob(blob, a.mime); }
  const url = URL.createObjectURL(blob); blobURLs.set(a.id, url); return url;
}
function resolveAtts(container) {
  if (!container) return;
  container.querySelectorAll('[data-att]').forEach(async el => {
    const a = DB.atts.get(el.dataset.att);
    if (el.tagName === 'A') { el.innerHTML = I.file.replace('<svg', '<svg width="15" height="15"') + esc(a ? a.filename : el.textContent || 'Attachment'); el.contentEditable = 'false'; }
    if (!a) return;
    try {
      const url = await attURL(a);
      if (el.tagName === 'IMG') { el.src = url; el.alt = a.filename; }
      else { el.href = url; el.target = '_blank'; el.setAttribute('download', a.filename); }
    } catch (_) { if (el.tagName === 'IMG') el.alt = 'Image not available offline'; }
  });
}
async function attachFiles(files, { quiet = false, after = '' } = {}) {
  const n = DB.notes.get(ui.current); if (!n) return;
  for (const f of files) {
    const a = { id: uuid(), note_id: n.id, filename: f.name || 'photo.jpg', mime: f.type || 'application/octet-stream', size: f.size, path: '', source_id: null, created_at: nowISO(), deleted_at: null };
    a.path = `${uid}/${a.id}/${safeName(a.filename)}`;
    let data = f;
    if (isLocked(n) || nbLocked(n.notebook_id)) { if (!vaultKey) return toast('Unlock the locked notebook first'); data = await encBlob(f); a.path += '.enc'; }
    await idb.put('blobs', a.id, data);
    a._pendingUpload = 1; DB.atts.set(a.id, a); persist('atts', a);
    insertHTML(/^image\//.test(a.mime) ? `<img data-att="${a.id}">${after}<p><br></p>` : `<a data-att="${a.id}" href="#">${esc(a.filename)}</a>&nbsp;`);
  }
  resolveAtts($('body'));
  saveFromEditor(); scheduleSync(300);
  if (!quiet) toast(files.length > 1 ? files.length + ' files attached' : 'Attached');
}

/* ---------- saving ---------- */
let saveTimer;
function saveFromEditor() {
  const n = DB.notes.get(ui.current); if (!n || n.deleted_at) return;
  const title = ($('ttl') ? $('ttl').textContent : '').trim(), body = serializeBody();
  if (isLocked(n) || nbLocked(n.notebook_id)) {
    if (!vaultKey) return;
    n._plain = { title, body };
    n.updated_at = nowISO();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => { n.cipher = await enc(vaultKey, n._plain); n.title = ''; n.body = ''; markDirty('notes', n); }, 400);
  } else { n.title = title; n.body = body; edited(n); }
  const m = $('meta'); if (m) m.innerHTML = `Edited ${when(n.updated_at, true)}<br>Created ${when(n.created_at, true)}`;
  refreshListSoon();
}
async function moveNote(n, nbId) {
  const fromLocked = isLocked(n), toLocked = nbLocked(nbId);
  if ((fromLocked || toLocked) && !vaultKey) { toast('Unlock the locked notebook first'); return false; }
  if (toLocked && !fromLocked) { n._plain = { title: n.title, body: n.body }; n.cipher = await enc(vaultKey, n._plain); n.title = ''; n.body = ''; }
  if (fromLocked && !toLocked) { const p = n._plain || await dec(vaultKey, n.cipher); n.title = p.title; n.body = p.body; n.cipher = null; delete n._plain; }
  n.notebook_id = nbId; markDirty('notes', n); return true;
}

/* ================= drawer + navigation ================= */
const drawerS = new Spring(0, applyDrawer, 1);
function applyDrawer(p) {
  if (!drawerMode()) { side.style.transform = side.style.visibility = ''; app.style.setProperty('--drawer', 0); app.classList.remove('drawer-live'); return; }
  const W = side.offsetWidth + 24;
  side.style.transform = `translate3d(${(p - 1) * W}px,0,0)`;
  side.style.visibility = p <= .001 ? 'hidden' : 'visible';
  app.style.setProperty('--drawer', clamp01(p));
  app.classList.toggle('drawer-live', p > .01);
}
const openDrawer = () => { ui.drawer = true; renderSide(); drawerS.to(1, { damping: .86, response: .4 }); };
const closeDrawer = velocity => { ui.drawer = false; drawerS.to(0, { damping: 1, response: .34, velocity }); };
function open(id) {
  if (openRow) { closeRow(openRow); return; }
  ui.current = id; renderEditor(); renderList();
  if (narrow()) { ui.pane = 'editor'; navS.to(1, { damping: 1, response: .42 }); }
}
function goBack(velocity) {
  ui.pane = 'list'; if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  navS.to(0, { damping: 1, response: .4, velocity });
}
function newNote() {
  if (ui.filter === 'trash') setFilter('all', null);
  let nb = DB.notebooks.has(ui.filter) ? ui.filter : (store.get('petesnotes-defaultnb', null));
  if (!DB.notebooks.has(nb) || DB.notebooks.get(nb).deleted_at) nb = (childrenOf(null).find(b => !b.locked) || {}).id || null;
  if (nbLocked(nb) && !vaultKey) { toast('Unlock the locked notebook first'); return; }
  const n = { id: uuid(), notebook_id: nb, title: '', body: '', cipher: null, job: '', tags: ui.tag ? [ui.tag] : [], pinned: false, source_url: '', source_id: null, created_at: nowISO(), updated_at: nowISO(), deleted_at: null };
  if (nbLocked(nb)) n._plain = { title: '', body: '' };
  DB.notes.set(n.id, n); markDirty('notes', n);
  if (nbLocked(nb)) enc(vaultKey, n._plain).then(c => { n.cipher = c; markDirty('notes', n); });
  ui.q = ''; $('q').value = '';
  open(n.id); renderSide();
  setTimeout(() => $('ttl') && $('ttl').focus(), narrow() ? 380 : 40);
}
function setFilter(f, tag) {
  ui.filter = f; ui.tag = tag; ui.limit = 150;
  renderSide(); renderList({ enter: true });
  if (drawerMode() && ui.drawer) setTimeout(() => closeDrawer(), 120);
  if (narrow() && ui.pane === 'editor') goBack();
  $('lscroll').scrollTop = 0;
}
const renderAll = () => { renderSide(); renderList(); };

/* ================= layers: sheets, menus, dialogs, toasts ================= */
const layers = [];
function menu(anchor, title, actions) { return narrow() || !anchor ? sheet(title, actions) : popover(anchor, title, actions); }
function sheet(title, actions) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const wrap = document.createElement('div'); wrap.className = 'sheetwrap';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grp"><div class="grabber"></div>${title ? `<div class="msg">${esc(title)}</div>` : ''}${actions.map((a, i) => `<button data-i="${i}" class="${a.danger ? 'del' : ''}">${esc(a.label)}</button>`).join('')}</div><div class="grp"><button class="cancel">Cancel</button></div></div>`;
  document.body.append(scrim, wrap);
  const el = wrap.firstChild, h = el.offsetHeight + 24;
  const s = new Spring(h, y => { el.style.transform = `translate3d(0,${y}px,0)`; scrim.style.setProperty('--o', clamp01(1 - y / h)); }, 100);
  s.to(0, { damping: 1, response: .4 });
  let closed = false;
  const close = (velocity = 0, then) => {
    if (closed) return; closed = true; layers.splice(layers.indexOf(close), 1);
    s.to(h + 10, { damping: 1, response: .32, velocity, done() { scrim.remove(); wrap.remove(); then && then(); } });
  };
  layers.push(close);
  scrim.onclick = () => close();
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('cancel')) return close();
    const a = actions[+b.dataset.i]; close(0, () => a.run());
  });
  el.addEventListener('pointerdown', e => {
    const y0 = s.v;
    track(e, el, 'y', {
      start() { s.stop(); },
      move(d) { let y = y0 + d; if (y < 0) y = -rubber(-y, h); s.hold(y); },
      end(d, v) { const proj = s.v + project(v); if (proj > h * .35 && v > -50) close(v); else s.to(0, { damping: .8, response: .3, velocity: v }); }
    });
  });
  return close;
}
function popover(anchor, title, actions) {
  const r = anchor.getBoundingClientRect();
  const catcher = document.createElement('div'); catcher.className = 'catcher';
  const el = document.createElement('div'); el.className = 'pop'; el.setAttribute('role', 'menu');
  el.style.top = (r.bottom + 8) + 'px'; el.style.right = Math.max(10, innerWidth - r.right) + 'px';
  el.style.maxHeight = (innerHeight - r.bottom - 24) + 'px'; el.style.overflowY = 'auto';
  el.innerHTML = (title ? `<div class="msg">${esc(title)}</div>` : '') + actions.map((a, i) => `<button role="menuitem" data-i="${i}" class="${a.danger ? 'del' : ''}">${esc(a.label)}</button>`).join('');
  document.body.append(catcher, el);
  const s = new Spring(0, p => { el.style.opacity = clamp01(p * 1.6); el.style.transform = `scale(${.4 + .6 * p})`; }, 1);
  s.to(1, { damping: .8, response: .36 });
  let closed = false;
  const close = (_, then) => {
    if (closed) return; closed = true; layers.splice(layers.indexOf(close), 1);
    catcher.remove(); el.style.pointerEvents = 'none';
    s.to(0, { damping: 1, response: .24, done() { el.remove(); then && then(); } });
  };
  layers.push(close);
  catcher.addEventListener('pointerdown', () => close());
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = actions[+b.dataset.i]; close(0, () => a.run()); });
  return close;
}
function card(html, { onClose } = {}) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const wrap = document.createElement('div'); wrap.className = 'center'; wrap.style.zIndex = 45;
  wrap.innerHTML = `<div class="card" role="dialog" aria-modal="true"><button class="closex press" data-close aria-label="Close">${I.close}</button>${html}</div>`;
  document.body.append(scrim, wrap);
  const el = wrap.firstChild;
  const s = new Spring(0, p => { el.style.opacity = clamp01(p * 1.4); el.style.transform = `translate3d(0,${(1 - p) * 30}px,0) scale(${.94 + .06 * p})`; scrim.style.setProperty('--o', clamp01(p)); }, 1);
  s.to(1, { damping: .86, response: .42 });
  let closed = false;
  const close = () => { if (closed) return; closed = true; layers.splice(layers.indexOf(close), 1); s.to(0, { damping: 1, response: .28, done() { scrim.remove(); wrap.remove(); onClose && onClose(); } }); };
  layers.push(close);
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  return { el, close };
}
function ask(title, { value = '', placeholder = '', button = 'Save' } = {}) {
  return new Promise(res => {
    let result = null;
    const c = card(`<h1 style="font-size:22px;margin-bottom:16px">${esc(title)}</h1><form id="askf"><label class="field"><input id="askv" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label><button class="primary press" type="submit">${esc(button)}</button></form>`, { onClose: () => res(result) });
    const inp = c.el.querySelector('#askv'); setTimeout(() => { inp.focus(); inp.select(); }, 80);
    c.el.querySelector('#askf').onsubmit = e => { e.preventDefault(); result = inp.value.trim() || null; c.close(); };
  });
}
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast glass'; t.textContent = msg; t.setAttribute('role', 'status');
  document.body.appendChild(t);
  const s = new Spring(-80, y => t.style.transform = `translate3d(-50%,${y}px,0) scale(${1 + Math.min(0, y) / 400})`, 100);
  s.to(0, { damping: .72, response: .42 });
  setTimeout(() => s.to(-90, { damping: 1, response: .32, done: () => t.remove() }), 1900);
}

/* ================= note & notebook actions ================= */
function togglePin(n) {
  n.pinned = !n.pinned; markDirty('notes', n); renderList(); renderSide();
  const b = $('pinBtn');
  if (b && ui.current === n.id) { b.innerHTML = n.pinned ? I.pinfill : I.pin; b.classList.toggle('pinned', n.pinned); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  toast(n.pinned ? 'Pinned' : 'Unpinned');
}
function collapseRow(id, then) {
  const w = list.querySelector(`.rowwrap[data-id="${id}"]`);
  if (!w) return then();
  const h = w.offsetHeight;
  new Spring(h, v => { w.style.height = v + 'px'; w.style.opacity = clamp01(v / h); }, 100).to(0, { damping: 1, response: .32, done: then });
}
function trashNote(id) {
  collapseRow(id, () => {
    const n = DB.notes.get(id); n.deleted_at = nowISO(); markDirty('notes', n);
    if (ui.current === id) { ui.current = null; renderEditor(); if (narrow()) goBack(); }
    renderList(); renderSide(); toast('Moved to Recently Deleted');
  });
}
function restoreNote(id) {
  collapseRow(id, () => {
    const n = DB.notes.get(id); n.deleted_at = null; markDirty('notes', n);
    if (ui.current === id) { ui.current = null; renderEditor(); if (narrow()) goBack(); }
    renderList(); renderSide(); toast('Restored');
  });
}
async function deleteForever(id) {
  const n = DB.notes.get(id);
  collapseRow(id, async () => {
    DB.notes.delete(id); idb.del('notes', id).catch(() => {});
    if (ui.current === id) { ui.current = null; renderEditor(); if (narrow()) goBack(); }
    renderList(); renderSide();
    if (!n._dirty || n.modified_at) { const { error } = await sb.from('notes').delete().eq('id', id); if (error) toast('Could not delete on the server: ' + error.message); }
    toast('Deleted');
  });
}
function notebookChoices(n, anchor) {
  const out = [];
  const walk = (p, d) => childrenOf(p).forEach(b => { out.push({ label: ' '.repeat(d) + b.name + (b.locked ? ' (locked)' : '') + (b.id === n.notebook_id ? '  ✓' : ''), run: async () => { if (await moveNote(n, b.id)) { $('props').innerHTML = propsHTML(n); renderList(); renderSide(); toast('Moved to ' + b.name); } } }); walk(b.id, d + 1); });
  walk(null, 0);
  menu(anchor, 'Move to notebook', out);
}
async function newNotebook() {
  const name = await ask('New notebook', { placeholder: 'Notebook name', button: 'Create' }); if (!name) return;
  const parent = DB.notebooks.has(ui.filter) && !nbLocked(ui.filter) ? null : null;
  const b = { id: uuid(), parent_id: parent, name, color: ['#2f5fd0', '#2e9e6a', '#d9822b', '#8a5cd6', '#c2459b', '#0f8fa8'][DB.notebooks.size % 6], sort_by: 'edited', locked: false, position: childrenOf(null).length, created_at: nowISO(), deleted_at: null };
  DB.notebooks.set(b.id, b); markDirty('notebooks', b); setFilter(b.id, null); toast('Notebook created');
}
function listOptions(anchor) {
  const sk = sortKey(), tick = k => sk === k ? '  ✓' : '';
  const setSort = k => () => { if (DB.notebooks.has(ui.filter)) { const b = DB.notebooks.get(ui.filter); b.sort_by = k; markDirty('notebooks', b); } else store.set('petesnotes-sort-' + ui.filter, k); renderList(); };
  const acts = [
    { label: 'Sort by Date Edited' + tick('edited'), run: setSort('edited') },
    { label: 'Sort by Date Created' + tick('created'), run: setSort('created') },
    { label: 'Sort by Title' + tick('title'), run: setSort('title') }
  ];
  const b = DB.notebooks.get(ui.filter);
  if (b) {
    acts.push({ label: 'Rename notebook', run: async () => { const v = await ask('Rename notebook', { value: b.name }); if (v) { b.name = v; markDirty('notebooks', b); renderAll(); } } });
    acts.push({ label: 'Add notebook inside', run: async () => { const v = await ask('New notebook inside ' + b.name, { placeholder: 'Notebook name', button: 'Create' }); if (v) { const c = { id: uuid(), parent_id: b.id, name: v, color: b.color, sort_by: 'edited', locked: b.locked, position: childrenOf(b.id).length, created_at: nowISO(), deleted_at: null }; DB.notebooks.set(c.id, c); markDirty('notebooks', c); collapsed.delete(b.id); store.set('petesnotes-collapsed', [...collapsed]); setFilter(c.id, null); } } });
    if (b.locked && vaultKey) acts.push({ label: 'Lock now', run: () => { lockVault(); toast('Locked'); } });
    acts.push({ label: 'Delete notebook', danger: true, run: () => {
      const has = [...DB.notes.values()].some(n => !n.deleted_at && nbIdsUnder(b.id).includes(n.notebook_id));
      if (has || childrenOf(b.id).length) return toast('Move or delete its notes and notebooks first');
      b.deleted_at = nowISO(); markDirty('notebooks', b); setFilter('all', null); toast('Notebook deleted');
    } });
  }
  if (ui.filter === 'trash' && visible().length) acts.push({ label: 'Empty Recently Deleted', danger: true, run: () => menu(null, 'All notes in Recently Deleted will be removed for good.', [{ label: 'Delete all permanently', danger: true, run: async () => { const ids = visible().map(n => n.id); ids.forEach(id => { DB.notes.delete(id); idb.del('notes', id).catch(() => {}); }); renderAll(); for (let i = 0; i < ids.length; i += 100) await sb.from('notes').delete().in('id', ids.slice(i, i + 100)); toast('Recently Deleted emptied'); } }]) });
  menu(anchor, filterName(), acts);
}
let listTimer;
const refreshListSoon = () => { clearTimeout(listTimer); listTimer = setTimeout(() => { renderList(); renderSide(); }, 450); };

/* ================= import ================= */
function openImport() {
  const c = card(`<h1>Import notes</h1><p class="sub">Choose the import file I prepared from your Joplin notes (petes-notes-import.zip). Notes keep their original dates and land in their new notebooks.</p>
    <label class="filepick" id="pick">${I.file}<span id="pickt">Choose or drop the .zip file</span><input type="file" accept=".zip,application/zip" id="impfile" hidden></label>
    <div id="impbody"></div>`);
  const pick = c.el.querySelector('#pick'), inp = c.el.querySelector('#impfile');
  const go = f => f && prepareImport(f, c);
  inp.onchange = () => go(inp.files[0]);
  pick.ondragover = e => { e.preventDefault(); pick.classList.add('drag'); };
  pick.ondragleave = () => pick.classList.remove('drag');
  pick.ondrop = e => { e.preventDefault(); pick.classList.remove('drag'); go(e.dataTransfer.files[0]); };
}
async function prepareImport(file, c) {
  const body = c.el.querySelector('#impbody');
  c.el.querySelector('#pickt').textContent = file.name;
  body.innerHTML = '<div class="msgline">Reading the file…</div>';
  let zip, m;
  try { zip = await JSZip.loadAsync(file); m = JSON.parse(await zip.file('manifest.json').async('string')); }
  catch (_) { body.innerHTML = '<div class="msgline err">That file isn’t a Pete’s Notes import file.</div>'; return; }
  const have = new Set([...DB.notes.values()].map(n => n.source_id).filter(Boolean));
  const fresh = m.notes.filter(n => !have.has(n.source_id));
  const needVault = m.notebooks.some(b => b.locked) && fresh.some(n => m.notebooks.find(b => b.key === n.notebook && b.locked));
  const vaultExists = !!vaultRec();
  body.innerHTML = `<div class="stats"><div class="stat"><b>${fresh.length}</b><span>new notes</span></div><div class="stat"><b>${m.notebooks.length}</b><span>notebooks</span></div><div class="stat"><b>${m.attachments.filter(a => a.notes.length).length}</b><span>attachments</span></div></div>
    ${m.notes.length - fresh.length ? `<div class="warn">${m.notes.length - fresh.length} notes are already here and will be skipped.</div>` : ''}
    <form id="impf">
      ${needVault && !vaultKey ? `<div class="warn">Some notes go into the locked notebook, so they’re encrypted before upload. ${vaultExists ? 'Enter your notes password.' : 'Choose a password for locked notes now (at least 8 characters). Nobody can recover it if it’s forgotten.'}</div>
        <label class="field"><span>Notes password</span><input type="password" id="ip1" required minlength="${vaultExists ? 1 : 8}" autocomplete="${vaultExists ? 'current-password' : 'new-password'}"></label>
        ${vaultExists ? '' : '<label class="field"><span>Confirm password</span><input type="password" id="ip2" required autocomplete="new-password"></label>'}` : ''}
      <button class="primary press" type="submit" id="impgo" ${fresh.length ? '' : 'disabled'}>${fresh.length ? 'Import ' + fresh.length + ' notes' : 'Nothing new to import'}</button>
      <div class="bar2" hidden id="impbar"><i></i></div><div class="msgline" id="impmsg"></div>
    </form>`;
  body.querySelector('#impf').onsubmit = async e => {
    e.preventDefault();
    const msg = body.querySelector('#impmsg'), btn = body.querySelector('#impgo');
    if (needVault && !vaultKey) {
      const p1 = body.querySelector('#ip1').value;
      if (vaultExists) { msg.textContent = 'Checking password…'; if (!await unlockVault(p1)) { msg.className = 'msgline err'; msg.textContent = 'That password isn’t right.'; return; } }
      else { if (p1 !== body.querySelector('#ip2').value) { msg.className = 'msgline err'; msg.textContent = 'The passwords don’t match.'; return; } msg.textContent = 'Setting up encryption…'; await createVault(p1); }
    }
    btn.disabled = true; body.querySelector('#impbar').hidden = false; msg.className = 'msgline';
    try { await runImport(zip, m, (p, t) => { body.querySelector('#impbar i').style.width = (p * 100).toFixed(1) + '%'; msg.textContent = t; }); msg.textContent = 'Done. Your notes are in.'; btn.textContent = 'Close'; btn.disabled = false; btn.type = 'button'; btn.onclick = () => c.close(); setFilter('all', null); }
    catch (err) { console.error(err); msg.className = 'msgline err'; msg.textContent = 'Import stopped: ' + (err.message || err) + '. Run it again to carry on; finished notes are skipped.'; btn.disabled = false; }
  };
}
async function runImport(zip, m, progress) {
  const keyToId = {};
  const ordered = m.notebooks.filter(b => !b.parent).concat(m.notebooks.filter(b => b.parent));
  for (const nb of ordered) {
    const parentId = nb.parent ? keyToId[nb.parent] : null;
    let ex = [...DB.notebooks.values()].find(x => !x.deleted_at && x.name === nb.name && (x.parent_id || null) === parentId);
    if (!ex) { ex = { id: uuid(), parent_id: parentId, name: nb.name, color: nb.color, sort_by: 'edited', locked: !!nb.locked, position: nb.position || 0, created_at: nowISO(), deleted_at: null }; DB.notebooks.set(ex.id, ex); markDirty('notebooks', ex); }
    keyToId[nb.key] = ex.id;
  }
  const attBySrc = new Map([...DB.atts.values()].filter(a => a.source_id).map(a => [a.source_id, a]));
  const attId = {};
  m.attachments.forEach(a => { if (a.notes.length) attId[a.key] = (attBySrc.get(a.source_id) || {}).id || uuid(); });
  const have = new Set([...DB.notes.values()].map(n => n.source_id).filter(Boolean));
  const noteBySrc = new Map([...DB.notes.values()].filter(n => n.source_id).map(n => [n.source_id, n]));
  const fresh = m.notes.filter(n => !have.has(n.source_id));
  const upAtts = m.attachments.filter(a => a.notes.length && !attBySrc.has(a.source_id));
  const total = fresh.length + upAtts.length; let done = 0;
  for (const n of fresh) {
    const body = n.body.replace(/data-att="([0-9a-f]{32})"/g, (s, k) => attId[k] ? `data-att="${attId[k]}"` : s);
    const nbId = keyToId[n.notebook] || null;
    const rec = { id: uuid(), notebook_id: nbId, title: n.title, body, cipher: null, job: '', tags: [], pinned: false, source_url: n.source_url || '', source_id: n.source_id, created_at: new Date(n.created).toISOString(), updated_at: new Date(n.updated).toISOString(), deleted_at: null };
    if (nbLocked(nbId)) { rec._plain = { title: rec.title, body: rec.body }; rec.cipher = await enc(vaultKey, rec._plain); rec.title = ''; rec.body = ''; }
    DB.notes.set(rec.id, rec); noteBySrc.set(rec.source_id, rec); rec._dirty = 1; rec._v = 1; persist('notes', rec);
    if (++done % 25 === 0) progress(done / total, `Adding notes… ${done} of ${fresh.length}`);
  }
  progress(done / total, 'Uploading notes…');
  await flushPersist(); await syncNow();
  for (const a of upAtts) {
    const owner = a.notes.map(s => noteBySrc.get(s)).find(Boolean);
    let blob = await zip.file(a.file).async('blob');
    const lockedOwner = owner && isLocked(owner);
    if (lockedOwner) blob = await encBlob(blob);
    const rec = { id: attId[a.key], note_id: owner ? owner.id : null, filename: a.filename, mime: a.mime, size: blob.size, path: '', source_id: a.source_id, created_at: owner ? owner.created_at : nowISO(), deleted_at: null };
    rec.path = `${uid}/${rec.id}/${safeName(rec.filename)}` + (lockedOwner ? '.enc' : '');
    const { error } = await sb.storage.from('attachments').upload(rec.path, blob, { upsert: true, contentType: rec.mime || undefined });
    if (error) throw error;
    idb.put('blobs', rec.id, blob).catch(() => {});
    DB.atts.set(rec.id, rec); rec._dirty = 1; rec._v = 1; persist('atts', rec);
    progress(++done / total, `Uploading attachments… ${done - fresh.length} of ${upAtts.length}`);
  }
  await flushPersist(); await syncNow();
  progress(1, 'Finishing…');
}
async function syncNow() { while (syncing) await new Promise(r => setTimeout(r, 200)); clearTimeout(syncTimer); await sync(); if (syncStatus.state === 'err' || syncStatus.state === 'off') throw new Error(syncStatus.msg || 'you seem to be offline'); }

/* ================= gestures ================= */
document.addEventListener('pointerdown', e => {
  suppressClick = false;
  if (e.button > 0 || !uid) return;
  const appL = app.getBoundingClientRect().left;
  if (drawerMode() && !ui.drawer && e.target.closest('#list') && e.clientX - appL < 22 && !(narrow() && ui.pane === 'editor')) {
    const W = side.offsetWidth + 24;
    return track(e, list, 'x', {
      allow: dx => dx > 0, start() { renderSide(); },
      move(d) { let p = d / W; if (p > 1) p = 1 + rubber((p - 1) * W, W) / W; drawerS.hold(Math.max(0, p)); },
      end(d, v) { const t = drawerS.v + project(v) / W > .5 ? 1 : 0; ui.drawer = !!t; drawerS.to(t, { damping: .85, response: .36, velocity: v / W }); }
    });
  }
  if (drawerMode() && ui.drawer && e.target.closest('#side')) {
    const W = side.offsetWidth + 24, p0 = drawerS.v;
    return track(e, side, 'x', {
      start() { drawerS.stop(); },
      move(d) { let p = p0 + d / W; if (p > 1) p = 1 + rubber((p - 1) * W, W) / W; drawerS.hold(Math.max(0, p)); },
      end(d, v) { const t = drawerS.v + project(v) / W > .5 ? 1 : 0; ui.drawer = !!t; drawerS.to(t, { damping: t ? .85 : 1, response: .34, velocity: v / W }); }
    });
  }
  if (narrow() && ui.pane === 'editor' && e.target.closest('#editor') && e.clientX - appL < 30) {
    const W = app.clientWidth, p0 = navS.v;
    return track(e, editor, 'x', {
      start() { navS.stop(); },
      move(d) { let p = p0 - d / W; if (p > 1) p = 1 + rubber((p - 1) * W, W) / W; navS.hold(Math.max(0, p)); },
      end(d, v) { const proj = navS.v - project(v) / W; if (proj < .5) goBack(-v / W); else navS.to(1, { damping: 1, response: .36, velocity: -v / W }); }
    });
  }
  const row = e.target.closest('#rows .row');
  if (row) {
    const w = row.parentElement, id = w.dataset.id, s = rowSpring(id), x0 = s.v, W = w.offsetWidth;
    row.classList.add('pressed');
    track(e, row, 'x', {
      start() { row.classList.remove('pressed'); if (openRow && openRow !== id) closeRow(openRow); s.stop(); },
      move(d) { let x = x0 + d; if (x > 0) x = rubber(x, W); else if (x < -ACTW) x = -ACTW - rubber(-ACTW - x, W); s.hold(x); },
      end(d, v) { const t = s.v + project(v, .99) < -ACTW / 2 ? -ACTW : 0; openRow = t ? id : null; s.to(t, { damping: t ? .82 : 1, response: .36, velocity: v }); },
      abort() { row.classList.remove('pressed'); }
    });
    const clear = () => { row.classList.remove('pressed'); removeEventListener('pointerup', clear); removeEventListener('pointercancel', clear); };
    addEventListener('pointerup', clear); addEventListener('pointercancel', clear);
  }
});
document.addEventListener('click', e => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);

/* ================= clicks ================= */
document.addEventListener('click', async e => {
  const t = e.target;
  if (!uid) return;
  if (t === app && ui.drawer) return closeDrawer();
  const th = t.closest('[data-theme-set]');
  if (th) {
    theme = th.dataset.themeSet; store.set('petesnotes-theme', theme);
    root.classList.add('theming'); applyTheme(); setTimeout(() => root.classList.remove('theming'), 450);
    thumbS.to(THEMES.indexOf(theme), { damping: .8, response: .36 });
    side.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-checked', b === th));
    return;
  }
  const tog = t.closest('[data-toggle]');
  if (tog) { e.stopPropagation(); const id = tog.dataset.toggle; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); store.set('petesnotes-collapsed', [...collapsed]); renderSide(); return; }
  const f = t.closest('[data-f]'); if (f) return setFilter(f.dataset.f, null);
  const tg = t.closest('[data-tag]'); if (tg) return setFilter(ui.filter, ui.tag === tg.dataset.tag ? null : tg.dataset.tag);
  if (t.closest('#newNb')) return newNotebook();
  if (t.closest('#importBtn') || t.closest('#emptyImport')) { if (ui.drawer) closeDrawer(); return openImport(); }
  if (t.closest('#clipBtn')) { if (ui.drawer) closeDrawer(); return clipperSetup(); }
  if (t.closest('#askBtn')) return askNotes();
  if (t.closest('#signOutBtn')) return menu(t.closest('#signOutBtn'), 'Sign out of Pete’s Notes on this device? Your notes stay safe in your account.', [{ label: 'Sign out', danger: true, run: signOut }]);
  if (t.closest('#moreRows')) { ui.limit += 300; return renderList(); }
  const act = t.closest('[data-act]');
  if (act) {
    const id = act.closest('.rowwrap').dataset.id, n = DB.notes.get(id);
    if (act.dataset.act === 'pin') { closeRow(id); setTimeout(() => togglePin(n), 160); }
    else if (act.dataset.act === 'restore') restoreNote(id);
    else if (ui.filter === 'trash') menu(null, 'This note will be deleted for good.', [{ label: 'Delete permanently', danger: true, run: () => deleteForever(id) }]);
    else trashNote(id);
    return;
  }
  const r = t.closest('#rows .row'); if (r) return open(r.parentElement.dataset.id);
  if (openRow && !t.closest('.rowwrap')) closeRow(openRow);
  if (t.closest('#newNote')) return newNote();
  if (t.closest('#sortBtn')) return listOptions(t.closest('#sortBtn'));
  if (t.closest('#openSide')) return openDrawer();
  if (t.closest('#back')) return goBack();

  const n = DB.notes.get(ui.current); if (!n) return;
  const attA = t.closest('#body a[data-att]');
  if (attA && !attA.href.startsWith('blob:')) { e.preventDefault(); toast('Attachment not available offline'); return; }
  if (attA) return;
  if (t.closest('#body a[href]') && !t.closest('[data-att]')) { const a = t.closest('a'); if (e.metaKey || e.ctrlKey || !editor.contains(document.activeElement)) { e.preventDefault(); window.open(a.href, '_blank', 'noopener'); } return; }
  if (t.closest('#pinBtn')) return togglePin(n);
  if (t.closest('#nbBtn')) return notebookChoices(n, t.closest('#nbBtn'));
  if (t.closest('#moreBtn')) {
    if (n.deleted_at) return menu(t.closest('#moreBtn'), null, [{ label: 'Restore note', run: () => restoreNote(n.id) }, { label: 'Delete permanently', danger: true, run: () => deleteForever(n.id) }]);
    return menu(t.closest('#moreBtn'), null, [
      { label: 'Move to notebook…', run: () => notebookChoices(n, $('moreBtn')) },
      ...(isLocked(n) ? [] : [{ label: 'Summarise with AI', run: () => summariseNote(n) }]),
      { label: 'Duplicate note', run: async () => { const c = { ...n, id: uuid(), pinned: false, source_id: null, created_at: nowISO(), updated_at: nowISO(), _dirty: 0 }; delete c.modified_at; if (isLocked(n)) { c._plain = { title: nTitle(n) + ' copy', body: nBody(n) }; c.cipher = await enc(vaultKey, c._plain); } else c.title = (n.title || 'New Note') + ' copy'; DB.notes.set(c.id, c); markDirty('notes', c); open(c.id); renderSide(); toast('Duplicated'); } },
      { label: 'Make this notebook the default for new notes', run: () => { store.set('petesnotes-defaultnb', n.notebook_id); toast('New notes go to ' + book(n.notebook_id).name); } },
      { label: 'Delete note', danger: true, run: () => trashNote(n.id) }
    ]);
  }
  const rm = t.closest('[data-rmtag]');
  if (rm) { n.tags = (n.tags || []).filter(x => x !== rm.dataset.rmtag); edited(n); $('props').innerHTML = propsHTML(n); renderSide(); return; }
  const li = t.closest('#body ul.check li');
  if (li && e.clientX - li.getBoundingClientRect().left < 28) {
    e.preventDefault(); li.classList.toggle('done'); li.classList.remove('pop'); void li.offsetWidth; if (li.classList.contains('done')) li.classList.add('pop');
    saveFromEditor(); return;
  }
  const btn = t.closest('[data-cmd]');
  if (btn) { e.preventDefault(); if (btn.dataset.cmd === 'attach') { $('filein').value = ''; $('filein').click(); return; } if (btn.dataset.cmd === 'scan') { $('scanin').value = ''; $('scanin').click(); return; } command(btn.dataset.cmd); saveFromEditor(); }
});
document.addEventListener('mousedown', e => { if (e.target.closest('.toolbar')) e.preventDefault(); });
$('filein').addEventListener('change', e => { const fs = [...e.target.files]; if (fs.length) attachFiles(fs); });
$('scanin').addEventListener('change', e => { const f = e.target.files[0]; if (f) scanDocument(f); });

/* ================= editing ================= */
let savedRange = null;
document.addEventListener('selectionchange', () => { const s = getSelection(); if (s.rangeCount && $('body') && $('body').contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); });
const inBody = () => { const s = getSelection(); return s.rangeCount && $('body') && $('body').contains(s.anchorNode); };
function insertHTML(html) {
  const b = $('body');
  if (!inBody()) { b.focus(); const s = getSelection(); s.removeAllRanges(); if (savedRange && b.contains(savedRange.startContainer)) s.addRange(savedRange); else { const r = document.createRange(); r.selectNodeContents(b); r.collapse(false); s.addRange(r); } }
  document.execCommand('insertHTML', false, html);
}
function command(c) {
  if (!inBody()) $('body').focus();
  if (c === 'bold' || c === 'italic') return document.execCommand(c);
  if (c === 'h2') return document.execCommand('formatBlock', false, 'h2');
  if (c === 'quote') return document.execCommand('formatBlock', false, 'blockquote');
  if (c === 'ul') return document.execCommand('insertUnorderedList');
  if (c === 'check') { document.execCommand('insertUnorderedList'); let node = getSelection().anchorNode; while (node && node.nodeName !== 'UL') node = node.parentNode; if (node) node.classList.toggle('check'); return; }
  if (c === 'table') return insertHTML('<div class="tablewrap"><table><tr><th>Item</th><th>Value</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table></div><p><br></p>');
  if (c === 'date') return insertHTML(new Date().toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '&nbsp;');
}
document.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; ui.limit = 150; return renderList(); }
  const n = DB.notes.get(ui.current); if (!n) return;
  if (e.target.id === 'ttl') { $('einline').textContent = e.target.textContent.trim() || 'New Note'; saveFromEditor(); }
  if (e.target.id === 'body') saveFromEditor();
  if (e.target.id === 'job') { e.target.value = e.target.value.replace(/\D/g, ''); n.job = e.target.value; edited(n); refreshListSoon(); }
});
document.addEventListener('paste', e => {
  if (!e.target.closest || !e.target.closest('#body')) return;
  const files = [...(e.clipboardData && e.clipboardData.files || [])];
  if (files.length) { e.preventDefault(); attachFiles(files); return; }
  const html = e.clipboardData && e.clipboardData.getData('text/html');
  if (html) { e.preventDefault(); document.execCommand('insertHTML', false, DOMPurify.sanitize(html, PURIFY)); }
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'ttl' && e.key === 'Enter') { e.preventDefault(); $('body').focus(); }
  if (e.target.classList && e.target.classList.contains('row') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(e.target.parentElement.dataset.id); }
  if (e.target.id === 'addtag' && (e.key === 'Enter' || e.key === ',')) {
    e.preventDefault();
    const v = e.target.value.trim().replace(/^#/, '').toLowerCase(), n = DB.notes.get(ui.current);
    if (v && n && !(n.tags || []).includes(v)) { n.tags = [...(n.tags || []), v]; edited(n); $('props').innerHTML = propsHTML(n); renderSide(); setTimeout(() => $('addtag') && $('addtag').focus(), 0); }
  }
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); newNote(); }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && uid) { e.preventDefault(); if (narrow() && ui.pane === 'editor') goBack(); $('q').focus(); }
  if (e.key === 'Escape') { if (layers.length) layers[layers.length - 1](); else if (ui.drawer) closeDrawer(); else if (openRow) closeRow(openRow); }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'vaultForm') return;
  e.preventDefault();
  const f = e.target, msg = $('vmsg'), p1 = $('vp1').value, btn = f.querySelector('button');
  btn.disabled = true; msg.className = 'msgline';
  if (vaultRec()) {
    msg.textContent = 'Unlocking…';
    if (await unlockVault(p1)) { toast('Unlocked'); renderAll(); }
    else { btn.disabled = false; msg.className = 'msgline err'; msg.textContent = 'That password isn’t right.'; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  } else {
    if (p1 !== $('vp2').value) { btn.disabled = false; msg.className = 'msgline err'; msg.textContent = 'The passwords don’t match.'; return; }
    msg.textContent = 'Setting up…'; await createVault(p1);
    for (const n of DB.notes.values()) if (!n.deleted_at && nbLocked(n.notebook_id) && !isLocked(n) && n.source_id !== VAULT) await moveNote(n, n.notebook_id);
    toast('Locked notebook ready'); renderAll();
  }
});
document.addEventListener('scroll', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('scroll')) return;
  el.parentElement.style.setProperty('--sc', clamp01(el.scrollTop / 46));
}, true);
addEventListener('resize', () => { applyNav(navS.v); if (!drawerMode() && ui.drawer) { ui.drawer = false; drawerS.set(0); } else applyDrawer(drawerS.v); });

/* ================= sign in / start ================= */
function showSignIn(note = '') {
  app.hidden = true; gate.hidden = false;
  let mode = 'in';
  const draw = () => {
    gate.innerHTML = `<div class="card" id="authcard"><img class="appicon" src="icons/icon-192.png" alt="">
      <h1>Pete's Notes</h1><p class="sub">${mode === 'in' ? 'Sign in to your notes.' : 'Create your account. You’ll only need to do this once.'}</p>
      <form id="authf">
        <label class="field"><span>Email</span><input type="email" id="aemail" autocomplete="username" required value="${esc(store.get('petesnotes-email', ''))}"></label>
        <label class="field"><span>Password</span><input type="password" id="apass" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" required minlength="8"></label>
        <button class="primary press" type="submit">${mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <div class="msgline" id="amsg">${esc(note)}</div>
      </form>
      <button class="linkbtn" id="aswap">${mode === 'in' ? 'First time here? Create your account' : 'Already have an account? Sign in'}</button>
      ${mode === 'in' ? '<button class="linkbtn" id="areset" style="margin-top:6px;font-size:13.5px">Forgot password?</button>' : ''}</div>`;
    const c = $('authcard');
    new Spring(0, p => { c.style.opacity = clamp01(p * 1.3); c.style.transform = `translate3d(0,${(1 - p) * 24}px,0) scale(${.95 + .05 * p})`; }, 1).to(1, { damping: .85, response: .5 });
    $('aswap').onclick = () => { mode = mode === 'in' ? 'up' : 'in'; note = ''; draw(); };
    if ($('areset')) $('areset').onclick = async () => {
      const email = $('aemail').value.trim(); const m = $('amsg');
      if (!email) { m.className = 'msgline err'; m.textContent = 'Type your email first.'; return; }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      m.className = 'msgline' + (error ? ' err' : ''); m.textContent = error ? error.message : 'Check your email for a link to reset your password.';
    };
    $('authf').onsubmit = async e => {
      e.preventDefault();
      const email = $('aemail').value.trim(), password = $('apass').value, m = $('amsg'), b = e.target.querySelector('button');
      b.disabled = true; m.className = 'msgline'; m.textContent = mode === 'in' ? 'Signing in…' : 'Creating your account…';
      store.set('petesnotes-email', email);
      const res = mode === 'in' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      b.disabled = false;
      if (res.error) { m.className = 'msgline err'; m.textContent = res.error.message; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); return; }
      if (!res.data.session) { m.textContent = 'Check your email and tap the confirmation link, then sign in here.'; mode = 'in'; return; }
      start(res.data.session.user);
    };
  };
  draw();
}
async function start(user) {
  if (uid === user.id) return;
  uid = user.id;
  const prev = await idb.get('meta', 'uid').catch(() => null);
  if (prev && prev !== uid) { for (const s of ['notebooks', 'notes', 'atts', 'blobs', 'meta']) await idb.clear(s).catch(() => {}); }
  await idb.put('meta', 'uid', uid).catch(() => {});
  meta = (await idb.get('meta', 'sync').catch(() => null)) || { pull: {}, lastSync: 0 };
  const [nbs, ns, as] = await Promise.all([idb.all('notebooks'), idb.all('notes'), idb.all('atts')]).catch(() => [[], [], []]);
  nbs.forEach(r => DB.notebooks.set(r.id, r)); ns.forEach(r => DB.notes.set(r.id, r)); as.forEach(r => DB.atts.set(r.id, r));
  gate.hidden = true; gate.innerHTML = ''; app.hidden = false;
  buildSide(); buildList();
  if (!narrow()) { const first = visible()[0]; if (first) ui.current = first.id; }
  renderSide(); renderList({ enter: true }); renderEditor(); applyNav(0); applyDrawer(0);
  await sync();
  if (!ui.current && !narrow()) { const first = visible()[0]; if (first) { ui.current = first.id; renderEditor(); renderList(); } }
  handleIncomingClip();
}
async function signOut() {
  await flushPersist();
  const dirty = [...DB.notes.values()].some(n => n._dirty);
  if (dirty && navigator.onLine) await sync();
  await sb.auth.signOut().catch(() => {});
  for (const s of ['notebooks', 'notes', 'atts', 'blobs', 'meta']) await idb.clear(s).catch(() => {});
  location.reload();
}
addEventListener('pagehide', () => { flushPersist(); });

(async function boot() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  const { data } = await sb.auth.getSession();
  if (data.session) start(data.session.user); else showSignIn();
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') { ask('Choose a new password', { placeholder: 'New password (8+ characters)', button: 'Save password' }).then(async p => { if (p) { const { error } = await sb.auth.updateUser({ password: p }); toast(error ? error.message : 'Password changed'); } }); }
    if (session && !uid) start(session.user);
  });
})();


/* ================= helper function (web clips + AI) ================= */
async function assistant(body) {
  const { data, error } = await sb.functions.invoke('assistant', { body });
  if (error) {
    let msg = error.message || String(error);
    try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (_) {}
    if (/Failed to send|not found|404/i.test(msg)) msg = 'The helper isn’t set up in Supabase yet';
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);
  return data;
}

/* ---------- document scanning with searchable text ---------- */
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load the text reader. Are you online?')); document.head.appendChild(s); }); }
function drawScan(img, clean) {
  const max = 2200, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
  if (clean) {
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    let lo = 255, hi = 0;
    for (let i = 0; i < p.length; i += 16) { const g = .299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2]; if (g < lo) lo = g; if (g > hi) hi = g; }
    const span = Math.max(40, hi - lo);
    for (let i = 0; i < p.length; i += 4) { let g = (.299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2] - lo) / span; g = Math.min(1, Math.max(0, (g - .12) * 1.35)); g = Math.pow(g, .8) * 255; p[i] = p[i + 1] = p[i + 2] = g; }
    x.putImageData(d, 0, 0);
  }
  return c;
}
async function scanDocument(file) {
  const n = DB.notes.get(ui.current); if (!n) return;
  const img = new Image(); img.src = URL.createObjectURL(file);
  try { await img.decode(); } catch (_) { toast('That photo couldn’t be opened'); return; }
  let clean = true, canvas = drawScan(img, clean), busy = false;
  const c = card(`<h1 style="font-size:24px">Scan document</h1><p class="sub">The text in the scan is added to your note so you can search for it.</p>
    <div class="scanprev" id="scanprev"></div>
    <label class="toggle"><input type="checkbox" id="scanclean" checked><span></span>Clean up for documents (black &amp; white)</label>
    <button class="primary press" id="scango">Add to note</button>
    <div class="bar2" hidden id="scanbar"><i></i></div><div class="msgline" id="scanmsg"></div>`, { onClose: () => URL.revokeObjectURL(img.src) });
  const show = () => { const p = c.el.querySelector('#scanprev'); p.innerHTML = ''; canvas.style.width = '100%'; p.appendChild(canvas); };
  show();
  c.el.querySelector('#scanclean').onchange = e => { clean = e.target.checked; canvas = drawScan(img, clean); show(); };
  c.el.querySelector('#scango').onclick = async e => {
    if (busy) return; busy = true; e.target.disabled = true;
    const msg = c.el.querySelector('#scanmsg'), bar = c.el.querySelector('#scanbar'); bar.hidden = false;
    let textOut = '';
    try {
      msg.textContent = 'Loading the text reader…';
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      const worker = await Tesseract.createWorker('eng', 1, { logger: m => { if (m.status === 'recognizing text') { bar.firstChild.style.width = (m.progress * 100).toFixed(0) + '%'; msg.textContent = 'Reading the text… ' + Math.round(m.progress * 100) + '%'; } } });
      const { data } = await worker.recognize(canvas); await worker.terminate();
      textOut = (data.text || '').trim();
    } catch (err) { msg.className = 'msgline err'; msg.textContent = (err.message || err) + ' The image will be added without searchable text.'; await new Promise(r => setTimeout(r, 1600)); }
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .85));
    const name = 'Scan ' + new Date().toLocaleDateString('en-IE').replace(/\//g, '-') + '.jpg';
    const ocr = textOut ? `<details class="ocr"><summary>Text in this scan</summary>${textOut.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</details>` : '';
    c.close();
    await attachFiles([new File([blob], name, { type: 'image/jpeg' })], { quiet: true, after: ocr });
    toast(textOut ? 'Scan added with searchable text' : 'Scan added');
  };
}

/* ---------- ask your notes ---------- */
const STOP = new Set('the and for with that this what when where which who how was were are have has had you your our from about into there their them then than does did can could would should will just also any all not but out get got its it’s i’m my me find show tell give list notes note'.split(' '));
function relevantNotes(question, limit = 14) {
  const terms = [...new Set(question.toLowerCase().match(/[a-z0-9&@.\-]{3,}/g) || [])].filter(t => !STOP.has(t));
  const pool = [...DB.notes.values()].filter(n => visibleNote(n) && !isLocked(n));
  const scored = pool.map(n => {
    const title = (n.title || '').toLowerCase(), body = plain(n).toLowerCase(), meta = ((n.tags || []).join(' ') + ' ' + (n.job || '') + ' ' + book(n.notebook_id).name).toLowerCase();
    let s = 0;
    for (const t of terms) { if (title.includes(t)) s += 6; if (meta.includes(t)) s += 3; let i = -1, k = 0; while ((i = body.indexOf(t, i + 1)) !== -1 && k < 8) k++; s += k; }
    return { n, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s || b.n.updated_at.localeCompare(a.n.updated_at)).slice(0, limit).map(x => x.n);
  return scored.length ? scored : pool.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
}
function askNotes() {
  const c = card(`<h1 style="font-size:24px;display:flex;align-items:center;gap:8px;justify-content:center"><span style="width:26px;height:26px;color:var(--accent);display:inline-block">${I.spark}</span>Ask your notes</h1>
    <p class="sub">Ask anything about what you’ve written. Locked notes are never sent.</p>
    <form id="askform"><label class="field"><input id="askq" placeholder="e.g. What did Keith want changed on the website?" autocomplete="off"></label>
    <button class="primary press" type="submit">Ask</button></form>
    <div id="answer" class="answer" hidden></div>`);
  c.el.style.maxWidth = '560px';
  const q = c.el.querySelector('#askq'); setTimeout(() => q.focus(), 80);
  c.el.querySelector('#askform').onsubmit = async e => {
    e.preventDefault();
    const question = q.value.trim(); if (!question) return;
    const out = c.el.querySelector('#answer'), btn = e.target.querySelector('button');
    const notes = relevantNotes(question);
    out.hidden = false; out.innerHTML = `<div class="msgline">Reading ${notes.length} notes…</div>`; btn.disabled = true;
    try {
      const payload = notes.map(n => ({ title: n.title || 'Untitled', notebook: book(n.notebook_id).name, date: n.updated_at.slice(0, 10), text: plain(n).slice(0, 2500) }));
      const { answer } = await assistant({ action: 'ask', question, notes: payload });
      const cited = new Set();
      const html = esc(answer).replace(/\[(\d+)\]/g, (m, d) => { const n = notes[+d - 1]; if (!n) return m; cited.add(n); return `<button class="cite press" data-open="${n.id}">${d}</button>`; })
        .split(/\n{2,}/).map(p => `<p>${p.replace(/\n- /g, '<br>• ').replace(/^- /, '• ').replace(/\n/g, '<br>')}</p>`).join('');
      out.innerHTML = html + (cited.size ? `<div class="sources"><span>From your notes</span>${[...cited].map((n, i) => `<button class="srcnote press" data-open="${n.id}">${esc(n.title || 'Untitled')}</button>`).join('')}</div>` : '');
      out.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { c.close(); const id = b.dataset.open; const nn = DB.notes.get(id); if (nn && DB.notebooks.has(nn.notebook_id) && ui.filter !== 'all') setFilter('all', null); open(id); });
    } catch (err) { out.innerHTML = `<div class="msgline err">${esc(err.message || err)}</div>`; }
    btn.disabled = false;
  };
}
async function summariseNote(n) {
  toast('Summarising…');
  try {
    const { summary } = await assistant({ action: 'summarise', title: n.title, text: plain(n) });
    const items = summary.split('\n').map(l => l.trim()).filter(Boolean);
    let html = '<blockquote class="aisum"><p><strong>Summary</strong></p><ul>', inTodo = false;
    for (const l of items) {
      if (/^to ?do:?$/i.test(l)) { html += '</ul><p><strong>To do</strong></p><ul class="check">'; inTodo = true; continue; }
      html += `<li>${esc(l.replace(/^[-•*]\s*/, ''))}</li>`;
    }
    html += '</ul></blockquote>';
    if (ui.current !== n.id) open(n.id);
    const b = $('body'); b.insertAdjacentHTML('afterbegin', html);
    saveFromEditor(); toast('Summary added to the top');
  } catch (err) { toast(err.message || 'Summary failed'); }
}

/* ---------- web clipper ---------- */
const CLIP_BOOKMARKLET = `javascript:(()=>{window.open('${location.origin}/?clip='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)+'&text='+encodeURIComponent(String(getSelection()).slice(0,3000)),'_blank')})()`;
function clipperSetup() {
  card(`<h1 style="font-size:24px">Web clipper</h1><p class="sub">Save any web page into a Web Clips notebook, with its text and pictures.</p>
    <h3 class="sethead">On your PC or laptop</h3>
    <p class="setp">Drag this button onto your browser’s bookmarks bar. On any page, click it to clip the page, or select some text first to clip just that.</p>
    <p style="text-align:center;margin:10px 0 18px"><a class="bookmarklet" href="${esc(CLIP_BOOKMARKLET)}" onclick="event.preventDefault();toast('Drag me to your bookmarks bar')">${I.globe.replace('<svg', '<svg width="16" height="16"')} Clip to Pete’s Notes</a></p>
    <h3 class="sethead">On your iPhone or iPad</h3>
    <ol class="setp">
      <li>Open the <b>Shortcuts</b> app, tap <b>+</b> and name it <b>Clip to Pete’s Notes</b>.</li>
      <li>Tap the <b>ⓘ</b> button and turn on <b>Show in Share Sheet</b>.</li>
      <li>Add the action <b>URL Encode</b> and set it to encode the <b>Shortcut Input</b>.</li>
      <li>Add <b>Open URLs</b> with the text <code>${esc(location.origin)}/?clip=</code> followed by the <b>URL Encoded Text</b> variable.</li>
      <li>In Safari, tap <b>Share → Clip to Pete’s Notes</b>. The first time, sign in to Pete’s Notes in Safari too.</li>
    </ol>`).el.style.maxWidth = '520px';
}
async function handleIncomingClip() {
  const qs = new URLSearchParams(location.search);
  let url = qs.get('clip') || qs.get('url') || '';
  const text = qs.get('text') || '';
  if (!url) { const m = text.match(/https?:\/\/\S+/); if (m) url = m[0]; }
  if (!url && !text) return;
  history.replaceState(null, '', location.pathname);
  let nb = [...DB.notebooks.values()].find(b => !b.deleted_at && b.name === 'Web Clips' && !b.parent_id);
  if (!nb) { nb = { id: uuid(), parent_id: null, name: 'Web Clips', color: '#0f8fa8', sort_by: 'edited', locked: false, position: childrenOf(null).length, created_at: nowISO(), deleted_at: null }; DB.notebooks.set(nb.id, nb); markDirty('notebooks', nb); }
  const sel = text && !/^https?:\/\/\S+$/.test(text.trim()) ? `<blockquote>${esc(text).replace(/\n/g, '<br>')}</blockquote>` : '';
  const link = url ? `<p><a href="${esc(url)}">${esc(url)}</a></p>` : '';
  const n = { id: uuid(), notebook_id: nb.id, title: qs.get('title') || url || 'Clipped text', body: link + sel + (url && !sel ? '<p><em>Fetching the page…</em></p>' : ''), cipher: null, job: '', tags: [], pinned: false, source_url: url, source_id: null, created_at: nowISO(), updated_at: nowISO(), deleted_at: null };
  DB.notes.set(n.id, n); markDirty('notes', n);
  ui.filter = nb.id; ui.tag = null; renderSide(); renderList({ enter: true }); open(n.id);
  if (!url || sel) { toast('Clipped'); return; }
  try {
    const page = await assistant({ action: 'clip', url });
    n.title = n.title && n.title !== url ? n.title : page.title;
    n.body = link + DOMPurify.sanitize(page.html, PURIFY);
  } catch (err) { n.body = link + `<p><em>Saved the link only: ${esc(err.message || err)}</em></p>`; }
  edited(n); if (ui.current === n.id) renderEditor(true); renderList(); toast('Page clipped');
}
