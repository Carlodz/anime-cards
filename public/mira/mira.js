/* Mira: assistant shown in every theme except Zero Two. Same behaviour as Zero Two (hello bubble, click to chat, owner card, Discord button). */
(function(){
var FW=290,FH=498,N=145,COLS=6,PER=30,FPS=24,SHEETS=5,V="1";
var sheets=[],idle=new Image(),idleOk=false,ready=false,started=false;
var hist=[],busy=false,tmr=null,anim=0,audio=null,myName="",myGender="",needName=false,songAudio=null,ICON_ON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;pointer-events:none"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',ICON_OFF='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;pointer-events:none"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',ICON_SEND='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;pointer-events:none"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
var muted=false;try{muted=localStorage.getItem("mira_mute")==="1"}catch(e){}
idle.onload=function(){idleOk=true;redraw()};idle.src="/mira/idle.webp?v="+V;
function loadSheets(){
  if(started)return;started=true;var n=0;
  for(var i=0;i<SHEETS;i++){(function(i){var im=new Image();im.onload=function(){if(++n===SHEETS)ready=true};im.src="/mira/s"+i+".webp?v="+V;sheets[i]=im})(i)}}
function afterLoad(){setTimeout(loadSheets,1500)}
if(document.readyState==="complete")afterLoad();else addEventListener("load",afterLoad);
var cvs=null,ctx=null;
function redraw(){if(!ctx)return;ctx.clearRect(0,0,FW,FH);if(idleOk)ctx.drawImage(idle,0,0,FW,FH)}
function drawFrame(i,a){
  var s=Math.floor(i/PER),k=i%PER,im=sheets[s];if(!im)return;
  ctx.globalAlpha=a==null?1:a;ctx.drawImage(im,(k%COLS)*FW,Math.floor(k/COLS)*FH,FW,FH,0,0,FW,FH);ctx.globalAlpha=1}
function stopAnim(root){cancelAnimationFrame(anim);if(audio){try{audio.pause()}catch(e){}}root.classList.remove("play");redraw()}
function wave(root){
  if(!ctx)return;stopAnim(root);
  try{if(!audio)audio=new Audio("/mira/hello.mp3?v="+V);audio.currentTime=0;var p=audio.play();if(p&&p.catch)p.catch(function(){})}catch(e){}
  if(!ready){return}
  root.classList.add("play");var t0=performance.now(),fade=.14;
  (function step(now){
    var t=(now-t0)/1000,i=Math.floor(t*FPS);
    if(i>=N){root.classList.remove("play");redraw();return}
    ctx.clearRect(0,0,FW,FH);
    if(t<fade){if(idleOk)ctx.drawImage(idle,0,0,FW,FH);drawFrame(0,t/fade)}else drawFrame(i);
    anim=requestAnimationFrame(step)})(t0)}
function isAr(t){return /[\u0600-\u06FF]/.test(t)}
var VOX={};
try{if(window.speechSynthesis)speechSynthesis.addEventListener("voiceschanged",function(){VOX={}})}catch(e){}
var RE_MALE=/(^|[^e])male\b|naayf|hamed|shakir|maged|tarik|fahed|omar|mehdi|henri|thomas|paul\b|claude|antoine|david|mark\b|james|george|daniel|alex\b|guy\b|ryan|fred\b|jorge|diego|rishi|oliver|christopher|eric\b|bruce|aaron|arthur|gordon|lee\b|reed|rocko|grandpa|ralph|albert|junior|kathy_/i,
    RE_FEM=/female|femme|woman|zira|samantha|hoda|salma|laila|layla|zariyah|amira|hedda|aria\b|jenny|sara\b|hortense|denise|eloise|julie|siri|karen|moira|tessa|fiona|victoria|ava\b|allison|susan|catherine|amelie|am\u00e9lie|audrey|marie|google (?:us|uk|fran\u00e7ais|\u0627\u0644\u0639\u0631\u0628\u064a\u0629)/i;
function pickVoice(pre){
  if(VOX[pre]!==undefined)return VOX[pre];
  var all=speechSynthesis.getVoices();if(!all.length)return null;
  var L=all.filter(function(x){return String(x.lang||"").toLowerCase().replace("_","-").indexOf(pre)===0}),
      v=L.filter(function(x){return RE_FEM.test(x.name)&&!RE_MALE.test(x.name)})[0]||L.filter(function(x){return !RE_MALE.test(x.name)})[0]||null;
  VOX[pre]=v;return v}
function speak(root,txt){
  if(muted||!window.speechSynthesis||!txt)return;
  try{
    var ar=isAr(txt),fr=!ar&&(/[\u00e0\u00e2\u00e7\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f9\u00fb\u00fc\u0153]/i.test(txt)||/\b(le|la|les|je|tu|est|pas|des|une|bonjour|salut|merci)\b/i.test(txt)),
        pre=ar?"ar":fr?"fr":"en",u=new SpeechSynthesisUtterance(txt.replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF]/gu,""));
    u.lang=ar?"ar-SA":fr?"fr-FR":"en-US";
    var v=pickVoice(pre);if(v){u.voice=v;u.lang=v.lang}
    u.rate=1;u.pitch=v&&RE_FEM.test(v.name)?1.2:1.9; /* no female voice found: raise the pitch so she never sounds like a man */
    u.onstart=function(){root.classList.add("speak")};
    var end=function(){root.classList.remove("speak")};u.onend=end;u.onerror=end;speechSynthesis.speak(u)}catch(e){}}
