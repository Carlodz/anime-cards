// Streams the app files from Google Drive through your own site, so the
// download page can read Content-Length and show a real progress bar.
// Usage in server.js (before express.static):  require('./dl-proxy')(app);
const { Readable } = require('stream');

const FILES = {
  android: { id: '1ZbIMpTxiYkgsp_AD8B4l5S0-04m9zp9e', name: 'Wayanime.apk', type: 'application/vnd.android.package-archive' },
  windows: { id: '1ljAyvJapRfbYeoCZLzWUpn61KWWciYQG', name: 'Wayanime-Setup.exe', type: 'application/octet-stream' }
};

module.exports = function (app) {
  app.get('/dl/:platform', async (req, res) => {
    const f = FILES[req.params.platform];
    if (!f) return res.sendStatus(404);
    try {
      const url = 'https://drive.usercontent.google.com/download?id=' + f.id + '&export=download&confirm=t';
      const up = await fetch(url, { redirect: 'follow' });
      const ct = up.headers.get('content-type') || '';
      if (!up.ok || !up.body || ct.includes('text/html')) return res.status(502).send('Drive did not return the file');
      res.setHeader('Content-Type', f.type);
      res.setHeader('Content-Disposition', 'attachment; filename="' + f.name + '"');
      res.setHeader('Cache-Control', 'no-store');
      const len = up.headers.get('content-length');
      if (len) res.setHeader('Content-Length', len);
      Readable.fromWeb(up.body).on('error', () => res.destroy()).pipe(res);
    } catch (e) {
      res.status(502).send('Download failed');
    }
  });
};
