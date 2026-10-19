# باكيت بطاقات الأنمي / Anime Card Packs

موقع لفتح باكيتات بطاقات الأنمي، جمع البطاقات النادرة، الهدايا، التبادل مع الأصدقاء، وباكيتات أسبوعية.

Open anime card packs daily, collect rare cards (Iron → Legendary), gift codes, friend trades, and weekly special packs.

## تشغيل محلي (Local)

```bash
npm install
node server.js
```

افتح http://localhost:3000

كل شيء اختياري في `.env` — بدون إعدادات يعمل بحسابات اسم مستخدم + كلمة سر فقط.

## Deploy على Render (مجاني)

1. اذهب إلى [render.com](https://render.com) وسجّل بحساب GitHub.
2. **New → Web Service** واختر هذا الريبو `Carlodz/anime-cards`.
3. الإعدادات:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. (اختياري) أضف Environment Variables:
   - `SESSION_SECRET` = سلسلة عشوائية طويلة (مهم عشان ما يتم تسجيل الخروج بعد كل restart)
   - `DATABASE_URL` = Postgres (من Render أو Neon/Supabase) لو تبي البطاقات تبقى بعد redeploy
   - Discord OAuth لو تبي (انظر `.env.example`)
5. Deploy.

بعد الـ deploy، ادخل على الرابط اللي يعطيك Render وسجّل حساب جديد.

## ملاحظات

- البيانات تتخزن في ملف `data/users.json` (أو Postgres لو حطيت `DATABASE_URL`).
- باكيت واحد في اليوم + باكيتات أسبوعية (cute + legendary).
- يمكن إهداء بطاقات عبر كود، أو إرسال لأصدقاء، أو صناديق مختومة لغير الأصدقاء.
