-- مایگریشن: ستون‌های منبع طرح (وردپرس/پنل)
-- اجرا: psql "$DATABASE_URL" -f migrations/2026-09-30-design-source.sql
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS source varchar(50) DEFAULT 'panel',
  ADD COLUMN IF NOT EXISTS source_ref varchar(100);

CREATE INDEX IF NOT EXISTS designs_source_ref_idx ON designs (source_ref);