function setReply(root,txt,ex){
  var r=root.querySelector(".mr-reply");r.textContent="";
  var t=document.createElement("div");t.textContent=txt;r.appendChild(t);
  var extra=false;
  if(ex&&ex.card&&ex.card.username){
    extra=true;var c=document.createElement("div");c.className="zcard";
    var im=document.createElement("img");im.alt="";im.src="/favicon.png";
    try{if(typeof avSrc==="function")im.src=avSrc(ex.card)}catch(e){}
    var nm=document.createElement("div");nm.className="znm";
    var b1=document.createElement("b");b1.textContent=ex.card.username;
    var b2=document.createElement("span");b2.textContent="Owner";
    nm.appendChild(b1);nm.appendChild(b2);
    if(ex.card.status){var s2=document.createElement("small");s2.textContent=ex.card.status;nm.appendChild(s2)}
    c.appendChild(im);c.appendChild(nm);r.appendChild(c)}
  if(ex&&ex.action&&typeof ex.action.url==="string"&&ex.action.url.indexOf("https://discord.gg/")===0){
    extra=true;var a=document.createElement("a");a.className="zbtn";a.href=ex.action.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Open Discord";r.appendChild(a)}
  if(ex&&ex.song&&((typeof ex.song.yt==="string"&&/^[\w-]{11}$/.test(ex.song.yt))||(typeof ex.song.preview==="string"&&ex.song.preview.indexOf("https://")===0))){
    extra=true;var sp=document.createElement("div");sp.className="zsong";
    var si=document.createElement("img");si.alt="";si.referrerPolicy="no-referrer";if(typeof ex.song.pic==="string"&&ex.song.pic.indexOf("https://")===0)si.src=ex.song.pic;
    var st=document.createElement("div");st.className="zs-t";var sb=document.createElement("b");sb.textContent=String(ex.song.artist||"").slice(0,60);var sm=document.createElement("small");sm.textContent=String(ex.song.title||"").slice(0,80);st.appendChild(sb);st.appendChild(sm);
    var eq=document.createElement("span");eq.className="zs-eq";eq.innerHTML="<i></i><i></i><i></i>";
    var pb=document.createElement("button");pb.type="button";pb.setAttribute("aria-label","Play / pause");
    var playing=!!(songAudio&&!songAudio.paused);pb.innerHTML=playing?ICON_PAUSE:ICON_PLAY;
    pb.addEventListener("click",function(e){e.stopPropagation();if(!songAudio)return;
      if(!songAudio.paused){songAudio.pause();root.classList.remove("speak","sing");pb.innerHTML=ICON_PLAY}
      else{if(songAudio.ended)songAudio.currentTime=0;songAudio.play().then(function(){root.classList.add("speak","sing");pb.innerHTML=ICON_PAUSE}).catch(function(){})}});
    sp.appendChild(si);sp.appendChild(st);sp.appendChild(eq);sp.appendChild(pb);r.appendChild(sp)}
  if(ex&&Array.isArray(ex.actions)){
    var bx=document.createElement("div");bx.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
    ex.actions.slice(0,3).forEach(function(q){
      if(!q||typeof q.url!=="string"||(q.url.indexOf("https://discord.gg/")!==0&&q.url.indexOf("https://wa.me/")!==0))return;
      var l=document.createElement("a");l.className="zbtn";l.href=q.url;l.target="_blank";l.rel="noopener noreferrer";
      l.textContent=String(q.label||"Open").slice(0,20);if(q.url.indexOf("https://wa.me/")===0)l.style.background="#25d366";bx.appendChild(l);extra=true});
    if(bx.childNodes.length)r.appendChild(bx)}
  r.classList.toggle("zx",extra);
  r.classList.add("on");clearTimeout(tmr);tmr=setTimeout(function(){r.classList.remove("on")},extra?60000:20000)}
function close(root){stopSong(root);hideMe(root);root.classList.remove("talk","speak");root.querySelector(".mr-reply").classList.remove("on");hist=[];if(window.speechSynthesis)try{speechSynthesis.cancel()}catch(e){}}
var SV18='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" style="display:block;pointer-events:none">',
    ICON_PLAY=SV18+'<path d="M8 5v14l11-7z"/></svg>',ICON_PAUSE=SV18+'<path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    SILENT="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
    RE_SING=/^\s*(?:(?:ya\s+|يا\s*)?(?:mira|ميرا)\s*[,،:!]*\s*)?(?:غنيلي|غنّيلي|غني ?لي|غنّي ?لي|غنى ?لي|غني|غنّي|ghanili+|ghenili+|ganili+|ghann?i ?li+|gann?i ?li+|ghanni|ghani|ganni|sing(?: me)?|chante(?:[- ]moi)?)\s+(.{2,80})$/i;
function showMe(root,t){var e=root.querySelector(".mr-me");if(!e)return;e.textContent=String(t).slice(0,80);e.classList.add("on");root.classList.add("hasme")}
function hideMe(root){var e=root.querySelector(".mr-me");if(e)e.classList.remove("on");root.classList.remove("hasme")}
function stopSong(root){if(songAudio){try{songAudio.pause()}catch(e){}}if(root)root.classList.remove("sing")}
var yt={p:null,ready:false,paused:true,ended:false,root:null,fail:null,
  pause:function(){try{if(this.p&&this.ready)this.p.pauseVideo()}catch(e){}},
  play:function(){try{if(this.p&&this.ready)this.p.playVideo()}catch(e){}return Promise.resolve()},
  set currentTime(v){try{if(this.p&&this.ready)this.p.seekTo(v,true)}catch(e){}}},ytApi=0;
function ytLoad(){
  if(window.YT&&window.YT.Player)return Promise.resolve();
  return new Promise(function(res,rej){
    if(ytApi){ytApi.push(res);return}
    ytApi=[res];var prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){try{if(prev)prev()}catch(e){}var q=ytApi;ytApi=0;(q||[]).forEach(function(f){f()})};
    var sc=document.createElement("script");sc.src="https://www.youtube.com/iframe_api";sc.onerror=function(){ytApi=0;rej(new Error("yt"))};document.head.appendChild(sc)})}
function ytState(e){
  var st=e&&e.data,root=yt.root;if(!root)return;var b=root.querySelector(".zsong button");
  if(st===1){yt.paused=false;yt.ended=false;root.classList.add("speak","sing");if(b)b.innerHTML=ICON_PAUSE}
  else if(st===2||st===0){yt.paused=true;yt.ended=st===0;root.classList.remove("speak","sing");if(b)b.innerHTML=ICON_PLAY}}
function startYt(root,vid){
  songAudio=yt;yt.root=root;yt.paused=true;yt.ended=false;
  return ytLoad().then(function(){return new Promise(function(res,rej){
    var to=setTimeout(function(){rej(new Error("timeout"))},9000);
    if(yt.p&&yt.ready){clearTimeout(to);try{yt.p.loadVideoById(vid)}catch(e){return rej(e)}res();return}
    var old=document.getElementById("mr-yt-host");if(old)old.remove();
    yt.p=null;yt.ready=false;
    var host=document.createElement("div");host.id="mr-yt-host";host.style.cssText="position:fixed;left:-9999px;top:0;width:220px;height:220px;opacity:0;pointer-events:none";
    var fr=document.createElement("iframe");fr.width="220";fr.height="220";fr.setAttribute("allow","autoplay; encrypted-media");fr.setAttribute("title","Mira");
    fr.src="https://www.youtube.com/embed/"+vid+"?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&fs=0&disablekb=1&origin="+encodeURIComponent(location.origin);
    host.appendChild(fr);document.body.appendChild(host);
    yt.p=new YT.Player(fr,{events:{
      onReady:function(){clearTimeout(to);yt.ready=true;try{yt.p.setVolume(100);yt.p.playVideo()}catch(e){}res()},
      onStateChange:ytState,
      onError:function(){clearTimeout(to);yt.ready=false;if(yt.fail)yt.fail()}}})})})}
function songReq(root,t,q,inp,btn){
  var a=LG()==="ar";
  showMe(root,t);busy=true;btn.disabled=true;stopSong(root);
  if(audio){try{audio.pause()}catch(e){}}
  var au=new Audio();au.src=SILENT;try{var pp=au.play();if(pp&&pp.catch)pp.catch(function(){})}catch(e){}
  songAudio=au;ytLoad().catch(function(){});
  setReply(root,a?"لحظة، أجهز الأغنية...":"One sec, getting the song ready...");
  function getSong(prev){return fetch("/api/mira-song?q="+encodeURIComponent(q)+(prev?"&src=preview":""),{credentials:"same-origin"})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status)})}
  function usePreview(j){
    if(!j||typeof j.preview!=="string"||j.preview.indexOf("https://")!==0)return Promise.reject(404);
    songAudio=au;au.src=j.preview;au.volume=1;
    au.onended=function(){root.classList.remove("speak","sing");var b=root.querySelector(".zsong button");if(b)b.innerHTML=ICON_PLAY};
    var go=au.play(),p=go&&go.then?go:Promise.resolve();
    return p.then(function(){root.classList.add("speak","sing")},function(){}).then(function(){
      setReply(root,a?"أغني لك الآن \u266A":"Singing for you \u266A",{song:j})})}
  function viaPreview(){return getSong(true).then(usePreview)}
  getSong(false).then(function(j){
    if(j&&typeof j.yt==="string"&&/^[\w-]{11}$/.test(j.yt)){
      yt.fail=function(){stopSong(root);viaPreview().catch(function(){root.classList.remove("speak","sing");setReply(root,a?"ما أقدر أشغل هذه الأغنية":"I can't play this one")})};
      return startYt(root,j.yt).then(function(){setReply(root,a?"أغني لك الآن \u266A":"Singing for you \u266A",{song:j})},function(){return Promise.reject("yt")})}
    return usePreview(j)})
    .catch(function(e){
      if(e==="yt"||(e&&e.message))return viaPreview();
      return Promise.reject(e)})
    .catch(function(e){root.classList.remove("speak","sing");setReply(root,e===404?(a?"ما لقيت هذه الأغنية":"I couldn't find that song"):e===429?(a?"مهلاً قليلاً":"Slow down a little"):(a?"ما أقدر أغني الآن...":"I can't sing right now..."))})
    .then(function(){busy=false;btn.disabled=false;inp.focus()})}
