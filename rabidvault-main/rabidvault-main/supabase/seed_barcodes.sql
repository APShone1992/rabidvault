-- ================================================================
-- BARCODE SEED DATA — Common comic UPC codes
-- Run this in Supabase SQL Editor ONCE after schema setup
-- These allow barcode lookups to work offline for popular titles
-- ================================================================

insert into public.barcode_cache (barcode, title, issue_number, publisher, cover_url) values
  -- Marvel key issues
  ('759606070619', 'The Amazing Spider-Man', '#300', 'Marvel Comics', ''),
  ('759606070510', 'The Amazing Spider-Man', '#252', 'Marvel Comics', ''),
  ('759606060504', 'Uncanny X-Men', '#266', 'Marvel Comics', ''),
  ('759606043156', 'X-Factor', '#6', 'Marvel Comics', ''),
  ('759606090396', 'New Mutants', '#98', 'Marvel Comics', ''),
  ('759606085460', 'The Incredible Hulk', '#340', 'Marvel Comics', ''),
  ('759606075454', 'Iron Man', '#128', 'Marvel Comics', ''),
  ('759606060276', 'Thor', '#337', 'Marvel Comics', ''),
  ('759606062195', 'Thor', '#362', 'Marvel Comics', ''),
  ('759606070817', 'Daredevil', '#181', 'Marvel Comics', ''),
  ('759606075034', 'Web of Spider-Man', '#1', 'Marvel Comics', ''),
  ('759606092208', 'X-Men', '#1', 'Marvel Comics', ''),
  ('759606083503', 'Wolverine', '#1', 'Marvel Comics', ''),
  ('759606082452', 'Spider-Man', '#1', 'Marvel Comics', ''),
  ('759606091935', 'Ghost Rider', '#1', 'Marvel Comics', ''),
  ('759606094097', 'Venom: Lethal Protector', '#1', 'Marvel Comics', ''),
  ('759606096862', 'Carnage', '#1', 'Marvel Comics', ''),
  ('759606098262', 'X-Men', '#4', 'Marvel Comics', ''),
  ('759606065707', 'Secret Wars', '#8', 'Marvel Comics', ''),
  ('759606078790', 'The Amazing Spider-Man', '#361', 'Marvel Comics', ''),
  -- DC key issues
  ('761941200255', 'Batman', '#357', 'DC Comics', ''),
  ('761941200217', 'Batman', '#386', 'DC Comics', ''),
  ('761941200316', 'Batman', '#404', 'DC Comics', ''),
  ('761941200415', 'Batman', '#428', 'DC Comics', ''),
  ('761941200521', 'Batman', '#497', 'DC Comics', ''),
  ('761941200538', 'Batman', '#500', 'DC Comics', ''),
  ('761941300338', 'The Dark Knight Returns', '#1', 'DC Comics', ''),
  ('761941300345', 'The Dark Knight Returns', '#2', 'DC Comics', ''),
  ('761941200149', 'Action Comics', '#600', 'DC Comics', ''),
  ('761941200316', 'Green Lantern', '#1', 'DC Comics', ''),
  ('761941200675', 'Superman', '#75', 'DC Comics', ''),
  ('761941200613', 'Superman', '#1', 'DC Comics', ''),
  ('761941200491', 'Justice League', '#1', 'DC Comics', ''),
  ('761941200088', 'Crisis on Infinite Earths', '#7', 'DC Comics', ''),
  ('761941200804', 'Preacher', '#1', 'DC Comics', ''),
  ('761941200811', 'Sandman', '#1', 'DC Comics', ''),
  ('761941200095', 'Watchmen', '#1', 'DC Comics', ''),
  -- Image key issues
  ('70985302720301', 'Spawn', '#1', 'Image Comics', ''),
  ('70985302723302', 'Spawn', '#9', 'Image Comics', ''),
  ('70985302721308', 'Savage Dragon', '#1', 'Image Comics', ''),
  ('70985302724309', 'Witchblade', '#1', 'Image Comics', ''),
  ('70985302727300', 'The Walking Dead', '#1', 'Image Comics', ''),
  ('70985302748305', 'Invincible', '#1', 'Image Comics', ''),
  ('70985302760308', 'Saga', '#1', 'Image Comics', ''),
  -- Dark Horse
  ('07219860800201', 'Aliens', '#1', 'Dark Horse Comics', ''),
  ('07219860801208', 'Predator', '#1', 'Dark Horse Comics', ''),
  ('07219861830207', 'Sin City', '#1', 'Dark Horse Comics', ''),
  ('07219862002207', 'Hellboy', '#1', 'Dark Horse Comics', '')
on conflict (barcode) do nothing;

-- Add a comment so you know what this was
comment on table public.barcode_cache is 'Barcode to comic metadata cache — seeded with common UPC codes, grows as users scan new barcodes';
