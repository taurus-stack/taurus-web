import { i18n } from '/@/i18n';
const t = i18n.global.t;

export const historyStatusTagType = (status: number, exitCode?: number): string => {
  if (status === 2 && exitCode !== undefined && exitCode < 0) return 'danger';
  if (status === 2 && exitCode !== undefined && exitCode > 0) return 'warning';
  switch (status) {
    case 0: return 'info';
    case 1: return 'warning';
    case 2: return 'success';
    case 3: return 'danger';
    case 4: return 'info';
    default: return 'info';
  }
};

export const historyStatusText = (status: number, exitCode?: number): string => {
  if (status === 2 && exitCode !== undefined && exitCode < 0) return t('message.terminated');
  if (status === 2 && exitCode !== undefined && exitCode > 0) return t('message.execError');
  const map: Record<number, string> = {
    0: t('message.waitingExecute'),
    1: t('message.executing'),
    2: t('message.completed'),
    3: t('message.statusFailed'),
    4: t('message.interrupted'),
  };
  return map[status] || t('message.unknown');
};

export const historyExecTypeTagType = (execType: string): string => {
  if (execType === 'script') return 'info';
  if (execType === 'command') return 'primary';
  return 'info';
};

export const historyExecTypeText = (execType: string): string => {
  if (execType === 'script') return t('message.script');
  if (execType === 'command') return t('message.command');
  if (execType === 'upload') return t('message.fileUpload');
  if (execType === 'download') return t('message.fileDownload');
  return execType || '-';
};

export const historyFormatCommand = (row: any): string => {
  if (row.execution_type === 'script') return `${historyExecTypeText(row.execution_type)}: ${row.script_type || 'shell'}`;
  if (row.execution_type === 'file') return `${historyExecTypeText(row.execution_type)}: ${row.file_path || '-'}`;
  return row.command || '-';
};

export const historyBatchStatusTagType = (row: any): string => {
  const children = row._children || [];
  if (children.length === 0) return 'info';
  if (children.some((c: any) => c.status === 1)) return 'warning';
  if (children.some((c: any) => c.status === 4)) return 'info';
  if (children.every((c: any) => c.status === 2 && (c.exit_code === 0 || c.exit_code === undefined))) return 'success';
  if (children.some((c: any) => c.status === 3 || (c.status === 2 && (c.exit_code !== undefined && c.exit_code !== 0)))) return 'danger';
  return 'info';
};

export const historyBatchStatusText = (row: any): string => {
  const children = row._children || [];
  if (children.length === 0) return t('message.noTask');
  if (children.some((c: any) => c.status === 1)) return t('message.executing');
  if (children.some((c: any) => c.status === 4)) return t('message.hasInterrupted');
  if (children.every((c: any) => c.status === 2 && (c.exit_code === 0 || c.exit_code === undefined))) return t('message.completed');
  if (children.some((c: any) => c.status === 3 || (c.status === 2 && (c.exit_code !== undefined && c.exit_code !== 0)))) return t('message.hasFailed');
  return t('message.waiting');
};

