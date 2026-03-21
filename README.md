# 🦝 The Rabid Vault

> Track, value, and discover your comic book collection.
> Free web app + Android APK — auto-built and deployed via GitHub Actions.

**Live web app:** https://YOUR_GITHUB_USERNAME.github.io/rabidvault
**Download Android APK:** Go to the Releases tab on this repo → download The Rabid Vault.apk

---

## 📁 Complete file structure

```
rabidvault/
│
├── .github/
│   └── workflows/
│       └── build.yml              ← AUTO-BUILDS everything on every git push
│
├── android/                       ← Android app wrapper (Capacitor)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/rabidvault/app/
│   │       │   └── MainActivity.java
│   │       └── res/
│   │           ├── values/
│   │           │   ├── strings.xml
│   │           │   └── styles.xml
│   │           ├── drawable/
│   │           │   └── splash.xml
│   │           └── xml/
│   │               ├── file_paths.xml
│   │               └── network_security_config.xml
│   ├── build.gradle
│   ├── gradle.properties
│   ├── settings.gradle
│   └── variables.gradle
│
├── public/
│   ├── logo.png                   ← PUT YOUR RACCOON LOGO HERE
│   ├── manifest.json              ← Makes it installable on iPhone/Android
│   └── 404.html                   ← Fixes page refresh on GitHub Pages
│
├── src/
│   ├── App.jsx                    ← Main app, all page routing
│   ├── App.css                    ← Global styles and design system
│   ├── main.jsx                   ← React entry point
│   │
│   ├── context/
│   │   └── AuthContext.jsx        ← Supabase login state
│   │
│   ├── hooks/
│   │   ├── useCollection.js       ← Collection CRUD
│   │   ├── useWishlist.js         ← Wishlist CRUD
│   │   ├── useFriends.js          ← Friends and search
│   │   └── useAchievements.js     ← XP, levels, badges
│   │
│   ├── lib/
│   │   ├── supabase.js            ← Database client
│   │   ├── comicvine.js           ← Live pricing and search
│   │   ├── releases.js            ← Upcoming issues and variants
│   │   ├── vision.js              ← AI cover scanning
│   │   └── barcode.js             ← Barcode scanning
│   │
│   ├── components/
│   │   ├── Sidebar.jsx            ← Navigation with XP bar
│   │   └── Sidebar.css
│   │
│   └── pages/
│       ├── Login.jsx / .css       ← Sign in and register
│       ├── Dashboard.jsx          ← Home: stats, feed, recent comics
│       ├── Analytics.jsx          ← Charts: value over time, publishers
│       ├── Collection.jsx         ← Grid and list view, price history
│       ├── AddComic.jsx           ← Manual, scan, barcode, ComicVine lookup
│       ├── Wishlist.jsx           ← Wishlist with progress bars and alerts
│       ├── NewReleases.jsx        ← Live covers, variants, weekly calendar
│       ├── NewReleases.css
│       ├── Market.jsx             ← Per-comic price charts
│       ├── Friends.jsx            ← Search, compare, leaderboard
│       └── Achievements.jsx       ← XP, levels, badges
│
├── supabase/
│   ├── schema.sql                 ← RUN FIRST: main database tables
│   ├── schema_v3.sql              ← RUN SECOND: achievements, XP, feed
│   └── functions/
│       └── comicvine-proxy/
│           └── index.ts           ← Edge function (keeps API key safe)
│
├── .env.example                   ← Copy to .env.local and fill in keys
├── .gitignore
├── capacitor.config.ts            ← Mobile app settings
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 How to set up from scratch

### Step 1 — Fork or clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/rabidvault.git
cd rabidvault
npm install
```

### Step 2 — Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** → paste and run `supabase/schema.sql` → click Run
4. Then paste and run `supabase/schema_v3.sql` → click Run
5. Go to **Project Settings → API** and copy your:
   - Project URL
   - anon / public key

### Step 3 — Get your other free API keys

**ComicVine** (for live covers, pricing, upcoming releases):
1. Go to [comicvine.gamespot.com/api](https://comicvine.gamespot.com/api)
2. Create a free account and copy your API key

**Google Vision** (for AI comic cover scanning — optional):
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → search Vision API → Enable
3. Go to Credentials → Create API Key → copy it

### Step 4 — Add your keys as GitHub Secrets

This is what lets GitHub Actions build your app with your real API keys:

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each one:

| Secret name | Where to get it |
|-------------|----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `VITE_COMICVINE_API_KEY` | comicvine.gamespot.com/api |
| `VITE_GOOGLE_VISION_API_KEY` | console.cloud.google.com |

### Step 5 — Update your username and repo name

In `package.json` change this line:
```
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/rabidvault",
```

In `vite.config.js` change this line (must match your repo name exactly):
```js
base: '/rabidvault/',
```

In `public/manifest.json` change all instances of `/rabidvault/` to match your repo name.

### Step 6 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under Source, select: **Deploy from a branch**
3. Under Branch, select: **gh-pages** and **/ (root)**
4. Click **Save**

### Step 7 — Add your logo

Drop your raccoon logo file into `public/logo.png`

### Step 8 — Push to GitHub

```bash
git add .
git commit -m "Initial The Rabid Vault setup"
git push origin main
```

GitHub Actions will automatically:
- ✅ Build the React web app
- ✅ Deploy it to GitHub Pages (your website)
- ✅ Build an Android APK
- ✅ Create a Release with the APK download link

This takes about 5-8 minutes the first time.

---

## 📱 How people install the app

### Android
1. Go to the **Releases** tab on this GitHub repo
2. Download `The Rabid Vault.apk`
3. On your Android phone: Settings → Security → Enable "Install from unknown sources"
4. Open the downloaded APK and tap Install

### iPhone (no App Store needed)
1. Open Safari on your iPhone
2. Go to `https://YOUR_USERNAME.github.io/rabidvault`
3. Tap the **Share** button (box with arrow pointing up)
4. Tap **Add to Home Screen**
5. Tap **Add**

It installs like a real app with its own icon on your home screen!

---

## 🔄 Every time you make changes

```bash
git add .
git commit -m "describe your change"
git push
```

GitHub Actions rebuilds everything automatically. New APK appears in Releases within 8 minutes.

---

## 🗝️ Deploying the ComicVine Edge Function

This keeps your ComicVine API key secure on the server:

```bash
# Install Supabase CLI
npm install -g supabase

# Log in and link your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set your secret (never goes in .env or GitHub)
supabase secrets set COMICVINE_API_KEY=your_key_here

# Deploy the function
supabase functions deploy comicvine-proxy
```

---

## 💰 Complete cost breakdown

| Service | Cost |
|---------|------|
| GitHub repo + Pages + Actions | **FREE** |
| Supabase database + auth | **FREE** (up to 500MB, 50k users) |
| ComicVine API | **FREE** (200 requests/hour) |
| Google Vision API | **FREE** (1,000 scans/month) |
| Android APK distribution | **FREE** (via GitHub Releases) |
| iPhone PWA | **FREE** (no App Store needed) |
| **Total** | **£0** |

---

## ✨ Features

- 📚 Full comic collection tracking with grades and values
- 📷 AI cover scanning (Google Vision)
- 📊 Barcode scanning
- 🔍 ComicVine live search, pricing and upcoming releases
- 🖼 Variant cover browser with full cover art
- 📈 Price history charts per comic
- ⭐ Wishlist with progress bars and price alerts
- 👥 Friends, collection comparison and leaderboard
- 🏆 18 achievements across 4 tiers, XP and levelling system
- 📊 Analytics dashboard with publisher breakdown
- 🌐 Works as website, Android app and iPhone home screen app