function LG(){try{return LANG==="ar"?"ar":"en"}catch(e){return"en"}}
function askMsg(){return LG()==="ar"?(myGender==="f"?"مرحباً عزيزتي \uD83D\uDC4B اكتبي اسمك لنتعرف":"مرحباً عزيزي \uD83D\uDC4B اكتب اسمك لنتعرف"):"Hello dear \uD83D\uDC4B Write your name so we can get to know each other"}
function greet(){if(needName)return askMsg();if(myName)return LG()==="ar"?"مرحباً يا "+myName+" \uD83D\uDC4B كيف أقدر أساعدك اليوم؟":"Hello "+myName+" \uD83D\uDC4B What can I help you with today?";return"Hello \uD83D\uDC4B What can I help you with today?"}
function saveName(root,t,inp){
  var n=t.replace(/[^\p{L}\p{N}_ .\-]/gu,"").replace(/\s+/g," ").trim();
  if(!n||n.length>20||t.length>30){setReply(root,LG()==="ar"?(myGender==="f"?"اكتبي اسمك فقط من فضلك":"اكتب اسمك فقط من فضلك"):"Just your name, please");return}
  busy=true;
  fetch("/api/mira-name",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
    .then(function(j){myName=j.name;needName=false;var m=LG()==="ar"?"تشرفنا يا "+myName+"! كيف أقدر أساعدك؟":"Nice to meet you, "+myName+"! How can I help you?";setReply(root,m);speak(root,m)})
    .catch(function(e){setReply(root,e===429?"Slow down a little":"I can't save it right now...")})
    .then(function(){busy=false;if(inp)inp.focus()})}
function onGender(g){
  myGender=g;var root=document.querySelector(".mr");if(!root||!root.offsetWidth)return;
  var a=LG()==="ar",msg=a?(g==="f"?"أهلاً بكِ يا جميلة \uD83D\uDC96 أنا ميرا، سعيدة جداً بتعرفي عليكِ":"أهلاً بك! أنا ميرا، سعيدة بتعرفي عليك"):(g==="f"?"Welcome, beautiful \uD83D\uDC96 I'm Mira, so happy to meet you":"Welcome! I'm Mira, happy to meet you");
  root.classList.add("talk");wave(root);setReply(root,msg);speak(root,msg);
}
(function(){var f0=window.fetch;if(!f0||f0.__mgd)return;
  var nf=function(u,o){var p=f0.apply(this,arguments);
    try{var url=typeof u==="string"?u:(u&&u.url)||"";
      if(url.indexOf("/api/gender")>-1&&o&&typeof o.body==="string"){var g=JSON.parse(o.body).gender;
        p.then(function(r){if(r.ok&&(g==="f"||g==="m"))onGender(g)}).catch(function(){})}}catch(e){}
    return p};
  nf.__mgd=1;window.fetch=nf})();
function nameCheck(n){
  n=n||0;if(n>80)return;
  fetch("/api/mira-name",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():Promise.reject(r.status)}).then(function(j){
    myName=j.name||"";myGender=j.gender||"";
    var asked=false;try{asked=sessionStorage.getItem("mira_asked")==="1"}catch(e){}
    if(!j.ask||myName||asked)return;
    setTimeout(function(){
      var root=document.querySelector(".mr");if(!root||!root.offsetWidth||needName)return;
      try{sessionStorage.setItem("mira_asked","1")}catch(e){}
      needName=true;root.classList.add("talk");wave(root);setReply(root,askMsg());
      var i=root.querySelector(".mr-in input");if(i)setTimeout(function(){i.focus()},50)},2500)
  }).catch(function(){setTimeout(function(){nameCheck(n+1)},5000)})}
function build(st){
  var root=document.createElement("div");root.className="mr";
  root.innerHTML='<div class="mr-sh"></div><div class="mr-nt" aria-hidden="true"><i>\u266A</i><i>\u266B</i><i>\u266A</i></div><canvas class="mr-cv" width="'+FW+'" height="'+FH+'" aria-hidden="true"></canvas>'+
    '<div class="mr-sg" aria-hidden="true"><img class="mr-sg-l" src="/mira/sing.webp?v=3" alt="" draggable="false"><img class="mr-sg-t" src="/mira/base.webp?v=3" alt="" draggable="false"><img class="mr-sg-h" src="/mira/hair.webp?v=3" alt="" draggable="false"><img class="mr-sg-m" src="/mira/mouth.webp?v=3" alt="" draggable="false"></div>'+
    '<button class="mr-hit" type="button" aria-label="Talk to Mira"></button>'+
    '<div class="mr-hello" aria-hidden="true">Hello<i>\uD83D\uDC4B</i></div>'+
    '<div class="mr-me"></div><div class="mr-reply" role="status"></div>'+
    '<div class="mr-in"><button class="mr-mute" type="button" aria-label="Sound">'+(muted?ICON_OFF:ICON_ON)+'</button><input type="text" maxlength="200" placeholder="..." aria-label="Message"><button class="mr-send" type="button" aria-label="Send">'+ICON_SEND+'</button></div>';
  cvs=root.querySelector(".mr-cv");ctx=cvs.getContext("2d");redraw();
  var hit=root.querySelector(".mr-hit"),f=root.querySelector(".mr-in"),rep=root.querySelector(".mr-reply"),
      inp=f.querySelector("input"),btn=f.querySelector(".mr-send"),mb=f.querySelector(".mr-mute");
  function send(){
    var t=inp.value.trim();if(!t||busy)return;
    if(needName){inp.value="";showMe(root,t);saveName(root,t,inp);return}
    var ms=RE_SING.exec(t);
    if(ms){inp.value="";songReq(root,t,ms[1].trim(),inp,btn);return}
    if(window.speechSynthesis){try{speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(""))}catch(e){}}
    inp.value="";busy=true;btn.disabled=true;showMe(root,t);hist.push({role:"user",content:t});setReply(root,"...");
    fetch("/api/mira-chat",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist})})
      .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
      .then(function(j){hist.push({role:"assistant",content:j.reply});setReply(root,j.reply,j);speak(root,j.reply)})
      .catch(function(e){hist.pop();setReply(root,e===429?"Slow down a little \uD83D\uDE18":"I can't talk right now...")})
      .then(function(){busy=false;btn.disabled=false;inp.focus()})}
  hit.addEventListener("click",function(e){e.stopPropagation();
    if(root.classList.contains("talk")){close(root);return}
    hideMe(root);root.classList.add("talk");wave(root);setReply(root,greet());setTimeout(function(){inp.focus()},50)});
  btn.addEventListener("click",send);
  mb.addEventListener("click",function(e){e.stopPropagation();muted=!muted;mb.innerHTML=muted?ICON_OFF:ICON_ON;try{localStorage.setItem("mira_mute",muted?"1":"0")}catch(x){}if(muted&&window.speechSynthesis)try{speechSynthesis.cancel()}catch(x){}});
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")send();else if(e.key==="Escape")close(root)});
  document.addEventListener("click",function(e){if(root.classList.contains("talk")&&!f.contains(e.target)&&!rep.contains(e.target))close(root)});
  st.appendChild(root)}
