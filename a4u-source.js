// Auto episode source: anime4up (sub + dubbed). Server-side scraper, no extra dependencies.
// Domains change often: set env A4U_HOSTS="https://x.rest/,https://y.cam/" or edit DEFAULT_HOSTS.
const DEFAULT_HOSTS = ['https://anime4up.rest/', 'https://w1.anime4up.rest/', 'https://anime4up.cam/', 'https://anime4up.pro/'];
const HOSTS = (process.env.A4U_HOSTS ? process.env.A4U_HOSTS.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_HOSTS).map((h) => (h.endsWith('/') ? h : h + '/'));
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const DUB_RE = /مدبلج|دبلج|dubbed/i;
let base = HOSTS[0];

const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const strip = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const abs = (u) => { try { return new URL(decode(u), base).href; } catch { return ''; } };
const norm = (s) => String(s || '').toLowerCase().replace(DUB_RE, ' ').replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').replace(/\b(season|the|tv|الموسم)\b/g, ' ').replace(/\s+/g, ' ').trim();
const lastNum = (s) => { const m = String(s || '').match(/(\d+(?:\.\d+)?)(?!.*\d)/); return m ? parseFloat(m[1]) : null; };

async function getHtml(path) {
  path = path.replace(/^\//, '');
  let err;
  for (const h of [base, ...HOSTS.filter((x) => x !== base)]) {
    try {
      const r = await fetch(h + path, { headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
      if (!r.ok) { err = new Error('http ' + r.status); continue; }
      const t = await r.text();
      if (t.length > 500) { base = h; return t; }
    } catch (e) { err = e; }
  }
  throw err || new Error('a4u unreachable');
}

// split html into blocks that start at each element whose class contains `cls`
function blocks(html, cls) {
  const re = new RegExp('<div[^>]+class="[^"]*\\b' + cls + '\\b[^"]*"', 'g'), idx = [];
  let m; while ((m = re.exec(html))) idx.push(m.index);
  return idx.map((s, i) => html.slice(s, idx[i + 1] || s + 6000));
}

function parseCards(html) {
  return blocks(html, 'anime-card-container').map((b) => {
    const m = b.match(/<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) || b.match(/<a[^>]+href="([^"]*\/anime\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!m) return null;
    const url = abs(m[1]), name = strip(m[2]);
    const im = b.match(/<img[^>]+src="([^"]+)"/i);
    const cover = im ? abs(im[1]) : '';
    return url && name ? { url, name, cover, dub: DUB_RE.test(name) } : null;
  }).filter(Boolean);
}

function parseEpisodes(html) {
  const seen = new Set(), out = [];
  // New theme: ep_num > a  (الحلقة N)
  const reEpNum = /<div[^>]+class="[^"]*\bep_num\b[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = reEpNum.exec(html))) {
    const url = abs(m[1]), ep = lastNum(strip(m[2]));
    if (!url || ep == null || seen.has(url) || !/\/episode\//i.test(url)) continue;
    seen.add(url); out.push({ ep, url });
  }
  // Fallback: any /episode/ link whose text contains a number
  if (!out.length) {
    const reA = /<a[^>]+href="([^"]*\/episode\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = reA.exec(html))) {
      const url = abs(m[1]), ep = lastNum(strip(m[2]));
      if (!url || ep == null || seen.has(url)) continue;
      seen.add(url); out.push({ ep, url });
    }
  }
  // Old theme fallback
  if (!out.length) {
    for (const b of blocks(html, 'episodes-card')) {
      const mm = b.match(/episodes-card-title[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) || b.match(/<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!mm) continue;
      const url = abs(mm[1]), ep = lastNum(strip(mm[2]));
      if (!url || ep == null || seen.has(url)) continue;
      seen.add(url); out.push({ ep, url });
    }
  }
  return out.sort((a, b) => a.ep - b.ep);
}

