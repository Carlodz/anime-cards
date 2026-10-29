// wa-profile-route.js  —  حطو فـ مشروع الموقع (Render) حدا server.js
// كيزيد route واحد:  GET /api/wa/profile  ← { ok, username, pts, pic, banner }
// التطبيق ديال سطح المكتب كيجيب منو الصورة + البانر + النقاط.

module.exports = function mountWaProfile(app, getUser) {
  // getUser(req) خاصها ترجع المستخدم المسجل (object) ولا null — شوف المثال لتحت.
  const first = (o, keys) => { for (const k of keys) if (o && o[k]) return o[k]; return ''; };

  // كتحول أي مسار (/uploads/x.png) لرابط كامل، باش التطبيق يقدر يعرضو
  const abs = (req, v) => {
    if (v && typeof v === 'object') v = v.url || v.src || v.path || '';
    v = typeof v === 'string' ? v.trim() : '';
    if (!v) return '';
    if (/^https?:\/\//i.test(v) || /^data:image\//i.test(v)) return v;
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
    return proto + '://' + req.get('host') + (v.startsWith('/') ? '' : '/') + v;
  };

  app.get('/api/wa/profile', async (req, res) => {
    try {
      const u = await getUser(req);
      if (!u) return res.status(401).json({ ok: false, error: 'unauthorized' });
      res.set('Cache-Control', 'no-store');
      res.json({
        ok: true,
        username: String(u.username || u.name || ''),
        // بدل/زيد سميات الحقول ديالك هنا إلا كانو مختلفين
        pts: Number(first(u, ['pts', 'points', 'coins', 'balance'])) || 0,
        pic: abs(req, first(u, ['pic', 'avatar', 'avatarUrl', 'avatar_url', 'photo', 'picture', 'profile_pic', 'profilePic'])),
        banner: abs(req, first(u, ['banner', 'bannerUrl', 'banner_url', 'cover', 'profile_banner', 'profileBanner']))
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'server' });
    }
  });
};

/* ===== كيفاش تربطو فـ server.js =====

const mountWaProfile = require('./wa-profile-route');

// نفس الطريقة اللي كتعرف بيها المستخدم فـ /api/me (cookie اسمها sid):
mountWaProfile(app, async (req) => {
  const sid = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (!sid) return null;
  return getUserBySid(sid);   // ← دالتك: كترجع المستخدم من الجلسة (sessions / db)
});

// حطو قبل أي app.use ديال 404 / static catch-all.
*/