function ensure(){
  if(!document.querySelector(".hero .stage")||document.querySelector(".mr"))return;
  build(document.body);place()}
function place(){
  var m=document.querySelector(".mr"),h=document.querySelector(".hero");if(!m||!h)return;
  var hr=h.getBoundingClientRect();if(!hr.width)return;
  var op=m.offsetParent||document.documentElement,pr=op.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight;
  if(!mh)return;
  var x=hr.left-pr.left+(innerWidth>700?53:6),y=hr.top-pr.top+mh*0.40-mh;
  m.style.setProperty("--mx",Math.round(x)+"px");m.style.setProperty("--my",Math.round(y)+"px")}
addEventListener("resize",place);
ensure();setInterval(function(){ensure();place()},400);(function(){var s=document.createElement("style");s.textContent=".mr-sh{position:absolute;left:10%;width:88%;top:calc(60% - 3px);height:12px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.6),rgba(0,0,0,0) 72%);filter:blur(1.5px);pointer-events:none;z-index:-1}";document.head.appendChild(s)})();
(function(){var s=document.createElement("style");var Z='html:not([data-theme="zero"]) ';
s.textContent=".mr-me{display:none}"+
Z+".mr.talk .mr-me.on{display:block;position:absolute;z-index:5;right:calc(100% - 26px);top:calc(30% + 52px);max-width:min(250px,70vw);padding:8px 16px;border-radius:99px 99px 6px 99px;background:#c04bff;color:#fff;font:700 .9rem 'Poppins','Cairo',system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;unicode-bidi:plaintext;box-shadow:0 8px 18px -8px rgba(192,75,255,.9);pointer-events:none}"+
Z+".mr.talk .mr-in{border-radius:99px!important}"+
Z+".mr.talk .mr-reply.on{border-radius:24px 24px 24px 8px!important;unicode-bidi:plaintext}"+
Z+".mr.hasme.talk .mr-reply.on{top:calc(30% + 98px)!important}"+
".mr-reply .zsong{display:flex;align-items:center;gap:10px;margin-top:8px;padding:6px 8px 6px 6px;border-radius:99px;background:linear-gradient(135deg,#ffe3ef,#f0d4ff);border:1px solid rgba(190,70,255,.35);min-width:230px;direction:ltr;text-align:left}"+
".zsong img{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none;border:2px solid #c04bff;background:#c04bff}"+
".zsong .zs-t{display:flex;flex-direction:column;min-width:0;flex:1;line-height:1.2}"+
".zsong b{font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".zsong small{opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.75rem}"+
".zsong .zs-eq{display:flex;gap:2px;align-items:flex-end;height:16px;flex:none}"+
".zsong .zs-eq i{width:3px;height:4px;background:#c04bff;border-radius:2px}"+
".mr.sing .zsong .zs-eq i{animation:zsEq .8s ease-in-out infinite}.mr.sing .zsong .zs-eq i:nth-child(2){animation-delay:.2s}.mr.sing .zsong .zs-eq i:nth-child(3){animation-delay:.4s}"+
"@keyframes zsEq{0%,100%{height:4px}50%{height:16px}}"+
".zsong button{border:0;border-radius:50%;width:32px;height:32px;background:#c04bff;color:#fff;cursor:pointer;display:grid;place-items:center;flex:none;padding:0}"+
".mr-nt{display:none;position:absolute;left:25%;top:0;width:50%;height:22%;pointer-events:none}.mr.sing .mr-nt{display:block}"+
".mr-nt i{position:absolute;bottom:0;font-style:normal;font-size:1.3rem;font-weight:800;color:#ff9ad5;text-shadow:0 2px 8px rgba(255,100,190,.8);opacity:0;animation:ntUp 2.4s ease-in infinite}"+
".mr-nt i:nth-child(1){left:5%}.mr-nt i:nth-child(2){left:45%;animation-delay:.8s}.mr-nt i:nth-child(3){left:80%;animation-delay:1.6s}"+
"@keyframes ntUp{0%{opacity:0;transform:translateY(0) rotate(-8deg)}15%{opacity:1}100%{opacity:0;transform:translateY(-46px) rotate(12deg)}}";
s.textContent+='.mr-sg{display:none;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;filter:drop-shadow(0 8px 16px rgba(0,0,0,.5));animation:sgDance 1.1s ease-in-out infinite;transform-origin:50% 90%}.mr-sg img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none}.mr.sing .mr-cv{opacity:0;animation:none}.mr.sing .mr-sg{display:block}.mr-sg-l{clip-path:inset(52% 0 0 0);transform-origin:55% 62%;animation:sgLeg 0.9s ease-in-out infinite}.mr-sg-t{clip-path:inset(0 0 38% 0);animation:sgTorso 1.1s ease-in-out infinite}.mr-sg-h{transform-origin:31.8% 23.4%;animation:sgHair 1.4s ease-in-out infinite}.mr-sg-m{transform-origin:56.1% 15.9%;animation:sgMouth .65s ease-in-out infinite}@keyframes sgDance{0%,100%{transform:translateY(0) rotate(0) scale(1)}15%{transform:translateY(-7px) rotate(-2.5deg) scale(1.02)}30%{transform:translateY(0) rotate(0) scale(1)}45%{transform:translateY(-5px) rotate(2.8deg) scale(1.015)}60%{transform:translateY(0) rotate(0)}75%{transform:translateY(-6px) rotate(-1.8deg) scale(1.01)}90%{transform:translateY(-1px) rotate(1.2deg)}}@keyframes sgTorso{0%,100%{transform:rotate(0)}25%{transform:rotate(-1.5deg)}50%{transform:rotate(0)}75%{transform:rotate(1.8deg)}}@keyframes sgLeg{0%,100%{transform:rotate(5deg) translateX(0)}20%{transform:rotate(-3deg) translateX(-3px)}50%{transform:rotate(-6deg) translateX(2px)}80%{transform:rotate(2deg) translateX(-1px)}}@keyframes sgHair{0%,100%{transform:rotate(2deg) translateX(0)}25%{transform:rotate(-4deg) translateX(-2px)}50%{transform:rotate(3deg) translateX(1px)}75%{transform:rotate(-2.5deg) translateX(1px)}}@keyframes sgMouth{0%,100%{transform:scaleY(.1) scaleX(.92)}10%{transform:scaleY(1.05) scaleX(1.08)}22%{transform:scaleY(.3) scaleX(1)}35%{transform:scaleY(.95) scaleX(1.06)}48%{transform:scaleY(.2) scaleX(.96)}60%{transform:scaleY(1.1) scaleX(1.1)}75%{transform:scaleY(.35) scaleX(1)}88%{transform:scaleY(.15) scaleX(.94)}}@media (prefers-reduced-motion:reduce){.mr-sg,.mr-sg-l,.mr-sg-t,.mr-sg-h,.mr-sg-m{animation:none!important}}';
document.head.appendChild(s)})();
nameCheck();
})();

