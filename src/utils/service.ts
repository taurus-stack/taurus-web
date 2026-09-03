import axios from 'axios';
import { get } from 'lodash-es';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Action } from 'element-plus';

// @ts-ignore
import { errorLog, errorCreate } from './tools.ts';
// import { env } from "/src/utils/util.env";
// import { useUserStore } from "../store/modules/user";
import { Local, Session } from '/@/utils/storage';
import qs from 'qs';
import { getBaseURL } from './baseUrl';
/**
 * @description Create request instance
 */
function createService() {
	// Create an axios instance
	const service = axios.create({
		timeout: 20000,
		headers: {
			'Content-Type': 'application/json;charset=utf-8',
		},
		paramsSerializer: {
			serialize(params) {
				interface paramsObj {
					[key: string]: any;
				}
				let result: paramsObj = {};
				for (const [key, value] of Object.entries(params)) {
					if (value !== '') {
						result[key] = value;
					}
					if (typeof value === 'boolean') {
						result[key] = value ? 'True' : 'False';
					}
				}
				return qs.stringify(result);
			},
		},
	});
	// Request interceptor
	service.interceptors.request.use(
		(config) => config,
		(error) => {
			// Send failed
			console.log(error);
			return Promise.reject(error);
		}
	);
	// Response interceptor
	service.interceptors.response.use(
		(response) => {
			if (response.config.responseType === 'blob') {
				return response;
			}
			// dataAxios is the data from axios response
			const dataAxios = response.data;
			// This status code is agreed with the backend
			const { code } = dataAxios;
			// swagger/schema detection
			if (dataAxios.swagger != undefined || dataAxios.openapi != undefined) {
				return dataAxios;
			}
			// Check based on code
			if (code === undefined) {
				// No code means this is not a project backend interface
				errorCreate(`Non-standard response: ${dataAxios}, ${response.config.url}`, false);
				return dataAxios;
			} else {
				// Business layer handles errors itself (e.g. 404 friendly prompt for script details); use _noGlobalError=true to suppress global popup
				const suppressNotify = !!get(response, 'config._noGlobalError');
				// Has code means this is a backend interface, proceed with further checks
				switch (code) {
					case 400:
						// Local.clear();
						// Session.clear();
						errorCreate(`${dataAxios.msg}: ${response.config.url}`, !suppressNotify);
						// window.location.reload();
						break;
					case 401:
						// Local.clear();
						Session.clear();
						dataAxios.msg = 'Authentication failed, please sign in again';
						ElMessageBox.alert(dataAxios.msg, 'Tip', {
							confirmButtonText: 'OK',
							callback: (action: Action) => {
								window.location.reload();
							},
						});
						errorCreate(`${dataAxios.msg}: ${response.config.url}`, false);
						break;
					case 2000:
						// @ts-ignore
						if (response.config.unpack === false) {
							// If unpacking not needed
							return dataAxios;
						}
						return dataAxios;
					case 4000:
						errorCreate(`${dataAxios.msg}: ${response.config.url}`, !suppressNotify);
						break;
					default:
						// Not a valid code
						errorCreate(`${dataAxios.msg}: ${response.config.url}`, !suppressNotify);
						break;
				}
				return Promise.reject(dataAxios);
			}
		},
		(error) => {
			const status = get(error, 'response.status');
			let suppressNotify = !!get(error, 'response.config._noGlobalError');
			// Edition Gate 403 静默：后端 EE 专属能力返回的 PermissionDenied detail 含特征词
			// CE 不弹 toast，让各页面自己通过 Edition store 控制是否请求/显示
			if (status === 403) {
				const detail = get(error, 'response.data.detail', '') || get(error, 'response.data.msg', '') || '';
				if (typeof detail === 'string' && /专属能力|商业版|Enterprise Edition/i.test(detail)) {
					suppressNotify = true;
					// 把后端 detail 挂到 error 上，供调用方 catch 里识别（如需区分处理）
					error.editionGated = true;
					error.message = detail;
				} else {
					error.message = 'Access denied';
				}
			}
			switch (status) {
				case 400:
					error.message = 'Bad request';
					break;
				case 401:
					if (suppressNotify) {
						error.message = 'Unauthorized (suppressed)';
					} else {
						// Local.clear();
						Session.clear();
						error.message = 'Session expired, please sign in again';
						ElMessageBox.alert(error.message, 'Tip', {
							confirmButtonText: 'OK',
							callback: (action: Action) => {
								window.location.reload();
							},
						});
					}
					break;
				case 403:
					// 上面已处理 Edition gate 和默认 message
					break;
				case 404:
					// Don't expose specific URL (users may think "wrong API"); just say resource not found
					error.message = 'Resource not found or no access permission';
					break;
				case 408:
					error.message = 'Request timeout';
					break;
				case 500:
					error.message = 'Internal server error';
					break;
				case 501:
					error.message = 'Not implemented';
					break;
				case 502:
					error.message = 'Gateway error';
					break;
				case 503:
					error.message = 'Service unavailable';
					break;
				case 504:
					error.message = 'Gateway timeout';
					break;
				case 505:
					error.message = 'HTTP version not supported';
					break;
				default:
					break;
			}
			// 401 must globally prompt re-login regardless of suppressNotify; other business-handled errors can be silent
			const shouldNotify = status === 401 ? true : !suppressNotify;
			errorLog(error, shouldNotify);
			if (status === 401) {
				// const userStore = useUserStore();
				// userStore.logout();
			}
			return Promise.reject(error);
		}
	);
	return service;
}

