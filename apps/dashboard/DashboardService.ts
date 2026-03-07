
import { api } from './api';
import { getCurrentStudioId } from './tenant';

export interface DashboardParams {
  userId?: number;
  since: string;
  until: string;
  stdId?: string;
  monitorId?: string;
}

const DashboardService = {
  getIndicators: (params: DashboardParams) => {
    const stdId = params.stdId || (getCurrentStudioId() ? String(getCurrentStudioId()) : undefined);
    const query = new URLSearchParams({
      user_id: params.userId?.toString() || '',
      report_since: params.since,
      report_until: params.until,
       ...(stdId && { std_id: stdId }),
       ...(params.monitorId && { monitor_id: params.monitorId })
    }).toString();

    return api.get(`/dashboard/indicators?${query}`);
  },

  getTasks: (params: DashboardParams) => {
    const stdId = params.stdId || (getCurrentStudioId() ? String(getCurrentStudioId()) : undefined);
    const query = new URLSearchParams({
      report_since: params.since,
      report_until: params.until,
      ...(stdId && { std_id: stdId })
    }).toString();

    return api.get(`/dashboard/tasks?${query}`);
  },

  getCharts: (params: DashboardParams) => {
    const stdId = params.stdId || (getCurrentStudioId() ? String(getCurrentStudioId()) : undefined);
    const query = new URLSearchParams({
      user_id: params.userId?.toString() || '',
      report_since: params.since,
      report_until: params.until,
      ...(stdId && { std_id: stdId })
    }).toString();

    return api.get(`/dashboard/charts?${query}`);
  }
};

export default DashboardService;