/* Mira opens the pack: she gets up from her seat, hops over to the pack, takes out scissors and cuts the top strip herself. */
(function(){
var run=null,ac=null;
function $(id){return document.getElementById(id)}
function en(){try{return LANG==="en"}catch(e){return false}}
function muted(){try{return localStorage.getItem("mira_mute")==="1"}catch(e){return false}}
function ease(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2}
function backOut(k){var c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)}
function lerp(a,b,k){return a+(b-a)*k}
function tween(ms,fn,t){return new Promise(function(res){
  var t0=performance.now();
  (function f(now){
    if(t.dead){res(false);return}
    var k=Math.max(0,Math.min(1,(now-t0)/ms));fn(k);
    if(k<1)requestAnimationFrame(f);else res(true)})(t0)})}
function wait(ms,t){return new Promise(function(res){setTimeout(function(){res(!t.dead)},ms)})}
function snipSound(){
  if(muted())return;
  try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    ac=ac||new C();if(ac.state==="suspended")ac.resume();
    var n=Math.floor(ac.sampleRate*.05),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0),i;
    for(i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
    var s=ac.createBufferSource();s.buffer=b;
    var f=ac.createBiquadFilter();f.type="highpass";f.frequency.value=3200;
    var g=ac.createGain();g.gain.value=.22;s.connect(f);f.connect(g);g.connect(ac.destination);s.start()}catch(e){}}
var SCISSORS='<svg viewBox="0 0 120 60" width="100%" height="100%" aria-hidden="true" focusable="false"><defs><linearGradient id="mrxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c4da"/></linearGradient></defs>'+
  '<g class="mrx-a"><path d="M34 27.5L118 29.2L118 31L36 33Z" fill="url(#mrxg)" stroke="#6b7893" stroke-width="1.2" stroke-linejoin="round"/><path d="M40 30L25 41" stroke="#e2b13c" stroke-width="5" stroke-linecap="round"/><ellipse cx="15" cy="46" rx="11" ry="8" fill="none" stroke="#e2b13c" stroke-width="5" transform="rotate(-25 15 46)"/></g>'+
  '<g class="mrx-c"><path d="M34 32.5L118 30.8L118 29L36 27Z" fill="url(#mrxg)" stroke="#6b7893" stroke-width="1.2" stroke-linejoin="round"/><path d="M40 30L25 19" stroke="#e2b13c" stroke-width="5" stroke-linecap="round"/><ellipse cx="15" cy="14" rx="11" ry="8" fill="none" stroke="#e2b13c" stroke-width="5" transform="rotate(25 15 14)"/></g>'+
  '<circle cx="40" cy="30" r="3.4" fill="#d9e1f0" stroke="#6b7893" stroke-width="1.3"/></svg>';
function cleanup(r){
  if(!r)return;r.dead=true;
  if(r.rn&&r.rn.parentNode)r.rn.remove();
  if(r.sc&&r.sc.parentNode)r.sc.remove();
  if(r.seat)r.seat.style.visibility="";
  if(run===r)run=null}
