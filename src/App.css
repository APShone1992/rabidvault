@import url('https://fonts.googleapis.com/css2?family=Creepster&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Oswald:wght@400;500;600;700&display=swap');

/* ══════════════════════════════════════════════
   THE RABID VAULT — Design System
   Dark gothic comic-vault aesthetic
   ══════════════════════════════════════════════ */

:root {
  /* Backgrounds */
  --bg:        #09090f;
  --bg2:       #111118;
  --bg3:       #1a1a24;
  --card:      #141420;
  --card-hover:#1a1a2e;

  /* Brand colours */
  --purple:      #8b5cf6;
  --purple-light:#a78bfa;
  --purple-dark: #6d28d9;
  --purple-glow: rgba(139,92,246,0.25);

  /* Semantic */
  --gold:   #f59e0b;
  --green:  #10b981;
  --red:    #ef4444;
  --cyan:   #06b6d4;
  --orange: #f97316;

  /* Text */
  --text:   #ede9ff;
  --muted:  #7c7a8e;
  --subtle: #3a3850;

  /* Borders */
  --border:       rgba(139,92,246,0.15);
  --border-strong:rgba(139,92,246,0.35);

  /* Layout */
  --sidebar-w: 230px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Fonts */
  --font-display: 'Creepster', cursive;
  --font-body:    'Crimson Text', Georgia, serif;
  --font-ui:      'Oswald', sans-serif;

  /* Transitions */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur:  0.2s;
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── Layout ── */
.app-layout { display: flex; min-height: 100vh; }

.main-content {
  margin-left: var(--sidebar-w);
  flex: 1;
  padding: 2.5rem 2.5rem 4rem;
  min-height: 100vh;
  max-width: calc(100vw - var(--sidebar-w));
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--subtle); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--purple); }

/* ══════════════════
   CARDS
   ══════════════════ */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  position: relative;
  transition: border-color var(--dur) var(--ease);
}
.card:hover { border-color: var(--border-strong); }

.card-glow {
  box-shadow: 0 0 0 1px var(--border), 0 8px 32px rgba(139,92,246,0.12);
}

/* ══════════════════
   BUTTONS
   ══════════════════ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.6rem 1.35rem;
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 0.88rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all var(--dur) var(--ease);
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background var(--dur) var(--ease);
}
.btn:hover::after { background: rgba(255,255,255,0.06); }
.btn:active { transform: scale(0.97); }

.btn-primary {
  background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  color: #fff;
  border-color: var(--purple);
  box-shadow: 0 4px 14px rgba(139,92,246,0.35);
}
.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(139,92,246,0.5);
  transform: translateY(-1px);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-outline {
  background: transparent;
  color: var(--purple-light);
  border-color: var(--border-strong);
}
.btn-outline:hover {
  background: rgba(139,92,246,0.12);
  border-color: var(--purple);
  color: #fff;
}

.btn-ghost {
  background: transparent;
  color: var(--muted);
  border-color: transparent;
}
.btn-ghost:hover { color: var(--text); background: var(--bg3); }

.btn-danger {
  background: rgba(239,68,68,0.12);
  color: var(--red);
  border-color: rgba(239,68,68,0.3);
}
.btn-danger:hover { background: rgba(239,68,68,0.2); border-color: var(--red); }

.btn-sm { padding: 0.4rem 0.85rem; font-size: 0.75rem; min-height: 34px; }
.btn-lg { padding: 0.8rem 2rem; font-size: 1rem; }
.btn-icon { padding: 0.5rem; width: 36px; height: 36px; }
.btn-full { width: 100%; }

/* ══════════════════
   STATS
   ══════════════════ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  position: relative;
  overflow: hidden;
  transition: border-color var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.stat-card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--purple), var(--purple-light));
  opacity: 0.7;
}

.stat-label {
  font-family: var(--font-ui);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.4rem;
}
.stat-value {
  font-family: var(--font-ui);
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.1;
}
.stat-delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
  font-family: var(--font-ui);
}

/* ══════════════════
   SECTION HEADERS
   ══════════════════ */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}
.section-title {
  font-family: var(--font-display);
  font-size: 2.1rem;
  letter-spacing: 0.1em;
  line-height: 1;
  text-shadow: 0 2px 16px rgba(139,92,246,0.35);
}

/* ══════════════════
   HERO BANNER
   ══════════════════ */
