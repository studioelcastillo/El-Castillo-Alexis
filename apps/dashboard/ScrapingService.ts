/**
 * ScrapingService.ts
 * Provides functions to interact with scraping jobs and extracted data in Supabase.
 * Also triggers the Playwright worker via the API bridge.
 */
import { supabase } from './supabaseClient';
import { api } from './api';
import { getCurrentStudioId } from './tenant';

// Derive the base URL for NestJS endpoints (v1) from the general API URL if SCRAPING API is not explicitly defined.
const defaultApiUrl = import.meta.env.VITE_API_URL || '/api';
const resolvedApiBase = defaultApiUrl.endsWith('/api') ? `${defaultApiUrl}/v1` : defaultApiUrl;
const SCRAPING_API_BASE = import.meta.env.VITE_SCRAPING_API_URL || resolvedApiBase;

export interface ScrapingJob {
  id: string;
  site: string;
  mode: string;
  target_date: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED_TEMPORARY' | 'FAILED_PERMANENT' | 'MANUAL_REQUIRED';
  attempts_count: number;
  last_error: string | null;
  last_error_type: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ScrapingStreamateRow {
  id: string;
  job_id: string;
  model_name: string;
  transaction_date: string | null;
  customer_username: string | null;
  customer_id: string | null;
  tip_type: string | null;
  site: string | null;
  duration_seconds: number | null;
  price_usd: number | null;
  earnings_usd: number | null;
  scraped_at: string;
}
export interface ScrapingJobAttempt {
  id: string;
  job_id: string;
  attempt_number: number;
  stage: 'LOGIN' | 'NAVIGATION' | 'EXTRACTION' | 'PARSING';
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  error_type: string | null;
  error_code: string | null;
  error_message: string | null;
  current_url?: string | null;
  screenshot_path?: string | null;
  screenshot_url?: string | null;
}

const ScrapingService = {

  /** List scraping jobs for the current tenant, optionally filtered by site and date range */
  async getJobs(site?: string, fromDate?: string, toDate?: string): Promise<ScrapingJob[]> {
    let query = supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (site) query = query.eq('site', site);
    if (fromDate) query = query.gte('target_date', fromDate);
    if (toDate) query = query.lte('target_date', toDate);

    const { data, error } = await query;
    if (error) { console.error('ScrapingService.getJobs error', error); return []; }
    return data || [];
  },

  /** Get individual attempts/logs for a specific job */
  async getJobAttempts(jobId: string): Promise<ScrapingJobAttempt[]> {
    try {
      const response = await fetch(`${SCRAPING_API_BASE}/scraping/jobs/${jobId}/screenshots`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || `Error HTTP ${response.status}`);
      }

      return (payload.data || []).map((row: any) => ({
        id: row.id,
        job_id: jobId,
        attempt_number: row.attemptNumber,
        stage: row.stage,
        started_at: row.startedAt,
        ended_at: row.endedAt,
        duration_ms: row.durationMs,
        error_type: row.errorType,
        error_code: row.errorCode,
        error_message: row.errorMessage,
        current_url: row.currentUrl,
        screenshot_path: row.screenshotPath,
        screenshot_url: row.screenshotUrl,
      }));
    } catch (error) {
      console.error('ScrapingService.getJobAttempts error', error);
      return [];
    }
  },

  /** Get extracted rows for a job, optionally filtered by model */
  async getStreamateData(jobId: string, modelName?: string): Promise<ScrapingStreamateRow[]> {
    let query = supabase
      .from('scraping_streamate')
      .select('*')
      .eq('job_id', jobId)
      .order('transaction_date', { ascending: true });

    if (modelName) query = query.eq('model_name', modelName);

    const { data, error } = await query;
    if (error) { console.error('ScrapingService.getStreamateData error', error); return []; }
    return data || [];
  },

  /** Get distinct model names for a given job */
  async getModelsForJob(jobId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('scraping_streamate')
      .select('model_name')
      .eq('job_id', jobId);
    if (error) return [];
    const unique = [...new Set((data || []).map((r: any) => r.model_name))];
    return unique.sort();
  },

  /**
   * Trigger a new scraping run via the API.
   * Credentials are passed in the request body and NEVER stored.
   */
  async triggerRun(payload: { date: string; username: string; password: string }): Promise<{ jobId?: string; message: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(`${SCRAPING_API_BASE}/scraping/streamate/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          date: payload.date,
          username: payload.username,
          password: payload.password,
          std_id: getCurrentStudioId() ? Number(getCurrentStudioId()) : undefined,
        })
      });

      const payloadRes = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payloadRes.message || `Error HTTP ${response.status}`);
      }

      const jobId = payloadRes.jobId || payloadRes.pid;
      return { jobId, message: payloadRes.message || 'Extracción iniciada correctamente.' };
    } catch (e: any) {
      console.error('ScrapingService.triggerRun error', e);
      const msg = e.response?.data?.message || e.message || 'Error de red al iniciar extracción.';
      return { message: msg };
    }
  },

  /** Download extracted data as CSV for a job/model */
  async exportCsv(jobId: string, modelName?: string): Promise<void> {
    const rows = await ScrapingService.getStreamateData(jobId, modelName);
    if (!rows.length) { alert('No hay datos para exportar.'); return; }

    const headers = ['Modelo', 'Fecha/Hora', 'Cliente', 'ID Cliente', 'Tipo', 'Sitio', 'Duración (s)', 'Precio USD', 'Ganancias USD'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.model_name, r.transaction_date, r.customer_username, r.customer_id,
        r.tip_type, r.site, r.duration_seconds, r.price_usd, r.earnings_usd,
      ].map(v => `"${v ?? ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamate_${jobId}_${modelName || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

export default ScrapingService;