/**
 * @description Create request method
 * @param {Object} service axios instance
 */
function createRequestFunction(service: any) {
	return function (config: any) {
		const token = Session.get('token');
		const configDefault = {
			headers: {
				'Content-Type': get(config, 'headers.Content-Type', 'application/json'),
			},
			timeout: 30000,
			baseURL: getBaseURL(),
			data: {},
		};

		if (token != null) {
			// @ts-ignore
			configDefault.headers.Authorization = 'JWT ' + token;
		}
		// Merge config.headers instead of replacing entirely to avoid overwriting Authorization
		if (config && config.headers) {
			Object.assign(configDefault.headers, config.headers);
			config = Object.assign({}, config);
			delete config.headers;
		}
		return service(Object.assign(configDefault, config));
	};
}

// Instance and request method for real network requests
export const service = createService();
export const request = createRequestFunction(service);

// Instance and request method for mock network requests
export const serviceForMock = createService();
export const requestForMock = createRequestFunction(serviceForMock);

/**
 * Download file
 * @param url       API URL
 * @param params    Query params (GET) or data param (passed via data field for POST)
 * @param method    Request method get / post
 * @param data      Request body (optional for POST)
 * @param filename  Default filename (fallback when backend lacks Content-Disposition), no extension;
 *                  if backend returns filename=xxx, use backend value.
 * @returns Promise<void>  Resolves on download completion; rejects(Error) on download/parse failure. Caller can catch and show error.
 */