.hero-banner {
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #16003a 0%, #1a1a2e 50%, var(--bg2) 100%);
  padding: 3rem;
  margin-bottom: 2.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
}
.hero-banner::before {
  content: '';
  position: absolute;
  right: -80px; top: -80px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%);
  pointer-events: none;
}
.hero-banner::after {
  content: '';
  position: absolute;
  left: -60px; bottom: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%);
  pointer-events: none;
}
.hero-title {
  font-family: var(--font-display);
  font-size: 3.5rem;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
  text-shadow: 0 4px 20px rgba(139,92,246,0.5);
  line-height: 1;
  position: relative;
  z-index: 1;
}
.hero-sub {
  color: var(--muted);
  margin-bottom: 2rem;
  font-size: 1.05rem;
  font-style: italic;
  position: relative;
  z-index: 1;
}

/* ══════════════════
   COMICS GRID
   ══════════════════ */
.comics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.comic-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), border-color var(--dur) var(--ease);
  cursor: pointer;
}
.comic-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 16px 40px rgba(139,92,246,0.3), 0 0 0 1px var(--purple);
  border-color: var(--purple);
}
.comic-card.selected {
  border-color: var(--purple);
  box-shadow: 0 0 0 2px var(--purple-glow), 0 8px 24px rgba(139,92,246,0.25);
}

