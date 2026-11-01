/* Mira reminders: shows a desktop notification when a reminder is due (polls /api/reminders/pending) */
(function(){
  if(window.__miraRemind)return;window.__miraRemind=1;
  var shown={};
  function toast(title,text){
    var d=document.createElement('div');
    d.style.cssText='position:fixed;right:18px;top:18px;z-index:99999;max-width:320px;background:#1b1426;color:#fff;border:1px solid #a56bff;border-radius:12px;padding:12px 14px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.4);cursor:pointer';
    var b=document.createElement('b');b.textContent=title;b.style.display='block';b.style.marginBottom='4px';
    var s=document.createElement('span');s.textContent=text;
    d.appendChild(b);d.appendChild(s);d.onclick=function(){d.remove()};
    document.body.appendChild(d);setTimeout(function(){d.remove()},15000);
  }
  function show(r){
    var title='Mira \u23F0 Reminder',text=String(r.text||'');
    var ok=false;
    try{
      if('Notification' in window&&Notification.permission==='granted'){
        var n=new Notification(title,{body:text,icon:'/mira/mira-pfp.jpg',tag:'mira-'+r.id,requireInteraction:true});
        n.onclick=function(){try{window.focus()}catch(e){}n.close()};ok=true;
      }
    }catch(e){}
    if(!ok)toast(title,text);
  }
  function poll(){
    fetch('/api/reminders/pending',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){
      var items=(j&&j.items||[]).filter(function(r){return !shown[r.id]});
      if(!items.length)return;
      items.forEach(function(r){shown[r.id]=1;show(r)});
      fetch('/api/reminders/ack',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:items.map(function(r){return r.id})})}).catch(function(){});
    }).catch(function(){});
  }
  function ask(){try{if('Notification' in window&&Notification.permission==='default')Notification.requestPermission()}catch(e){}}
  window.MiraRemind={ask:ask,poll:poll};
  document.addEventListener('click',function(){ask()},{once:true});
  setTimeout(poll,4000);setInterval(poll,15000);
})();
