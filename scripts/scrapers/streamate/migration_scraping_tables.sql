-- ============================================================
-- MIGRATION: Scraping Tables
-- Site: Streamate (Master Mode)
-- ============================================================

-- Jobs: one record per scraping run
CREATE TABLE IF NOT EXISTS public.scraping_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site            TEXT NOT NULL DEFAULT 'streamate',
    mode            TEXT NOT NULL DEFAULT 'master',         -- 'master' | 'model'
    target_date     DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'PENDING',        -- PENDING | RUNNING | DONE | FAILED_TEMPORARY | FAILED_PERMANENT | MANUAL_REQUIRED
    attempts_count  INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT,
    last_error_type TEXT,                                   -- TEMPORARY | PERMANENT | MANUAL
    started_at      TIMESTAMP WITH TIME ZONE,
    finished_at     TIMESTAMP WITH TIME ZONE,
    std_id          INTEGER,                                -- tenant isolation
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attempts: each individual try per job
CREATE TABLE IF NOT EXISTS public.scraping_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES public.scraping_jobs(id) ON DELETE CASCADE,
    attempt_number  INTEGER NOT NULL DEFAULT 1,
    stage           TEXT,                                   -- LOGIN | NAVIGATION | EXTRACTION | PARSING
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at        TIMESTAMP WITH TIME ZONE,
    duration_ms     INTEGER,
    error_type      TEXT,                                   -- TEMPORARY | PERMANENT | MANUAL
    error_code      TEXT,
    error_message   TEXT,
    current_url     TEXT,
    screenshot_path TEXT                                    -- optional local path or storage URL
);

-- Extracted data: one row per transaction line from the report
CREATE TABLE IF NOT EXISTS public.scraping_streamate (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES public.scraping_jobs(id) ON DELETE CASCADE,
    model_name          TEXT NOT NULL,                      -- "Earnings for [MODEL]" section header
    transaction_date    TIMESTAMP WITH TIME ZONE,
    customer_username   TEXT,
    customer_id         TEXT,
    tip_type            TEXT,                               -- Private | Gold | Gold Quick Show | etc.
    site                TEXT DEFAULT 'streamate',
    duration_seconds    INTEGER,                            -- parsed from "HH:MM:SS" or "MM:SS"
    price_usd           NUMERIC(10, 4),
    earnings_usd        NUMERIC(10, 4),
    std_id              INTEGER,
    scraped_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_site_date       ON public.scraping_jobs(site, target_date);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_std_id          ON public.scraping_jobs(std_id);
CREATE INDEX IF NOT EXISTS idx_scraping_streamate_job        ON public.scraping_streamate(job_id);
CREATE INDEX IF NOT EXISTS idx_scraping_streamate_model      ON public.scraping_streamate(model_name);
CREATE INDEX IF NOT EXISTS idx_scraping_streamate_date       ON public.scraping_streamate(transaction_date);
CREATE INDEX IF NOT EXISTS idx_scraping_streamate_std        ON public.scraping_streamate(std_id);
CREATE INDEX IF NOT EXISTS idx_scraping_attempts_job         ON public.scraping_attempts(job_id);

-- Enable RLS
ALTER TABLE public.scraping_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_streamate  ENABLE ROW LEVEL SECURITY;

-- TODO: Add RLS policies scoped to std_id after confirming auth mechanism
