<template>
  <EditionLockedPage feature="TOOLS_CENTER" :label="t('message.pages.edition.lockedPageLabels.toolsCenter')">
  <div class="tools-center-page">
    <div class="tools-container">
      <!-- Left category menu -->
      <div class="tools-menu">
        <div class="menu-title">{{ t('message.pages.toolsCenter.tcTitle') }}</div>
        <el-menu
          :default-active="activeTool"
          @select="handleMenuSelect"
          class="tool-menu-list"
        >
          <el-menu-item-group :title="t('message.pages.toolsCenter.tcCoding')">
            <el-menu-item index="base64">{{ t('message.pages.toolsCenter.tcBase64Item') }}</el-menu-item>
            <el-menu-item index="timestamp">{{ t('message.pages.toolsCenter.tcTimestampItem') }}</el-menu-item>
            <el-menu-item index="password">{{ t('message.pages.toolsCenter.tcPasswordItem') }}</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group :title="t('message.pages.toolsCenter.tcNetwork')">
            <el-menu-item index="ping">{{ t('message.pages.toolsCenter.tcPingItem') }}</el-menu-item>
            <el-menu-item index="subnet">{{ t('message.pages.toolsCenter.tcSubnetItem') }}</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group :title="t('message.pages.toolsCenter.tcDevTools')">
            <el-menu-item index="json">{{ t('message.pages.toolsCenter.tcJsonItem') }}</el-menu-item>
            <el-menu-item index="regex">{{ t('message.pages.toolsCenter.tcRegexItem') }}</el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </div>

      <!-- Right tool content area -->
      <div class="tools-content">
        <!-- Base64 encode/decode tool -->
        <div v-show="activeTool === 'base64'" class="tool-card">
          <h3 class="tool-title">{{ t('message.pages.toolsCenter.tcBase64Title') }}</h3>
          <div class="tool-operate">
            <el-button type="primary" @click="encodeBase64">{{ t('message.pages.toolsCenter.tcEncode') }}</el-button>
            <el-button @click="decodeBase64">{{ t('message.pages.toolsCenter.tcDecode') }}</el-button>
            <el-button @click="clearBase64">{{ t('message.pages.toolsCenter.tcClear') }}</el-button>
          </div>
          <div class="tool-input-group">
            <div class="input-item">
              <div class="input-label">{{ t('message.pages.toolsCenter.tcSource') }}</div>
              <el-input
                v-model="base64Form.source"
                type="textarea"
                :rows="8"
                :placeholder="t('message.pages.toolsCenter.tcBase64Ph')"
              />
            </div>
            <div class="input-item">
              <div class="input-label">{{ t('message.pages.toolsCenter.tcResult') }}</div>
              <div class="result-box">{{ base64Form.result }}</div>
              <el-button size="small" text type="primary" @click="copyResult(base64Form.result)" style="margin-top:8px">
                {{ t('message.pages.toolsCenter.tcCopyResult') }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- Timestamp conversion tool -->
        <div v-show="activeTool === 'timestamp'" class="tool-card">
          <h3 class="tool-title">{{ t('message.pages.toolsCenter.tcTimestampTitle') }}</h3>
          <div class="tool-input-group">
            <div class="input-item">
              <div class="input-label">{{ t('message.pages.toolsCenter.tcTsLabel') }}</div>
              <el-input v-model="timestampForm.timestamp" :placeholder="t('message.pages.toolsCenter.tcTsPh')" @input="timestampToDate">
                <template #append>
                  <el-button @click="getNowTimestamp">{{ t('message.pages.toolsCenter.tcNow') }}</el-button>
                </template>
              </el-input>
            </div>
            <div class="input-item">
              <div class="input-label">{{ t('message.pages.toolsCenter.tcBjTime') }}</div>
              <el-date-picker
                v-model="timestampForm.date"
                type="datetime"
                :placeholder="t('message.pages.toolsCenter.tcDatePh')"
                style="width: 100%"
                @change="dateToTimestamp"
              />
            </div>
          </div>
        </div>

        <!-- Random password generator tool -->
        <div v-show="activeTool === 'password'" class="tool-card">
          <h3 class="tool-title">{{ t('message.pages.toolsCenter.tcPasswordTitle') }}</h3>
          <el-form :model="passwordForm" inline size="small">
            <el-form-item :label="t('message.pages.toolsCenter.tcPwdLength')">
              <el-input-number v-model="passwordForm.length" :min="6" :max="32" />
            </el-form-item>
            <el-form-item :label="t('message.pages.toolsCenter.tcPwdUpper')">
              <el-switch v-model="passwordForm.upper" />
            </el-form-item>
            <el-form-item :label="t('message.pages.toolsCenter.tcPwdDigits')">
              <el-switch v-model="passwordForm.number" />
            </el-form-item>
            <el-form-item :label="t('message.pages.toolsCenter.tcPwdSymbol')">
              <el-switch v-model="passwordForm.symbol" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generatePassword">{{ t('message.pages.toolsCenter.tcPwdGenerate') }}</el-button>
            </el-form-item>
          </el-form>
          <div class="password-result">
            <span>{{ passwordForm.result }}</span>
            <el-button size="small" text type="primary" @click="copyResult(passwordForm.result)">{{ t('message.pages.toolsCenter.tcCopy') }}</el-button>
          </div>
        </div>

        <!-- Placeholder for other tools -->
        <div v-show="['ping','subnet','json','regex'].includes(activeTool)" class="tool-card">
          <el-empty :description="t('message.pages.toolsCenter.tcComingSoon')" />
        </div>
      </div>
    </div>
  </div>
  </EditionLockedPage>
  </template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import EditionLockedPage from '/@/components/EditionLockedPage.vue'

const { t } = useI18n()
const hasFeature = (code) => useEditionStore().hasFeature(code)
import { ElMessage } from 'element-plus'

const activeTool = ref('base64')

// Base64 form data
const base64Form = reactive({
  source: '',
  result: ''
})

// Timestamp form data
const timestampForm = reactive({
  timestamp: '',
  date: ''
})

// Password generator form data
const passwordForm = reactive({
  length: 12,
  upper: true,
  number: true,
  symbol: false,
  result: ''
})

// Menu switch
const handleMenuSelect = (key) => {
  activeTool.value = key
}

// Base64 encode
const encodeBase64 = () => {
  if (!base64Form.source) return ElMessage.warning(t('message.pages.toolsCenter.tcMsgNeedSource'))
  try {
    base64Form.result = btoa(unescape(encodeURIComponent(base64Form.source)))
    ElMessage.success(t('message.pages.toolsCenter.tcMsgEncodeOk'))
  } catch (e) {
    ElMessage.error(t('message.pages.toolsCenter.tcMsgEncodeFail'))
  }
}

// Base64 decode
const decodeBase64 = () => {
  if (!base64Form.source) return ElMessage.warning(t('message.pages.toolsCenter.tcMsgNeedBase64'))
  try {
    base64Form.result = decodeURIComponent(escape(atob(base64Form.source)))
    ElMessage.success(t('message.pages.toolsCenter.tcMsgDecodeOk'))
  } catch (e) {
    ElMessage.error(t('message.pages.toolsCenter.tcMsgDecodeFail'))
  }
}

// Clear Base64
const clearBase64 = () => {
  base64Form.source = ''
  base64Form.result = ''
}

// Timestamp to date
const timestampToDate = () => {
  if (!timestampForm.timestamp) return
  const ts = Number(timestampForm.timestamp)
  if (isNaN(ts)) return ElMessage.warning(t('message.pages.toolsCenter.tcMsgNeedNumber'))
  timestampForm.date = new Date(ts)
}

// Date to timestamp
const dateToTimestamp = () => {
  if (!timestampForm.date) return
  timestampForm.timestamp = String(new Date(timestampForm.date).getTime())
}

// Get current timestamp
const getNowTimestamp = () => {
  timestampForm.timestamp = String(Date.now())
  timestampForm.date = new Date()
}

// Generate random password
const generatePassword = () => {
  let chars = 'abcdefghijklmnopqrstuvwxyz'
  if (passwordForm.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (passwordForm.number) chars += '0123456789'
  if (passwordForm.symbol) chars += '!@#$%^&*()_+-=[]{}|;:,.?'
  
  let result = ''
  for (let i = 0; i < passwordForm.length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }
  passwordForm.result = result
  ElMessage.success(t('message.pages.toolsCenter.tcMsgPwdOk'))
}

// Copy result to clipboard
const copyResult = (text) => {
  if (!text) return ElMessage.warning(t('message.pages.toolsCenter.tcMsgCopyEmpty'))
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('message.pages.toolsCenter.tcMsgCopyOk'))
  }).catch(() => {
    ElMessage.error(t('message.pages.toolsCenter.tcMsgCopyFail'))
  })
}

// Page initialization
onMounted(() => {
  if (!useEditionStore().hasFeature('TOOLS_CENTER')) return
  generatePassword()
  getNowTimestamp()
})
</script>

<style scoped lang="scss">
.tools-center-page {
  width: 100%;
  height: calc(100vh - 85px - 50px);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tools-container {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

// Left menu
.tools-menu {
  width: 200px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 16px 0;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .menu-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    padding: 0 20px 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 8px;
    flex-shrink: 0;
  }
  .tool-menu-list {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
}

// Right content area
.tools-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.tool-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  min-height: 0;

  .tool-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
  }
  .tool-operate {
    margin-bottom: 16px;
    display: flex;
    gap: 10px;
  }
  .tool-input-group {
    display: flex;
    gap: 20px;
  }
  .input-item {
    flex: 1;
    .input-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }
  .result-box {
    width: 100%;
    min-height: 120px;
    padding: 10px;
    box-sizing: border-box;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fafafa;
    font-size: 14px;
    color: #333;
    word-break: break-all;
    line-height: 1.5;
  }
  .password-result {
    margin-top: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 6px;
    font-size: 18px;
    font-family: monospace;
    letter-spacing: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>