/* Wayanime – anime pages. Metadata comes from AniList (server proxy); videos come only from links staff add. */
(function(){
const A=(u,o)=>J(u,o);
const del=(u,b)=>J(u,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
const fmt={TV:'TV',TV_SHORT:'TV Short',MOVIE:'Movie',OVA:'OVA',ONA:'ONA',SPECIAL:'Special',MUSIC:'Music'};
const GENRES=['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'];
const img=u=>E(u||'/logo.png');

function card(a){
  const meta=[a.format&&(fmt[a.format]||a.format),a.year].filter(Boolean).join(' · ');
  return`<a class="an-c" href="#a-${a.id}">${a.score?`<span class="sc">★ ${(a.score/10).toFixed(1)}</span>`:''}${a.ep?`<span class="ep">EP ${E(a.ep)}</span>`:''}<img loading="lazy" decoding="async" src="${img(a.cover)}" alt=""><b>${E(a.title)}</b><small>${E(meta)}</small></a>`;
}
const row=(t,items)=>items&&items.length?`<h2>${E(t)}</h2><div class="an-row">${items.map(card).join('')}</div>`:'';

/* ---------- Home ---------- */
let homeBusy=false;
async function loadAHome(){
  const box=$('#ahome');if(!box||homeBusy)return;homeBusy=true;
  try{
    const [tr,ai,top,se,wa]=await Promise.all([
      A('/api/anime/browse?sec=trending'),A('/api/anime/browse?sec=airing'),A('/api/anime/browse?sec=top'),A('/api/anime/browse?sec=season'),
      A('/api/anime/watching').catch(()=>({items:[]}))]);
    const hero=tr.items.find(x=>x.banner)||tr.items[0];
    box.innerHTML=(hero?`<section class="an-hero" style="background-image:url('${E(hero.banner||hero.cover)}')"><div><small>TRENDING NOW</small><h1>${E(hero.title)}</h1><p>${E((hero.genres||[]).slice(0,4).join(' · '))}${hero.episodes?' · '+hero.episodes+' episodes':''}</p><a class="btn p" href="#a-${hero.id}">Watch now</a></div></section>`:'')
      +row('Continue watching',wa.items.map(w=>({id:w.id,title:w.title,cover:w.cover,ep:w.ep})))
      +row('Trending',tr.items)+row('Airing now',ai.items)+row('This season',se.items)+row('Top rated',top.items);
  }catch(e){box.innerHTML=e===401?'':'<p class="empty">Could not load anime right now. Try again in a moment.</p>'}
  homeBusy=false;
}

/* ---------- Browse ---------- */
const AB={sec:'trending',genre:'',page:1};
VIEWS.browse=async function(){
  const secs=[['trending','Trending'],['popular','Popular'],['season','This season'],['airing','Airing now'],['top','Top rated']];
  V.innerHTML=`<h2 style="margin-top:8px">Browse anime</h2><div class="an-tabs">${secs.map(([k,n])=>`<button data-s="${k}" class="${k===AB.sec?'on':''}">${n}</button>`).join('')}<select id="ang"><option value="">All genres</option>${GENRES.map(g=>`<option ${g===AB.genre?'selected':''}>${g}</option>`).join('')}</select></div><div class="an-grid" id="ang2"></div><button class="btn p an-more" id="anm" hidden>Load more</button>`;
  V.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{AB.sec=b.dataset.s;AB.page=1;VIEWS.browse()});
  $('#ang').onchange=e=>{AB.genre=e.target.value;AB.page=1;VIEWS.browse()};
  const more=async(reset)=>{
    try{const d=await A(`/api/anime/browse?sec=${AB.sec}&page=${AB.page}${AB.genre?'&genre='+encodeURIComponent(AB.genre):''}`);
      $('#ang2').insertAdjacentHTML('beforeend',d.items.map(card).join(''));$('#anm').hidden=!d.more;
      if(!d.items.length&&AB.page===1)$('#ang2').innerHTML='<p class="empty">Nothing here.</p>'}
    catch(e){$('#ang2').insertAdjacentHTML('beforeend','<p class="empty">AniList is busy, try again.</p>')}
  };
  $('#anm').onclick=()=>{AB.page++;more()};
  await more();
};

/* ---------- Schedule ---------- */
VIEWS.schedule=async function(){
  V.innerHTML='<h2 style="margin-top:8px">Airing schedule</h2><div class="an-sch" id="ans"><p class="empty">Loading…</p></div>';
  const d=await A('/api/anime/schedule'),days={};
  d.items.forEach(x=>{const dt=new Date(x.at*1000),k=dt.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'});(days[k]=days[k]||[]).push({...x,t:dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})})});
  $('#ans').innerHTML=Object.keys(days).map(k=>`<h3>${E(k)}</h3>`+days[k].map(x=>`<a class="an-sr" href="#a-${x.id}"><img loading="lazy" src="${img(x.cover)}" alt=""><div><b>${E(x.title)}</b><small>Episode ${x.ep}</small></div><time>${x.t}</time></a>`).join('')).join('')||'<p class="empty">No data.</p>';
};

/* ---------- Favourites ---------- */
VIEWS.favs=async function(){
  const d=await A('/api/anime/favs');
  V.innerHTML=`<h2 style="margin-top:8px">My list</h2>${d.items.length?`<div class="an-grid">${d.items.map(card).join('')}</div>`:'<p class="empty">Your list is empty. Open an anime and press “Add to list”.</p>'}`;
};

/* ---------- Search ---------- */
async function searchView(q){
  V.innerHTML=`<h2 style="margin-top:8px">Results for “${E(q)}”</h2><div class="an-grid" id="ans2"><p class="empty">Searching…</p></div>`;
  const d=await A('/api/anime/search?q='+encodeURIComponent(q));
  $('#ans2').innerHTML=d.items.length?d.items.map(card).join(''):'<p class="empty">No anime found.</p>';
}

/* ---------- Detail ---------- */
const uniq=eps=>[...new Set(eps.map(e=>e.ep))].sort((a,b)=>a-b);
async function detailView(id){
  V.innerHTML='<p class="empty">Loading…</p>';
  const d=await A('/api/anime/'+id),a=d.anime,nums=uniq(d.eps);
  const first=d.last!=null&&nums.includes(d.last)?d.last:nums[0];
  const total=a.episodes||nums.length;
  const grid=(nums.length?nums:Array.from({length:Math.min(total||12,200)},(_,i)=>i+1)).map(n=>`<button type="button" class="${nums.includes(n)?'':'off'}" data-n="${n}" ${nums.includes(n)?'':'disabled'}>${n}</button>`).join('');
  V.innerHTML=`<section class="an-det" style="background-image:url('${E(a.banner||a.cover)}')"><div class="an-top"><img src="${img(a.cover)}" alt=""><div>
    <h1>${E(a.title)}</h1><div class="an-meta">${a.score?`<span>★ ${(a.score/10).toFixed(1)}</span>`:''}${a.format?`<span>${E(fmt[a.format]||a.format)}</span>`:''}${a.year?`<span>${a.year}</span>`:''}${a.episodes?`<span>${a.episodes} eps</span>`:''}${a.status?`<span>${E(a.status.replace(/_/g,' '))}</span>`:''}${a.studio?`<span>${E(a.studio)}</span>`:''}</div>
    <div class="an-meta">${a.genres.map(g=>`<span>${E(g)}</span>`).join('')}</div>
    <div class="an-act">${first!=null?`<a class="btn p" href="#p-${id}-${first}">▶ ${d.last!=null?'Continue ep '+first:'Watch ep '+first}</a>`:'<span class="btn g" style="opacity:.6">No episodes yet</span>'}<button class="btn g" id="anfav">${d.fav?'✓ In my list':'+ Add to list'}</button>${a.trailer?`<a class="btn g" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=${E(a.trailer)}">Trailer</a>`:''}</div></div></div>
    <p class="an-desc">${E(a.description)}</p></section>
    <h2>Episodes</h2><div class="an-eps" id="aneps">${grid}</div>
    <div class="an-srv" id="ansrv" hidden></div>
    ${a.related.length?row('Related',a.related.map(r=>({id:r.id,title:r.title,cover:r.cover,format:r.rel.replace(/_/g,' ').toLowerCase()}))):''}`;
  let srvTok=0;
  const panel=$('#ansrv');
  V.querySelectorAll('#aneps button[data-n]').forEach(b=>b.onclick=async()=>{
    const n=b.dataset.n,tok=++srvTok;
    V.querySelectorAll('#aneps button').forEach(x=>x.classList.toggle('on',x===b));
    panel.hidden=false;panel.innerHTML=`<h3>Episode ${E(n)} · Servers</h3><p class="empty">Loading servers…</p>`;
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    let src=[];
    try{src=(await A(`/api/anime/${id}/ep/${n}`)).sources||[]}catch(e){}
    if(tok!==srvTok)return;
    panel.innerHTML=`<h3>Episode ${E(n)} · Servers</h3>`+(src.length?`<div class="an-srvl">${src.map((x,k)=>`<a href="#p-${id}-${n}-${k}"><span>▶</span>${E(x.label||'Server '+(k+1))}</a>`).join('')}</div>`:'<p class="empty">No servers available for this episode yet.</p>');
  });
  $('#anfav').onclick=async e=>{const on=e.target.textContent.indexOf('✓')<0;await P('/api/anime/fav',{id,on,title:a.title,cover:a.cover});e.target.textContent=on?'✓ In my list':'+ Add to list'};
}
/* ---------- Player ---------- */
let hlsP=null;
const loadHls=()=>window.Hls?Promise.resolve():hlsP||(hlsP=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)}));
let curHls=null;
async function playerView(id,ep,k0){
  V.innerHTML='<p class="empty">Loading…</p>';
  const [d,s]=await Promise.all([A('/api/anime/'+id),A(`/api/anime/${id}/ep/${ep}`)]),a=d.anime,nums=uniq(d.eps),i=nums.indexOf(+ep);
  const prev=nums[i-1],next=nums[i+1];
  V.innerHTML=`<div class="an-pl"><div><div class="an-vid" id="anv"></div>
    <div class="an-bar" id="ansrc">${s.sources.map((x,k)=>`<button data-k="${k}">${E(x.label)}</button>`).join('')}</div>
    <h2 style="margin:6px 0"><a href="#a-${id}" style="color:inherit">${E(a.title)}</a> · Episode ${E(ep)}</h2>
    <div class="an-bar">${prev!=null?`<a href="#p-${id}-${prev}">◀ Prev</a>`:''}<a href="#a-${id}">All episodes</a>${next!=null?`<a href="#p-${id}-${next}">Next ▶</a>`:''}</div></div>
    <aside class="an-side"><h3>Episodes</h3><div class="an-eps">${nums.map(n=>`<a class="${n==ep?'on':''}" href="#p-${id}-${n}">${n}</a>`).join('')}</div></aside></div>`;
  P('/api/anime/progress',{id,ep:+ep,title:a.title,cover:a.cover}).catch(()=>{});
  const box=$('#anv');
  const play=async k=>{
    const x=s.sources[k];V.querySelectorAll('#ansrc button').forEach(b=>b.classList.toggle('on',+b.dataset.k===k));
    if(curHls){curHls.destroy();curHls=null}box.innerHTML='';
    if(!x){box.innerHTML='<div class="none">No source for this episode yet.</div>';return}
    if(x.kind==='iframe'){const f=document.createElement('iframe');f.allowFullscreen=true;f.allow='autoplay; fullscreen; picture-in-picture';f.referrerPolicy='no-referrer';f.src=x.url;box.appendChild(f);return}
    const v=document.createElement('video');v.controls=true;v.playsInline=true;v.autoplay=true;box.appendChild(v);
    const key=`an:t:${id}:${ep}`;let last=0;
    v.addEventListener('loadedmetadata',()=>{const t=+localStorage.getItem(key);if(t>5&&t<v.duration-30)v.currentTime=t});
    v.addEventListener('timeupdate',()=>{if(Date.now()-last>5000){last=Date.now();try{localStorage.setItem(key,v.currentTime)}catch(e){}}});
    v.addEventListener('ended',()=>{try{localStorage.removeItem(key)}catch(e){}if(next!=null)location.hash=`#p-${id}-${next}`});
    if(x.kind==='hls'&&!v.canPlayType('application/vnd.apple.mpegurl')){
      try{await loadHls();if(Hls.isSupported()){curHls=new Hls();curHls.loadSource(x.url);curHls.attachMedia(v)}else v.src=x.url}catch(e){box.innerHTML='<div class="none">Could not load the player.</div>'}
    }else v.src=x.url;
  };
  V.querySelectorAll('#ansrc button').forEach(b=>b.onclick=()=>play(+b.dataset.k));
  play(s.sources[k0]?k0:0);
}

/* ---------- Routing hooks ---------- */
const OLD=['library','store','aura'];
OLD.forEach(k=>delete VIEWS[k]);Object.keys(VIEWS).filter(k=>k.indexOf('pack-')===0).forEach(k=>delete VIEWS[k]);
window.animeRoute=function(h){
  let m;
  if(m=h.match(/^a-(\d+)$/))return()=>detailView(+m[1]);
  if(m=h.match(/^p-(\d+)-([\d.]+)(?:-(\d+))?$/))return()=>playerView(+m[1],m[2],m[3]!=null?+m[3]:0);
  if(m=h.match(/^s-(.+)$/))return()=>searchView(decodeURIComponent(m[1]));
};
const q=$('#q');
if(q){q.placeholder='Search anime… (Enter)';q.addEventListener('keydown',e=>{if(e.key==='Enter'&&q.value.trim().length>1)location.hash='#s-'+encodeURIComponent(q.value.trim())})}
const goHome=()=>{const h=location.hash.slice(1);if(OLD.includes(h)||h.indexOf('pack-')===0){location.hash='#browse';return}if(!h||h==='home')loadAHome()};
addEventListener('hashchange',()=>{if(curHls&&!/^p-/.test(location.hash.slice(1))){curHls.destroy();curHls=null}goHome()});
setInterval(()=>{const l=$('#login');if(l&&l.style.display==='grid')return;const b=$('#ahome');if(b&&!b.children.length&&$('#home').style.display!=='none')goHome()},1200);
goHome();if(window.route)route();
})();
