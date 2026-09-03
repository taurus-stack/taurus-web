import type { NodeManifest } from './types.ts'

type TranslateFn = (key: string, def?: string) => string

const PREFIX = 'message.pages.workflowEditor'

/** Convert underscore_case to PascalCase: 'webhook_notification' → 'WebhookNotification' */
function pascalize(str: string): string {
  return str
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

/** Short alias: t('weNodeWebhookNotificationName', 'Webhook notification') → fallback to def */
function tr(t: TranslateFn, suffix: string, fallback: string): string {
  const v = t(`${PREFIX}.${suffix}`, fallback)
  // vue-i18n when key missing with default arg returns the default, not the key
  return v
}

/** Fully translate a NodeManifest: displayName, description, all params, all outputSchema */
export function translateManifest(
  t: TranslateFn,
  manifest: NodeManifest | null | undefined,
): NodeManifest | null {
  if (!manifest) return null
  const typePascal = pascalize(manifest.nodeType)

  const tNode = (suffix: string, fallback: string) =>
    tr(t, `weNode${typePascal}${suffix}`, fallback)

  const params = (manifest.params || []).map((field) => {
    const keyPas = pascalize(field.key)
    const out: typeof field = {
      ...field,
      label: tNode(`Param${keyPas}Label`, field.label),
    }
    if (field.group) out.group = tNode(`Group${pascalize(field.group)}`, field.group)
    if (field.drawerGroup) out.drawerGroup = tNode(`DrawerGroup${pascalize(field.drawerGroup)}`, field.drawerGroup)
    if (field.placeholder) out.placeholder = tNode(`Param${keyPas}Placeholder`, field.placeholder)
    if (field.help) out.help = tNode(`Param${keyPas}Help`, field.help)
    if (field.keyColumnLabel) out.keyColumnLabel = tNode(`Param${keyPas}KeyLabel`, field.keyColumnLabel)
    if (field.valueColumnLabel) out.valueColumnLabel = tNode(`Param${keyPas}ValueLabel`, field.valueColumnLabel)
    if (field.keyColumnPlaceholder) out.keyColumnPlaceholder = tNode(`Param${keyPas}KeyPlaceholder`, field.keyColumnPlaceholder)
    if (field.valueColumnPlaceholder) out.valueColumnPlaceholder = tNode(`Param${keyPas}ValuePlaceholder`, field.valueColumnPlaceholder)
    if (field.options) {
      out.options = field.options.map((opt) => {
        const optVal = String(opt.value).replace(/[^a-zA-Z0-9]/g, '_')
        return {
          ...opt,
          label: tNode(`Param${keyPas}Opt${pascalize(optVal)}`, opt.label),
        }
      })
    }
    return out
  })

  const outputSchema = (manifest.outputSchema || []).map((field) => ({
    ...field,
    label: tNode(`Output${pascalize(field.key)}Label`, field.label),
  }))

  return {
    ...manifest,
    displayName: tNode('Name', manifest.displayName),
    description: tNode('Desc', manifest.description),
    params,
    outputSchema,
  }
}

/** Translate a category label */
const CATEGORY_KEY: Record<string, string> = {
  control: 'weCatControl',
  execution: 'weCatExecution',
  notification: 'weCatNotification',
  approval: 'weCatApproval',
  integration: 'weCatIntegration',
  transform: 'weCatTransform',
}
export function tCategory(t: TranslateFn, category: string, fallback: string): string {
  const key = CATEGORY_KEY[category]
  if (!key) return fallback
  return tr(t, key, fallback)
}

/** Translate a single field by nodeType + paramKey — used when consuming manifest.params separately */
export function tField(
  t: TranslateFn,
  nodeType: string,
  paramKey: string,
  fallback: string,
  suffix = 'Label',
): string {
  const typePascal = pascalize(nodeType)
  const keyPas = pascalize(paramKey)
  return tr(t, `weNode${typePascal}Param${keyPas}${suffix}`, fallback)
}
