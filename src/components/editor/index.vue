<template>
	<div class="editor-container">
		<Toolbar :editor="editorRef" :mode="mode" />
		<Editor
			:mode="mode"
			:defaultConfig="state.editorConfig"
			:style="{ height }"
			v-model="state.editorVal"
			@onCreated="handleCreated"
			@onChange="handleChange"
		/>
	</div>
</template>

<script setup lang="ts" name="wngEditor">
// https://www.wangeditor.com/v5/for-frame.html#vue3
import '@wangeditor/editor/dist/css/style.css';
import { reactive, shallowRef, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { IDomEditor } from '@wangeditor/editor';
import { Toolbar, Editor } from '@wangeditor/editor-for-vue';

// define props passed from parent
const props = defineProps({
	// disabled
	disable: {
		type: Boolean,
		default: () => false,
	},
	// default content placeholder
	placeholder: {
		type: String,
		default: () => '请输入内容...',
	},
	// https://www.wangeditor.com/v5/getting-started.html#mode-%E6%A8%A1%E5%BC%8F
	// mode, optional <default|simple>, default default
	mode: {
		type: String,
		default: () => 'default',
	},
	// height
	height: {
		type: String,
		default: () => '310px',
	},
	// v-model for editor.getHtml()
	getHtml: String,
	// v-model for editor.getText()
	getText: String,
});

// define emits
const emit = defineEmits(['update:getHtml', 'update:getText']);
const { t } = useI18n();

// define variables
const editorRef = shallowRef();
const state = reactive({
	editorConfig: {
		placeholder: props.placeholder || t('message.editorPlaceholder'),
	},
	editorVal: props.getHtml,
});

// editor created callback
const handleCreated = (editor: IDomEditor) => {
	editorRef.value = editor;
};
// editor content changed
const handleChange = (editor: IDomEditor) => {
	emit('update:getHtml', editor.getHtml());
	emit('update:getText', editor.getText());
};
// on component unmount
onBeforeUnmount(() => {
	const editor = editorRef.value;
	if (editor == null) return;
	editor.destroy();
});
// watch disable changes
// https://gitee.com/lyt-top/vue-next-admin/issues/I4LM7I
watch(
	() => props.disable,
	(bool) => {
		const editor = editorRef.value;
		if (editor == null) return;
		bool ? editor.disable() : editor.enable();
	},
	{
		deep: true,
	}
);
// watch v-model for echo
watch(
	() => props.getHtml,
	(val) => {
		state.editorVal = val;
	},
	{
		deep: true,
	}
);
</script>
