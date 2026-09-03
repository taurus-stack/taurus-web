<template>
  <div class="auto-node-form">
    <el-form :disabled="readonly" class="auto-node-form-inner" v-if="manifest">
      <div v-for="group in groupedParams" :key="group.name" class="form-group">
        <div v-if="group.name" class="group-title">
          <span class="group-title-text">{{ group.name }}</span>
          <el-button
            v-if="groupHasDefaults(group)"
            type="primary"
            link
            size="small"
            class="group-reset-btn"
            @click="resetGroupToDefaults(group.name)"
          >
            <el-icon><Refresh /></el-icon>{{ t('message.restoreDefault') }}</el-button>
        </div>
        <template v-for="field in group.fields" :key="field.key">
          <el-form-item
            v-if="!isRemoteSourceField(field)"
            :label="getFieldLabel(field)"
            :required="field.required"
            :error="errors?.[field.key]"
            :class="{ 'has-error': !!(errors?.[field.key]) }"
          >
            <el-input
              v-if="field.type === 'text'"
              v-model="innerConfig[field.key]"
              :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
              @change="onFieldChange(field.key)"
            />
            <el-input
              v-else-if="field.type === 'password'"
              v-model="innerConfig[field.key]"
              type="password"
              show-password
              :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
              @change="onFieldChange(field.key)"
            />

            <!-- Dynamic request body editor (takes priority over textarea) -->
            <div v-else-if="field.dynamicEditor === 'body-format'" class="body-format-editor" style="width: 100%;">
              <el-input
                v-if="innerConfig.body_format === 'json' || !innerConfig.body_format"
                :model-value="getBodyJsonDisplay()"
                type="textarea"
                :rows="6"
                :placeholder="t('message.pleaseInputJson')"
                class="json-editor"
                @update:model-value="(val: string) => setBodyJsonValue(val)"
              >
                <template #append>
                  <el-button link type="primary" @click="formatBodyJson">{{ t('message.format') }}</el-button>
                </template>
              </el-input>

              <div v-else-if="innerConfig.body_format === 'form'" class="body-form-editor">
                <div class="kv-column-headers">
                  <div class="kv-col-header kv-col-key">{{ t("message.paramName") }}</div>
                  <div class="kv-col-header kv-col-value">{{ t("message.paramValue") }}</div>
                  <div class="kv-col-header kv-col-actions"></div>
                </div>
                <div v-for="(kv, idx) in bodyFormRows" :key="idx" class="kv-row">
                  <div class="kv-col-key-wrap">
                    <el-input
                      v-model="kv.key"
                      :placeholder="t('message.paramName')"
                      size="small"
                      @change="writeBodyFormToConfig"
                    />
                  </div>
                  <el-input
                    v-model="kv.value"
                    :placeholder="t('message.paramValue')"
                    size="small"
                    class="kv-value-input"
                    @change="writeBodyFormToConfig"
                  />
                  <el-button
                    type="danger"
                    link
                    size="small"
                    :disabled="readonly"
                    @click="removeBodyFormRow(idx)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button type="primary" link size="small" :disabled="readonly" @click="addBodyFormRow">
                  <el-icon style="margin-right:2px;"><Plus /></el-icon>{{ t("message.addParam") }}
                </el-button>
              </div>

              <el-input
                v-else
                :model-value="String(innerConfig[field.key] ?? '')"
                type="textarea"
                :rows="6"
                :placeholder="t('message.pleaseInputRawText')"
                @update:model-value="(val: string) => { innerConfig[field.key] = val; onFieldChange(field.key) }"
              />
            </div>

            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="innerConfig[field.key]"
              type="textarea"
              :rows="4"
              :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
              @change="onFieldChange(field.key)"
            />
            <el-input
              v-else-if="field.type === 'code-editor'"
              v-model="innerConfig[field.key]"
              type="textarea"
              :rows="6"
              :placeholder="field.placeholder || t('message.pleaseInputCode')"
              class="code-editor"
              @change="onFieldChange(field.key)"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="innerConfig[field.key]"
              :min="field.min ?? 0"
              :max="field.max"
              :placeholder="field.placeholder"
              @change="onFieldChange(field.key)"
            />
            <el-time-picker
              v-else-if="field.type === 'time-picker'"
              v-model="innerConfig[field.key]"
              value-format="HH:mm:ss"
              format="HH:mm:ss"
              :placeholder="t('message.pleaseSelectTime')"
              style="width: 100%"
              @change="onFieldChange(field.key)"
            />
            <el-switch
              v-else-if="field.type === 'boolean'"
              v-model="innerConfig[field.key]"
              @change="onFieldChange(field.key)"
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="innerConfig[field.key]"
              :placeholder="field.placeholder || t('message.pleaseSelectPh')"
              style="width: 100%"
              @change="onFieldChange(field.key)"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select
              v-else-if="field.type === 'multiSelect'"
              v-model="innerConfig[field.key]"
              multiple
              :placeholder="field.placeholder || t('message.pleaseSelectMulti')"
              style="width: 100%"
              @change="onFieldChange(field.key)"
            >
              <el-option
                v-for="opt in field.options || []"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>

            <div v-else-if="field.type === 'node-type-select'" class="complex-field">
              <el-select
                v-model="innerConfig[field.key]"
                :placeholder="field.placeholder || t('message.pleaseSelectNodeType')"
                filterable
                style="width: 100%"
                @change="onFieldChange(field.key)"
              >
                <el-option
                  v-for="nt in availableNodeTypes"
                  :key="nt.nodeType"
                  :label="nt.displayName"
                  :value="nt.nodeType"
                />
              </el-select>
            </div>

            <div v-else-if="field.type === 'host-selector'" class="complex-field host-selector-field">
              <div
                class="selector-display-tag-box"
                :class="{ 'is-readonly': readonly }"
                @click="readonly ? undefined : openHostSelector(field)"
              >
                <el-tag
                  :type="getHostCount(innerConfig[field.key]) > 0 ? 'primary' : 'info'"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                  :closable="getHostCount(innerConfig[field.key]) > 0 && !readonly"
                  :disabled="readonly"
                  @close.stop="clearHostSelection(field)"
                >
                  {{ formatHostCountDisplay(innerConfig[field.key]) }}
                </el-tag>
              </div>
              <el-button size="small" :disabled="readonly" @click="openHostSelector(field)">{{ t("message.selectBtn") }}</el-button>
            </div>

            <div v-else-if="field.type === 'host-group-selector'" class="complex-field host-selector-field">
              <div
                class="selector-display-tag-box"
                :class="{ 'is-readonly': readonly }"
                @click="readonly ? undefined : openHostGroupSelector(field)"
              >
                <el-tag
                  :type="getHostCount(innerConfig[field.key]) > 0 ? 'primary' : 'info'"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                  :closable="getHostCount(innerConfig[field.key]) > 0 && !readonly"
                  :disabled="readonly"
                  @close.stop="clearHostSelection(field)"
                >
                  {{ formatHostCountDisplay(innerConfig[field.key]) }}
                </el-tag>
              </div>
              <el-button size="small" :disabled="readonly" @click="openHostGroupSelector(field)">{{ t("message.selectBtn") }}</el-button>
            </div>

            <div v-else-if="field.type === 'credential-selector'" class="complex-field host-selector-field">
              <div
                class="selector-display-tag-box"
                :class="{ 'is-readonly': readonly }"
                @click="readonly ? undefined : openCredentialSelector(field)"
              >
                <el-tag
                  v-if="innerConfig[field.key]"
                  type="primary"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                  closable
                  :disabled="readonly"
                  @close.stop="innerConfig[field.key] = null; onFieldChange(field.key)"
                >
                  {{ t("message.selectedCredential") }} {{ innerConfig[field.key] }}
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                >
                  {{ t("message.noCredentialSelected") }}
                </el-tag>
              </div>
              <el-button size="small" :disabled="readonly" @click="openCredentialSelector(field)">{{ t("message.selectBtn") }}</el-button>
            </div>

            <div v-else-if="field.type === 'script-selector'" class="complex-field host-selector-field">
              <div
                class="selector-display-tag-box"
                :class="{ 'is-readonly': readonly }"
                @click="readonly ? undefined : openScriptSelector(field)"
              >
                <el-tag
                  v-if="innerConfig[field.key]"
                  type="primary"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                  closable
                  :disabled="readonly"
                  @close.stop="innerConfig[field.key] = null; onFieldChange(field.key)"
                >
                  {{ t("message.selectedScript") }} {{ scriptNameMap[String(innerConfig[field.key])] || ('ID: ' + innerConfig[field.key]) }}
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  effect="light"
                  size="default"
                  class="host-count-tag"
                >
                  {{ t("message.noScriptSelected") }}
                </el-tag>
              </div>
              <el-button size="small" :disabled="readonly" @click="openScriptSelector(field)">{{ t("message.selectBtn") }}</el-button>
            </div>

            <div v-else-if="field.type === 'time-duration'" class="time-duration-field">
              <el-input-number
                v-model="innerConfig[field.key]"
                :min="field.min ?? 1"
                :max="field.max"
                :step="1"
                style="width: calc(100% - 100px); margin-right: 8px;"
                @change="onFieldChange(field.key)"
              />
              <el-select
                :model-value="durationUnits[field.key]"
                style="width: 92px;"
                @update:model-value="(newVal: string) => onDurationUnitChange(field.key, newVal)"
              >
                <el-option :label="t('message.unitSec')" value="second" />
                <el-option :label="t('message.unitMin')" value="minute" />
                <el-option :label="t('message.unitHour')" value="hour" />
                <el-option :label="t('message.unitDay')" value="day" />
              </el-select>
            </div>

            <el-input
              v-else-if="field.type === 'json-editor'"
              :model-value="getJsonDisplayValue(field.key)"
              type="textarea"
              :rows="4"
              :placeholder="field.placeholder || t('message.jsonFormatPlaceholder')"
              class="json-editor"
              @update:model-value="(val: string) => setJsonFieldValue(field.key, val)"
            />

            <!-- Dynamic request body editor moved before textarea, this is duplicate old code, removed -->

            <UserSearch
              v-else-if="field.type === 'user-select'"
              v-model="innerConfig[field.key]"
              :multiple="field.multiple ?? true"
              :placeholder="field.placeholder || t('message.pleaseSelectApprover')"
              :disabled="readonly"
              @change="onFieldChange(field.key)"
            />

            <div v-else-if="field.type === 'key-value-table'" class="kv-table">
              <!-- Toolbar: only shown for local file upload scenarios -->
              <div v-if="showFileUploadForField(field)" class="kv-toolbar">
                <div class="kv-toolbar-left">
                  <el-button
                    size="default"
                    type="success"
                    plain
                    :disabled="readonly"
                    @click="openUploadDrawer(field.key)"
                  >
                    <el-icon style="margin-right:4px;"><UploadFilled /></el-icon>
                    {{ t("message.uploadLocalFile") }}
                  </el-button>
                </div>
                <div class="kv-toolbar-right">
                  <el-tag
                    type="success"
                    effect="plain"
                    :closable="getUploadedCount(field.key) > 0"
                    @close="clearAllUploadedFiles(field.key)"
                  >
                    {{ t("message.uploadedCountTag", { count: getUploadedCount(field.key) }) }}
                  </el-tag>
                </div>
              </div>

              <!-- Import from global variable scenario -->
              <div v-else-if="field.enableGlobalVarImport" class="kv-toolbar">
                <div class="kv-toolbar-left">
                  <el-button
                    size="small"
                    type="primary"
                    text
                    :disabled="readonly || !globalVarList.length"
                    @click="importFromGlobalVars(field)"
                  >
                    <el-icon style="margin-right:2px;"><Plus /></el-icon>
                    {{ t("message.globalVarImport") }}
                  </el-button>
                  <el-popover
                    placement="bottom-start"
                    :width="260"
                    trigger="hover"
                    popper-class="kv-hint-pop"
                  >
                    <template #reference>
                      <el-link type="primary" :icon="Link" :underline="false">{{ t("message.usageHint") }}</el-link>
                    </template>
                    <div style="font-size:12px; line-height:1.7; color:#606266;">
                      { t('message.gvHintLine1') }<br>
                      
                      { t('message.gvHintLine2') }
                    </div>
                  </el-popover>
                </div>
              </div>

              <!-- Local file upload: details managed in Drawer -->
              <template v-if="showFileUploadForField(field)">
              </template>

              <!-- Remote source: config entry moved to Drawer for remote_sources field -->
              <template v-else-if="isRemoteSourceField(field)">
              </template>

              <!-- Plain key-value pair mode (environment variables etc.) -->
              <template v-else>
                <div class="kv-column-headers" v-if="field.keyColumnLabel || field.valueColumnLabel">
                  <div class="kv-col-header kv-col-key">{{ field.keyColumnLabel || t('message.colKey') }}</div>
                  <div class="kv-col-header kv-col-value">{{ field.valueColumnLabel || t('message.colValue') }}</div>
                  <div class="kv-col-header kv-col-actions"></div>
                </div>
                <div v-for="(kv, idx) in parseKeyValue(field.key)" :key="idx" class="kv-row">
                  <div class="kv-col-key-wrap">
                    <el-input
                      v-model="kv.key"
                      :placeholder="field.keyColumnPlaceholder || t('message.keyPlaceholder')"
                      size="small"
                      @change="updateKeyValue(field.key, kv, idx)"
                    />
                  </div>
                  <el-input
                    v-model="kv.value"
                    :placeholder="field.valueColumnPlaceholder || t('message.valuePlaceholderWithHint')"
                    size="small"
                    class="kv-value-input"
                    @change="updateKeyValue(field.key, kv, idx)"
                  >
                    <template #append v-if="field.enableGlobalVarImport">
                      <el-dropdown
                        trigger="click"
                        :disabled="readonly || !globalVarList.length"
                        @command="(cmd: any) => insertGlobalVarRef(field.key, idx, cmd as string)"
                      >
                        <el-button class="kv-insert-btn" link type="primary" :disabled="readonly || !globalVarList.length">
                          <el-icon :size="14"><Link /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              v-for="gv in globalVarList"
                              :key="gv.key"
                              :command="gv.key"
                            >
                              <span
                                style="font-family: ui-monospace, Menlo, monospace;"
                                v-text="'${workflow.env.' + gv.key + '}'"
                              ></span>
                            </el-dropdown-item>
                            <el-dropdown-item v-if="!globalVarList.length" disabled>
                              {{ t("message.noGlobalVars") }}
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </template>
                  </el-input>
                  <el-button
                    size="small"
                    text
                    type="danger"
                    :disabled="readonly"
                    @click="removeKeyValue(field.key, idx)"
                  >{{ t("message.deleteShort") }}</el-button>
                </div>
                <el-button size="small" type="primary" text :disabled="readonly" @click="addKeyValue(field.key)">{{ t("message.addShort") }}</el-button>
              </template>
            </div>

            <div v-else-if="field.type === 'array-list'" class="kv-table">
              <div v-if="field.enableGlobalVarImport" class="kv-toolbar">
                <el-popover
                  placement="bottom-start"
                  :width="280"
                  trigger="hover"
                  popper-class="kv-hint-pop"
                >
                  <template #reference>
                    <el-link type="primary" :icon="Link" :underline="false">{{ t("message.usageHint") }}</el-link>
                  </template>
                  <div style="font-size:12px; line-height:1.7; color:#606266;">
                    {{ t('message.arrayHintLine1') }}<br>
                    {{ t('message.arrayHintLine2') }}
                    <code style="background:#f5f5f5;padding:0 4px;border-radius:3px;">${workflow.env.VAR_NAME}</code>
                  </div>
                </el-popover>
              </div>
              <div v-for="(item, idx) in parseArrayList(field.key)" :key="idx" class="kv-row">
                <div class="array-index-col" :title="t('message.positionalArgTitle', { n: idx + 1 })">
                  <span class="array-index-dot" />
                  <span class="array-index-num">${{ idx + 1 }}</span>
                </div>
                <el-input
                  v-model="innerConfig[field.key][idx]"
                  :placeholder="(field.placeholder ? field.placeholder + ',' : '') + t('message.positionalArgPlaceholder', { n: idx + 1 })"
                  size="small"
                  class="kv-value-input"
                  @change="onArrayListChange(field.key)"
                >
                  <template #append>
                    <el-dropdown
                      trigger="click"
                      :disabled="readonly || !globalVarList.length"
                      @command="(cmd: any) => insertArrayListGlobalVarRef(field.key, idx, cmd as string)"
                    >
                      <el-button class="kv-insert-btn" link type="primary" :disabled="readonly || !globalVarList.length">
                        <el-icon :size="14"><Link /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-for="gv in globalVarList"
                            :key="gv.key"
                            :command="gv.key"
                          >
                            <span
                              style="font-family: ui-monospace, Menlo, monospace;"
                              v-text="'${workflow.env.' + gv.key + '}'"
                            ></span>
                          </el-dropdown-item>
                          <el-dropdown-item v-if="!globalVarList.length" disabled>
                            {{ t("message.noGlobalVars") }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-input>
                <el-button size="small" text type="danger" :disabled="readonly" @click="removeArrayListItem(field.key, idx)">{{ t("message.deleteShort") }}</el-button>
              </div>
              <el-button size="small" type="primary" text :disabled="readonly" @click="addArrayListItem(field.key)">{{ t("message.addArrayArg") }}</el-button>
            </div>

            <div v-else-if="field.type === 'condition-expr'" class="condition-expr-field">
              <ConditionExprEditor
                v-model="innerConfig[field.key]"
                :nodes="nodes || []"
                :edges="edges || []"
                :current-node-id="currentNodeId"
                :placeholder="field.placeholder"
                :readonly="readonly"
              />
            </div>

            <div v-else-if="field.type === 'remote-source-list'" class="kv-table">
              <div class="kv-toolbar">
                <div class="kv-toolbar-left">
                  <el-button
                    size="default"
                    type="primary"
                    plain
                    :disabled="readonly"
                    @click="openRemoteSourceDrawer(field.key)"
                  >
                    <el-icon style="margin-right:4px;"><Link /></el-icon>
                    {{ t("message.configRemoteLinksBtn") }}
                  </el-button>
                </div>
                <div class="kv-toolbar-right">
                  <el-tag
                    type="info"
                    effect="plain"
                    :closable="getRemoteSourceCount(field.key) > 0"
                    @close="clearRemoteSources(field.key)"
                  >
                    {{ t("message.configuredCountTag", { count: getRemoteSourceCount(field.key) }) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div v-else-if="field.type === 'loop-body-form'" class="complex-field loop-body-form-field">
              <LoopBodyForm
                v-model="innerConfig[field.key]"
                :body-node-type="String(innerConfig['body_node_type'] || '')"
                :global-vars="globalVars"
              />
            </div>

            <div v-else class="unsupported-field">
              <el-input
                :model-value="t('message.unsupportedField', { label: field.label, type: field.type })"
                disabled
              />
            </div>

            <div v-if="field.help && !showFileUploadForField(field) && !isRemoteSourceField(field)" class="field-help">{{ field.help }}</div>
          </el-form-item>
        </template>
      </div>
    </el-form>
    <!-- Drawer group summaries -->
    <template v-if="manifest">
      <el-form-item
        v-for="dg in drawerGroups"
        :key="'dg-' + dg.name"
        :label="dg.name"
        :required="dg.hasRequired"
        class="drawer-group-summary-item"
      >
        <div class="drawer-group-summary">
          <el-button
            type="primary"
            plain
            size="default"
            :disabled="readonly"
            @click="openDrawerGroup(dg.name)"
          >
            <el-icon style="margin-right: 4px;"><Setting /></el-icon>
            {{ t("message.drawerConfigBtn") }}
          </el-button>
          <div class="dg-status-row">
            <span class="dg-status-text">{{ getDrawerGroupSummary(dg) }}</span>
          </div>
        </div>
        <div v-if="errors && dg.fields.some(f => errors![f.key])" class="drawer-group-error-hint">
          <el-icon :size="12"><InfoFilled /></el-icon>
          <span>{{ t("message.drawerIncomplete") }}</span>
        </div>
      </el-form-item>
    </template>
    <el-empty v-else :description="t('message.noNodeSelected')" />
    <SelectorDialog
      ref="selectorDialogRef"
      :model-value="innerConfig[currentSelectorKey] || null"
      :type="currentSelectorType as any"
      :multiple="currentSelectorMulti"
      @update:model-value="onSelectorUpdate"
    />
    <!-- File upload Drawer -->
    <el-drawer
      v-model="showUploadDrawer"
      :title="t('message.uploadLocalFile')"
      direction="rtl"
      size="580px"
      :close-on-click-modal="true"
      :destroy-on-close="false"
      :teleported="false"
      class="upload-drawer-wrapper"
    >
      <div class="upload-drawer">
        <!-- Usage instructions -->
        <div v-if="drawerFieldHelp" class="drawer-help">
          <el-icon :size="14"><Link /></el-icon>
          <span>{{ drawerFieldHelp }}</span>
        </div>

        <!-- Target path prefix -->
        <div class="drawer-section">
          <div class="drawer-label">
            {{ t("message.targetPathPrefixLabel") }}
            <el-tag v-if="drawerFiles.length > 0" size="small" type="info" effect="plain" style="margin-left:8px;">
              {{ drawerSuccessCount }} / {{ drawerFiles.length }} {{ t("message.uploaded") }}
            </el-tag>
          </div>
          <div class="drawer-prefix-row">
            <el-input
              v-model="drawerBatchPrefix"
              size="default"
              :placeholder="t('message.targetPathPrefixPh')"
              clearable
              @keyup.enter="applyDrawerBatchPrefix"
            />
            <el-button type="primary" :disabled="drawerSuccessCount === 0" @click="applyDrawerBatchPrefix">
              {{ t("message.applyBtn") }}
            </el-button>
          </div>
        </div>

        <!-- File selection area -->
        <div class="drawer-section">
          <div class="file-drop-zone" @click="drawerFileInputRef?.click()">
            <el-icon :size="28" color="#409EFF"><UploadFilled /></el-icon>
            <div class="drop-text">{{ t("message.clickToSelectFile") }}</div>
            <div class="drop-hint">{{ t("message.selectMultiFileHint") }}</div>
          </div>
          <input
            ref="drawerFileInputRef"
            type="file"
            multiple
            style="display: none;"
            @change="onDrawerFileSelect"
          />
        </div>

        <!-- File list -->
        <div v-if="drawerFiles.length > 0" class="drawer-section">
          <div class="drawer-label">
            {{ t("message.fileListTitle", { count: drawerFiles.length }) }}
            <el-tag v-if="uploading" type="warning" size="small" style="margin-left:8px;">{{ t("message.uploadingTag") }}</el-tag>
          </div>
          <div class="drawer-file-list">
            <div v-for="(df, idx) in drawerFiles" :key="df.uid" class="drawer-file-item">
              <div class="df-main-row">
                <div class="df-info">
                  <el-icon :size="14" color="#67C23A"><Document /></el-icon>
                  <span class="df-name" :title="df.original_filename">{{ df.original_filename }}</span>
                  <span class="df-size">{{ formatFileSize(df.size) }}</span>
                </div>
                <div class="df-status">
                  <el-tag v-if="df.status === 'pending'" size="small" type="info" effect="plain">{{ t("message.pendingUpload") }}</el-tag>
                  <el-tag v-else-if="df.status === 'uploading'" size="small" type="warning" effect="plain">{{ t("message.uploadingStatus") }}</el-tag>
                  <el-tag v-else-if="df.status === 'success'" size="small" type="success" effect="plain">{{ t("message.uploadedStatus") }}</el-tag>
                  <el-tag v-else size="small" type="danger" effect="plain" :title="df.error">{{ df.error || t('message.failedStatus') }}</el-tag>
                  <el-button
                    size="small"
                    text
                    type="danger"
                    :disabled="uploading"
                    @click="removeDrawerFile(idx)"
                  >{{ t("message.removeBtn") }}</el-button>
                </div>
              </div>
              <div v-if="df.status === 'uploading'" class="df-progress">
                <el-progress :percentage="df.progress || 0" :show-text="false" />
              </div>
              <el-input
                v-model="df.value"
                size="small"
                :placeholder="t('message.targetHostPathPh')"
                class="df-target-input"
                :disabled="df.status !== 'success'"
                @change="onDrawerTargetChange"
              />
            </div>
          </div>
        </div>

        <el-empty v-else :description="t('message.noFileSelected')" :image-size="60" />
      </div>
      <template #footer>
        <div class="drawer-footer">
          <span class="drawer-summary">
            {{ t("message.fileSummary", { total: drawerFiles.length, success: drawerSuccessCount }) }}
          </span>
          <div>
            <el-button @click="showUploadDrawer = false">{{ t("message.cancelBtn") }}</el-button>
            <el-button type="primary" :disabled="drawerSuccessCount === 0" @click="confirmDrawerFiles">
              {{ t("message.confirmWithCount", { count: drawerSuccessCount }) }}
            </el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- Remote link configuration Drawer -->
    <el-drawer
      v-model="showRemoteSourceDrawer"
      :title="t('message.configRemoteFileLink')"
      direction="rtl"
      size="620px"
      :close-on-click-modal="true"
      :teleported="false"
      class="upload-drawer-wrapper"
    >
      <div class="upload-drawer">
        <div class="drawer-help">
          <el-icon :size="14"><Link /></el-icon>
          <span>{{ t("message.remoteLinkHint") }}</span>
        </div>

        <!-- Target path prefix -->
        <div class="drawer-section">
          <div class="drawer-label">
            {{ t("message.targetPathPrefixLabel") }}
            <el-tag v-if="remoteSourceList.length > 0" size="small" type="info" effect="plain" style="margin-left:8px;">
              {{ t("message.remoteLinkCount", { count: remoteSourceList.length }) }}
            </el-tag>
          </div>
          <div class="drawer-prefix-row">
            <el-input
              v-model="remoteSourcePrefix"
              size="default"
              :placeholder="t('message.targetPathPrefixLinksPh')"
              clearable
              @keyup.enter="applyRemoteSourcePrefix"
            />
            <el-button type="primary" :disabled="remoteSourceList.length === 0" @click="applyRemoteSourcePrefix">
              {{ t("message.applyBtn") }}
            </el-button>
          </div>
        </div>

        <!-- Remote link list -->
        <div class="drawer-section">
          <div class="drawer-label">
            <span>{{ t("message.remoteLinkListTitle", { count: remoteSourceList.length }) }}</span>
            <el-button
              size="small"
              type="primary"
              plain
              style="margin-left:8px;"
              @click="addRemoteSource"
            >
              <el-icon style="margin-right:2px;"><Plus /></el-icon>
              {{ t("message.addLink") }}
            </el-button>
          </div>

          <div v-if="remoteSourceList.length > 0" class="remote-source-list">
            <div v-for="(rs, idx) in remoteSourceList" :key="idx" class="remote-source-item">
              <div class="rs-header">
                <span class="rs-index">#{{ idx + 1 }}</span>
                <el-popconfirm
                  :title="t('message.confirmDeleteLink')"
                  @confirm="removeRemoteSource(idx)"
                >
                  <template #reference>
                    <el-button size="small" text type="danger">{{ t("message.deleteBtn") }}</el-button>
                  </template>
                </el-popconfirm>
              </div>

              <div class="rs-field">
                <label>{{ t("message.fileAddressLabel") }}</label>
                <el-input
                  v-model="rs.url"
                  size="default"
                  :placeholder="t('message.fileAddressPh')"
                  clearable
                />
              </div>

              <div class="rs-field">
                <label>{{ t("message.transportProtocol") }}</label>
                <el-select v-model="rs.protocol" size="default" style="width:100%;">
                  <el-option :label="t('message.transportHttpsRecommended')" value="https" />
                  <el-option label="HTTP" value="http" />
                  <el-option label="FTP" value="ftp" />
                  <el-option :label="t('message.transportFtpsLabel')" value="ftps" />
                  <el-option :label="t('message.transportSftpLabel')" value="sftp" />
                </el-select>
              </div>

              <div v-if="requiresAuth(rs.protocol)" class="rs-auth">
                <div class="rs-field">
                  <label>{{ t("message.authUsername") }}</label>
                  <el-input
                    v-model="rs.username"
                    size="default"
                    :placeholder="t('message.authUsernamePh')"
                    clearable
                  />
                </div>
                <div class="rs-field">
                  <label>{{ t("message.authPassword") }}</label>
                  <el-input
                    v-model="rs.password"
                    type="password"
                    size="default"
                    :placeholder="t('message.authPasswordPh')"
                    show-password
                    clearable
                  />
                </div>
              </div>
              <div v-else class="rs-no-auth-hint">
                <el-icon :size="12"><InfoFilled /></el-icon>
                <span>{{ t("message.noAuthNeeded") }}</span>
              </div>

              <div class="rs-field rs-target-field">
                <label>{{ t("message.targetHostPathLabel") }}</label>
                <el-input
                  v-model="rs.targetPath"
                  size="default"
                  :placeholder="t('message.targetHostPathExample', { filename: getFilename(rs.url) })"
                  clearable
                />
              </div>
            </div>
          </div>

          <el-empty v-else :description="t('message.noRemoteLinkStart')" :image-size="60" />
        </div>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <span class="drawer-summary">
            {{ t("message.remoteLinkCount", { count: remoteSourceList.length }) }}
          </span>
          <div>
            <el-button @click="showRemoteSourceDrawer = false">{{ t("message.cancelBtn") }}</el-button>
            <el-button type="primary" :disabled="remoteSourceList.length === 0" @click="confirmRemoteSources">
              {{ t("message.confirmWithCount", { count: remoteSourceList.length }) }}
            </el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- Drawer group configuration -->
    <el-drawer
      v-model="showDrawerGroup"
      :title="activeDrawerGroupName"
      direction="rtl"
      size="580px"
      :close-on-click-modal="true"
      :teleported="false"
      class="drawer-group-wrapper"
    >
      <div class="drawer-group-content">
        <el-form :disabled="readonly" class="auto-node-form-inner">
          <template v-for="field in activeDrawerGroupFields" :key="field.key">
            <el-form-item
              :label="getFieldLabel(field)"
              :required="field.required"
              :error="errors?.[field.key]"
              :class="{ 'has-error': !!(errors?.[field.key]) }"
            >
              <el-input
                v-if="field.type === 'text'"
                v-model="innerConfig[field.key]"
                :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
                @change="onFieldChange(field.key)"
              />
              <el-input
                v-else-if="field.type === 'password'"
                v-model="innerConfig[field.key]"
                type="password"
                show-password
                :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
                @change="onFieldChange(field.key)"
              />

              <!-- Dynamic request body editor in Drawer -->
              <div v-else-if="field.dynamicEditor === 'body-format'" class="body-format-editor" style="width: 100%;">
                <el-input
                  v-if="innerConfig.body_format === 'json' || !innerConfig.body_format"
                  :model-value="getBodyJsonDisplay()"
                  type="textarea"
                  :rows="6"
                  :placeholder="t('message.pleaseInputJson')"
                  class="json-editor"
                  @update:model-value="(val: string) => setBodyJsonValue(val)"
                >
                  <template #append>
                    <el-button link type="primary" @click="formatBodyJson">{{ t("message.format") }}</el-button>
                  </template>
                </el-input>

                <div v-else-if="innerConfig.body_format === 'form'" class="body-form-editor">
                  <div class="kv-column-headers">
                    <div class="kv-col-header kv-col-key">{{ t("message.paramName") }}</div>
                    <div class="kv-col-header kv-col-value">{{ t("message.paramValue") }}</div>
                    <div class="kv-col-header kv-col-actions"></div>
                  </div>
                  <div v-for="(kv, idx) in bodyFormRows" :key="idx" class="kv-row">
                    <div class="kv-col-key-wrap">
                      <el-input
                        v-model="kv.key"
                        :placeholder="t('message.paramName')"
                        size="small"
                        @change="writeBodyFormToConfig"
                      />
                    </div>
                    <el-input
                      v-model="kv.value"
                      :placeholder="t('message.paramValue')"
                      size="small"
                      class="kv-value-input"
                      @change="writeBodyFormToConfig"
                    />
                    <el-button
                      type="danger"
                      link
                      size="small"
                      :disabled="readonly"
                      @click="removeBodyFormRow(idx)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button type="primary" link size="small" :disabled="readonly" @click="addBodyFormRow">
                    <el-icon style="margin-right:2px;"><Plus /></el-icon>{{ t("message.addParam") }}
                  </el-button>
                </div>

                <el-input
                  v-else
                  :model-value="String(innerConfig[field.key] ?? '')"
                  type="textarea"
                  :rows="6"
                  :placeholder="t('message.pleaseInputRawText')"
                  @update:model-value="(val: string) => { innerConfig[field.key] = val; onFieldChange(field.key) }"
                />
              </div>

              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="innerConfig[field.key]"
                type="textarea"
                :rows="4"
                :placeholder="field.placeholder || t('message.pleaseInputWithLabel', { label: field.label })"
                @change="onFieldChange(field.key)"
              />
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="innerConfig[field.key]"
                :min="field.min ?? 0"
                :max="field.max"
                :placeholder="field.placeholder"
                @change="onFieldChange(field.key)"
              />
              <el-switch
                v-else-if="field.type === 'boolean'"
                v-model="innerConfig[field.key]"
                @change="onFieldChange(field.key)"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="innerConfig[field.key]"
                :placeholder="field.placeholder || t('message.pleaseSelectPh')"
                style="width: 100%"
                @change="onFieldChange(field.key)"
              >
                <el-option
                  v-for="opt in field.options || []"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-input
                v-else-if="field.type === 'json-editor'"
                :model-value="getJsonDisplayValue(field.key)"
                type="textarea"
                :rows="4"
                :placeholder="field.placeholder || t('message.jsonFormatPlaceholder')"
                class="json-editor"
                @update:model-value="(val: string) => setJsonFieldValue(field.key, val)"
              />
              <div v-else-if="field.type === 'key-value-table'" class="kv-table">
                <div class="kv-column-headers" v-if="field.keyColumnLabel || field.valueColumnLabel">
                  <div class="kv-col-header kv-col-key">{{ field.keyColumnLabel || t('message.colKey') }}</div>
                  <div class="kv-col-header kv-col-value">{{ field.valueColumnLabel || t('message.colValue') }}</div>
                  <div class="kv-col-header kv-col-actions"></div>
                </div>
                <div v-for="(kv, idx) in parseKeyValue(field.key)" :key="idx" class="kv-row">
                  <div class="kv-col-key-wrap">
                    <el-input
                      v-model="kv.key"
                      :placeholder="field.keyColumnPlaceholder || t('message.keyPlaceholder')"
                      size="small"
                      @change="updateKeyValue(field.key, kv, idx)"
                    />
                  </div>
                  <el-input
                    v-model="kv.value"
                    :placeholder="field.valueColumnPlaceholder || t('message.valuePlaceholder')"
                    size="small"
                    class="kv-value-input"
                    @change="updateKeyValue(field.key, kv, idx)"
                  />
                  <el-button
                    size="small"
                    text
                    type="danger"
                    :disabled="readonly"
                    @click="removeKeyValue(field.key, idx)"
                  >{{ t("message.deleteShort") }}</el-button>
                </div>
                <el-button size="small" type="primary" text :disabled="readonly" @click="addKeyValue(field.key)">{{ t("message.addShort") }}</el-button>
              </div>
              <div v-else-if="field.type === 'time-duration'" class="time-duration-field">
                <el-input-number
                  v-model="innerConfig[field.key]"
                  :min="field.min ?? 1"
                  :max="field.max"
                  :step="1"
                  style="width: calc(100% - 100px); margin-right: 8px;"
                  @change="onFieldChange(field.key)"
                />
                <el-select
                  :model-value="durationUnits[field.key]"
                  style="width: 92px;"
                  @update:model-value="(newVal: string) => onDurationUnitChange(field.key, newVal)"
                >
                  <el-option :label="t('message.unitSec')" value="second" />
                  <el-option :label="t('message.unitMin')" value="minute" />
                  <el-option :label="t('message.unitHour')" value="hour" />
                  <el-option :label="t('message.unitDay')" value="day" />
                </el-select>
              </div>
              <el-input
                v-else
                :model-value="t('message.unsupportedInDrawer', { label: field.label, type: field.type })"
                disabled
              />
              <div v-if="field.help" class="field-help">{{ field.help }}</div>
            </el-form-item>
          </template>
        </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <span class="drawer-summary">{{ activeDrawerGroupName }}</span>
          <div>
            <el-button @click="showDrawerGroup = false">{{ t("message.closeBtn") }}</el-button>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Plus, Link, Refresh, UploadFilled, Document, InfoFilled, Setting, Delete } from '@element-plus/icons-vue'
import type { Edge, Node } from '@vue-flow/core'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { NodeManifest, NodeFieldSchema } from '/@/views/taurus/workflow/manifest/types.ts'
import { getAllNodeManifests } from '/@/views/taurus/workflow/manifest/registry.ts'
import { translateManifest } from '/@/views/taurus/workflow/manifest/translate.ts'
import ConditionExprEditor from './ConditionExprEditor.vue'
import SelectorDialog from './SelectorDialog.vue'
import LoopBodyForm from './LoopBodyForm.vue'
import UserSearch from '/@/components/UserSearch/index.vue'
import { GetList as getScriptList } from '/@/api/taurus/script-library/api'
import { uploadToBackendTemp, uploadBatchToBackendTemp } from '/@/api/taurus/ops/index'

const props = defineProps<{
  manifest: NodeManifest | null
  config: Record<string, any>
  errors?: Record<string, string>
  nodes?: Node[]
  edges?: Edge[]
  currentNodeId?: string
  globalVars?: { key: string; value: string }[]
  readonly?: boolean
}>()

const readonly = computed(() => !!props.readonly)

const emit = defineEmits<{
  (_e: 'update:config', _config: Record<string, any>): void
}>()

const { t } = useI18n()

const innerConfig = reactive<Record<string, any>>({})

const durationUnits = reactive<Record<string, string>>({})

const UNIT_TO_SECONDS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400
}

function autoPickUnit(seconds: number): string {
  if (seconds >= 86400 && seconds % 86400 === 0) return 'day'
  if (seconds >= 3600 && seconds % 3600 === 0) return 'hour'
  if (seconds >= 60 && seconds % 60 === 0) return 'minute'
  return 'second'
}

function toDisplayValue(seconds: number | null | undefined, unit: string): number {
  if (seconds == null) return 0
  const divisor = UNIT_TO_SECONDS[unit] || 1
  return Math.round(seconds / divisor)
}

function toSeconds(displayValue: number | null | undefined, unit: string): number {
  if (displayValue == null) return 0
  const multiplier = UNIT_TO_SECONDS[unit] || 1
  return displayValue * multiplier
}

function initDurationUnits() {
  if (!props.manifest) return
  for (const field of props.manifest.params) {
    if (field.type === 'time-duration' && durationUnits[field.key] === undefined) {
      durationUnits[field.key] = 'second'
    }
  }
}

function onDurationUnitChange(key: string, newUnit: string) {
  if (!props.manifest) return
  const field = props.manifest.params.find((f) => f.key === key)
  if (!field || field.type !== 'time-duration') return
  const oldUnit = durationUnits[key] || 'second'
  const seconds = toSeconds(innerConfig[key], oldUnit)
  durationUnits[key] = newUnit
  innerConfig[key] = toDisplayValue(seconds, newUnit)
  onFieldChange(key)
}

function getJsonDisplayValue(key: string): string {
  const val = innerConfig[key]
  if (val === undefined || val === null) return ''
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

function setJsonFieldValue(key: string, newVal: string) {
  try {
    innerConfig[key] = JSON.parse(newVal)
  } catch {
    innerConfig[key] = newVal
  }
  onFieldChange(key)
}

// ---- body-format dynamic editor helpers ----

interface BodyFormRow {
  key: string
  value: string
}

const bodyFormRows = reactive<BodyFormRow[]>([])

function parseBodyFormFromConfig() {
  const raw = innerConfig.payload_template
  if (!raw || typeof raw !== 'string') {
    bodyFormRows.length = 0
    bodyFormRows.push({ key: '', value: '' })
    return
  }
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    bodyFormRows.length = 0
    bodyFormRows.push({ key: '', value: '' })
    return
  }
  const rows: BodyFormRow[] = []
  const pairs = trimmed.split('&')
  for (const pair of pairs) {
    if (!pair.trim()) continue
    const eqIdx = pair.indexOf('=')
    if (eqIdx >= 0) {
      rows.push({
        key: decodeURIComponent(pair.slice(0, eqIdx)),
        value: decodeURIComponent(pair.slice(eqIdx + 1))
      })
    } else {
      rows.push({ key: decodeURIComponent(pair), value: '' })
    }
  }
  if (rows.length === 0) {
    rows.push({ key: '', value: '' })
  }
  bodyFormRows.splice(0, bodyFormRows.length, ...rows)
}

function writeBodyFormToConfig() {
  const validRows = bodyFormRows.filter(r => r.key.trim())
  const encoded = validRows
    .map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`)
    .join('&')
  innerConfig.payload_template = encoded
  onFieldChange('payload_template')
}

function addBodyFormRow() {
  bodyFormRows.push({ key: '', value: '' })
}

function removeBodyFormRow(idx: number) {
  bodyFormRows.splice(idx, 1)
  if (bodyFormRows.length === 0) {
    bodyFormRows.push({ key: '', value: '' })
  }
  writeBodyFormToConfig()
}

function getBodyJsonDisplay(): string {
  const val = innerConfig.payload_template
  if (val === undefined || val === null || val === '') return ''
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return val
    }
  }
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

function setBodyJsonValue(newVal: string) {
  innerConfig.payload_template = newVal
  onFieldChange('payload_template')
}

function formatBodyJson() {
  const display = getBodyJsonDisplay()
  if (!display.trim()) return
  try {
    const parsed = JSON.parse(display)
    const formatted = JSON.stringify(parsed, null, 2)
    innerConfig.payload_template = formatted
    onFieldChange('payload_template')
  } catch {
    ElMessage.warning(t('message.jsonFormatInvalidCannotFormat'))
  }
}

watch(
  () => innerConfig.body_format,
  (newFormat, oldFormat) => {
    if (newFormat === 'form' && newFormat !== oldFormat) {
      parseBodyFormFromConfig()
    }
  }
)

watch(
  () => innerConfig.payload_template,
  () => {
    if (innerConfig.body_format === 'form') {
      parseBodyFormFromConfig()
    }
  },
  { immediate: true }
)

const isShallowEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const k of keysA) {
    if (!keysB.includes(k)) return false
    const va = a[k]
    const vb = b[k]
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length) return false
      for (let i = 0; i < va.length; i++) {
        if (!isShallowEqual(va[i], vb[i])) return false
      }
      continue
    }
    if (typeof va === 'object' && typeof vb === 'object' && va !== null && vb !== null) {
      if (!isShallowEqual(va, vb)) return false
      continue
    }
    if (va !== vb) return false
  }
  return true
}

watch(
  () => props.config,
  (val) => {
    const merged: Record<string, any> = val ? { ...val } : {}
    let defaultsApplied = false
    if (props.manifest) {
      props.manifest.params.forEach((field) => {
        if (merged[field.key] === undefined && field.defaultValue !== undefined) {
          merged[field.key] = field.defaultValue
          defaultsApplied = true
        }
        if (field.type === 'time-duration' && merged[field.key] !== undefined) {
          const unit = durationUnits[field.key] || autoPickUnit(merged[field.key])
          durationUnits[field.key] = unit
          merged[field.key] = toDisplayValue(merged[field.key], unit)
        }
        if (field.dynamicEditor === 'body-format' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
          const fmt = merged.body_format || 'json'
          if (fmt === 'json') {
            merged[field.key] = JSON.stringify(merged[field.key], null, 2)
          } else if (fmt === 'form') {
            const obj = merged[field.key]
            if (typeof obj === 'object') {
              merged[field.key] = Object.entries(obj)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                .join('&')
            } else {
              merged[field.key] = String(obj)
            }
          } else {
            merged[field.key] = JSON.stringify(merged[field.key], null, 2)
          }
        }
        if (field.type === 'textarea' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
          merged[field.key] = JSON.stringify(merged[field.key], null, 2)
        }
      })
    }
    if (isShallowEqual(innerConfig, merged)) {
      if (defaultsApplied) emit('update:config', { ...merged })
      return
    }
    const allKeys = new Set([...Object.keys(innerConfig), ...Object.keys(merged)])
    allKeys.forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(merged, k)) {
        delete innerConfig[k]
      } else if (innerConfig[k] !== merged[k]) {
        innerConfig[k] = merged[k]
      }
    })
    if (merged.body_format === 'form') {
      parseBodyFormFromConfig()
    }
    // Push back after defaults injected / props.config updated, ensure node.data.config stays in sync with UI display
    if (defaultsApplied || !isShallowEqual(val || {}, merged)) {
      const output: Record<string, any> = { ...merged }
      if (props.manifest) {
        for (const field of props.manifest.params) {
          if (field.type === 'time-duration' && output[field.key] !== undefined) {
            const unit = durationUnits[field.key] || 'second'
            output[field.key] = toSeconds(output[field.key], unit)
          }
        }
      }
      emit('update:config', output)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.manifest,
  (newManifest) => {
    if (!newManifest) return
    initDurationUnits()
    let changed = false
    const merged: Record<string, any> = { ...(props.config || {}) }
    newManifest.params.forEach((field) => {
      if (merged[field.key] === undefined && field.defaultValue !== undefined) {
        merged[field.key] = field.defaultValue
        if (field.type === 'time-duration') {
          const unit = durationUnits[field.key] || autoPickUnit(merged[field.key])
          durationUnits[field.key] = unit
          merged[field.key] = toDisplayValue(merged[field.key], unit)
        }
        if (field.dynamicEditor === 'body-format' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
          const fmt = merged.body_format || 'json'
          if (fmt === 'json') {
            merged[field.key] = JSON.stringify(merged[field.key], null, 2)
          } else if (fmt === 'form') {
            const obj = merged[field.key]
            if (typeof obj === 'object') {
              merged[field.key] = Object.entries(obj)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                .join('&')
            } else {
              merged[field.key] = String(obj)
            }
          } else {
            merged[field.key] = JSON.stringify(merged[field.key], null, 2)
          }
        }
        if (field.type === 'textarea' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
          merged[field.key] = JSON.stringify(merged[field.key], null, 2)
        }
        if (innerConfig[field.key] !== merged[field.key]) {
          innerConfig[field.key] = merged[field.key]
        }
        changed = true
      } else if (field.dynamicEditor === 'body-format' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
        const fmt = merged.body_format || 'json'
        if (fmt === 'json') {
          merged[field.key] = JSON.stringify(merged[field.key], null, 2)
        } else if (fmt === 'form') {
          const obj = merged[field.key]
          if (typeof obj === 'object') {
            merged[field.key] = Object.entries(obj)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
              .join('&')
          } else {
            merged[field.key] = String(obj)
          }
        } else {
          merged[field.key] = JSON.stringify(merged[field.key], null, 2)
        }
        if (innerConfig[field.key] !== merged[field.key]) {
          innerConfig[field.key] = merged[field.key]
        }
        changed = true
      } else if (field.type === 'textarea' && merged[field.key] !== undefined && typeof merged[field.key] === 'object') {
        merged[field.key] = JSON.stringify(merged[field.key], null, 2)
        if (innerConfig[field.key] !== merged[field.key]) {
          innerConfig[field.key] = merged[field.key]
        }
        changed = true
      }
    })
    if (changed) {
      const output: Record<string, any> = { ...merged }
      for (const field of newManifest.params) {
        if (field.type === 'time-duration' && output[field.key] !== undefined) {
          output[field.key] = toSeconds(output[field.key], durationUnits[field.key] || 'second')
        }
      }
      emit('update:config', output)
    }
  }
)

const groupedParams = computed(() => {
  if (!props.manifest) return []
  const groups = new Map<string, NodeFieldSchema[]>()
  props.manifest.params.forEach((field) => {
    if (field.visibleWhen && !isVisible(field)) return
    if (field.drawerGroup) return
    const name = field.group || ''
    if (!groups.has(name)) {
      groups.set(name, [])
    }
    groups.get(name)!.push(field)
  })
  const result: { name: string; fields: NodeFieldSchema[] }[] = []
  groups.forEach((fields, name) => {
    result.push({ name, fields })
  })
  return result
})

const drawerGroups = computed(() => {
  if (!props.manifest) return []
  const groups = new Map<string, NodeFieldSchema[]>()
  props.manifest.params.forEach((field) => {
    if (!field.drawerGroup) return
    if (field.visibleWhen && !isVisible(field)) return
    if (!groups.has(field.drawerGroup)) {
      groups.set(field.drawerGroup, [])
    }
    groups.get(field.drawerGroup)!.push(field)
  })
  const result: { name: string; fields: NodeFieldSchema[]; hasRequired: boolean }[] = []
  groups.forEach((fields, name) => {
    const hasRequired = fields.some(f => f.required)
    result.push({ name, fields, hasRequired })
  })
  return result
})

const showDrawerGroup = ref(false)
const activeDrawerGroupName = ref('')
const activeDrawerGroupFields = computed(() => {
  if (!activeDrawerGroupName.value) return []
  return drawerGroups.value.find(g => g.name === activeDrawerGroupName.value)?.fields || []
})

const openDrawerGroup = (name: string) => {
  activeDrawerGroupName.value = name
  showDrawerGroup.value = true
}

const getDrawerGroupSummary = (group: { name: string; fields: NodeFieldSchema[] }): string => {
  const parts: string[] = []
  for (const field of group.fields) {
    const val = innerConfig[field.key]
    if (val !== undefined && val !== null && val !== '' && val !== false) {
      if (field.dynamicEditor === 'body-format') {
        const fmt = innerConfig.body_format || 'json'
        const label = fmt === 'json' ? t('message.jsonLabel') : fmt === 'form' ? t('message.formLabel') : t('message.textLabel')
        if (fmt === 'form') {
          const count = bodyFormRows.filter(r => r.key.trim()).length
          parts.push(t('message.requestBodySummaryCount', { label, count }))
        } else if (fmt === 'json') {
          const s = String(val).replace(/\s*\n\s*/g, ' ').trim()
          parts.push(t('message.requestBodySummaryPreview', { label, preview: s.length > 40 ? s.slice(0, 40) + '...' : s }))
        } else {
          const s = String(val).replace(/\s*\n\s*/g, ' ').trim()
          parts.push(t('message.requestBodySummaryPreview', { label, preview: s.length > 40 ? s.slice(0, 40) + '...' : s }))
        }
      } else if (field.type === 'text' || field.type === 'password' || field.type === 'textarea') {
        const s = String(val).replace(/\s*\n\s*/g, ' ').trim()
        parts.push(`${field.label}: ${s.length > 30 ? s.slice(0, 30) + '...' : s}`)
      } else if (field.type === 'select') {
        const opt = field.options?.find(o => o.value === val)
        parts.push(`${field.label}: ${opt?.label || val}`)
      } else if (field.type === 'json-editor') {
        if (val && typeof val === 'object') {
          const keys = Object.keys(val)
          parts.push(t('message.fieldFieldCount', { label: field.label, count: keys.length }))
        } else if (typeof val === 'string' && val.trim()) {
          parts.push(t('message.fieldConfigured', { label: field.label }))
        }
      } else if (field.type === 'key-value-table') {
        const count = Array.isArray(val) ? val.filter((kv: any) => kv?.key || kv?.value).length : 0
        parts.push(t('message.fieldCountItems', { label: field.label, count }))
      } else if (field.type === 'number') {
        parts.push(`${field.label}: ${val}`)
      }
    }
  }
  return parts.length > 0 ? parts.join(' | ') : t('message.notConfigured')
}

const isVisible = (field: NodeFieldSchema): boolean => {
  if (!field.visibleWhen) return true
  return Object.entries(field.visibleWhen).every(([key, value]) => {
    const currentVal = innerConfig[key]
    if (Array.isArray(value)) return value.includes(currentVal)
    return currentVal === value
  })
}

const availableNodeTypes = computed(() => {
  return getAllNodeManifests().map(m => {
    const tr = translateManifest(t, m)
    return {
      nodeType: m.nodeType,
      displayName: tr?.displayName || m.displayName,
    }
  })
})

const onFieldChange = (_key?: string) => {
  const output: Record<string, any> = { ...innerConfig }
  if (props.manifest) {
    for (const field of props.manifest.params) {
      if (field.type === 'time-duration' && output[field.key] !== undefined) {
        const unit = durationUnits[field.key] || 'second'
        output[field.key] = toSeconds(output[field.key], unit)
      }
    }
  }
  emit('update:config', output)
}

const groupHasDefaults = (group: { name: string; fields: NodeFieldSchema[] }): boolean => {
  return group.fields.some((f) => f.defaultValue !== undefined)
}

const resetGroupToDefaults = (groupName: string) => {
  const group = groupedParams.value.find((g) => g.name === groupName)
  if (!group) return
  group.fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      let val: any
      if (Array.isArray(field.defaultValue)) {
        val = [...field.defaultValue]
      } else if (typeof field.defaultValue === 'object' && field.defaultValue !== null) {
        val = { ...field.defaultValue }
      } else {
        val = field.defaultValue
      }
      if (field.type === 'time-duration') {
        const unit = durationUnits[field.key] || autoPickUnit(val)
        durationUnits[field.key] = unit
        val = toDisplayValue(val, unit)
      }
      innerConfig[field.key] = val
    }
  })
  emit('update:config', { ...innerConfig })
  ElMessage.success(t('message.resetGroupSuccess', { name: groupName }))
}

const formatHostDisplay = (val: any) => {
  if (!val) return ''
  if (Array.isArray(val)) {
    return val.map((h: any) => (typeof h === 'string' ? h : h.host_name || h.host_ip || h.id)).join(', ')
  }
  if (typeof val === 'object') {
    return val.host_name || val.host_ip || val.id || ''
  }
  return String(val)
}

const getHostCount = (val: any): number => {
  if (!val) return 0
  if (Array.isArray(val)) return val.length
  return 1
}

const formatHostCountDisplay = (val: any): string => {
  const count = getHostCount(val)
  return t('message.hostCountSelected', { count })
}

const clearHostSelection = (field: NodeFieldSchema) => {
  innerConfig[field.key] = field.multiple ?? defaultMultipleForType(field.type) ? [] : null
  onFieldChange(field.key)
}

const selectorDialogRef = ref<InstanceType<typeof SelectorDialog> | null>(null)
const currentSelectorKey = ref('')
const currentSelectorType = ref('host-selector')
const currentSelectorMulti = ref(false)

const defaultMultipleForType = (type: string): boolean => {
  switch (type) {
    case 'host-selector':
    case 'host-group-selector':
      return true
    case 'credential-selector':
    case 'script-selector':
    default:
      return false
  }
}

const openSelector = (field: NodeFieldSchema) => {
  const multiple = field.multiple ?? defaultMultipleForType(field.type)
  currentSelectorKey.value = field.key
  currentSelectorType.value = field.type
  currentSelectorMulti.value = multiple
  if (selectorDialogRef.value) {
    selectorDialogRef.value.open({
      type: field.type as any,
      multiple,
      modelValue: innerConfig[field.key]
    })
  }
}

const onSelectorUpdate = (val: any) => {
  if (currentSelectorKey.value) {
    innerConfig[currentSelectorKey.value] = val
    onFieldChange(currentSelectorKey.value)
  }
}

const openHostSelector = (field: NodeFieldSchema) => {
  openSelector(field)
}

const openHostGroupSelector = (field: NodeFieldSchema) => {
  openSelector(field)
}

const openCredentialSelector = (field: NodeFieldSchema) => {
  openSelector(field)
}

const openScriptSelector = (field: NodeFieldSchema) => {
  openSelector(field)
}

const scriptList = ref<any[]>([])

const loadScripts = async () => {
  try {
    const res = await getScriptList({ page: 1, limit: 500 } as any)
    scriptList.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.results) ? res.data.results : [])
  } catch {
    scriptList.value = []
  }
}

const scriptNameMap = computed(() => {
  const map: Record<string, string> = {}
  scriptList.value.forEach(s => {
    map[String(s.id)] = s.name || t('message.untitledScript')
  })
  return map
})

onMounted(() => {
  loadScripts()
})

interface KvPair {
  key: string
  value: string
  original_filename?: string
  size?: number
}

const ensureKvLoaded = (key: string) => {
  if (!innerConfig[key]) innerConfig[key] = []
  if (!Array.isArray(innerConfig[key])) {
    if (typeof innerConfig[key] === 'object') {
      innerConfig[key] = Object.entries(innerConfig[key]).map(([k, v]) => ({ key: k, value: String(v) }))
    } else {
      innerConfig[key] = []
    }
  }
}

const parseKeyValue = (key: string): KvPair[] => {
  ensureKvLoaded(key)
  return innerConfig[key] as KvPair[]
}

const addKeyValue = (key: string) => {
  ensureKvLoaded(key)
  innerConfig[key].push({ key: '', value: '' })
  onFieldChange(key)
}

const updateKeyValue = (key: string, _kv: KvPair, _idx: number) => {
  onFieldChange(key)
}

const removeKeyValue = (key: string, idx: number) => {
  ensureKvLoaded(key)
  innerConfig[key].splice(idx, 1)
  onFieldChange(key)
}

const globalVarList = computed(() => {
  const valid = (props.globalVars || []).filter(v => v && typeof v.key === 'string' && v.key.trim())
  const seen = new Set<string>()
  const result: { key: string; value: string }[] = []
  for (const v of valid) {
    const k = v.key.trim()
    if (seen.has(k)) continue
    seen.add(k)
    result.push({ key: k, value: v.value ?? '' })
  }
  return result
})

const importFromGlobalVars = (field: NodeFieldSchema) => {
  ensureKvLoaded(field.key)
  if (!globalVarList.value.length) {
    ElMessage.info(t('message.importExcel.noGlobalVarAvailable'))
    return
  }
  const existingKeys = new Set<string>()
  innerConfig[field.key].forEach((kv: KvPair) => {
    if (kv?.key) existingKeys.add(String(kv.key))
  })
  let added = 0
  globalVarList.value.forEach((gv) => {
    if (existingKeys.has(gv.key)) return
    innerConfig[field.key].push({ key: gv.key, value: `\${workflow.env.${gv.key}}` })
    existingKeys.add(gv.key)
    added++
  })
  if (added > 0) {
    ElMessage.success(t('message.importGlobalVarsSuccess', { added, skipped: globalVarList.value.length - added }))
  } else {
    ElMessage.info(t('message.importGlobalVarsAllExist', { count: globalVarList.value.length }))
  }
  onFieldChange(field.key)
}

const insertGlobalVarRef = (key: string, idx: number, gvKey: string) => {
  ensureKvLoaded(key)
  const arr = innerConfig[key] as KvPair[]
  if (!arr[idx]) return
  const existing = arr[idx].value ?? ''
  arr[idx].value = existing + `\${workflow.env.${gvKey}}`
  onFieldChange(key)
}

// ===== array-list (positional argument array) =====
const ensureArrayListLoaded = (key: string) => {
  if (!Array.isArray(innerConfig[key])) {
    if (typeof innerConfig[key] === 'string' && innerConfig[key].trim()) {
      // Compatibility: comma/newline separated string input
      innerConfig[key] = innerConfig[key].split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean)
    } else {
      innerConfig[key] = []
    }
  }
}

const parseArrayList = (key: string): string[] => {
  ensureArrayListLoaded(key)
  return innerConfig[key] as string[]
}

const addArrayListItem = (key: string) => {
  ensureArrayListLoaded(key)
  innerConfig[key].push('')
  onFieldChange(key)
}

const removeArrayListItem = (key: string, idx: number) => {
  ensureArrayListLoaded(key)
  innerConfig[key].splice(idx, 1)
  onFieldChange(key)
}

const onArrayListChange = (key: string) => {
  onFieldChange(key)
}

const insertArrayListGlobalVarRef = (key: string, idx: number, gvKey: string) => {
  ensureArrayListLoaded(key)
  const arr = innerConfig[key] as string[]
  if (idx >= arr.length) return
  arr[idx] = (arr[idx] ?? '') + `\${workflow.env.${gvKey}}`
  onFieldChange(key)
}

// ===== File distribution node: upload local file to backend temp directory =====
interface DrawerFileItem {
  uid: string
  key: string
  value: string
  original_filename: string
  size: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

const showUploadDrawer = ref(false)
const drawerFileInputRef = ref<HTMLInputElement | null>(null)
const drawerBatchPrefix = ref('')
const drawerFiles = ref<DrawerFileItem[]>([])
const currentUploadFieldKey = ref('')
const uploading = ref(false)

const showFileUploadForField = (field: NodeFieldSchema): boolean => {
  if (!props.manifest) return false
  if (props.manifest.nodeType !== 'file_op') return false
  if (field.key !== 'file_paths') return false
  if (innerConfig['source_type'] !== 'local_path') return false
  return true
}

const getFieldLabel = (field: NodeFieldSchema): string => {
  if (field.key === 'file_paths') {
    if (innerConfig['source_type'] === 'http_url') return t('message.targetPathConfigLabel')
    return t('message.fileUploadLabel')
  }
  return field.label
}

const isRemoteSourceField = (field: NodeFieldSchema): boolean => {
  if (!props.manifest) return false
  if (props.manifest.nodeType !== 'file_op') return false
  if (field.key !== 'file_paths') return false
  return innerConfig['source_type'] === 'http_url'
}

const drawerSuccessCount = computed(() => drawerFiles.value.filter(f => f.status === 'success').length)

const drawerFieldHelp = computed(() => {
  if (!props.manifest?.params) return ''
  const f = props.manifest.params.find(f => f.key === currentUploadFieldKey.value)
  return f?.help || ''
})

const getUploadedCount = (fieldKey: string): number => {
  ensureKvLoaded(fieldKey)
  const arr = innerConfig[fieldKey] as KvPair[]
  return arr.filter(kv => kv.original_filename).length
}

const openUploadDrawer = (fieldKey: string) => {
  currentUploadFieldKey.value = fieldKey
  ensureKvLoaded(fieldKey)
  // Restore uploaded files from existing config
  const arr = innerConfig[fieldKey] as KvPair[]
  drawerFiles.value = arr
    .filter(kv => kv.original_filename && kv.key)
    .map((kv, i) => ({
      uid: `existing-${i}-${Date.now()}`,
      key: kv.key,
      value: kv.value || '',
      original_filename: kv.original_filename!,
      size: kv.size || 0,
      status: 'success' as const,
    }))
  showUploadDrawer.value = true
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

const onDrawerFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const fileList = Array.from(files)
  uploading.value = true

  // Generate temp placeholder items
  const newItems: DrawerFileItem[] = fileList.map((f, i) => ({
    uid: `new-${Date.now()}-${i}`,
    key: '',
    value: '',
    original_filename: f.name,
    size: f.size,
    status: 'pending' as const,
  }))
  drawerFiles.value.push(...newItems)

  try {
    if (fileList.length === 1) {
      const res = await uploadToBackendTemp(fileList[0], fileList[0].name, drawerBatchPrefix.value || undefined)
      const data = res?.data || res
      if (data?.file_path) {
        const item = drawerFiles.value.find(f => f.uid === newItems[0].uid)
        if (item) {
          item.key = data.file_path
          item.original_filename = data.original_filename || data.filename
          item.size = data.size || item.size
          item.value = drawerBatchPrefix.value
            ? drawerBatchPrefix.value.replace(/\/$/, '') + '/' + item.original_filename
            : ''
          item.status = 'success'
        }
        ElMessage.success(t('message.uploadSingleSuccess'))
      } else {
        const item = drawerFiles.value.find(f => f.uid === newItems[0].uid)
        if (item) { item.status = 'error'; item.error = t('message.uploadFileFailed') }
        ElMessage.error(t('message.uploadFileFailed'))
      }
    } else {
      const res = await uploadBatchToBackendTemp(fileList, drawerBatchPrefix.value || undefined)
      const data = res?.data || res
      if (data?.files && data.files.length > 0) {
        for (let i = 0; i < data.files.length; i++) {
          const fileItem = data.files[i]
          const tempItem = newItems[i]
          if (!tempItem) continue
          const df = drawerFiles.value.find(f => f.uid === tempItem.uid)
          if (!df) continue
          if (fileItem.error) {
            df.status = 'error'
            df.error = fileItem.error
          } else {
            df.key = fileItem.file_path
            df.original_filename = fileItem.original_filename || fileItem.filename
            df.size = fileItem.size || df.size
            df.value = drawerBatchPrefix.value
              ? drawerBatchPrefix.value.replace(/\/$/, '') + '/' + df.original_filename
              : ''
            df.status = 'success'
          }
        }
        const successCount = data.files.filter((f: any) => !f.error).length
        ElMessage.success(t('message.uploadBatchComplete', { success: successCount, total: data.files.length }))
      } else {
        ElMessage.error(t('message.uploadFileFailed'))
      }
    }
  } catch (error: any) {
    ElMessage.error(t('message.uploadFileFailed') + ': ' + (error?.message || t('message.uploadFailedUnknown')))
    // Mark all pending as error
    for (const item of drawerFiles.value) {
      if (item.status === 'pending') {
        item.status = 'error'
        item.error = error?.message || t('message.uploadException')
      }
    }
  } finally {
    uploading.value = false
    target.value = ''
  }
}

const removeDrawerFile = (idx: number) => {
  drawerFiles.value.splice(idx, 1)
}

const applyDrawerBatchPrefix = () => {
  const prefix = drawerBatchPrefix.value.trim()
  if (!prefix) {
    ElMessage.warning(t('message.importExcel.pleaseInputTargetPathPrefix'))
    return
  }
  let updated = 0
  for (const df of drawerFiles.value) {
    if (df.status === 'success' && df.key) {
      df.value = prefix.replace(/\/$/, '') + '/' + df.original_filename
      updated++
    }
  }
  if (updated > 0) {
    ElMessage.success(t('message.updateUploadTargetPathSuccess', { count: updated }))
  } else {
    ElMessage.warning(t('message.noUploadedFileToUpdate'))
  }
}

const onDrawerTargetChange = () => {
  // v-model auto-updates, no extra logic needed
}

const confirmDrawerFiles = () => {
  const fieldKey = currentUploadFieldKey.value || 'file_paths'
  ensureKvLoaded(fieldKey)
  const arr = innerConfig[fieldKey] as KvPair[]

  // Clear existing uploaded file entries
  const keepManual = arr.filter(kv => !kv.original_filename)

  // Merge successful files from drawer
  const successFiles = drawerFiles.value.filter(df => df.status === 'success' && df.key)
  const newEntries: KvPair[] = successFiles.map(df => ({
    key: df.key,
    value: df.value,
    original_filename: df.original_filename,
    size: df.size,
  }))

  // Keep existing empty rows
  const emptyRows = keepManual.filter(kv => !kv.key && !kv.value)

  // Merge: manual entries (non-empty) + new uploads + empty rows
  const manualEntries = keepManual.filter(kv => kv.key || kv.value)
  arr.splice(0, arr.length, ...manualEntries, ...newEntries, ...emptyRows)

  onFieldChange(fieldKey)
  showUploadDrawer.value = false
  ElMessage.success(t('message.saveUploadConfigSuccess', { count: successFiles.length }))
}

const clearAllUploadedFiles = (fieldKey: string) => {
  innerConfig[fieldKey] = [{ key: '', value: '' }]
  onFieldChange(fieldKey)
}

// ============ Remote link configuration ============
interface RemoteSource {
  url: string
  protocol: string
  username: string
  password: string
  targetPath: string
}

const showRemoteSourceDrawer = ref(false)
const remoteSourceList = ref<RemoteSource[]>([])
const currentRemoteSourceFieldKey = ref('')

const requiresAuth = (protocol: string): boolean => {
  return ['ftp', 'ftps', 'sftp'].includes(protocol)
}

const getFilename = (url: string): string => {
  if (!url) return 'file'
  const parts = url.split('/')
  let name = parts[parts.length - 1] || 'file'
  name = name.split('?')[0]
  return name || 'file'
}

const getRemoteSourceCount = (fieldKey: string): number => {
  const arr = innerConfig[fieldKey]
  if (!Array.isArray(arr)) return 0
  return arr.filter((r: any) => r?.url).length
}

const openRemoteSourceDrawer = (fieldKey: string) => {
  currentRemoteSourceFieldKey.value = fieldKey
  const arr = innerConfig[fieldKey]
  if (Array.isArray(arr) && arr.length > 0) {
    remoteSourceList.value = arr.map((r: any) => ({
      url: r.url || '',
      protocol: r.protocol || 'https',
      username: r.username || '',
      password: r.password || '',
      targetPath: r.targetPath || ''
    }))
  } else {
    remoteSourceList.value = []
  }
  showRemoteSourceDrawer.value = true
}

const addRemoteSource = () => {
  remoteSourceList.value.push({
    url: '',
    protocol: 'https',
    username: '',
    password: '',
    targetPath: ''
  })
}

const removeRemoteSource = (idx: number) => {
  remoteSourceList.value.splice(idx, 1)
}

const clearRemoteSources = (fieldKey: string) => {
  innerConfig[fieldKey] = []
  onFieldChange(fieldKey)
}

const confirmRemoteSources = () => {
  const fieldKey = currentRemoteSourceFieldKey.value || 'remote_sources'
  const valid = remoteSourceList.value.filter(r => r.url.trim())
  if (valid.length === 0) {
    ElMessage.warning(t('message.atLeastOneRemoteLink'))
    return
  }
  innerConfig[fieldKey] = valid.map(r => ({
    url: r.url.trim(),
    protocol: r.protocol,
    username: requiresAuth(r.protocol) ? r.username : '',
    password: requiresAuth(r.protocol) ? r.password : '',
    targetPath: r.targetPath || ''
  }))
  // Write target paths into file_paths (key = remote source index, value = target path)
  const fpKey = 'file_paths'
  const newPaths: KvPair[] = valid.map((r, i) => ({
    key: String(i),
    value: r.targetPath || '',
  }))
  innerConfig[fpKey] = newPaths
  onFieldChange(fpKey)
  onFieldChange(fieldKey)
  remoteSourcePrefix.value = ''
  showRemoteSourceDrawer.value = false
  ElMessage.success(t('message.saveRemoteLinkSuccess', { count: valid.length }))
}

// Remote source target path prefix (applied inside Drawer)
const remoteSourcePrefix = ref('')

const applyRemoteSourcePrefix = () => {
  const prefix = remoteSourcePrefix.value.trim()
  if (!prefix) {
    ElMessage.warning(t('message.pleaseEnterTargetPathPrefix'))
    return
  }
  let updated = 0
  for (const rs of remoteSourceList.value) {
    if (!rs.url.trim()) continue
    const filename = getFilename(rs.url)
    rs.targetPath = prefix.replace(/\/$/, '') + '/' + filename
    updated++
  }
  if (updated > 0) {
    ElMessage.success(t('message.updateRemoteTargetPathSuccess', { count: updated }))
  } else {
    ElMessage.warning(t('message.importExcel.remoteLinkListEmpty'))
  }
}
</script>

<style scoped lang="scss">
.auto-node-form {
  .form-group {
    margin-bottom: 16px;
    .group-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #999;
      padding: 8px 0 4px;
      font-weight: 500;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 8px;
      .group-title-text {
        flex: 1;
      }
      .group-reset-btn {
        padding: 0;
        font-size: 12px;
        color: var(--el-color-primary-light-3);
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .complex-field {
    display: flex;
    gap: 8px;
    width: 100%;
    align-items: center;
    .selector-display {
      flex: 1;
      cursor: pointer;
    }

    &.host-selector-field {
      .selector-display-tag-box {
        flex: 1;
        min-height: 32px;
        display: flex;
        align-items: center;
        padding: 4px 12px;
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        background-color: var(--el-fill-color-blank);
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
        cursor: pointer;

        &:hover:not(.is-readonly) {
          border-color: var(--el-color-primary-light-5);
        }

        &:not(.is-readonly):focus-within,
        &:not(.is-readonly):active {
          border-color: var(--el-color-primary);
          box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
        }

        &.is-readonly {
          cursor: not-allowed;
          background-color: var(--el-disabled-bg-color);
          border-color: var(--el-disabled-border-color);
        }

        .host-count-tag {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .field-help {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .unsupported-field {
    width: 100%;
    opacity: 0.7;
  }

  .kv-table {
    width: 100%;

    .kv-toolbar {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 12px;

      .kv-toolbar-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        width: 100%;
      }

      .kv-toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .el-link {
        font-size: 12px;
      }
    }

    .remote-source-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .remote-source-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 12px;
      background: #fafbfc;

      .rs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .rs-index {
          font-weight: 600;
          color: #409eff;
          font-size: 13px;
        }
      }

      .rs-field {
        margin-bottom: 10px;

        label {
          display: block;
          font-size: 12px;
          color: #606266;
          margin-bottom: 4px;
          font-weight: 500;
        }
      }

      .rs-auth {
        border-top: 1px dashed #dcdfe6;
        padding-top: 10px;
        margin-top: 4px;
      }

      .rs-no-auth-hint {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;
        padding: 6px 10px;
        background: #f4f4f5;
        border-radius: 4px;
      }

      .rs-target-field {
        border-top: 1px dashed #dcdfe6;
        padding-top: 10px;
        margin-top: 4px;
      }
    }

    .kv-empty {
      padding: 16px 0;
      text-align: center;
    }

    // ===== Plain key-value pair layout =====
    .kv-remote-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background: #f4f4f5;
      border-radius: 4px;
      font-size: 12px;
      color: #606266;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .kv-column-headers {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
      padding: 0;
      font-size: 12px;
      color: #909399;
      font-weight: 500;

      .kv-col-key {
        flex: 1;
        min-width: 0;
      }

      .kv-col-value {
        flex: 1.3;
      }

      .kv-col-actions {
        width: 42px;
        flex-shrink: 0;
      }
    }

    .kv-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;

      .kv-col-key-wrap {
        flex: 1;
        min-width: 0;
      }

      .kv-value-input {
        flex: 1.3;
      }

      .kv-col-actions,
      .kv-row > .el-button {
        width: 42px;
        flex-shrink: 0;
      }

      .kv-insert-btn {
        padding: 0 6px;
        height: 24px;
      }

      .array-index-col {
        width: 42px;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;

        .array-index-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--el-color-primary-light-5);
          flex-shrink: 0;
        }

        .array-index-num {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 12px;
          color: var(--el-color-primary);
          font-weight: 600;
          line-height: 1;
        }
      }

      :deep(.el-input-group__append) {
        padding: 0;
        background: transparent;
        border-color: var(--el-border-color-lighter);
      }
    }
  }

  .code-editor textarea,
  .json-editor textarea {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
  }

  .body-format-editor {
    width: 100%;

    .body-form-editor {
      display: flex;
      flex-direction: column;

      .kv-column-headers {
        display: flex;
        gap: 8px;
        margin-bottom: 4px;
        padding: 0;
        font-size: 12px;
        color: #909399;
        font-weight: 500;

        .kv-col-key {
          flex: 1;
          min-width: 0;
        }

        .kv-col-value {
          flex: 1.3;
        }

        .kv-col-actions {
          width: 42px;
          flex-shrink: 0;
        }
      }

      .kv-row {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        align-items: center;

        .kv-col-key-wrap {
          flex: 1;
          min-width: 0;
        }

        .kv-value-input {
          flex: 1.3;
        }

        .kv-col-actions,
        .kv-row > .el-button {
          width: 42px;
          flex-shrink: 0;
        }
      }
    }
  }

  .has-error {
    :deep(.el-form-item__content) {
      .el-input__wrapper {
        box-shadow: 0 0 0 1px var(--el-color-danger) inset;
      }
    }
  }
}

// ===== File upload Drawer =====
.upload-drawer {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;

  .drawer-help {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 10px 12px;
    background: #f4f4f5;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: #606266;
    margin-bottom: 16px;

    .el-icon {
      color: #909399;
      flex-shrink: 0;
      margin-top: 2px;
    }

    span {
      flex: 1;
    }
  }

  .drawer-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .drawer-label {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }

    .drawer-prefix-row {
      display: flex;
      gap: 8px;

      .el-input {
        flex: 1;
      }
    }
  }

  .file-drop-zone {
    border: 1.5px dashed #dcdfe6;
    border-radius: 8px;
    padding: 24px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
    }

    .drop-text {
      font-size: 13px;
      color: #303133;
      margin-top: 8px;
      font-weight: 500;
    }

    .drop-hint {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .drawer-file-list {
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;

    .drawer-file-item {
      border: 1px solid #ebeef5;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #fafbfc;
      transition: border-color 0.2s;

      &:hover {
        border-color: #d0d7de;
      }

      &:last-child {
        margin-bottom: 0;
      }

      .df-main-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .df-info {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;

          .df-name {
            font-size: 13px;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 200px;
          }

          .df-size {
            font-size: 12px;
            color: #909399;
            flex-shrink: 0;
          }
        }

        .df-status {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
      }

      .df-progress {
        margin-bottom: 8px;
      }

      .df-target-input {
        width: 100%;
      }
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  flex-shrink: 0;

  .drawer-summary {
    font-size: 13px;
    color: #606266;
  }

  & > div {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      margin: 0;
    }
  }
}

// ===== Drawer group configuration =====
.drawer-group-summary-item {
    .drawer-group-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;

      .dg-status-row {
        font-size: 13px;
        color: #606266;
        background: #f5f7fa;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        padding: 8px 12px;
        line-height: 1.5;
      }

      .dg-status-text {
        color: #606266;
      }
    }

  .drawer-group-error-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #e6a23c;
    margin-top: 4px;
  }
}
</style>

<!-- Non-scoped styles: used to override Element Plus drawer internal structure -->
<style lang="scss">
.upload-drawer-wrapper .el-drawer__body {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.upload-drawer-wrapper .el-drawer__footer {
  padding: 14px 20px;
  margin: 0;
  border-top: 1px solid #ebeef5;
}

.drawer-group-wrapper .el-drawer__body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.drawer-group-wrapper .el-drawer__footer {
  padding: 14px 20px;
  margin: 0;
  border-top: 1px solid #ebeef5;
}
</style>