export const formatTimestamp = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  let date: Date;
  if (typeof value === 'number') {
    date = new Date(value < 1e11 ? value * 1000 : value);
  } else if (typeof value === 'string') {
    if (/^\d+(\.\d+)?$/.test(value)) {
      const num = parseFloat(value);
      date = new Date(num < 1e11 ? num * 1000 : num);
    } else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

export interface RerunFormData {
  execution_type: 'command' | 'script' | '';
  command: string;
  script_type: string;
  script_content: string;
  working_directory: string;
  timeout_seconds: number | undefined;
  environment: string;
  use_shell: boolean | undefined;
  load_profile: string;
  merge_streams: boolean | undefined;
  privileged: boolean | undefined;
  su_user: string;
  su_password: string;
  exec_mode: 'serial' | 'parallel' | 'pilot';
  concurrent: number;
  fail_strategy: 'stop' | 'continue';
  pilot_count: number;
  pilot_success_rate: number;
  args_json: string;
  need_audit: boolean | undefined;
  auto_notify: boolean | undefined;
  approval_mode: 'any' | 'all' | undefined;
  approver_ids: number[] | undefined;
  countersign_ids: number[] | undefined;
  submit_desc: string | undefined;
}

export const createDefaultRerunForm = (): RerunFormData => ({
  execution_type: '',
  command: '',
  script_type: 'sh',
  script_content: '',
  working_directory: '',
  timeout_seconds: 300,
  environment: '',
  use_shell: true,
  load_profile: 'false',
  merge_streams: false,
  privileged: false,
  su_user: '',
  su_password: '',
  exec_mode: 'parallel',
  concurrent: 10,
  fail_strategy: 'continue',
  pilot_count: 2,
  pilot_success_rate: 100,
  args_json: '[]',
  need_audit: false,
  auto_notify: false,
  approval_mode: 'any',
  approver_ids: [],
  countersign_ids: [],
  submit_desc: '',
});

export const envObjectToText = (envObj: Record<string, string>): string => {
  if (!envObj || typeof envObj !== 'object' || Object.keys(envObj).length === 0) return '';
  return Object.entries(envObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
};

export const fillRerunFormFromRecord = (record: any): RerunFormData => {
  if (!record) return createDefaultRerunForm();

  const src: any = record;
  const failStrategyRaw = src.fail_strategy;
  const failStrategy: 'stop' | 'continue' =
    failStrategyRaw === 'abort' || failStrategyRaw === 'stop' ? 'stop' :
    failStrategyRaw === 'continue' ? 'continue' :
    'continue';

  return {
    execution_type: src.execution_type || 'command',
    command: src.command || '',
    script_type: src.script_type || 'sh',
    script_content: src.script_content || '',
    working_directory: src.working_directory ?? '',
    timeout_seconds: src.timeout_seconds ?? 300,
    environment: envObjectToText(src.environment ?? {}),
    use_shell: src.use_shell ?? true,
    load_profile: src.load_profile ?? 'false',
    merge_streams: src.merge_streams ?? false,
    privileged: src.privileged ?? false,
    su_user: src.su_user ?? '',
    su_password: '',
    exec_mode: src.exec_mode ?? 'parallel',
    concurrent: src.concurrent ?? src.concurrency ?? 10,
    fail_strategy: failStrategy,
    pilot_count: src.pilot_count ?? 2,
    pilot_success_rate: src.pilot_success_rate ?? 100,
    args_json: Array.isArray(src.args) ? JSON.stringify(src.args) : '[]',
    need_audit: src.need_audit ?? false,
    auto_notify: src.auto_notify ?? false,
    approval_mode: src.approval_mode ?? 'any',
    approver_ids: Array.isArray(src.approver_ids) ? src.approver_ids : [],
    countersign_ids: Array.isArray(src.countersign_ids) ? src.countersign_ids : [],
    submit_desc: src.submit_desc ?? '',
  };
};

export const fillBatchRerunFormFromRecord = (record: any): RerunFormData => {
  const form = fillRerunFormFromRecord(record);
  form.working_directory = '';
  form.timeout_seconds = undefined;
  form.environment = '';
  // Boolean and selection fields: undefined means do not override, use original values from each task
  form.use_shell = undefined;
  form.load_profile = '';
  form.merge_streams = undefined;
  form.privileged = undefined;
  form.su_user = '';
  form.su_password = '';
  form.need_audit = undefined;
  form.auto_notify = undefined;
  form.approval_mode = undefined;
  form.approver_ids = undefined;
  form.countersign_ids = undefined;
  form.submit_desc = undefined;
  form.args_json = '[]';
  return form;
};

export const validateAndParseEnvironment = (envText: string): Record<string, string> | null => {
  if (!envText || !envText.trim()) return {};
  
  const env: Record<string, string> = {};
  
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return Object.keys(env).length > 0 ? env : null;
};

export interface FormattedOutput {
  stdout: string;
  stderr: string;
  merged: string;
  _finished?: boolean;
  _exit_code?: number;
}

export const formatOutputBuffer = (buf: any): FormattedOutput => {
  let stdoutChunks: string[] = [];
  let stderrChunks: string[] = [];
  let metaFinished: boolean | undefined = undefined;
  let metaExitCode: number | undefined = undefined;

  const processChunk = (chunk: any) => {
    let text = '';
    if (typeof chunk === 'string') {
      text = chunk;
    } else if (chunk && typeof chunk === 'object') {
      text = chunk.content || chunk.data || chunk.text || JSON.stringify(chunk);
    } else {
      text = String(chunk);
    }

    // Try to parse text as JSON
    const trimmed = text.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 2) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Extract stdout
          const s = parsed.stdout || parsed.stdOut || parsed.output;
          if (s != null) {
            stdoutChunks.push(String(s));
            return;
          }
          // Extract stderr
          const e = parsed.stderr || parsed.stdErr || parsed.error;
          if (e != null) {
            stderrChunks.push(String(e));
            return;
          }
          // Extract metadata
          if ('finished' in parsed) metaFinished = parsed.finished;
          if ('exit_code' in parsed) metaExitCode = parsed.exit_code;
          if ('finished' in parsed || 'exit_code' in parsed) {
            return; // Metadata chunk, do not append to output
          }
        }
      } catch {
        // Not valid JSON, treat as plain text
      }
    }

    // Plain text: append directly
    stdoutChunks.push(text);
  };

  if (Array.isArray(buf)) {
    buf.forEach(processChunk);
  } else if (buf && typeof buf === 'object') {
    // Single object (case where JSONField directly returns an object)
    const s = buf.stdout || buf.stdOut || buf.output;
    const e = buf.stderr || buf.stdErr || buf.error;
    if (s != null) stdoutChunks.push(String(s));
    if (e != null) stderrChunks.push(String(e));
    if ('finished' in buf) metaFinished = buf.finished;
    if ('exit_code' in buf) metaExitCode = buf.exit_code;
  } else if (typeof buf === 'string') {
    processChunk(buf);
  } else if (buf) {
    try {
      processChunk(JSON.stringify(buf));
    } catch {
      processChunk(String(buf));
    }
  }

  const stdout = stdoutChunks.join('');
  const stderr = stderrChunks.join('');
  return {
    stdout,
    stderr,
    merged: stdout || stderr,
    ...(metaFinished !== undefined ? { _finished: metaFinished } : {}),
    ...(metaExitCode !== undefined ? { _exit_code: metaExitCode } : {}),
  };
};