/* Profile games: search a game in Settings, show it on your profile and on friends' profiles. */
(function(){
var AR=function(){try{return typeof LANG!=="undefined"&&LANG!=="en"}catch(e){return false}};
var T=function(a,b){return AR()?a:b};
var esc=function(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var me=function(){try{return typeof USER!=="undefined"?USER:null}catch(e){return null}};
var css=document.createElement("style");css.textContent=
".gms{margin:12px 0}.gms h4{margin:0 0 8px;font-size:13px;opacity:.8}.gms .gl{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}"+
".gm{position:relative;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);text-align:center}"+
".gm img,.gm .gi{width:100%;aspect-ratio:16/10;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:26px;background:rgba(0,0,0,.25)}"+
".gm span{display:block;padding:5px 6px;font-size:11px;font-weight:700;line-height:1.25;word-break:break-word}"+
".gm .gx{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;line-height:1}"+
".gsr{display:flex;align-items:center;gap:10px;padding:6px;border-radius:10px;background:rgba(255,255,255,.06);margin-top:6px;font-size:13px}.gsr img{width:56px;height:36px;object-fit:cover;border-radius:6px;flex:none;background:#0006}.gsr b{flex:1;min-width:0}"+
".gsr button,.gsec .gadd{border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#ff7ad9,#b04bff);color:#fff}"+
".gsec{margin:14px 16px}.gsec input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:inherit;font:inherit}.gsec .gn{font-size:12px;opacity:.7;margin:6px 0}";
document.head.appendChild(css);
function tiles(list,edit){return list.map(function(g){return'<div class="gm">'+(g.img?'<img loading="lazy" referrerpolicy="no-referrer" alt="" src="'+esc(g.img)+'">':'<div class="gi">\uD83C\uDFAE</div>')+'<span>'+esc(g.name)+'</span>'+(edit?'<button class="gx" type="button" data-gdel="'+esc(g.id)+'" aria-label="remove">\u00d7</button>':'')+'</div>'}).join("")}
window.gamesHtml=function(u){var l=u&&u.games;if(!l||!l.length)return"";return'<div class="gms"><h4>\uD83C\uDFAE '+T("\u0627\u0644\u0623\u0644\u0639\u0627\u0628","Games")+'</h4><div class="gl">'+tiles(l,false)+'</div></div>'};
function api(m,u,b){return fetch(u,{method:m,credentials:"same-origin",headers:b?{"Content-Type":"application/json"}:{},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})}
function save(list,done){api("POST","/api/profile/games",{games:list}).then(function(x){if(!x.ok)return;var u=me();if(u)u.games=x.j.games;done&&done();try{renderProfile()}catch(e){}})}
function paint(){var u=me(),w=document.getElementById("gcur");if(!u||!w)return;var l=u.games||[];w.innerHTML=l.length?'<div class="gl">'+tiles(l,true)+'</div>':'<div class="gn">'+T("\u0645\u0627 \u0636\u0641\u062a \u0623\u064a \u0644\u0639\u0628\u0629 \u0628\u0639\u062f","No games yet")+'</div>';var n=document.getElementById("gcnt");if(n)n.textContent=l.length+" / 6"}
function mount(){var st=document.getElementById("stg");if(!st||st.querySelector(".gsec"))return;var d=document.createElement("div");d.className="gsec";
d.innerHTML='<h4 style="margin:0 0 8px">\uD83C\uDFAE '+T("\u0623\u0644\u0639\u0627\u0628\u064a","My games")+' <small id="gcnt" style="opacity:.6"></small></h4><div id="gcur"></div><input id="gq" type="text" maxlength="60" autocomplete="off" placeholder="'+T("\u0627\u0628\u062d\u062b \u0639\u0646 \u0644\u0639\u0628\u0629\u2026","Search a game\u2026")+'"><div id="gres"></div>';
st.appendChild(d);paint();var tm=null,q=document.getElementById("gq"),res=document.getElementById("gres"),found=[];
q.addEventListener("input",function(){clearTimeout(tm);var v=q.value.trim();if(v.length<2){res.innerHTML="";return}tm=setTimeout(function(){api("GET","/api/games/search?q="+encodeURIComponent(v)).then(function(x){found=(x.j&&x.j.items)||[];res.innerHTML=found.length?found.map(function(g,i){return'<div class="gsr">'+(g.img?'<img referrerpolicy="no-referrer" alt="" src="'+esc(g.img)+'">':'<img alt="">')+'<b>'+esc(g.name)+(g.year?' <small style="opacity:.6">'+esc(g.year)+'</small>':'')+'</b><button type="button" data-gadd="'+i+'">+</button></div>'}).join(""):'<div class="gn">'+T("\u0644\u0627 \u0646\u062a\u0627\u0626\u062c","No results")+'</div>'})},400)});
d.addEventListener("click",function(e){var u=me();if(!u)return;var l=(u.games||[]).slice(),a=e.target.closest("[data-gadd]"),x=e.target.closest("[data-gdel]");
if(a){var g=found[+a.getAttribute("data-gadd")];if(!g||l.length>=6||l.some(function(y){return y.id===g.id}))return;l.push({id:g.id,name:g.name,img:g.img});save(l,paint)}
if(x){save(l.filter(function(y){return y.id!==x.getAttribute("data-gdel")}),paint)}})}
var so=window.stgOpen;if(typeof so==="function")window.stgOpen=function(){var r=so.apply(this,arguments);setTimeout(mount,0);return r};
var rp=window.renderProfile;if(typeof rp==="function")window.renderProfile=function(){var r=rp.apply(this,arguments);try{var u=me(),el=document.getElementById("profile");if(u&&el){var o=el.querySelector(".gms");if(o)o.remove();var h=window.gamesHtml(u),a=el.querySelector(".ph0");if(h&&a)a.insertAdjacentHTML("afterend",h)}}catch(e){}return r};
})();
