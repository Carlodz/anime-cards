/* Spotify link: Settings card + "Listening now" / "Top artists" on profiles. Server side: /api/spotify/* in server.js */
(function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var okImg = function (u) { return /^https:\/\/[\w.-]+\.(scdn\.co|spotifycdn\.com)\//.test(u || ''); };
  var okLink = function (u) { return /^https:\/\/open\.spotify\.com\//.test(u || ''); };
  var jget = function (u) { return fetch(u, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); };
  var jpost = function (u, b) { return fetch(u, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); };
  var fmt = function (ms) { var t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  var LOGO = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1db954"/><path d="M6.5 9.2c3.6-1 7.6-.7 10.8 1M7 12.4c3-.8 6.2-.5 9 1M7.6 15.4c2.4-.6 4.8-.4 7 .7" fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round"/></svg>';

  /* ---- profile widget: SPW(userId, element) ---- */
  window.SPW = function (id, el) {
    if (!el || !id) return;
    var timer, tick, st = null;
    function draw() {
      if (!st || !st.ok) { el.innerHTML = ''; return; }
      var h = '', n = st.now;
      if (n) {
        var inner = (n.art && okImg(n.art) ? '<img loading="lazy" decoding="async" src="' + esc(n.art) + '" alt="">' : '<span class="spc"></span>') +
          '<div><small>' + LOGO.replace('width="18" height="18"', 'width="12" height="12"') + (n.playing ? 'Listening now <span class="spe"><i></i><i></i><i></i></span>' : 'Paused on Spotify') + '</small><b>' + esc(n.song) + '</b><em>' + esc(n.artist) + '</em>' +
          (n.dur ? '<div class="spb"><b id="spbar"></b></div>' : '') + '</div>';
        h += okLink(n.url) ? '<a class="spn' + (n.playing ? '' : ' pz') + '" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : '<div class="spn' + (n.playing ? '' : ' pz') + '">' + inner + '</div>';
      }
      if (st.top && st.top.length) {
        h += '<div class="spt"><h4>Top artists on Spotify</h4>' + st.top.map(function (a) {
          var im = a.img && okImg(a.img) ? '<img loading="lazy" decoding="async" src="' + esc(a.img) + '" alt="">' : '<img alt="" src="/favicon.png">';
          return (okLink(a.url) ? '<a class="spa" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' : '<div class="spa">') + im + '<span>' + esc(a.name) + '</span>' + (okLink(a.url) ? '</a>' : '</div>');
        }).join('') + '</div>';
      }
      el.innerHTML = h;
    }
    function run() {
      if (!document.body.contains(el)) { clearInterval(timer); clearInterval(tick); return; }
      jget('/api/spotify/profile/' + encodeURIComponent(id)).then(function (d) { st = d; st.t0 = Date.now(); draw(); }).catch(function () { });
    }
    tick = setInterval(function () {
      if (!st || !st.now || !st.now.dur) return;
      var b = el.querySelector('#spbar'); if (!b) return;
      var p = st.now.pos + (st.now.playing ? Date.now() - st.t0 : 0);
      b.style.width = Math.min(100, p / st.now.dur * 100) + '%';
    }, 1000);
    timer = setInterval(run, 15000); run();
  };

  /* ---- Settings card ---- */
  function setCard() {
    var box = document.getElementById('sspot'); if (!box) return;
    jget('/api/spotify/status').then(function (d) {
      var q = new URLSearchParams(location.search).get('splink');
      var note = { ok: 'Spotify linked.', cancel: 'Spotify link cancelled.', bad: 'Could not link Spotify. Try again.' }[q];
      box.className = 'sc ssp';
      var body;
      if (!d.configured) body = '<p class="bad">Spotify is not set up on this server (needs SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET).</p>';
      else if (!d.linked) body = '<div class="row"><a class="btn p" href="/auth/spotify/link">Link Spotify</a></div>';
      else body = '<div class="row"><b class="spg">Linked' + (d.name ? ' as ' + esc(d.name) : '') + '</b><button class="btn g" style="border:1px solid var(--line)" id="spun" type="button">Unlink</button></div>' +
        '<label class="tg"><input type="checkbox" id="spsh" ' + (d.show ? 'checked' : '') + '> Show what I\u2019m listening to and my top artists on my profile</label>';
      box.innerHTML = '<h3>' + LOGO + '<span>Spotify</span></h3><p>Link your Spotify account to show your current song and your top artists on your profile. We only read what you listen to; we never change your account.</p>' +
        (note ? '<p class="' + (q === 'ok' ? 'ok' : 'bad') + '">' + note + '</p>' : '') + body;
      var un = document.getElementById('spun'); if (un) un.onclick = function () { jpost('/api/spotify/unlink').then(setCard).catch(setCard); };
      var sh = document.getElementById('spsh'); if (sh) sh.onchange = function () { jpost('/api/spotify/show', { show: sh.checked }).catch(function () { }); };
    }).catch(function () { box.innerHTML = ''; });
  }
  window.SPSET = setCard;
  function chk() { if (location.hash === '#settings') setCard(); }
  window.addEventListener('hashchange', chk);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chk); else chk();
})();
