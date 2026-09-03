import type { NodeManifest, NodeManifestMap } from './types'

const registry: NodeManifestMap = {}

let loaded = false

export function registerNodeManifest(manifest: NodeManifest): void {
  if (!manifest.nodeType) {
    throw new Error('Node manifest must have a nodeType')
  }
  if (registry[manifest.nodeType]) {
    const existing = registry[manifest.nodeType]
    // Static 'start/end/virtual_start/virtual_end' must NEVER be overwritten (especially when unknown manifests come back)
    const protectedTypes = ['start', 'end', 'virtual_start', 'virtual_end', 'wait', 'noop', 'condition', 'loop', 'sub_workflow']
    if (protectedTypes.includes(manifest.nodeType)) {
      console.warn(
        `[WorkflowRegistry] 保留节点类型 "${manifest.nodeType}" 已注册为 display="${existing.displayName}"，` +
        `拒绝覆盖为 display="${manifest.displayName}"。`
      )
      return
    }
    console.warn(
      `[WorkflowRegistry] Overwriting manifest for "${manifest.nodeType}"`,
      `(${existing.displayName} -> ${manifest.displayName})`
    )
  }
  registry[manifest.nodeType] = manifest
}

export function getNodeManifest(nodeType: string): NodeManifest | undefined {
  return registry[nodeType]
}

export function getAllNodeManifests(): NodeManifest[] {
  return Object.values(registry)
}

export function getNodeManifestsByCategory(category: NodeManifest['category']): NodeManifest[] {
  return Object.values(registry).filter((m) => m.category === category && !m.hiddenInPalette)
}

export function getAllCategories(): NodeManifest['category'][] {
  const set = new Set<NodeManifest['category']>()
  Object.values(registry).forEach((m) => set.add(m.category))
  return Array.from(set)
}

export function isRegistryLoaded(): boolean {
  return loaded
}

export function setRegistryLoaded(value: boolean): void {
  loaded = value
}

export function getSortedCategories(): NodeManifest['category'][] {
  const order: NodeManifest['category'][] = [
    'control',
    'execution',
    'notification',
    'approval',
  ]
  const available = new Set(getAllCategories())
  return order.filter((c) => available.has(c))
}

const _isFieldVisible = (field: { visibleWhen?: Record<string, any> }, config: Record<string, any>): boolean => {
  if (!field.visibleWhen) return true
  return Object.entries(field.visibleWhen).every(([key, value]) => {
    const currentVal = config[key]
    if (Array.isArray(value)) return value.includes(currentVal)
    return currentVal === value
  })
}

export const normalizeParamsByManifest = (
  config: Record<string, any>,
  manifest: NodeManifest | null | undefined,
): Record<string, any> => {
  if (!manifest || !Array.isArray(manifest.params)) {
    const { nodeType, node_key, node_name, ...rest } = config as any
    return rest
  }
  const cleaned: Record<string, any> = { ...config }
  delete cleaned.nodeType
  delete cleaned.node_key
  delete cleaned.node_name

  // Fill in manifest.defaultValue (prevent node.data.config from not having synced defaults)
  manifest.params.forEach((field) => {
    if (cleaned[field.key] === undefined && field.defaultValue !== undefined) {
      cleaned[field.key] = field.defaultValue
    }
  })

  const visibleKeys = new Set<string>()
  manifest.params.forEach((field) => {
    if (_isFieldVisible(field, cleaned)) {
      visibleKeys.add(field.key)
    }
  })
  const result: Record<string, any> = {}
  manifest.params.forEach((field) => {
    if (!visibleKeys.has(field.key)) return
    const val = cleaned[field.key]
    // Don't write empty for number types (prevents backend validate_config from complaining 'must be a number')
    if ((field.type === 'number' || field.type === 'time-duration') && (val === '' || val === null || val === undefined)) {
      return
    }
    if (val === undefined) return
    // key-value-table type: convert UI [{key,value}] array back to backend format
    // If entries contain extra metadata (e.g. file upload original_filename/size), keep array to avoid info loss
    // Plain key/value entries are still converted to Record<string, string> for env-var etc. compatibility
    if (field.type === 'key-value-table') {
      if (Array.isArray(val)) {
        const hasExtraMeta = val.some((kv: any) => {
          if (!kv || typeof kv !== 'object') return false
          const keys = Object.keys(kv)
          return keys.some((k) => k !== 'key' && k !== 'value')
        })
        if (hasExtraMeta) {
          result[field.key] = val
            .filter((kv: any) => {
              const k = kv?.key
              return k !== undefined && k !== null && String(k).trim() !== ''
            })
            .map((kv: any) => {
              const entry: Record<string, any> = {}
              for (const k of Object.keys(kv)) {
                entry[k] = kv[k]
              }
              return entry
            })
        } else {
          const obj: Record<string, string> = {}
          val.forEach((kv: any) => {
            const k = kv?.key
            if (k !== undefined && k !== null && String(k).trim() !== '') {
              obj[String(k)] = kv?.value === undefined || kv?.value === null ? '' : String(kv.value)
            }
          })
          result[field.key] = obj
        }
      } else if (val && typeof val === 'object') {
        result[field.key] = val
      } else {
        result[field.key] = {}
      }
      return
    }
    // array-list type: UI stores string[], backend expects string[] — normalize (filter empty, keep order; tolerate legacy comma-separated)
    if (field.type === 'array-list') {
      if (Array.isArray(val)) {
        result[field.key] = val
          .map((v) => (v === undefined || v === null ? '' : String(v)))
      } else if (typeof val === 'string') {
        result[field.key] = val.trim() === '' ? [] : val.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
      } else {
        result[field.key] = []
      }
      return
    }
    result[field.key] = val
  })
  return result
}

export const cleanConfigForValidateStep = (
  nodeType: string,
  config: Record<string, any>,
): Record<string, any> => {
  const manifest = getNodeManifest(nodeType)
  return normalizeParamsByManifest(config, manifest)
}