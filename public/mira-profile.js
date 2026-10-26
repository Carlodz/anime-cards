/* Mira Assistant: sidebar profile entry + chat panel (talks to /api/mira-chat) */
(function(){
  var NAME='Mira Assistant',STATUS='\u2728 Mira Assistant \u00b7 WayAnime',PFP='/mira/mira-pfp.jpg';
  var hist=[],busy=false,panel,msgs,hello,inp,send;
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

  function addNav(){
    var side=document.querySelector('nav.side');if(!side||side.querySelector('.mira-nav'))return;
    var a=el('a','mira-nav');a.href='#mira';a.setAttribute('aria-label',NAME);
    var av=el('span','mn-av');var im=el('img');im.src=PFP;im.alt='';av.appendChild(im);av.appendChild(el('i'));
    var tx=el('span','mn-tx');tx.appendChild(el('b','',NAME));tx.appendChild(el('small','',STATUS));
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
    var t=el('div');t.appendChild(el('h2','',NAME));t.appendChild(el('p','',STATUS));hd.appendChild(t);card.appendChild(hd);
    var body=el('div','mp-body');
    hello=el('div','mp-hello');hello.appendChild(el('h3','','How can I help you?'));
    var chips=el('div','mp-chips');
    ['How do packs work?','How do I earn points?','Trade cards','Change my theme'].forEach(function(q){
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
  function close(){if(panel)panel.classList.remove('on')}

  function ask(text){
    if(busy)return;
    busy=true;send.disabled=true;inp.value='';hello.style.display='none';
    bubble('me',text);hist.push({role:'user',content:text});hist=hist.slice(-8);
    var w=el('div','mp-m ai');var d=el('span','mp-dots');d.appendChild(el('i'));d.appendChild(el('i'));d.appendChild(el('i'));w.appendChild(d);msgs.appendChild(w);scroll();
    fetch('/api/mira-chat',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})})
      .then(function(r){
        if(r.status===401)throw new Error('Log in first so I can talk to you.');
        if(r.status===429)throw new Error('Slow down a little, try again in a minute.');
        if(!r.ok)throw new Error('I could not answer right now. Try again.');
        return r.json()})
      .then(function(j){var rep=String((j&&j.reply)||'').trim()||'...';w.textContent=rep;hist.push({role:'assistant',content:rep})})
      .catch(function(e){w.textContent=e&&e.message?e.message:'Connection problem.';w.classList.add('err');hist.pop()})
      .then(function(){busy=false;send.disabled=false;scroll();inp.focus()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNav);else addNav();
})();
