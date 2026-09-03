import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { directive } from '/@/directive/index';
import { i18n } from '/@/i18n';
import other from '/@/utils/other';
import '/@/assets/style/tailwind.css'; // Import tailwind CSS first to avoid element-plus conflicts
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '/@/theme/index.scss';
import mitt from 'mitt';
import VueGridLayout from 'vue-grid-layout';
import piniaPersist from 'pinia-plugin-persist';
// @ts-ignore
import fastCrud from './settings.ts';
import pinia from './stores';
import {RegisterPermission} from '/@/plugin/permission/index';
// @ts-ignore
import eIconPicker, { iconList, analyzingIconForIconfont } from 'e-icon-picker';
import 'e-icon-picker/icon/default-icon/symbol.js'; // Basic colored icon library
import 'e-icon-picker/index.css'; // Basic styles including default icons
import 'font-awesome/css/font-awesome.min.css';
import elementPlus from 'e-icon-picker/icon/ele/element-plus.js'; // element-plus icons
import fontAwesome470 from 'e-icon-picker/icon/fontawesome/font-awesome.v4.7.0.js'; // fontAwesome 470 icons
import eIconList from 'e-icon-picker/icon/default-icon/eIconList.js';
import iconfont from '/@/assets/iconfont/iconfont.json'; // Import iconfont JSON
import '/@/assets/iconfont/iconfont.css'; // Import iconfont CSS
// Auto-register plugins
import { scanAndInstallPlugins } from '/@/views/plugins/index';
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import '/@/assets/style/reset.scss';
import 'element-tree-line/dist/style.css'
import {setLogger} from "@fast-crud/fast-crud";

setLogger({level:'debug'})

let forIconfont = analyzingIconForIconfont(iconfont); // Parse class names
iconList.addIcon(forIconfont.list); // Add iconfont dvadmin3 icons
iconList.addIcon(elementPlus); // Add element plus icons
iconList.addIcon(fontAwesome470); // Add fontAwesome 470 version icons

let app = createApp(App);

scanAndInstallPlugins(app);

app.use(eIconPicker, {
	addIconList: eIconList, // Global add icons
	removeIconList: [], // Global remove icons
	zIndex: 3100, // Minimum z-index of picker popover, global config
});

pinia.use(piniaPersist);
directive(app);
other.elSvg(app);


app.use(VXETable)
app.use(pinia)
	.use(router)
	.use(ElementPlus, { i18n: i18n.global.t })
	.use(i18n)
	.use(VueGridLayout)
	.use(fastCrud)
	.mount('#app');

app.config.globalProperties.mittBus = mitt();