export const downloadFile = async function ({
  url,
  params,
  method = 'get',
  data,
  filename = 'export',
}: any) {
  // Replicate createRequestFunction's token/baseURL/timeout injection (downloadFile needs to go directly through axios service for headers,
  // cannot wrap via request; JWT / baseURL / Content-Type must match regular requests, otherwise dvadmin returns "Authentication credentials not provided")
  const token = Session.get('token');
  const axiosConf: any = {
    url,
    method: (method || 'get').toLowerCase(),
    responseType: 'blob',
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  if (token != null) {
    axiosConf.headers.Authorization = 'JWT ' + token;
  }
  if (params !== undefined && params !== null) axiosConf.params = params
  if (data !== undefined && data !== null) axiosConf.data = data

  let resp: any
  try {
    resp = await service(axiosConf)
  } catch (err: any) {
    // 1) HTTP failure (4xx/5xx): if backend returns JSON error for business errors, parse blob back to JSON before showing message
    if (err?.response?.data instanceof Blob) {
      try {
        const txt = await err.response.data.text()
        let msg = txt
        try {
          const parsed = JSON.parse(txt)
          msg = parsed?.msg || parsed?.message || parsed?.detail || txt
        } catch (_) { /* ignore */ }
        throw new Error(msg || `Download failed (HTTP ${err.response.status})`)
      } catch (parseErr: any) {
        if (parseErr instanceof Error && /^Download failed/i.test(parseErr.message)) throw parseErr
      }
    }
    throw new Error(err?.message || 'Download request failed')
  }

  // 2) Response body compatibility: dvadmin interceptor sometimes returns response, sometimes response.data
  const rawBlob: Blob | null = (() => {
    if (resp instanceof Blob) return resp
    if (resp?.data instanceof Blob) return resp.data
    return null
  })()

  // Get headers (axios: resp.headers is plain object; fetch: has .get method)
  const headers = resp?.headers || {}
  const getHeader = (k: string): string | undefined => {
    if (!headers) return undefined
    if (typeof headers.get === 'function') {
      const v = headers.get(k) || headers.get(k.toLowerCase()) || headers.get(k.toUpperCase())
      return v ?? undefined
    }
    return headers[k] ?? headers[k.toLowerCase()] ?? headers[k.toUpperCase()]
  }

  if (!rawBlob || rawBlob.size === 0) {
    throw new Error('Download failed: server returned an empty file')
  }

  // 3) Content-Type == application/json: three scenarios (dvadmin cases are complex)
  //    A. Backend business error JSON ⇒ throw backend msg (permission denied / param error / AssertionError text, etc.)
  //    B. Valid JSON export file ⇒ mark __forceExt=.json, download as JSON
  //    C. Parse fail but rawBlob non-empty ⇒ common dvadmin pitfall: actually returns xlsx/zip, but Content-Type
  //       is still application/json → ignore Content-Type, **continue download as binary, NEVER throw**
  const contentType = getHeader('content-type') || (rawBlob as any).type || ''
  const lookLikeJson = contentType && contentType.toLowerCase().includes('application/json')
  if (lookLikeJson || (rawBlob as any).type?.toLowerCase()?.includes('json')) {
    const txt = await rawBlob.text()
    let parsed: any = undefined
    let parseOk = false
    try {
      parsed = JSON.parse(txt)
      parseOk = true
    } catch (_) { parseOk = false }

    if (parseOk && parsed && typeof parsed === 'object') {
      // A) Business error detection: status=False / success=False / code!=200&code!=0, with msg/message/detail
      const hasErrorCode =
        (typeof parsed.code === 'number' && parsed.code !== 200 && parsed.code !== 0) ||
        (typeof parsed.status === 'boolean' && parsed.status === false) ||
        (typeof parsed.success === 'boolean' && parsed.success === false)
      const errMsg = parsed?.msg || parsed?.message || parsed?.detail
      if (hasErrorCode && errMsg) {
        throw new Error(errMsg)
      }
      if (parsed?.error && typeof parsed.error === 'string') {
        throw new Error(parsed.error)
      }
      // B) Valid JSON: when export result is itself a JSON file (definition / metadata), proceed with download
      ;(rawBlob as any).__forceExt = '.json'
    }
    // C) Parse fail (xlsx/zip binary labeled as application/json): do nothing, continue file download
  }

  // 4) Parse filename: priority Content-Disposition → attachment; filename*=UTF-8''xxx; filename=xxx → final fallback
  let fileName = `${filename}.xlsx`
  const disposition = getHeader('content-disposition')
  if (disposition) {
    // RFC 5987: filename*=UTF-8''<encoded> takes priority
    const starMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    if (starMatch && starMatch[1]) {
      try {
        fileName = decodeURIComponent(starMatch[1].trim())
      } catch (_) { /* ignore decoding err, fallback below */ }
    } else {
      const plainMatch = disposition.match(/filename\s*=\s*("([^"]+)"|([^;]+))/i)
      const raw = (plainMatch && (plainMatch[2] || plainMatch[3]))?.trim()
      if (raw) {
        try {
          fileName = decodeURIComponent(raw.replace(/^"|"$/g, ''))
        } catch (_) {
          fileName = raw.replace(/^"|"$/g, '')
        }
      }
    }
  }

  // 5) Extension priority: __forceExt (valid JSON export) > parsed extension > Content-Type guess
  const forceExt = (rawBlob as any).__forceExt
  if (forceExt && typeof forceExt === 'string') {
    const ext = forceExt.startsWith('.') ? forceExt : `.${forceExt}`
    if (!fileName.toLowerCase().endsWith(ext.toLowerCase())) {
      fileName = fileName.replace(/\.[^.]{0,8}$/, '') + ext
    }
  } else if (!/\.[^.]{1,8}$/.test(fileName)) {
    const ct = (contentType || '').toLowerCase()
    if (ct.includes('json')) fileName += '.json'
    else if (ct.includes('zip')) fileName += '.zip'
    else if (ct.includes('sheet') || ct.includes('excel')) fileName += '.xlsx'
    else fileName += '.xlsx'
  }

  try {
    const blob = new Blob([rawBlob], { type: rawBlob.type || 'application/octet-stream' })
    const elink = document.createElement('a')
    elink.download = fileName
    elink.style.display = 'none'
    const objUrl = URL.createObjectURL(blob)
    elink.href = objUrl
    document.body.appendChild(elink)
    elink.click()
    // Allow time after click before revoking URL (Safari occasionally cancels if too fast)
    setTimeout(() => {
      URL.revokeObjectURL(objUrl)
      document.body.removeChild(elink)
    }, 300)
  } catch (e: any) {
    throw new Error(e?.message || 'Browser failed to save file')
  }
}