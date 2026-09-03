<template>
  <div class="knowledge-page" v-if="hasFeature('KNOWLEDGE_BASE')">
    <div class="page-container">
      <!-- Left category tree -->
      <div class="left-tree">
        <div class="tree-header">
          <span>{{ t('message.pages.knowledgeBase.kbPageTitle') }}</span>
          <el-button type="primary" size="small" @click="openCreateArticle">{{ t('message.pages.knowledgeBase.kbPageNew') }}</el-button>
        </div>
        <el-tree
          ref="treeRef"
          :data="categoryTree"
          node-key="id"
          default-expand-all
          :highlight-current="true"
          @node-click="handleCategoryClick"
        />
        <div class="tree-footer">
          <el-input v-model="searchKey" :placeholder="t('message.pages.knowledgeBase.kbSearchPh')" clearable @keyup.enter="searchArticle">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <!-- Middle article list -->
      <div class="middle-col-wrap">
        <div class="middle-list">
          <div class="list-header">
            <div class="header-title">{{ currentCategoryName }}</div>
            <div class="header-sort">
              <el-radio-group v-model="sortType" size="small" @change="getArticleList">
                <el-radio-button value="latest">{{ t('message.pages.knowledgeBase.kbSortLatest') }}</el-radio-button>
                <el-radio-button value="hot">{{ t('message.pages.knowledgeBase.kbSortMostViewed') }}</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="article-list">
            <div
              v-for="item in articleList"
              :key="item.id"
              :class="['article-item', { active: currentArticleId === item.id }]"
              @click="viewArticleDetail(item)"
            >
              <div class="article-title">{{ item.title }}</div>
              <div class="article-desc">{{ item.summary }}</div>
              <div class="article-meta">
                <el-tag size="small" :type="tagTypeMap[item.category]">{{ item.categoryName }}</el-tag>
                <span class="meta-item">👁 {{ item.views }}</span>
                <span class="meta-item">👍 {{ item.likes }}</span>
                <span class="meta-item">{{ item.updateTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="page.current"
            v-model:page-size="page.size"
            :total="page.total"
            layout="prev, pager, next"
            @change="getArticleList"
          />
        </div>
      </div>

      <!-- Right article details -->
      <div class="right-detail" v-if="currentArticle">
        <div class="detail-header">
          <h2>{{ currentArticle.title }}</h2>
          <div class="detail-meta">
            <span>{{ t('message.pages.knowledgeBase.kbAuthor') }}{{ currentArticle.author }}</span>
            <span>{{ t('message.pages.knowledgeBase.kbUpdated') }}{{ currentArticle.updateTime }}</span>
            <span>{{ t('message.pages.knowledgeBase.kbViews') }}{{ currentArticle.views }}</span>
          </div>
          <div class="detail-actions">
            <el-button size="small" :type="isCollected ? 'primary' : ''" @click="toggleCollect">
              {{ isCollected ? t('message.pages.knowledgeBase.kbCollected') : t('message.pages.knowledgeBase.kbCollect') }}
            </el-button>
            <el-button size="small" @click="likeArticle">👍 {{ currentArticle.likes }}</el-button>
            <el-button size="small" text @click="editArticle">{{ t('message.pages.knowledgeBase.kbEdit') }}</el-button>
          </div>
        </div>
        <div class="detail-content">
          <div class="markdown-body" v-html="currentArticle.content"></div>
        </div>
        <div class="detail-related">
          <div class="related-title">{{ t('message.pages.knowledgeBase.kbRelatedScripts') }}</div>
          <div class="related-list">
            <div class="related-item" v-for="script in currentArticle.relatedScripts" :key="script.id" @click="goScript(script)">
              <span>{{ script.name }}</span>
              <el-button size="small" text type="primary">{{ t('message.pages.knowledgeBase.kbRunNow') }}</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- No-selection placeholder -->
      <div class="right-detail empty" v-else>
        <el-empty :description="t('message.pages.knowledgeBase.kbEmptyTip')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'

const { t } = useI18n()
const hasFeature = (code) => useEditionStore().hasFeature(code)
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const searchKey = ref('')
const sortType = ref('latest')
const currentCategoryId = ref('all')
const currentCategoryName = ref(t('message.pages.knowledgeBase.kbAllArticles'))
const currentArticleId = ref('')
const currentArticle = ref(null)
const isCollected = ref(false)

const page = reactive({ current: 1, size: 10, total: 0 })
const articleList = ref([])

const tagTypeMap = {
  fault: 'danger',
  manual: 'primary',
  script: 'warning',
  standard: 'success',
  best: 'info'
}

// Category tree data
const categoryTree = computed(() => [
  { id: 'all', label: t('message.pages.knowledgeBase.kbAllArticles'), children: [] },
  {
    id: 'fault', label: t('message.pages.knowledgeBase.kbCatFault'), children: [
      { id: 'fault-linux', label: t('message.pages.knowledgeBase.kbCatFaultLinux') },
      { id: 'fault-db', label: t('message.pages.knowledgeBase.kbCatFaultDb') },
      { id: 'fault-network', label: t('message.pages.knowledgeBase.kbCatFaultNetwork') }
    ]
  },
  {
    id: 'manual', label: t('message.pages.knowledgeBase.kbCatManual'), children: [
      { id: 'manual-deploy', label: t('message.pages.knowledgeBase.kbCatManualDeploy') },
      { id: 'manual-backup', label: t('message.pages.knowledgeBase.kbCatManualBackup') }
    ]
  },
  { id: 'script', label: t('message.pages.knowledgeBase.kbCatScript') },
  { id: 'standard', label: t('message.pages.knowledgeBase.kbCatStandard') },
  { id: 'best', label: t('message.pages.knowledgeBase.kbCatBest') }
])

// Mock article list
const mockArticles = [
  {
    id: '1', title: t('message.pages.knowledgeBase.kbMock1Title'), category: 'fault', categoryName: t('message.pages.knowledgeBase.kbCatFault'),
    summary: t('message.pages.knowledgeBase.kbMock1Summary'),
    views: 1286, likes: 89, updateTime: '2026-07-15', author: 'admin',
    content: '<h3>一、排查步骤</h3><p>1. 使用 df -h 查看整体磁盘使用情况</p><p>2. 使用 du -sh /* 定位大文件目录</p><p>3. 重点排查日志目录、临时文件、缓存文件</p><h3>二、常见清理方法</h3><p>1. 清理 /var/log 下的历史日志</p><p>2. 清理 /tmp 临时文件</p><p>3. 清理应用产生的核心转储文件</p><h3>三、注意事项</h3><p>严禁直接执行 rm -rf /*，删除前务必确认路径与文件用途。</p>',
    relatedScripts: [{ id: 's1', name: '磁盘使用率巡检脚本' }, { id: 's2', name: '日志自动清理脚本' }]
  },
  {
    id: '2', title: t('message.pages.knowledgeBase.kbMock2Title'), category: 'best', categoryName: t('message.pages.knowledgeBase.kbCatBest'),
    summary: t('message.pages.knowledgeBase.kbMock2Summary'),
    views: 956, likes: 72, updateTime: '2026-07-12', author: 'dba',
    content: '<h3>一、慢查询定位</h3><p>开启慢查询日志，设置阈值为1秒，分析慢日志文件。</p><h3>二、执行计划分析</h3><p>使用 explain 分析SQL执行计划，重点关注 type、key、rows 字段。</p><h3>三、索引优化原则</h3><p>1. 最左前缀匹配原则</p><p>2. 避免索引列上使用函数</p><p>3. 控制联合索引的字段顺序</p>',
    relatedScripts: [{ id: 's3', name: 'MySQL慢查询统计脚本' }]
  },
  {
    id: '3', title: t('message.pages.knowledgeBase.kbMock3Title'), category: 'standard', categoryName: t('message.pages.knowledgeBase.kbCatStandard'),
    summary: t('message.pages.knowledgeBase.kbMock3Summary'),
    views: 642, likes: 45, updateTime: '2026-07-08', author: 'ops',
    content: '<h3>发布前检查</h3><p>1. 变更审批流程已完成</p><p>2. 备份方案已确认</p><p>3. 回滚方案已准备</p><h3>发布执行</h3><p>严格按照发布步骤执行，每步验证结果。</p><h3>发布后验证</h3><p>功能验证、日志检查、性能监控。</p>',
    relatedScripts: []
  }
]

onMounted(() => {
  getArticleList()
})

const getArticleList = () => {
  articleList.value = mockArticles
  page.total = 28
}

const handleCategoryClick = (node) => {
  currentCategoryId.value = node.id
  currentCategoryName.value = node.label
  getArticleList()
}

const searchArticle = () => {
  ElMessage.success(t('message.pages.knowledgeBase.kbMsgSearchDone'))
  getArticleList()
}

const viewArticleDetail = (item) => {
  currentArticleId.value = item.id
  currentArticle.value = item
  isCollected.value = false
  item.views++
}

const toggleCollect = () => {
  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? t('message.pages.knowledgeBase.kbMsgCollected') : t('message.pages.knowledgeBase.kbMsgUncollected'))
}

const likeArticle = () => {
  currentArticle.value.likes++
  ElMessage.success(t('message.pages.knowledgeBase.kbMsgLiked'))
}

const editArticle = () => {
  ElMessage.info(t('message.pages.knowledgeBase.kbMsgEditJump'))
}

const openCreateArticle = () => {
  ElMessage.info(t('message.pages.knowledgeBase.kbMsgNewArticle'))
}

const goScript = (script) => {
  ElMessage.success(t('message.pages.knowledgeBase.kbMsgGoScript', { name: script.name }))
}
</script>

<style scoped lang="scss">
.knowledge-page {
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

.page-container {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

// Left categories
.left-tree {
  width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;

  .tree-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
  }
  :deep(.el-tree) {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .tree-footer {
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    margin-top: auto;
    flex-shrink: 0;
  }
}

// Middle list outer wrapper
.middle-col-wrap {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.middle-list {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  .list-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    .header-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .article-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    min-height: 0;
  }

  .article-item {
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover, &.active {
      background: #ecf5ff;
      border-color: #409EFF;
    }

    .article-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .article-desc {
      font-size: 12px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .article-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 12px;
      color: #999;

      .meta-item { flex-shrink: 0; }
    }
  }
}

.pagination-bar {
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  display: flex;
  justify-content: center;
  align-items: center;
}

// Right details
.right-detail {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  &.empty {
    align-items: center;
    justify-content: center;
  }

  .detail-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    min-height: 0;

    h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #333;
    }

    .detail-meta {
      font-size: 12px;
      color: #999;
      display: flex;
      gap: 20px;
      margin-bottom: 12px;
    }

    .detail-actions {
      display: flex;
      gap: 10px;
    }
  }

  .detail-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    min-height: 0;
  }

  .markdown-body {
    line-height: 1.8;
    color: #333;

    h3 {
      color: #333;
      margin: 20px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
    }

    p {
      margin: 8px 0;
    }
  }

  .detail-related {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
    flex-shrink: 0;

    .related-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .related-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #fff;
      border-radius: 4px;
      margin-bottom: 6px;
      cursor: pointer;

      &:hover { background: #ecf5ff; }
    }
  }
}
</style>
