import { request } from '/@/utils/service';
import { Session } from '/@/utils/storage';
import { getWsBaseURL } from '/@/utils/baseUrl';

export const apiPrefix = '/api/taurus/ops/';
export const scriptApiPrefix = '/api/taurus/script/';
export const scriptCategoryApiPrefix = '/api/taurus/script-category/';

/**
 * Execute a single command, returns execution_id
 * Frontend gets real-time output via WebSocket
 */
export function executeCommand(data: {
  host_id: string;
  command: string;
  args?: string[];
  working_directory?: string;
  timeout_seconds?: number;
  environment?: Record<string, string>;
  use_shell?: boolean;
  merge_streams?: boolean;
  load_profile?: 'false' | 'true' | 'login';
  privileged?: boolean;
  su_user?: string;
  su_password?: string;
  batch_id?: string;
}) {
  return request({
    url: apiPrefix + 'execute_command/',
    method: 'post',
    data,
  });
}

/**
 * Execute a script, returns execution_id
 * Frontend gets real-time output via WebSocket
 */
export function executeScript(data: {
  host_id: string;
  script_type: 'sh' | 'python';
  script_content: string;
  args?: string[];
  working_directory?: string;
  environment?: Record<string, string>;
  timeout_seconds?: number;
  merge_streams?: boolean;
  load_profile?: 'false' | 'true' | 'login';
  privileged?: boolean;
  su_user?: string;
  su_password?: string;
  batch_id?: string;
  exec_mode?: 'serial' | 'parallel' | 'pilot';
  concurrent?: number;
  fail_strategy?: 'stop' | 'continue';
  pilot_count?: number;
  pilot_success_rate?: number;
  need_audit?: boolean;
  auto_notify?: boolean;
}) {
  return request({
    url: apiPrefix + 'execute_script/',
    method: 'post',
    data,
  });
}

/**
 * Terminate a running command
 */
export function terminateCommand(data: { host_id: string; execution_id: string }) {
  return request({
    url: apiPrefix + 'terminate_command/',
    method: 'post',
    data,
  });
}

/**
 * Pause a running command (SIGSTOP)
 */
export function pauseCommand(data: { host_id: string; execution_id: string }) {
  return request({
    url: apiPrefix + 'pause_command/',
    method: 'post',
    data,
  });
}

/**
 * Resume a paused command (SIGCONT)
 */
export function resumeCommand(data: { host_id: string; execution_id: string }) {
  return request({
    url: apiPrefix + 'resume_command/',
    method: 'post',
    data,
  });
}

/**
 * List commands running on the specified host
 */
export function listExecutions(params: { host_id: string }) {
  return request({
    url: apiPrefix + 'list_executions/',
    method: 'get',
    params,
  });
}

/**
 * Query execution history records
 */
export function executionHistory(params: { host_id?: string; page?: number; limit?: number }) {
  return request({
    url: apiPrefix + 'execution_history/',
    method: 'get',
    params,
  });
}

/**
 * Get ops WebSocket URL
 * @param executionId Execution ID
 */
export function getOpsWebSocketUrl(executionId: string): string {
  const wsBase = getWsBaseURL().replace(/\/$/, '');
  const token = Session.get('token') || '';
  return `${wsBase}/ws/ops/${executionId}/?token=${encodeURIComponent(token)}`;
}

export interface FileEntry {
  name: string;
  is_dir: boolean;
  size: number;
  modified_at: number;
  permissions?: string;
  owner?: string;
  group?: string;
}

export interface ListFilesResponse {
  success: boolean;
  path?: string;
  entries?: FileEntry[];
  error?: string;
}

export function listFiles(params: { host_id: string; path: string }) {
  return request({
    url: apiPrefix + 'list_files/',
    method: 'get',
    params,
  });
}

export function uploadFile(data: FormData) {
  return request({
    url: apiPrefix + 'upload_file/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export interface BackendTempUploadResponse {
  file_path: string;
  filename: string;
  size: number;
  original_filename: string;
  default_target_path: string;
}

export function uploadToBackendTemp(file: File, originalFilename?: string, defaultTargetPrefix?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (originalFilename) {
    formData.append('original_filename', originalFilename);
  }
  if (defaultTargetPrefix) {
    formData.append('default_target_prefix', defaultTargetPrefix);
  }
  return request({
    url: apiPrefix + 'upload_to_backend_temp/',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export interface BatchBackendTempUploadFile {
  file_path: string;
  filename: string;
  size: number;
  original_filename: string;
  default_target_path: string;
  error?: string;
}

export interface BatchBackendTempUploadResponse {
  files: BatchBackendTempUploadFile[];
  session_id: string;
  upload_dir: string;
}

export function uploadBatchToBackendTemp(files: File[], defaultTargetPrefix?: string) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  if (defaultTargetPrefix) {
    formData.append('default_target_prefix', defaultTargetPrefix);
  }
  return request({
    url: apiPrefix + 'upload_batch_to_backend_temp/',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function downloadFile(params: { host_id: string; path: string }) {
  return request({
    url: apiPrefix + 'download_file/',
    method: 'get',
    params,
    responseType: 'blob',
  });
}

export function checkFile(params: { host_id: string; path: string }) {
  return request({
    url: apiPrefix + 'check_file/',
    method: 'get',
    params,
  });
}

export function getScriptCategoryTree() {
  return request({
    url: scriptCategoryApiPrefix,
    method: 'get',
    params: { limit: 9999 },
  });
}

export function getScriptList(params?: any) {
  return request({
    url: scriptApiPrefix,
    method: 'get',
    params: { limit: 9999, ...params },
  });
}

export function getScriptCategories() {
  return request({
    url: scriptApiPrefix + 'categories/',
    method: 'get',
  });
}

export function getScriptDetail(id: number | string) {
  return request({
    url: scriptApiPrefix + id + '/',
    method: 'get',
    _noGlobalError: true,
  });
}

export function createScript(data: any) {
  return request({
    url: scriptApiPrefix,
    method: 'post',
    data,
  });
}

export function updateScript(id: number | string, data: any) {
  return request({
    url: scriptApiPrefix + id + '/',
    method: 'put',
    data,
  });
}

export function copyScript(id: number | string) {
  return request({
    url: scriptApiPrefix + id + '/copy/',
    method: 'post',
  });
}

export function toggleScriptStatus(id: number | string) {
  return request({
    url: scriptApiPrefix + id + '/toggle-status/',
    method: 'post',
  });
}

export interface OpsWsMessage {
  type: 'output' | 'status' | 'error' | 'done';
  execution_id?: string;
  host_id?: string;
  stream?: 'stdout' | 'stderr';
  data?: string;
  status?: 'running' | 'success' | 'error' | 'terminated';
  exit_code?: number;
  message?: string;
}