const b64 = (x) => { try { return Buffer.from(String(x).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch { return ''; } };
const urlOf = (raw) => {
  raw = decode(String(raw || '').trim()); if (!raw) return '';
  let m = raw.match(/https?:\/\/[^\s"'<>]+/); if (m) return m[0];
  if (raw.startsWith('//')) return 'https:' + raw;
  m = b64(raw).match(/https?:\/\/[^\s"'<>]+/); return m ? m[0] : '';
};
const BAD = /(facebook|twitter|telegram|t\.me|discord|disqus|google|doubleclick|histats|whatsapp)\./i;

function parseServers(html) {
  const out = [], seen = new Set(), host = (() => { try { return new URL(base).hostname; } catch { return ''; } })();
  const push = (label, raw) => {
    const u = urlOf(raw);
    if (!/^https:\/\//i.test(u) || seen.has(u) || BAD.test(u)) return;
    try { if (new URL(u).hostname === host) return; } catch { return; }
    let lab = strip(label).slice(0, 40) || 'Server';
    if (/^embed$/i.test(lab)) {
      try { lab = new URL(u).hostname.replace(/^www\./, '').split('.')[0] || lab; } catch {}
    }
    seen.add(u); out.push({ label: lab, url: u });
  };
  let m;
  // old attribute
  const reA = /<a[^>]+data-ep-url="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = reA.exec(html))) push(m[2], m[1]);
  // new theme: li with aria-label + noscript iframe
  const reLi = /<li[^>]*class="[^"]*watch-server[^"]*"[^>]*>[\s\S]*?<a[^>]*aria-label="([^"]*)"[^>]*>[\s\S]*?<noscript>[\s\S]*?<iframe[^>]+src="([^"]+)"/gi;
  while ((m = reLi.exec(html))) {
    const lab = (m[1] || '').replace(/^تشغيل سيرفر\s*/i, '').trim() || 'Server';
    push(lab, m[2]);
  }
  // any iframe fallback
  const reI = /<iframe[^>]+src="([^"]+)"/gi;
  while ((m = reI.exec(html))) push('Embed', m[1]);
  // quality-list (download pages like Mediafire) are skipped: they cannot be embedded in an iframe
  return out.slice(0, 14);
}

/* ---- matching an AniList title to anime4up entries ---- */
function score(aTitles, name) {
  const n = norm(name); if (!n) return 0;
  let best = 0;
  for (const t of aTitles) {
    const q = norm(t); if (!q) continue;
    if (q === n) return 1;
    const A = new Set(q.split(' ')), B = new Set(n.split(' '));
    let i = 0; A.forEach((w) => { if (B.has(w)) i++; });
    const j = i / (A.size + B.size - i);
    best = Math.max(best, j);
  }
  return best;
}
const cache = new Map();
const memo = (key, ttl, fn) => {
  const h = cache.get(key);
  if (h && Date.now() - h.t < ttl) return h.p;
  const p = fn().catch((e) => { cache.delete(key); throw e; });
  cache.set(key, { t: Date.now(), p });
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  return p;
};

async function search(q) { return memo('s:' + q, 30 * 60e3, async () => parseCards(await getHtml('?search_param=animes&s=' + encodeURIComponent(q)))); }

// list Arabic-dubbed anime (from anime4up search مدبلج)
async function listDubbed(limit = 24) {
  return memo('dubbed-list', 45 * 60e3, async () => {
    const cards = await search('مدبلج');
    const seen = new Set(), out = [];
    for (const c of cards) {
      if (!c.dub) continue;
      const clean = strip(c.name).replace(DUB_RE, '').replace(/\s+/g, ' ').trim();
      const key = norm(clean);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ name: clean, fullName: c.name, url: c.url, cover: c.cover || '' });
      if (out.length >= limit) break;
    }
    return out;
  });
}

// returns { sub: url|null, dub: url|null }
async function match(titles) {
  const qs = [...new Set(titles.filter(Boolean))].slice(0, 2);
  const all = [];
  for (const q of qs) { try { all.push(...(await search(q))); } catch {} }
  if (!all.length) return { sub: null, dub: null };
  const pick = (dub) => {
    let best = null, bs = 0.55;
    for (const c of all) { if (c.dub !== dub) continue; const s = score(titles, c.name); if (s > bs) { bs = s; best = c.url; } }
    return best;
  };
  return { sub: pick(false), dub: pick(true) };
}
async function episodes(animeUrl) { return memo('e:' + animeUrl, 15 * 60e3, async () => parseEpisodes(await getHtml(new URL(animeUrl).pathname + new URL(animeUrl).search))); }

// Find one specific episode URL via the site's AJAX search (works for any ep number, not only the first page)
async function findEpisode(animeUrl, epNum) {
  const key = 'fe:' + animeUrl + ':' + epNum;
  return memo(key, 20 * 60e3, async () => {
    // 1) try already-parsed list first
    const list = await episodes(animeUrl).catch(() => []);
    const hit = list.find((x) => String(x.ep) === String(epNum));
    if (hit) return hit.url;

    // 2) AJAX search by episode number
    const pageHtml = await getHtml(new URL(animeUrl).pathname + new URL(animeUrl).search);
    const term = (pageHtml.match(/data-term-id=["'](\d+)/) || [])[1];
    const nonce = (pageHtml.match(/data-nonce=["']([^"']+)/) || [])[1];
    const ajaxUrl = (pageHtml.match(/data-ajax-url=["']([^"']+)/) || [])[1] || (base + 'wp-admin/admin-ajax.php');
    if (!term) return null;

    const form = new URLSearchParams();
    form.set('action', 'wa_episode_ajax_search');
    if (nonce) form.set('nonce', nonce);
    form.set('term_id', term);
    form.set('order', 'desc');
    form.set('q', String(epNum));

    let err;
    for (const h of [base, ...HOSTS.filter((x) => x !== base)]) {
      try {
        const ajax = ajaxUrl.startsWith('http') ? ajaxUrl : h + ajaxUrl.replace(/^\//, '');
        const r = await fetch(ajax, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: form.toString(),
          signal: AbortSignal.timeout(12000)
        });
        if (!r.ok) { err = new Error('ajax ' + r.status); continue; }
        const j = await r.json();
        const html = (j && j.data && j.data.html) || '';
        if (!html) { err = new Error('empty ajax'); continue; }
        const found = parseEpisodes(html);
        const exact = found.find((x) => String(x.ep) === String(epNum)) || found[0];
        if (exact) return exact.url;
      } catch (e) { err = e; }
    }
    // 3) last resort: construct common slug patterns (unreliable)
    return null;
  });
}

async function servers(epUrl) { return memo('v:' + epUrl, 10 * 60e3, async () => parseServers(await getHtml(new URL(epUrl).pathname + new URL(epUrl).search))); }

module.exports = { match, episodes, servers, findEpisode, listDubbed, _t: { parseCards, parseEpisodes, parseServers, score, norm } };
