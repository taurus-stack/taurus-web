import { request } from '/@/utils/service'

const apiPrefix = '/api/taurus/workflow/'

export interface NodeManifestAPI {
  node_type: string
  display_name: string
  requires_host: boolean
  is_asynchronous_human: boolean
  category?: 'control' | 'execution' | 'notification' | 'approval' | 'integration' | 'transform'
}

export function fetchManifests(): Promise<NodeManifestAPI[]> {
  return request({
    url: apiPrefix + 'manifests/',
    method: 'get'
  }).then((res: any) => {
    if (res && Array.isArray(res.data)) return res.data
    if (Array.isArray(res)) return res
    return []
  })
}

export function validateStep(nodeType: string, config: Record<string, any>): Promise<{
  valid: boolean
  field_errors?: Record<string, string>
}> {
  return request({
    url: apiPrefix + 'validate_step/',
    method: 'post',
    data: {
      node_type: nodeType,
      config
    }
  }).then((res: any) => {
    if (res && res.data) return res.data
    return res || { valid: true }
  })
}