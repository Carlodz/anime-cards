/* Spotify = Discord status only. The song shows on profiles through the Discord presence widget (PACT in index.html).
   No Spotify API, no Premium needed. This file only draws the info card in Settings. */
(function () {
  var LOGO = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1db954"/><path d="M6.5 9.2c3.6-1 7.6-.7 10.8 1M7 12.4c3-.8 6.2-.5 9 1M7.6 15.4c2.4-.6 4.8-.4 7 .7" fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round"/></svg>';
  window.SPW = function (id, el) { if (el) el.innerHTML = ''; }; /* old Spotify widget removed: PACT shows "Listening to Spotify" */
  function setCard() {
    var box = document.getElementById('sspot'); if (!box) return;
    box.className = 'sc ssp';
    box.innerHTML = '<h3>' + LOGO + '<span>Spotify</span></h3>' +
      '<p>Your current song shows on your profile automatically from your <b>Discord status</b>.</p>' +
      '<ol style="margin:8px 0 0 18px;padding:0;line-height:1.7;font-size:13px;opacity:.85">' +
      '<li>Discord \u2192 User Settings \u2192 Connections \u2192 connect Spotify.</li>' +
      '<li>Turn on \u201CDisplay Spotify as your status\u201D.</li>' +
      '<li>Join the site\u2019s Discord server and play a song.</li></ol>';
  }
  window.SPSET = setCard;
  function chk() { if (location.hash === '#settings') setCard(); }
  window.addEventListener('hashchange', chk);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chk); else chk();
})();
