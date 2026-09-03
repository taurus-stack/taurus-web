import { request } from '/@/utils/service';

export const apiPrefix = '/api/taurus/script-task/';

export interface TaskForm {
  script?: number | string;
  name: string;
  description?: string;
  schedule_type?: 'cron' | 'interval' | 'once';
  cron_expression?: string;
  interval_seconds?: number;
  run_once_at?: string;
  hosts?: string[];
  timeout?: number;
  fail_notify?: boolean;
  envs?: Record<string, string>;
  args?: string[];
  enabled?: boolean;
}

export interface TaskListItem {
  id: number;
  script: number;
  script_name: string;
  script_type: string;
  name: string;
  description?: string;
  schedule_type: 'cron' | 'interval' | 'once';
  schedule_type_display: string;
  cron_expression?: string;
  interval_seconds?: number;
  run_once_at?: string;
  hosts?: string[];
  host_count: number;
  timeout: number;
  fail_notify: boolean;
  envs?: Record<string, string>;
  args?: string[];
  enabled: boolean;
  exec_count: number;
  last_exec_time?: string;
  last_exec_result?: string;
  last_exec_result_display?: string;
  next_exec_time?: string;
  creator_name: string;
  create_datetime: string;
}

export interface TaskExecution {
  id: number;
  task: number;
  task_name: string;
  status: number;
  status_display: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  trigger_type: string;
  trigger_type_display: string;
  result?: any;
  error_message?: string;
  executed_hosts?: string[];
  creator_name: string;
  create_datetime: string;
}

export function GetList(params: Record<string, any>) {
  return request({
    url: apiPrefix,
    method: 'get',
    params,
  });
}

export function GetObj(id: any) {
  return request({
    url: apiPrefix + id + '/',
    method: 'get',
  });
}

export function AddObj(obj: TaskForm) {
  return request({
    url: apiPrefix,
    method: 'post',
    data: obj,
  });
}

export function UpdateObj(obj: TaskForm & { id: any }) {
  return request({
    url: apiPrefix + obj.id + '/',
    method: 'put',
    data: obj,
  });
}

export function DelObj(id: any) {
  return request({
    url: apiPrefix + id + '/',
    method: 'delete',
    data: { id },
  });
}

export function toggleEnabled(id: any) {
  return request({
    url: apiPrefix + id + '/toggle/',
    method: 'post',
  });
}

export function executeNow(id: any) {
  return request({
    url: apiPrefix + id + '/execute/',
    method: 'post',
  });
}

export function listExecutions(id: any) {
  return request({
    url: apiPrefix + id + '/executions/',
    method: 'get',
  });
}

export function listExecutionsPaged(id: any, params: any) {
  return request({
    url: apiPrefix + id + '/executions/',
    method: 'get',
    params: params || {},
  });
}

export function getExecutionHostOutputs(executionId: any, lazy: boolean = true) {
  return request({
    url: '/api/taurus/script-task-execution/' + executionId + '/host_outputs/',
    method: 'get',
    params: lazy ? { lazy: 1 } : {},
  });
}

export function getExecutionHostOutputsRaw(executionId: any, params: any) {
  return request({
    url: '/api/taurus/script-task-execution/' + executionId + '/host_outputs/',
    method: 'get',
    params: params || {},
  });
}

export function getHostOutputDetail(executionId: any, opsExecutionId: any) {
  return request({
    url: '/api/taurus/script-task-execution/' + executionId + '/host_output_detail/',
    method: 'get',
    params: { ops_execution_id: opsExecutionId },
  });
}