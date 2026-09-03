import { request } from '/@/utils/service';

export const apiPrefix = '/api/taurus/task-center/';

export interface TaskCenterItem {
  id: number;
  item_type: 'script_task' | 'workflow';
  name: string;
  description?: string;
  target_name: string;
  schedule_type: string;
  schedule_type_display: string;
  cron_expression?: string;
  interval_seconds?: number;
  run_once_at?: string;
  status: number;
  status_display: string;
  last_exec_time?: string;
  next_exec_time?: string;
  last_exec_result?: string;
  last_exec_result_display?: string;
  exec_count: number;
  creator_name: string;
  create_datetime: string;
  script_id?: number;
}

export interface TaskCenterListParams {
  page?: number;
  limit?: number;
  type?: 'script_task' | 'workflow';
  keyword?: string;
  status?: number;
  ordering?: string;
}

export function GetList(params: TaskCenterListParams) {
  return request({
    url: apiPrefix,
    method: 'get',
    params,
  });
}