function begin(){
  if(run){var o=run;run=null;if(!o.fin&&typeof TS!=="undefined"&&TS.state==="auto")TS.state="wait";cleanup(o)}
  var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  var seat=document.querySelector(".mr"),ov=$("ov"),pkEl=$("pk");
  if(rm||!seat||!ov||!pkEl||typeof TS==="undefined"||typeof setTear!=="function"||typeof finish!=="function"||TS.state!=="wait")return;
  if(getComputedStyle(seat).display==="none"||!seat.offsetWidth)return;
  var r={dead:false,fin:false,seat:seat,rn:null,sc:null};run=r;
  TS.state="auto";var th=$("th");if(th)th.style.opacity=0;
  var mw=seat.offsetWidth,mh=seat.offsetHeight||mw*1.717,hS=Math.round(mh*1.55),sW=Math.round(hS/2.937),dh=hS-mh,sw=innerWidth>700?130:100;
  var rn=document.createElement("div");rn.className="mrx";rn.style.setProperty("--mw",mw+"px");rn.style.setProperty("--mh",hS+"px");
  rn.innerHTML='<div class="mrx-say"></div><div class="mrx-b"><img class="mrx-sit" src="/mira/idle.webp?v=1" alt="" draggable="false" style="position:absolute;left:0;bottom:0;width:100%;height:'+mh+'px"><img class="mrx-stand" src="/mira/stand.webp?v=1" alt="" draggable="false" style="position:absolute;left:50%;bottom:0;width:'+sW+'px;height:'+hS+'px;margin-left:-'+(sW/2)+'px;display:none"><img class="mrx-hold" src="/mira/hold.webp?v=1" alt="" draggable="false" style="position:absolute;left:50%;bottom:0;width:'+sW+'px;height:'+hS+'px;margin-left:-'+(sW/2)+'px;display:none"></div>';
  var body=rn.querySelector(".mrx-b"),imSit=rn.querySelector(".mrx-sit"),imStand=rn.querySelector(".mrx-stand"),imHold=rn.querySelector(".mrx-hold"),bub=rn.querySelector(".mrx-say");
  var sc=document.createElement("div");sc.className="mrx-sc";sc.style.setProperty("--sw",sw+"px");sc.innerHTML=SCISSORS;sc.style.opacity=0;
  var bA=sc.querySelector(".mrx-a"),bC=sc.querySelector(".mrx-c");
  var cx=sw*70/120,cy=sw/4;sc.style.transformOrigin=cx+"px "+cy+"px";
  r.rn=rn;r.sc=sc;
  function alive(){return !r.dead&&ov.classList.contains("show")}
  function setR(x,y,sx,sy,rot){rn.style.transform="translate("+x+"px,"+y+"px)";body.style.transform="rotate("+(rot||0)+"deg) scale("+(sx||1)+","+(sy||1)+")"}
  function setS(px,py,ang,s){sc.style.transform="translate("+(px-cx)+"px,"+(py-cy)+"px) rotate("+ang+"deg) scale("+s+")"}
  function blades(o){bA.setAttribute("transform","rotate("+(-o)+" 40 30)");bC.setAttribute("transform","rotate("+o+" 40 30)")}
  function say(txt){
    bub.textContent=txt;bub.style.left="0px";
    var m=rn.getBoundingClientRect(),w=bub.offsetWidth,want=m.left+mw/2-w/2,lim=Math.max(6,Math.min(innerWidth-w-6,want));
    bub.style.left=(lim-m.left)+"px";bub.classList.remove("on");void bub.offsetWidth;bub.classList.add("on")}
  function hush(){bub.classList.remove("on")}
  function pr(){return pkEl.getBoundingClientRect()}
  function pose(m){if(m===true)m="stand";if(m===false)m="sit";imSit.style.display=m==="sit"?"block":"none";imStand.style.display=m==="stand"?"block":"none";imHold.style.display=m==="hold"?"block":"none"}
  function bits(x,y){
    var cols=["#ffd27a","#ff7a1a","#ffffff","#7f93ff"],i;
    for(i=0;i<3;i++){var e=document.createElement("i");e.className="mrx-bit";e.style.left=x+"px";e.style.top=y+"px";e.style.background=cols[(Math.random()*4)|0];
      document.body.appendChild(e);
      e.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:"translate("+(Math.random()*34-10)+"px,"+(34+Math.random()*60)+"px) rotate("+(Math.random()*540)+"deg)",opacity:0}],{duration:600+Math.random()*400,easing:"cubic-bezier(.3,.6,.5,1)"}).onfinish=function(){if(e.parentNode)e.remove()}}}
  function dest(){var p=pr();return{x:Math.max(6,p.left-mw*.6),y:Math.max(8,Math.min(innerHeight-hS-8,p.bottom-hS+12))}}
  function hand(d){return{x:d.x+(mw-sW)/2+.76*sW,y:d.y+.279*hS}}
  function walk(a,b,ms){var dist=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(3,Math.round(dist/70)),dir=b.x>=a.x?1:-1;
    return tween(ms,function(k){
      var u=ease(k),w=Math.sin(k*n*Math.PI),h=Math.abs(w);
      setR(lerp(a.x,b.x,u),lerp(a.y,b.y,u)-h*7,dir,1+.012*h,w*2.2)},r)}
  function jump(pt,ms,h,toStand){var sw2=false;
    return tween(ms,function(k){var s2=Math.sin(k*Math.PI);if(!sw2&&k>.45){sw2=true;pose(toStand)}setR(pt.x,pt.y-s2*h,1.03-.05*s2,.96+.08*s2,0)},r)}
  function onSkip(){
    if(r.fin||r.dead)return;
    r.dead=true;TS.state="wait";if(th)th.style.opacity=1;
    cleanup(r)}
  var sbEl=$("sb");sbEl.addEventListener("pointerdown",onSkip,true);
  r.off=function(){sbEl.removeEventListener("pointerdown",onSkip,true)};
  (async function(){
    try{
      if(!await wait(500,r)||!alive())return;
      var sr=seat.getBoundingClientRect(),vis=sr.width>0&&sr.bottom>0&&sr.top<innerHeight&&sr.right>0&&sr.left<innerWidth,p0=pr();
      var S=vis?{x:sr.left,y:sr.top-dh}:{x:-mw-10,y:Math.max(8,Math.min(innerHeight-hS-8,p0.bottom-hS+12))};pose(vis?false:true);
      document.body.appendChild(rn);document.body.appendChild(sc);setR(S.x,S.y,1,1,0);seat.style.visibility="hidden";
      say(en()?"Let me open it for you \u2702\uFE0F":"\u062e\u0644\u064a\u0646\u064a \u0646\u0641\u062a\u062d\u0648 \u0644\u064a\u0643 \u2702\uFE0F");
      /* stand up: crouch, then spring off the seat */
      if(vis){
        if(!await tween(140,function(k){setR(S.x,S.y,1+.06*k,1-.1*k,0)},r)||!alive())return;
        if(!await jump(S,340,44,true)||!alive())return}
      /* hop over to the pack */
      var D=dest(),dist=Math.hypot(D.x-S.x,D.y-S.y),ms=Math.max(800,Math.min(1700,dist*3));
      if(!await walk(S,D,ms)||!alive())return;
      if(!await tween(160,function(k){setR(D.x,D.y,1+.05*Math.sin(k*Math.PI),1-.07*Math.sin(k*Math.PI),0)},r)||!alive())return;
      /* take out the scissors */
      D=dest();var H=hand(D);hush();
      blades(10);pose("hold");
      if(!await tween(520,function(k){var s2=Math.sin(k*Math.PI);setR(D.x,D.y-s2*10,1.02-.03*s2,.98+.04*s2,0)},r)||!alive())return;
      /* the scissors fly to the top-left corner of the pack, spinning */
      var P=pr(),st={x:P.left-6,y:P.top+P.height*.12};
      pose("stand");sc.style.opacity=1;
      if(!await tween(560,function(k){
        var e=ease(k),m={x:(H.x+st.x)/2,y:Math.min(H.y,st.y)-90},u=1-e,
            x=u*u*H.x+2*u*e*m.x+e*e*st.x,y=u*u*H.y+2*u*e*m.y+e*e*st.y;
        blades(12+12*Math.sin(k*Math.PI*6));setS(x,y,lerp(-25,360,e),(.5+.5*e)+.1*Math.sin(k*Math.PI))},r)||!alive())return;
      setS(st.x,st.y,0,1);
      /* snip, snip: the scissors cut along the top strip while the pack tears open behind them */
      var N=11,last=-1,CUT=1300;
      if(!await tween(CUT,function(k){
        var s=k*N,i=Math.min(N-1,Math.floor(s)),f=s-i,o,pg;
        if(f<.5){o=24*(f*2);pg=i/N}else{o=24*(1-(f-.5)*2);pg=(i+(f-.5)*2)/N}
        if(k>=1){pg=1;o=0}
        if(i!==last&&f<.5){last=i;if(i>0){snipSound();var q=pr();bits(q.left+q.width*(i/N),q.top+q.height*.12)}}
        var q2=pr(),jx=pg*q2.width;
        blades(o);setS(q2.left-6+jx+(f<.5?0:3),q2.top+q2.height*.12+(f<.5?-1.5:1.5),0,1);
        setR(D.x,D.y+(f<.5?0:2),1,1,3*Math.sin(k*Math.PI*N));
        if(pg>.85&&!TS.snd){TS.snd=1;try{tearSound()}catch(e){}}
        setTear(pg)},r)||!alive())return;
      snipSound();
      /* done: finish the normal tear (strip falls off, cards come out) */
      r.fin=true;TS.state="wait";try{finish()}catch(e){}
      say(en()?"Ta-da! \u2728":"\u062a\u0641\u0636\u0644! \u2728");
      var qe=pr(),E={x:qe.right,y:qe.top+qe.height*.12};D=dest();H=hand(D);
      await tween(520,function(k){
        var e=ease(k),m={x:(H.x+E.x)/2,y:Math.min(H.y,E.y)-80},u=1-e,
            x=u*u*E.x+2*u*e*m.x+e*e*H.x,y=u*u*E.y+2*u*e*m.y+e*e*H.y;
        blades(14*(1-e));setS(x,y,lerp(0,-335,e),1-.5*e);sc.style.opacity=1-Math.max(0,(k-.85)/.15)},r);
      sc.style.opacity=0;pose("hold");
      /* happy hop, then back to her seat */
      await tween(520,function(k){var h=Math.abs(Math.sin(k*2*Math.PI));setR(D.x,D.y-h*16,1.03-.05*h,.96+.08*h,0)},r);
      hush();pose("stand");
      var B=vis?(function(){var s2=seat.getBoundingClientRect();return{x:s2.left,y:s2.top-dh}})():{x:-mw-10,y:D.y},d2=Math.hypot(B.x-D.x,B.y-D.y);
      if(!await walk(D,B,Math.max(800,Math.min(1600,d2*3))))return;
      if(vis)await jump(B,340,36,false);
    }catch(e){}
    finally{if(r.off)r.off();if(!r.fin&&!r.dead&&typeof TS!=="undefined"&&TS.state==="auto"){TS.state="wait";if(th)th.style.opacity=1}cleanup(r)}
  })()}
function hook(){
  if(typeof anim!=="function"||anim.__mira)return;
  var o=anim;
  var w=function(a){var x=o.apply(this,arguments);try{begin()}catch(e){}return x};
  w.__mira=1;anim=w;try{window.anim=w}catch(e){}}
try{var pl=new Image();pl.src="/mira/stand.webp?v=1";var pl2=new Image();pl2.src="/mira/hold.webp?v=1"}catch(e){}
if(document.readyState==="complete")hook();else addEventListener("load",hook);
hook();
})();

