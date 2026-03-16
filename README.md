# Tawla — Su Sushi Digital Menu

تطبيق ويب لمنيو رقمي لمطعم **Su Sushi** (سو سوشي)، مبني بـ Next.js و Supabase. يدعم تجربة الضيف (المنيو، السلة، QR)، والويتر (المسح والتأكيد)، والكاشير/المطبخ (لوحة الطلبات).

---

## التقنيات المستخدمة (Tech Stack)

| الطبقة | التقنية |
|--------|---------|
| **Framework** | Next.js 16 (App Router) |
| **اللغة** | TypeScript |
| **التنسيق** | Tailwind CSS v4 |
| **الحركات** | Framer Motion |
| **إدارة الحالة** | Zustand (سلة الضيف) |
| **قاعدة البيانات والـ Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **QR** | qrcode.react, html5-qrcode |

---

## الهوية والثيم (Su Sushi)

- **الاسم:** Su Sushi
- **اللون الأساسي:** أخضر غامق `#1B4332`
- **الثانوي:** خشب/خيزران `#C4956A`
- **الخلفية:** كريمي `#FAF8F5`
- **العملة:** دينار كويتي (KWD) — 3 منازل عشرية
- **الخطوط:** Plus Jakarta Sans (EN), Tajawal (AR)
- **دعم RTL/LTR:** عربي وإنجليزي عبر Tailwind logical properties

---

## ما تم تنفيذه

### 1. الصفحة الرئيسية والتدفق الواحد

- `/` يعيد التوجيه مباشرة إلى `/susushi`.
- التطبيق حالياً لمطعم واحد: Su Sushi (slug: `susushi`).

### 2. تجربة الضيف (Guest)

| الصفحة | المسار | الوظيفة |
|--------|--------|---------|
| **إدخال رقم الطاولة** | `/susushi` | شاشة ترحيب، نumpad لإدخال رقم الطاولة، زر "View Menu". |
| **المنيو** | `/susushi/menu` | تصنيفات (أ pills)، بحث، شبكة بطاقات أطباق (2 أعمدة موبايل، 3–4 لاحقاً)، زر إضافة للسلة. |
| **البحث** | `/susushi/search` | بحث فوري بالاسم (عربي/إنجليزي) والوصف، نفس بطاقات المنيو. |
| **السلة** | `/susushi/cart` | قائمة عناصر، +/- للكمية، ملخص (فرعي، خدمة 10%، إجمالي)، زر "Proceed to Checkout". |
| **الدفع/التأكيد** | `/susushi/checkout` | ملخص الطلب، طلبات خاصة، إجمالي، زر "Place Order" (بدون خيارات دفع — الدفع عند الكاشير). |
| **QR الطلب** | `/susushi/qr` | عرض QR يحتوي بيانات الطلب؛ "Show to waiter"، أزرار "Done" / "Modify Order". |

- **سلة الضيف:** Zustand (`src/store/cart.ts`) — عناصر، كميات، إجماليات، رقم الطاولة، slug المطعم.
- **بطاقة الطبق (DishCard):** صورة، اسم، وصف (محدود)، سعر KD، زر +. دعم فتح ورقة تفاصيل (ItemDetailSheet) للكمية ثم الإضافة.
- **شريط التنقل السفلي (FloatingNavBar):** Menu، Search، Cart مع أيقونات وbadge لعدد السلة؛ يظهر في المنيو، البحث، السلة، الدفع، QR.

### 3. تجربة الويتر (Waiter)

| الصفحة | المسار | الوظيفة |
|--------|--------|---------|
| **داشبورد الطاولات** | `/susushi/waiter` | شبكة طاولات وحالاتها. |
| **مسح QR** | `/susushi/waiter/scan` | مسح QR الذي يولّده الضيف. |
| **تأكيد الطلب** | `/susushi/waiter/confirm` | مراجعة الطلب الممسوح، زر "Confirm & Send to Kitchen"، إنشاء الطلب في Supabase. |

### 4. تجربة الكاشير/المطبخ (Cashier)

| الصفحة | المسار | الوظيفة |
|--------|--------|---------|
| **لوحة الطلبات (Kanban)** | `/susushi/cashier` | أعمدة (مثلاً: New, Preparing, Ready)، بطاقات طلبات، نقل بين الأعمدة، تحديثات Realtime عبر Supabase. |

---

## هيكل المشروع (ملخص)

