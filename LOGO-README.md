# How to swap the logo

Replace these two files with your own logo:

  public/logo.svg   ← main logo (used in browser tab, sidebar, login page)
  public/logo.png   ← fallback for older browsers and home screen icon

Requirements:
  - Square dimensions (512×512 recommended)
  - PNG: any size, square is best
  - SVG: viewBox="0 0 512 512" recommended

The logo appears in:
  1. Browser tab / favicon
  2. Sidebar top-left (28×28px)
  3. Login page (78×78px)
  4. "Add to home screen" icon on phones (PWA)

Just drop your files in and push to GitHub — no code changes needed.


## Setup Steps (Quick Reference)

1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Run `supabase/schema_v3.sql` in Supabase SQL Editor
3. Run `supabase/seed_barcodes.sql` in Supabase SQL Editor (optional — seeds offline barcode lookup)
4. Upload to GitHub, add secrets, enable Pages
5. Your app: `https://USERNAME.github.io/rabidvault/`
6. Your download page: `https://USERNAME.github.io/rabidvault/download.html`
