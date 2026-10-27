/* Mira Assistant: sidebar profile entry + chat panel (talks to /api/mira-chat) */
(function(){
  var NAME='Mira Assistant',STATUS='\u2728 Mira Assistant \u00b7 WayAnime',PFP='/mira/mira-pfp.jpg';
  var hist=[],busy=false,panel,msgs,hello,inp,send;
  function badge(){var i=document.createElement('img');i.src='/verified-yellow.png';i.alt='';i.title='Admin';i.className='mira-vb';return i}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

  function addNav(){
    var side=document.querySelector('nav.side');if(!side||side.querySelector('.mira-nav'))return;
    var a=el('a','mira-nav');a.href='#mira';a.setAttribute('aria-label',NAME);
    var av=el('span','mn-av');var im=el('img');im.src=PFP;im.alt='';av.appendChild(im);av.appendChild(el('i'));
    var tx=el('span','mn-tx');var nb=el('b','',NAME);nb.appendChild(badge());tx.appendChild(nb);tx.appendChild(el('small','',STATUS));
    a.appendChild(av);a.appendChild(tx);
    a.addEventListener('click',function(e){e.preventDefault();open()});
    var prof=side.querySelector('a[href="#profile"]');
    if(prof)side.insertBefore(a,prof);else side.appendChild(a);
  }

  function build(){
    if(panel)return;
    panel=el('div');panel.id='mira-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',NAME);
    var card=el('div','mp-card');
    card.appendChild(el('div','mp-bg'));card.appendChild(el('div','mp-ghost'));
    var x=el('button','mp-x','\u2715');x.type='button';x.setAttribute('aria-label','Close');x.onclick=close;card.appendChild(x);
    var hd=el('div','mp-hd');var im=el('img');im.src=PFP;im.alt='';hd.appendChild(im);
    var t=el('div');var h2=el('h2','',NAME);h2.appendChild(badge());t.appendChild(h2);t.appendChild(el('p','',STATUS));hd.appendChild(t);card.appendChild(hd);
    var body=el('div','mp-body');
    hello=el('div','mp-hello');hello.appendChild(el('h3','','How can I help you?'));
    var chips=el('div','mp-chips');
    ['How do packs work?','How do I earn points?','Trade cards','Change my theme','Sing me Blinding Lights'].forEach(function(q){
      var b=el('button','mp-chip',q);b.type='button';b.onclick=function(){ask(q)};chips.appendChild(b)});
    hello.appendChild(chips);body.appendChild(hello);
    msgs=el('div','mp-msgs');body.appendChild(msgs);card.appendChild(body);
    var f=el('form','mp-in');
    inp=el('input');inp.type='text';inp.placeholder='Ask something...';inp.maxLength=400;inp.autocomplete='off';inp.setAttribute('aria-label','Message Mira');
    send=el('button');send.type='submit';send.setAttribute('aria-label','Send');
    send.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    f.appendChild(inp);f.appendChild(send);
    f.addEventListener('submit',function(e){e.preventDefault();var v=inp.value.trim();if(v)ask(v)});
    card.appendChild(f);panel.appendChild(card);
    panel.addEventListener('mousedown',function(e){if(e.target===panel)close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('on'))close()});
    document.body.appendChild(panel);
  }
  function scroll(){var b=panel.querySelector('.mp-body');b.scrollTop=b.scrollHeight}
  function bubble(cls,txt){var m=el('div','mp-m '+cls,txt);msgs.appendChild(m);scroll();return m}
  function open(){build();panel.classList.add('on');setTimeout(function(){inp.focus()},60)}
  function close(){stopAudio();if(panel)panel.classList.remove('on')}

  var curAudio=null;
  function stopAudio(){if(curAudio){try{curAudio.pause()}catch(e){}curAudio=null}var f=msgs&&msgs.querySelectorAll?msgs.querySelectorAll('iframe.mp-yt'):[];for(var i=0;i<f.length;i++)f[i].src='about:blank'}
  var SING=/^(?:please\s+|من فضلك\s+)?(?:sing(?:\s+me|\s+for me)?|غني\s*لي|غنيلي|غنيلنا|غني|غنّي|ghanili|ghani)\s+(.+)$/i;
  var PLAY=/^(?:please\s+|من فضلك\s+)?(?:play|شغل|شغلي|بلاي|حطلي|حط لي|حط|7atli|hatli)\s+(.+)$/i;
  function isOwner(){return !!(window.MY&&window.MY.role==='owner')}
  function songQuery(t){
    t=String(t||'').trim();var m=t.match(SING);
    if(!m&&!isOwner())m=t.match(PLAY); /* the owner's "play X" still goes to the Discord bot */
    if(!m)return null;
    var q=m[1].replace(/^(?:me\s+)?(?:the\s+)?(?:song|اغنية|أغنية|غنية)\s+/i,'').replace(/\s+(?:please|من فضلك)\s*$/i,'').replace(/[<>]/g,'').trim().slice(0,80);
    return q.length>1?q:null;
  }
  function ytCard(j){
    var c=el('div','mp-m ai mp-song mp-ytc');
    var top=el('div','mp-st');
    if(j.pic){var im=el('img');im.src=j.pic;im.alt='';im.referrerPolicy='no-referrer';top.appendChild(im)}
    var x=el('div','mp-sg');x.appendChild(el('b','',j.title||''));x.appendChild(el('small','',j.artist||'YouTube'));
    top.appendChild(x);c.appendChild(top);
    var fr=el('iframe','mp-yt');
    fr.src='https://www.youtube-nocookie.com/embed/'+j.yt+'?autoplay=1&playsinline=1&rel=0&modestbranding=1';
    fr.title=j.title||'YouTube';fr.allow='autoplay; encrypted-media; picture-in-picture';fr.setAttribute('allowfullscreen','');fr.referrerPolicy='strict-origin-when-cross-origin';
    c.appendChild(fr);
    return {card:c};
  }
  function songCard(j){
    var c=el('div','mp-m ai mp-song');
    if(j.pic){var im=el('img');im.src=j.pic;im.alt='';im.referrerPolicy='no-referrer';c.appendChild(im)}
    var x=el('div','mp-sg');x.appendChild(el('b','',j.title||''));x.appendChild(el('small','',j.artist||''));
    var a=el('audio');a.controls=true;a.preload='auto';a.src=j.preview;a.setAttribute('aria-label',(j.title||'')+' preview');
    a.addEventListener('play',function(){if(curAudio&&curAudio!==a)try{curAudio.pause()}catch(e){}curAudio=a});
    x.appendChild(a);c.appendChild(x);
    return {card:c,audio:a};
  }
  function sing(text,q){
    if(busy)return;
    busy=true;send.disabled=true;inp.value='';hello.style.display='none';
    var ar=/[\u0600-\u06FF]/.test(text);
    bubble('me',text);hist.push({role:'user',content:text});hist=hist.slice(-8);
    var w=el('div','mp-m ai');var d=el('span','mp-dots');d.appendChild(el('i'));d.appendChild(el('i'));d.appendChild(el('i'));w.appendChild(d);msgs.appendChild(w);scroll();
    fetch('/api/mira-song?q='+encodeURIComponent(q),{credentials:'same-origin'})
      .then(function(r){
        if(r.status===401)throw new Error(ar?'سجّل الدخول أولا باش نغنيلك.':'Log in first so I can play it for you.');
        if(r.status===429)throw new Error(ar?'بشوية شوية، عاود بعد دقيقة.':'Slow down a little, try again in a minute.');
        if(r.status===404)throw new Error(ar?'ما لقيتش هذه الأغنية 🤔 جرب تكتب اسمها مع المغني.':"I couldn't find that song 🤔 try the title with the artist name.");
        if(!r.ok)throw new Error(ar?'ما قدرتش نشغلها دابا، عاود.':'I could not play it right now. Try again.');
        return r.json()})
      .then(function(j){
        if(!j)throw new Error(ar?'ما لقيتش هذه الأغنية 🤔':"I couldn't find that song 🤔");
        stopAudio();
        var yt=/^[\w-]{11}$/.test(String(j.yt||''));
        if(!yt&&!j.preview)throw new Error(ar?'ما لقيتش هذه الأغنية 🤔':"I couldn't find that song 🤔");
        var intro=yt?(ar?'🎵 هاك الأغنية من YouTube:':'🎵 Here it is, playing from YouTube:'):(ar?'🎵 هاك، تسمع 30 ثانية من الأغنية:':'🎵 Here you go, a 30-second preview:');
        w.textContent=intro;
        var sc=yt?ytCard(j):songCard(j);msgs.appendChild(sc.card);scroll();
        hist.push({role:'assistant',content:intro+' '+(j.title||'')+' - '+(j.artist||'')});
        if(sc.audio){var pr=sc.audio.play();if(pr&&pr.catch)pr.catch(function(){})}
      })
      .catch(function(e){w.textContent=e&&e.message?e.message:'Connection problem.';w.classList.add('err');hist.pop()})
      .then(function(){busy=false;send.disabled=false;scroll();inp.focus()});
  }

  function okHttps(u){return typeof u==='string'&&/^https:\/\//.test(u)}
  function animeCard(a){
    var c=el('div','mp-m ai mp-anime');
    var top=el('div','mp-st');
    if(okHttps(a.pic)){var im=el('img');im.src=a.pic;im.alt='';im.referrerPolicy='no-referrer';top.appendChild(im)}
    top.appendChild(el('b','',a.title||''));c.appendChild(top);
    var row=el('div','mp-acts'),n=0;
    (a.watch||[]).slice(0,2).forEach(function(w){
      if(!okHttps(w.url))return;var l=el('a','mp-act mp-'+String(w.name).toLowerCase(),'\u25B6 '+w.name);
      l.href=w.url;l.target='_blank';l.rel='noopener noreferrer';row.appendChild(l);n++});
    if(okHttps(a.url)){var m=el('a','mp-act mp-mal','MyAnimeList');m.href=a.url;m.target='_blank';m.rel='noopener noreferrer';row.appendChild(m);n++}
    if(n)c.appendChild(row);
    return c;
  }
  function ask(text){
    if(busy)return;
    var sq=songQuery(text);if(sq)return sing(text,sq);
    busy=true;send.disabled=true;inp.value='';hello.style.display='none';
    bubble('me',text);hist.push({role:'user',content:text});hist=hist.slice(-8);
    var w=el('div','mp-m ai');var d=el('span','mp-dots');d.appendChild(el('i'));d.appendChild(el('i'));d.appendChild(el('i'));w.appendChild(d);msgs.appendChild(w);scroll();
    fetch('/api/mira-chat',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})})
      .then(function(r){
        if(r.status===401)throw new Error('Log in first so I can talk to you.');
        if(r.status===429)throw new Error('Slow down a little, try again in a minute.');
        if(!r.ok)throw new Error('I could not answer right now. Try again.');
        return r.json()})
      .then(function(j){var rep=String((j&&j.reply)||'').trim()||'...';w.textContent=rep;hist.push({role:'assistant',content:rep});if(j&&j.anime){msgs.appendChild(animeCard(j.anime));scroll()}})
      .catch(function(e){w.textContent=e&&e.message?e.message:'Connection problem.';w.classList.add('err');hist.pop()})
      .then(function(){busy=false;send.disabled=false;scroll();inp.focus()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNav);else addNav();
})();