```
src/
├── app/
│   ├── page.tsx                 # redirect → /susushi
│   ├── layout.tsx               # Root layout, metadata, fonts
│   ├── globals.css              # ثيم Su Sushi، متغيرات CSS، RTL
│   └── [slug]/
│       ├── layout.tsx           # RestaurantLayout (يجلب المطعم حسب slug)
│       ├── page.tsx             # إدخال رقم الطاولة
│       ├── menu/page.tsx        # المنيو + بحث + شبكة أطباق
│       ├── search/page.tsx      # صفحة البحث
│       ├── cart/page.tsx        # السلة
│       ├── checkout/page.tsx    # تأكيد الطلب
│       ├── qr/page.tsx          # عرض QR الطلب
│       ├── waiter/page.tsx      # داشبورد الويتر
│       ├── waiter/scan/page.tsx # مسح QR
│       ├── waiter/confirm/page.tsx # تأكيد الطلب
│       └── cashier/page.tsx     # Kanban الكاشير
├── components/ui/               # Button, DishCard, CartItemCard, FloatingNavBar,
│                                # CategoryTabs, BottomSheet, ItemDetailSheet,
│                                # NumericKeypad, PageHeader, BackButton
├── store/cart.ts                # Zustand: سلة الضيف
├── lib/
│   ├── supabase/client.ts       # Supabase client (browser)
│   ├── supabase/server.ts        # Supabase server
│   ├── data/restaurants.ts      # جلب المطعم (server)
│   ├── data/orders.ts           # الطلبات (server)
│   └── data/orders.client.ts    # جلب المطعم/التصنيفات/المنيو (client)
└── types/database.ts            # أنواع Restaurant, Category, MenuItem, Order, ...
```

---

## قاعدة البيانات (Supabase)

- **الجداول (من `docs/Database-Schema.md` و migration):**  
  `restaurants`, `categories`, `menu_items`, `tables`, `orders`, `order_items`, `waiter_calls`.
- **البيانات الافتراضية:** ملف `supabase/seed/seed_data.sql` يدرج:
  - مطعم **Su Sushi** (slug: `susushi`).
  - 3 تصنيفات: Appetizers، Salads، Sushi & Maki.
  - عشرات عناصر المنيو مع أسعار KWD ووصف عربي/إنجليزي وروابط صور (محلي `/menu/...` أو Unsplash).
  - جداول الطاولات.

**تشغيل الـ seed (مهم لتجنب 404 على `/susushi`):**

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك.
2. **SQL Editor** → انسخ محتوى `supabase/seed/seed_data.sql`.
3. نفّذ الـ script (Run).

بدون تشغيل الـ seed، صفحة `/susushi` تعيد 404 مع رسالة "Error fetching restaurant".

---

## الإعداد والتشغيل

### المتطلبات

- Node.js (مثلاً 18+)
- مشروع Supabase مع تنفيذ migration الـ schema

### خطوات الإعداد

1. **استنساخ المشروع وتثبيت الحزم:**
   ```bash
   npm install
   ```

2. **إعداد متغيرات البيئة:**  
   أنشئ `.env.local` في جذر المشروع:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **تشغيل الـ seed في Supabase** (كما في قسم قاعدة البيانات أعلاه).

4. **تشغيل التطبيق:**
   ```bash
   npm run dev
   ```
   ثم افتح [http://localhost:3000](http://localhost:3000) (سيتم توجيهك إلى `/susushi`).

### أوامر أخرى

- `npm run build` — بناء الإنتاج
- `npm run start` — تشغيل نسخة مبنية
- `npm run lint` — فحص ESLint

---

## روابط سريعة (بعد تشغيل الـ seed)

| الدور | الرابط |
|-------|--------|
| **الضيف — بداية** | http://localhost:3000/susushi |
| **المنيو** | http://localhost:3000/susushi/menu |
| **البحث** | http://localhost:3000/susushi/search |
| **السلة** | http://localhost:3000/susushi/cart |
| **الويتر** | http://localhost:3000/susushi/waiter |
| **مسح QR (ويتر)** | http://localhost:3000/susushi/waiter/scan |
| **الكاشير** | http://localhost:3000/susushi/cashier |

---

## الوثائق الداخلية

- `docs/PRD.md` — متطلبات المنتج والأدوار (ضيف، ويتر، كاشير).
- `docs/Database-Schema.md` — وصف جداول Supabase.
- `docs/Design-System.md` — (إن وُجد) نظام التصميم والألوان.

---

## ملاحظات

- **Hydration mismatch:** إن ظهر تحذير يتعلق بـ `data-atm-ext-installed` أو `data-gptw` على `<body>`، غالباً من إضافات المتصفح وليس من الكود؛ التجربة في نافذة خاصة أو بعد تعطيل الإضافات تقلل التحذير.
- **الصور:** عناصر المنيو تستخدم `image_url` من قاعدة البيانات (محلي من `public/menu/` أو Unsplash). تأكد من إعداد `next.config` لأي دومين خارجي للصور إن لزم.
- **الدفع:** لا يختار الضيف طريقة دفع؛ الدفع يتم عند الكاشير فقط.

---

تم توثيق كل ما تم الوصول إليه في المشروع حتى الآن في هذا الملف.
