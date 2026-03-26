/**
 * ScrapingService.ts
 * Provides functions to interact with scraping jobs and extracted data in Supabase.
 * Also triggers the Playwright worker via the API bridge.
 */
import { supabase } from './supabaseClient';
import { getCurrentStudioId } from './tenant';

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
    const { data, error } = await supabase
      .from('scraping_attempts')
      .select('*')
      .eq('job_id', jobId)
      .order('started_at', { ascending: false });

    if (error) { console.error('ScrapingService.getJobAttempts error', error); return []; }
    return data || [];
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
      // The API endpoint spawns the Playwright worker process
      const res = await fetch('/api/v1/scraping/streamate/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: payload.date, username: payload.username, password: payload.password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
        return { message: err.message || `Error HTTP ${res.status}` };
      }
      const data = await res.json();
      return { jobId: data.jobId, message: 'Extracción iniciada correctamente.' };
    } catch (e: any) {
      return { message: e.message || 'Error de red al iniciar extracción.' };
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
