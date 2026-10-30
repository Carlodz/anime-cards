// Anime catalogue (AniList) + episode links added by the site owner/admins + favourites + watch progress.
// Episode links are NOT scraped from anywhere: only https links that staff add themselves are played.
module.exports = function mountAnime({ app, sessionId, db, store, persist, isAdmin }) {
  store.anime = store.anime || {};
  store.anime.eps = store.anime.eps || {}; // anilistId -> [{ ep, label, url, kind }]

  const GQL = 'https://graphql.anilist.co';
  const cache = new Map();
  async function gql(query, variables, ttl = 10 * 60e3) {
    const key = query + JSON.stringify(variables);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < ttl) return hit.v;
    const r = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12000)
    });
    if (!r.ok) throw new Error('anilist ' + r.status);
    const j = await r.json();
    if (j.errors) throw new Error(j.errors[0].message);
    cache.set(key, { t: Date.now(), v: j.data });
    if (cache.size > 400) cache.delete(cache.keys().next().value);
    return j.data;
  }

  const CARD = `id title{romaji english} coverImage{large extraLarge color} bannerImage averageScore episodes format status seasonYear genres nextAiringEpisode{episode airingAt}`;
  const mapCard = (m) => ({
    id: m.id,
    title: (m.title && (m.title.english || m.title.romaji)) || '—',
    romaji: m.title && m.title.romaji,
    cover: m.coverImage && (m.coverImage.extraLarge || m.coverImage.large),
    color: m.coverImage && m.coverImage.color,
    banner: m.bannerImage,
    score: m.averageScore,
    episodes: m.episodes,
    format: m.format,
    status: m.status,
    year: m.seasonYear,
    genres: m.genres || [],
    next: m.nextAiringEpisode || null
  });

  const need = (req, res) => {
    const id = sessionId(req);
    if (!id) { res.status(401).json({ error: 'login' }); return null; }
    return id;
  };
  const wrap = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (e) { res.status(502).json({ error: 'anilist unavailable' }); }
  };

  const seasonNow = () => {
    const d = new Date(), m = d.getUTCMonth();
    return { season: ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(m / 3)], year: d.getUTCFullYear() };
  };

  // sec: trending | popular | season | airing | top
  app.get('/api/anime/browse', wrap(async (req, res) => {
    if (!need(req, res)) return;
    const sec = String(req.query.sec || 'trending');
    const page = Math.max(1, Math.min(50, parseInt(req.query.page) || 1));
    const genre = String(req.query.genre || '').slice(0, 30);
    const sortMap = { trending: 'TRENDING_DESC', popular: 'POPULARITY_DESC', season: 'POPULARITY_DESC', airing: 'POPULARITY_DESC', top: 'SCORE_DESC' };
    const sort = sortMap[sec] || 'TRENDING_DESC';
    const v = { page, sort: [sort], genre: genre || undefined };
    let extra = '';
    if (sec === 'season') { const s = seasonNow(); v.season = s.season; v.year = s.year; extra = ', season:$season, seasonYear:$year'; }
    if (sec === 'airing') extra = ', status:RELEASING';
    const q = `query($page:Int,$sort:[MediaSort],$genre:String${sec === 'season' ? ',$season:MediaSeason,$year:Int' : ''}){Page(page:$page,perPage:24){pageInfo{hasNextPage} media(type:ANIME,isAdult:false,sort:$sort,genre:$genre${extra}){${CARD}}}}`;
    const d = await gql(q, v);
    res.json({ items: d.Page.media.map(mapCard), more: d.Page.pageInfo.hasNextPage });
  }));

  app.get('/api/anime/search', wrap(async (req, res) => {
    if (!need(req, res)) return;
    const s = String(req.query.q || '').trim().slice(0, 80);
    if (s.length < 2) return res.json({ items: [] });
    const d = await gql(`query($s:String){Page(perPage:24){media(type:ANIME,isAdult:false,search:$s,sort:SEARCH_MATCH){${CARD}}}}`, { s });
    res.json({ items: d.Page.media.map(mapCard) });
  }));

  app.get('/api/anime/schedule', wrap(async (req, res) => {
    if (!need(req, res)) return;
    const from = Math.floor(Date.now() / 1000), to = from + 7 * 86400;
    const d = await gql(`query($a:Int,$b:Int){Page(perPage:50){airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){episode airingAt media{${CARD}}}}}`, { a: from, b: to }, 5 * 60e3);
    res.json({ items: d.Page.airingSchedules.filter((x) => x.media && !x.media.isAdult).map((x) => ({ ep: x.episode, at: x.airingAt, ...mapCard(x.media) })) });
  }));

  // public (login page background): trending posters only
  app.get('/api/anime/covers', async (req, res) => {
    try {
      const d = await gql(`query{Page(perPage:40){media(type:ANIME,isAdult:false,sort:TRENDING_DESC){coverImage{large}}}}`, {}, 60 * 60e3);
      res.json({ items: d.Page.media.map((m) => m.coverImage.large).filter(Boolean) });
    } catch (e) { res.json({ items: [] }); }
  });

  app.get('/api/anime/favs', (req, res) => {
    const id = need(req, res); if (!id) return;
    res.json({ items: db[id].favs || [] });
  });
  app.post('/api/anime/fav', (req, res) => {
    const id = need(req, res); if (!id) return;
    const b = req.body || {}, aid = parseInt(b.id);
    if (!aid) return res.status(400).json({});
    let f = db[id].favs || [];
    f = f.filter((x) => x.id !== aid);
    if (b.on) f.unshift({ id: aid, title: String(b.title || '').slice(0, 120), cover: String(b.cover || '').slice(0, 300) });
    db[id].favs = f.slice(0, 300);
    persist();
    res.json({ ok: true });
  });

  app.get('/api/anime/watching', (req, res) => {
    const id = need(req, res); if (!id) return;
    res.json({ items: (db[id].watch || []).slice(0, 20) });
  });
  app.post('/api/anime/progress', (req, res) => {
    const id = need(req, res); if (!id) return;
    const b = req.body || {}, aid = parseInt(b.id), ep = parseFloat(b.ep);
    if (!aid || !(ep >= 0)) return res.status(400).json({});
    let w = (db[id].watch || []).filter((x) => x.id !== aid);
    w.unshift({ id: aid, ep, title: String(b.title || '').slice(0, 120), cover: String(b.cover || '').slice(0, 300), t: Date.now() });
    db[id].watch = w.slice(0, 40);
    persist();
    res.json({ ok: true });
  });

  const kindOf = (u) => (/\.m3u8(\?|$)/i.test(u) ? 'hls' : /\.(mp4|webm|m4v)(\?|$)/i.test(u) ? 'video' : 'iframe');
  const epsOf = (aid) => (store.anime.eps[aid] || []).slice().sort((a, b) => a.ep - b.ep);

  app.get('/api/anime/:id(\\d+)', wrap(async (req, res) => {
    const uid = need(req, res); if (!uid) return;
    const aid = parseInt(req.params.id);
    const d = await gql(`query($id:Int){Media(id:$id,type:ANIME){${CARD} description(asHtml:false) trailer{id site} studios(isMain:true){nodes{name}} relations{edges{relationType node{id title{romaji english} coverImage{large} type}}}}}`, { id: aid });
    const m = d.Media, c = mapCard(m);
    c.description = String(m.description || '').replace(/<[^>]+>/g, '').slice(0, 1500);
    c.trailer = m.trailer && m.trailer.site === 'youtube' ? m.trailer.id : null;
    c.studio = m.studios && m.studios.nodes[0] ? m.studios.nodes[0].name : '';
    c.related = ((m.relations && m.relations.edges) || []).filter((e) => e.node.type === 'ANIME').slice(0, 8).map((e) => ({ id: e.node.id, rel: e.relationType, title: e.node.title.english || e.node.title.romaji, cover: e.node.coverImage.large }));
    const w = (db[uid].watch || []).find((x) => x.id === aid);
    res.json({ anime: c, eps: epsOf(aid).map((e) => ({ ep: e.ep, label: e.label, kind: e.kind })), fav: !!(db[uid].favs || []).find((x) => x.id === aid), last: w ? w.ep : null, admin: isAdmin(uid) });
  }));

  // Resolve one playable link (only for logged-in users).
  app.get('/api/anime/:id(\\d+)/ep/:ep', (req, res) => {
    if (!need(req, res)) return;
    const e = epsOf(parseInt(req.params.id)).filter((x) => String(x.ep) === String(req.params.ep));
    res.json({ sources: e.map((x) => ({ label: x.label, url: x.url, kind: x.kind })) });
  });

  // ---- staff only: add / remove episode links ----
  app.post('/api/anime/eps', (req, res) => {
    const uid = need(req, res); if (!uid) return;
    if (!isAdmin(uid)) return res.status(403).json({});
    const b = req.body || {}, aid = parseInt(b.id);
    if (!aid) return res.status(400).json({ error: 'id' });
    // single: {id, ep, url, label}   bulk: {id, bulk:"1|https://..\n2|https://.."}
    const rows = [];
    if (b.bulk) String(b.bulk).split(/\r?\n/).forEach((l) => { const m = l.trim().match(/^(\d+(?:\.\d+)?)\s*[|,\s]\s*(https:\/\/\S+)$/); if (m) rows.push({ ep: parseFloat(m[1]), url: m[2] }); });
    else rows.push({ ep: parseFloat(b.ep), url: String(b.url || '').trim() });
    const list = store.anime.eps[aid] || [];
    let n = 0;
    for (const r of rows) {
      if (!(r.ep >= 0) || !/^https:\/\/[^\s"'<>]{4,1500}$/.test(r.url)) continue;
      list.push({ ep: r.ep, label: String(b.label || 'Server').slice(0, 30), url: r.url, kind: kindOf(r.url) });
      n++;
    }
    store.anime.eps[aid] = list;
    persist();
    res.json({ ok: true, added: n });
  });
  app.delete('/api/anime/eps', (req, res) => {
    const uid = need(req, res); if (!uid) return;
    if (!isAdmin(uid)) return res.status(403).json({});
    const aid = parseInt(req.body && req.body.id), ep = String(req.body && req.body.ep);
    store.anime.eps[aid] = (store.anime.eps[aid] || []).filter((x) => String(x.ep) !== ep);
    persist();
    res.json({ ok: true });
  });
};
