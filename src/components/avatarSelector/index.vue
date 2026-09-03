<template>
	<div class="user-info-head" @click="editCropper()">
		<el-avatar :size="100" :src="options.img" />
		<div class="hover-mask">
			<span>{{ t('message.pages.personal.avatar.title') }}</span>
		</div>
		<el-dialog :title="dialogTitle" v-model="dialogVisiable" width="600px" append-to-body @opened="modalOpened" @close="closeDialog">
			<el-row>
				<el-col class="flex justify-center">
					<vue-cropper
						ref="cropper"
						:img="options.img"
						:info="true"
						:autoCrop="options.autoCrop"
						:autoCropWidth="options.autoCropWidth"
						:autoCropHeight="options.autoCropHeight"
						:fixedBox="options.fixedBox"
						:outputType="options.outputType"
						@realTime="realTime"
						:centerBox="true"
						v-if="visible"
						class="cropper"
					/>
				</el-col>
			</el-row>
			<br />
			<el-row class="flex justify-center">
				<el-col :lg="2" :md="2">
					<el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
						<el-button type="success">
							{{ t('message.pages.personal.avatar.select') }}
							<el-icon class="el-icon--right"><Plus /></el-icon>
						</el-button>
					</el-upload>
				</el-col>
				<el-col :lg="{ span: 1, offset: 2 }" :md="2">
					<el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
				</el-col>
				<el-col :lg="{ span: 1, offset: 2 }" :md="2">
					<el-button icon="RefreshRight" @click="rotateRight()"></el-button>
				</el-col>
				<el-col :lg="{ span: 2, offset: 2 }" :md="2">
					<el-button type="primary" @click="uploadImg()">{{ t('message.pages.personal.avatar.updateAvatar') }}</el-button>
				</el-col>
			</el-row>
		</el-dialog>
	</div>
</template>

<script setup>
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
import { useUserInfo } from '/@/stores/userInfo';
import { getCurrentInstance, nextTick, reactive, ref, computed, defineExpose } from 'vue';
import { base64ToFile } from '/@/utils/tools';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserInfo();
const { proxy } = getCurrentInstance();

const visible = ref(false);
const dialogTitle = computed(() => t('message.pages.personal.avatar.title'));
const emit = defineEmits(['uploadImg']);
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
		required: true,
	},
});
const dialogVisiable = computed({
	get() {
		return props.modelValue;
	},
	set(newVal) {
		emit('update:modelValue', newVal);
	},
});

// Image cropping settings
const options = reactive({
	img: userStore.userInfos.avatar, // Image URL to crop
	fileName: '',
	autoCrop: true, // Whether to auto-generate crop box
	autoCropWidth: 200, // Default auto-generated crop box width
	autoCropHeight: 200, // Default auto-generated crop box height
	fixedBox: true, // Fix crop box size, disallow changes
	outputType: 'png', // Default crop output format is PNG
});

/** Edit avatar */
function editCropper() {
	dialogVisiable.value = true;
}
/** Callback when dialog finishes opening */
function modalOpened() {
	nextTick(() => {
		visible.value = true;
	});
}
/** Override default upload behavior */
function requestUpload() {}
/** Rotate left */
function rotateLeft() {
	proxy.$refs.cropper.rotateLeft();
}
/** Rotate right */
function rotateRight() {
	proxy.$refs.cropper.rotateRight();
}
/** Pre-upload processing */
function beforeUpload(file) {
	if (file.type.indexOf('image/') == -1) {
		ElMessage.error(t('message.pages.personal.avatar.invalidFileType'));
	} else {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			options.img = reader.result;
			options.fileName = file.name;
		};
	}
}
/** Upload image */
function uploadImg() {
	// Get the cropped base64 data
	proxy.$refs.cropper.getCropData((data) => {
		let img = new Image();
		img.src = data;
		img.onload = async () => {
			let _data = compress(img);
			const imgFile = base64ToFile(_data, options.fileName);
			emit('uploadImg', imgFile);
		};
	});
}
// Compress image
function compress(img) {
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	// let initSize = img.src.length;
	let width = img.width;
	let height = img.height;
	canvas.width = width;
	canvas.height = height;
	// Fill base color
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, width, height);
	// Compress
	let ndata = canvas.toDataURL('image/jpeg', 0.8);
	return ndata;
}

/** Close dialog */
function closeDialog() {
	options.visible = false;
	options.img = userStore.userInfos.avatar;
}

const updateAvatar = (img) => {
	options.img = img;
};

defineExpose({
	updateAvatar,
});
</script>

<style lang="scss" scoped>
.user-info-head {
	position: relative;
	display: inline-block;
	height: 120px;
	cursor: pointer;
}

.hover-mask {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	color: #fff;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s ease;
	border-radius: 50%;
	pointer-events: none;
}

.user-info-head:hover .hover-mask {
	opacity: 1;
}

.cropper {
	height: 400px;
	width: 400px;
}
</style>
