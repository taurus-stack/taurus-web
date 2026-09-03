<script setup lang="ts" name="custom-dialog">

import {FsIcon} from "@fast-crud/fast-crud";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

const { t } = useI18n();
const isFullScreen = ref(false)
const {title, height} = defineProps({
  title: String,
  height: Number,
})
const content = computed(() => {
  return isFullScreen.value ? t('message.exitFullscreen') : t('message.fullscreenBtn')
})
</script>

<template>
  <el-dialog v-bind="$attrs" :fullscreen="isFullScreen">
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #default>
      <div style="display: flex;justify-content: space-between;margin-bottom: 1em">
        <h1 style="font-size: 1.2em;">{{ title }}</h1>
        <el-tooltip :content="content">
          <fs-icon icon="FullScreen" @click="isFullScreen=!isFullScreen"
                   class="fullscreen"></fs-icon>
        </el-tooltip>
      </div>
      <slot name="content" :height="height"></slot>
    </template>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.fullscreen:hover {
  color: #409eff;
}
</style>