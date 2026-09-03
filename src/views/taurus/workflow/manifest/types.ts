export type FieldType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'time-picker'
  | 'host-selector'
  | 'host-group-selector'
  | 'credential-selector'
  | 'script-selector'
  | 'node-type-select'
  | 'time-duration'
  | 'json-editor'
  | 'code-editor'
  | 'key-value-table'
  | 'array-list'
  | 'condition-expr'
  | 'loop-body-form'
  | 'remote-source-list'
  | 'user-select'

export interface NodeFieldSchema {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: { label: string; value: any }[]
  help?: string
  group?: string
  drawerGroup?: string
  visibleWhen?: Record<string, any>
  enableGlobalVarImport?: boolean
  multiple?: boolean
  min?: number
  max?: number
  keyColumnLabel?: string
  valueColumnLabel?: string
  keyColumnPlaceholder?: string
  valueColumnPlaceholder?: string
  dynamicEditor?: string
}

export interface NodeManifest {
  nodeType: string
  displayName: string
  category: 'control' | 'execution' | 'notification' | 'approval' | 'integration' | 'transform'
  color: string
  icon: string
  description: string
  requiresHost: boolean
  isAsynchronousHuman: boolean
  inputs: string[]
  outputs: string[]
  params: NodeFieldSchema[]
  outputSchema?: NodeFieldSchema[]
  hiddenInPalette?: boolean
}

export type NodeManifestMap = Record<string, NodeManifest>