.comic-cover { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; }
.comic-cover-placeholder {
  width: 100%; aspect-ratio: 2/3;
  background: linear-gradient(135deg, var(--bg3), var(--bg2));
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem;
}
.comic-info { padding: 0.85rem; }
.comic-title {
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 0.82rem;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  color: var(--text);
}
.comic-meta { font-size: 0.72rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.comic-value { font-family: var(--font-ui); font-size: 0.85rem; font-weight: 700; color: var(--gold); margin-top: 0.35rem; }

/* ══════════════════
   GRADE BADGES
   ══════════════════ */
.grade-badge {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 20px;
  font-family: var(--font-ui);
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}
.grade-mint { background: linear-gradient(135deg,#059669,#10b981); color: #fff; box-shadow: 0 2px 8px rgba(16,185,129,0.4); }
.grade-nm   { background: linear-gradient(135deg,#6d28d9,#8b5cf6); color: #fff; box-shadow: 0 2px 8px rgba(139,92,246,0.4); }
.grade-vf   { background: linear-gradient(135deg,#1d4ed8,#3b82f6); color: #fff; box-shadow: 0 2px 8px rgba(59,130,246,0.4); }
.grade-fn   { background: linear-gradient(135deg,#d97706,#f59e0b); color: #111; box-shadow: 0 2px 8px rgba(245,158,11,0.4); }
.grade-gd   { background: linear-gradient(135deg,#4b5563,#6b7280); color: #fff; }
.grade-fair { background: linear-gradient(135deg,#92400e,#b45309); color: #fff; }
.grade-poor { background: linear-gradient(135deg,#7f1d1d,#b91c1c); color: #fff; }

/* ══════════════════
   FORMS
   ══════════════════ */
.form-group { margin-bottom: 1.25rem; }
.form-label {
  display: block;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.45rem;
}
.form-input, .form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg3);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
  outline: none;
}
.form-input:focus, .form-select:focus {
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
}
.form-input::placeholder { color: var(--muted); opacity: 0.7; }
.form-select option { background: var(--bg3); color: var(--text); }

/* ══════════════════
   TABS
   ══════════════════ */
.tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.tab {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--muted);
  transition: all var(--dur) var(--ease);
}
.tab:hover:not(.active) { border-color: var(--purple); color: var(--purple-light); }
.tab.active { background: var(--purple); border-color: var(--purple); color: #fff; box-shadow: 0 2px 10px rgba(139,92,246,0.4); }

/* ══════════════════
   SKELETON LOADERS
   ══════════════════ */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg3) 25%, var(--bg2) 50%, var(--bg3) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite;
  border-radius: var(--radius-sm);
}
.skeleton-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* ══════════════════
   TOAST NOTIFICATIONS
   ══════════════════ */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: all;
  animation: toast-in 0.3s var(--ease) forwards;
  max-width: 360px;
  min-width: 220px;
}
.toast-success { border-left: 3px solid var(--green); }
.toast-error   { border-left: 3px solid var(--red); }
.toast-info    { border-left: 3px solid var(--purple); }
.toast-warning { border-left: 3px solid var(--gold); }
.toast-out     { animation: toast-out 0.25s var(--ease) forwards; }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(100px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateX(0); max-height: 80px; }
  to   { opacity: 0; transform: translateX(100px); max-height: 0; padding: 0; margin: 0; }
}

/* ══════════════════
   EMPTY STATES
   ══════════════════ */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--muted);
}
.empty-icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7; }
.empty-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.08em; color: var(--text); margin-bottom: 0.5rem; }
.empty-body  { font-size: 0.95rem; margin-bottom: 1.5rem; max-width: 320px; margin-left: auto; margin-right: auto; }

/* ══════════════════
   PAGE TRANSITION
   ══════════════════ */
@keyframes page-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: page-in 0.25s var(--ease) forwards; }

/* ══════════════════
   TICKER / FEED
   ══════════════════ */
.ticker { display:flex; gap:12px; padding:8px 14px; background:var(--card); border:1px solid var(--border); border-radius:10px; flex-wrap:wrap; align-items:center; }
.tick   { display:flex; align-items:center; gap:6px; font-family:var(--font-ui); font-size:0.72rem; }
.tick-name { font-weight:700; color:var(--text); }
.tick-up { background:rgba(16,185,129,.15); color:#34d399; padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:700; }
.tick-dn { background:rgba(239,68,68,.15);  color:#fca5a5; padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:700; }

.feed-item { display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); }

/* ══════════════════
   SEARCH HIGHLIGHT
   ══════════════════ */
.search-wrapper {
  position: relative;
  flex: 1;
}
.search-wrapper .form-input { transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
  padding-left: 2.5rem;
}
.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.9rem;
  pointer-events: none;
}

/* ══════════════════
   BADGES / PILLS
   ══════════════════ */
.badge { transition: opacity 0.15s var(--ease);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.badge-purple { background: rgba(139,92,246,0.2); color: var(--purple-light); border: 1px solid rgba(139,92,246,0.3); }
.badge-green  { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
.badge-gold   { background: rgba(245,158,11,0.15); color: var(--gold); border: 1px solid rgba(245,158,11,0.3); }
.badge-red    { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
.badge-gray   { background: rgba(107,114,128,0.15); color: var(--muted); border: 1px solid var(--border); }

/* ══════════════════
   DIVIDER
   ══════════════════ */
.divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

/* ══════════════════
   TABLE BASE
   ══════════════════ */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-family: var(--font-ui);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}
.data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr { transition: background var(--dur) var(--ease); cursor: pointer; }
.data-table tbody tr:hover { background: rgba(139,92,246,0.05); }
.data-table tbody tr:last-child td { border-bottom: none; }

/* ══════════════════
   RESPONSIVE
   ══════════════════ */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  :root { --sidebar-w: 0px; }
  .main-content { margin-left: 0; padding: 1rem 1rem 5rem; max-width: 100vw; }
  .hero-title { font-size: 2.2rem; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .section-title { font-size: 1.6rem; }
  .comics-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.85rem; }
}
@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .hero-banner { padding: 1.75rem; }
}

/* ══════════════════
   MOBILE HEADER
   ══════════════════ */
.mobile-header {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 52px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  z-index: 150;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .mobile-header { display: flex; }
  .main-content  { padding-top: calc(52px + 1rem); }
}

.mobile-header-title {
  font-family: 'Creepster', cursive;
  font-size: 1.1rem;
  letter-spacing: 0.12em;
  color: var(--purple-light);
  text-shadow: 0 0 12px rgba(139,92,246,0.5);
}

.mobile-hamburger {
  width: 36px; height: 36px;
  background: none; border: none;
  cursor: pointer;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 5px; padding: 4px;
}
.mobile-hamburger span {
  display: block;
  width: 20px; height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* ── Comic card hover lift ── */
.comic-card { transition: transform 0.15s var(--ease), box-shadow 0.15s var(--ease), border-color 0.15s var(--ease); }
.comic-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }

/* ── Stat card hover ── */
.stat-card { transition: transform 0.15s var(--ease); }
.stat-card:hover { transform: translateY(-2px); }

/* ── Skeleton shimmer animation ── */
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
  background-size: 1200px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Toast slide in ── */
@keyframes toast-in {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