/* Mira at the login gate: sits on the top edge of the login card, answers "I forgot my account / password" and, after a wrong password, points to Discord / WhatsApp support. No AI call here (nobody is logged in), so it costs nothing and cannot be abused. */
(function(){
var SEND_SVG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;pointer-events:none"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
var awaitUser=false,RESET_CMD="";/* put the name of the bot reset command here, e.g. "/reset", to show it in the chat */
var el=null,hello=0,DISCORD="https://discord.gg/fkH9mEkuSX",WA="https://wa.me/213669967596";
function ar(){try{return LANG==="ar"}catch(e){return false}}
function T(){var a=ar();return{
  hi:a?"نسيت حسابك؟ اسألني":"Forgot your account? Ask me",
  open:a?"مرحباً، ما هي مشكلتك؟ اكتب لي أو اختر من الأسفل":"Hi, what's the problem? Type below or pick one",
  q1:a?"نسيت حسابي":"I forgot my account",q2:a?"نسيت كلمة السر":"I forgot my password",q3:a?"شراء نقاط":"Buy points",
  help:a?"تواصل مع الدعم: اضغط على Discord":"Contact support: tap Discord",
  buy:a?"لشراء النقاط تواصل مع المالك: اضغط على Discord":"To buy points, contact the owner: tap Discord",
  wrong:a?"الاسم أو كلمة السر غير صحيحة. إذا نسيت حسابك تواصل مع الدعم: اضغط على Discord":"Wrong username or password. If you forgot your account, contact support: tap Discord",
  many:a?"محاولات كثيرة. انتظر قليلاً أو تواصل مع الدعم: اضغط على Discord":"Too many attempts. Wait a bit or contact support: tap Discord",
  other:a?"أساعدك فقط في مشاكل الدخول. لأي شيء آخر تواصل مع الدعم:":"I only help with login problems. For anything else, contact support:",
  ph:a?"اكتب هنا...":"Type here...",you:a?"أنت":"You",
  viaBot:(a?"إذا كان حسابك مربوطاً بديسكورد (أمر /link): اطلب من البوت هناك رابط إعادة كلمة السر"+(RESET_CMD?" ("+RESET_CMD+")":"")+"، فهو يتأكد أنك أنت ويرسله لك في الخاص":"If your account is linked to Discord (the /link command): ask the bot there for a password reset link"+(RESET_CMD?" ("+RESET_CMD+")":"")+". It checks that it's you and sends it to you privately"),
  askUser:a?"وإذا لم تربطه، اكتب اسم حسابك وسأرسل طلبك للأدمن ليرسل لك رابط إعادة كلمة السر":"If it isn't linked, type your account name and I'll send your request to the admin so he sends you a reset link",
  sentOn:a?"وصل طلبك للمالك عبر البوت، وسيتواصل معك ويرسل لك رابط إعادة كلمة السر. إن تأخر اضغط على Discord":"Your request reached the owner through the bot. He will contact you and send you a password reset link. If it takes long, tap Discord",
  sentOff:a?"البوت متوقف حالياً، لكنني كتبت طلبك في لوحة الأدمن وسيراه المالك ويرسل لك الرابط. تقدر أيضاً تضغط على Discord":"The bot is off right now, but I wrote your request on the admin page and the owner will see it and send you the link. You can also tap Discord",
  wrongAsk:a?"الاسم أو كلمة السر غير صحيحة":"Wrong username or password",
  fail:a?"ما قدرت أرسل الطلب الآن، جرّب بعد قليل أو اضغط على Discord":"I couldn't send the request right now, try again in a bit or tap Discord",
  noName:a?"اكتب اسم الحساب فقط من فضلك":"Just the account name, please"}}
function css(){
  if(document.getElementById("mg-css"))return;
  var s=document.createElement("style");s.id="mg-css";
  s.textContent="#gbuy,#gfgw{display:none!important}"+
  ".mg{position:absolute;z-index:5;left:-999px;top:0;pointer-events:none}"+
  ".mg-img{display:block;height:var(--h,225px);aspect-ratio:290/498;width:auto;pointer-events:auto;cursor:pointer;background:none;border:0;padding:0;filter:drop-shadow(0 8px 16px rgba(0,0,0,.5));transform-origin:50% 100%;animation:mgSway 5s ease-in-out infinite;-webkit-tap-highlight-color:transparent}"+
  ".mg-img img{display:block;width:100%;height:100%;-webkit-user-drag:none;user-select:none;-webkit-mask-image:linear-gradient(to bottom,#000 72%,transparent 92%);mask-image:linear-gradient(to bottom,#000 72%,transparent 92%)}"+
  "@keyframes mgSway{0%,100%{transform:rotate(0)}30%{transform:rotate(-1deg)}70%{transform:rotate(1deg)}}"+
  ".mg-sh{position:absolute;left:10%;width:88%;top:calc(var(--h,225px)*.60 - 3px);height:12px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.6),rgba(0,0,0,0) 72%);filter:blur(1.5px);pointer-events:none;z-index:-1}"+
  ".mg-hi{position:absolute;left:calc(100% - 10px);top:12%;padding:8px 16px;border-radius:99px;background:rgba(20,12,34,.78);border:1px solid rgba(255,255,255,.55);color:#fff;font:700 .9rem/1.2 'Poppins','Cairo',system-ui,sans-serif;white-space:nowrap;opacity:0;transform:translateY(6px) scale(.9);transition:opacity .25s,transform .25s;pointer-events:none}"+
  ".mg-hi.on{opacity:1;transform:none}"+
  ".mg-p{display:none;position:absolute;left:var(--pl,100%);top:var(--pt,50%);width:310px;max-height:var(--pm,70vh);overflow:auto;padding:12px;border-radius:22px;background:rgba(20,12,34,.92);border:1px solid rgba(255,255,255,.25);box-shadow:0 14px 34px -10px rgba(255,100,190,.55);pointer-events:auto;flex-direction:column;gap:8px;font-family:'Poppins','Cairo',system-ui,sans-serif}"+
  ".mg.talk .mg-p{display:flex}.mg.talk .mg-hi{display:none}"+
  ".mg-c{display:flex;flex-direction:column;gap:6px;overflow:auto}"+
  ".mg-b{max-width:88%;padding:8px 14px;border-radius:99px;font-weight:700;font-size:.88rem;line-height:1.35;font-family:inherit;overflow-wrap:anywhere}"+
  ".mg-m{align-self:flex-start;background:#fff;color:#2a0618;border-radius:18px}"+
  ".mg-u{align-self:flex-end;background:#c04bff;color:#fff}"+
  ".mg-q{display:flex;flex-wrap:wrap;gap:6px}"+
  ".mg-q button{border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.1);color:#fff;border-radius:99px;padding:6px 12px;font-weight:700;font-size:.8rem;font-family:inherit;cursor:pointer}"+
  ".mg-q button:hover{background:rgba(255,255,255,.22)}"+
  ".mg-l{display:flex;gap:8px;flex-wrap:wrap}"+
  ".mg-l a{display:inline-block;padding:8px 18px;border-radius:99px;color:#fff!important;font-weight:800;font-size:.88rem;font-family:inherit;text-decoration:none}"+
  ".mg-in{display:flex;align-items:center;gap:6px;padding:4px 4px 4px 14px;border-radius:99px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.4)}"+
  ".mg-in input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-weight:700;font-size:.9rem;font-family:inherit}"+
  ".mg-in input{border:0!important;background:none!important;box-shadow:none!important;height:auto!important;padding:0 4px!important;border-radius:0!important}"+".mg-in input::placeholder{color:rgba(255,255,255,.6)}"+
  ".mg-in button{flex:none;width:32px;height:32px;border:0;border-radius:50%;background:#c04bff;color:#fff;cursor:pointer;font-size:1rem}"+
  "@media (max-width:700px){.mg-hi{left:auto;right:calc(100% - 6px);top:2%}.mg-p{position:fixed;left:10px;right:10px;top:auto;bottom:12px;width:auto;max-height:60vh}}"+
  "@media (prefers-reduced-motion:reduce){.mg-img{animation:none}}";
  document.head.appendChild(s)}
function add(box,cls,txt){var d=document.createElement("div");d.className="mg-b "+cls;d.textContent=txt;box.appendChild(d);
  while(box.querySelectorAll(".mg-b").length>10){var f=box.querySelector(".mg-b");if(f)f.remove();else break}
  return d}
function links(box){var l=document.createElement("div");l.className="mg-l";
  [["Discord",DISCORD,"#5865f2"]].forEach(function(x){
    var a=document.createElement("a");a.href=x[1];a.target="_blank";a.rel="noopener noreferrer";a.textContent=x[0];a.style.background=x[2];l.appendChild(a)});
  box.appendChild(l)}
function say(txt,withLinks){
  if(!el)return;var box=el.querySelector(".mg-c");
  add(box,"mg-m",txt);if(withLinks)links(box);box.scrollTop=box.scrollHeight}
function openP(){if(!el)return;el.classList.add("talk");var inp=el.querySelector("input");try{if(!ar()||true)inp.placeholder=T().ph}catch(e){}}
function closeP(){if(el)el.classList.remove("talk")}
function startReset(prefill){
  awaitUser=true;say(T().viaBot,true);say(T().askUser,false);
  if(el){var i=el.querySelector("input");if(i){if(prefill)i.value=prefill;i.focus()}}}
function sendForgot(t){
  var tx=T(),n=String(t).replace(/^@/,"").replace(/[^\p{L}\p{N}_.\-]/gu,"").slice(0,32);
  if(!n){say(tx.noName,false);return}
  awaitUser=false;
  fetch("/api/gate/forgot",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:n})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
    .then(function(j){say(j&&j.bot?tx.sentOn:tx.sentOff,true)})
    .catch(function(e){say(e===429?tx.many:tx.fail,true)})}
function answer(t){
  var s=String(t).toLowerCase(),tx=T();
  if(awaitUser){sendForgot(t);return}
  if(String(t)===tx.q1){say(tx.help,true);return}
  if(/buy|point|coin|achat|\u0634\u0631\u0627\u0621|\u0646\u0642\u0627\u0637|\u0627\u0634\u062a\u0631/.test(s))say(tx.buy,true);
  else if(/forgot|forget|lost|password|pass|login|log in|sign in|oubli|mot de|nsit|ansit|\u0646\u0633\u064a\u062a|\u0643\u0644\u0645\u0629|\u0628\u0627\u0633|\u062f\u062e\u0648\u0644|\u0645\u0634\u0643\u0644/.test(s))startReset();
  else if(/account|compte|\u062d\u0633\u0627\u0628/.test(s))say(tx.help,true);
  else say(tx.other,true)}
function ask(t){t=String(t||"").trim().slice(0,120);if(!t||!el)return;var box=el.querySelector(".mg-c");add(box,"mg-u",t);box.scrollTop=box.scrollHeight;setTimeout(function(){answer(t)},350)}
function build(g){
  css();
  var tx=T();
  el=document.createElement("div");el.className="mg";
  el.innerHTML='<div class="mg-sh"></div><button class="mg-img" type="button" aria-label="Mira"><img src="/mira/idle.webp?v=1" alt="" draggable="false"></button><div class="mg-hi"></div><div class="mg-p" role="dialog" aria-label="Mira"><div class="mg-c"></div><div class="mg-q"></div><div class="mg-in"><input type="text" maxlength="120" aria-label="Message"><button type="button" aria-label="Send">'+SEND_SVG+'</button></div></div>';
  var hi=el.querySelector(".mg-hi"),q=el.querySelector(".mg-q"),inp=el.querySelector("input"),btn=el.querySelector(".mg-in button");
  hi.textContent=tx.hi;inp.placeholder=tx.ph;
  [tx.q1,tx.q2,tx.q3].forEach(function(l){var b=document.createElement("button");b.type="button";b.textContent=l;b.addEventListener("click",function(e){e.stopPropagation();ask(l)});q.appendChild(b)});
  el.querySelector(".mg-img").addEventListener("click",function(e){e.stopPropagation();
    if(el.classList.contains("talk")){closeP();return}
    openP();var box=el.querySelector(".mg-c");if(!box.children.length)say(T().open,false)});
  btn.addEventListener("click",function(e){e.stopPropagation();var v=inp.value;inp.value="";ask(v)});
  inp.addEventListener("keydown",function(e){e.stopPropagation();if(e.key==="Enter"){var v=inp.value;inp.value="";ask(v)}else if(e.key==="Escape")closeP()});
  inp.addEventListener("keyup",function(e){e.stopPropagation()});
  el.querySelector(".mg-p").addEventListener("click",function(e){e.stopPropagation()});
  g.addEventListener("click",function(){if(el&&el.classList.contains("talk"))closeP()});
  g.appendChild(el);place();
  clearTimeout(hello);hello=setTimeout(function(){if(el&&!el.classList.contains("talk")){hi.classList.add("on");setTimeout(function(){hi.classList.remove("on")},6000)}},1500)}
function place(){if(!el)return;var c=document.getElementById("gmain");if(!c)return;var r=c.getBoundingClientRect();if(!r.width)return;
  var m=innerWidth<=700,h=m?170:225,w=h*290/498,x=r.right-w-(m?18:30),y=r.top-.60*h;
  el.style.left=Math.round(x)+"px";el.style.top=Math.round(y)+"px";el.style.setProperty("--h",h+"px");
  el.style.setProperty("--pl",Math.round(r.right+14-x)+"px");el.style.setProperty("--pt",Math.round(r.top-y)+"px");
  el.style.setProperty("--pm",Math.max(220,innerHeight-r.top-16)+"px")}
function gate(){var g=document.getElementById("gate");if(!g)return null;var c=getComputedStyle(g);return c.display==="none"||c.visibility==="hidden"?null:g}
function sync(){var g=gate();
  if(g&&!el)build(g);
  else if(!g&&el){awaitUser=false;clearTimeout(hello);if(el.parentNode)el.remove();el=null}}
function wrongPw(){var g=gate();if(!g)return;if(!el)build(g);openP();
  var u=document.getElementById("gu"),v=u?String(u.value||"").replace(/^@/,"").replace(/[^\p{L}\p{N}_.\-]/gu,"").slice(0,32):"";
  say(T().wrongAsk,false);say(T().viaBot,true);say(T().askUser,false);awaitUser=true;
  var i=el.querySelector("input");if(i){if(v)i.value=v;i.focus()}}
function wrong(msg){var g=gate();if(!g)return;if(!el)build(g);openP();say(msg,true)}
var of=window.fetch;
if(of&&!of.__mg){
  var nf=function(u){
    var p=of.apply(this,arguments);
    try{var url=typeof u==="string"?u:(u&&u.url)||"";
      if(url.indexOf("/auth/loginpw")>-1)p.then(function(r){if(r.status===401)wrongPw();else if(r.status===429)wrong(T().many)}).catch(function(){})}catch(e){}
    return p};
  nf.__mg=1;window.fetch=nf}
sync();setInterval(function(){sync();place()},400);addEventListener("resize",place);
})();
