import type { App } from 'vue';
import { judementSameArr } from '/@/utils/arrayOperation';
import {BtnPermissionStore} from "/@/stores/btnPermission";
/**
 * User permission directives
 * @directive Single permission validation (v-auth="xxx")
 * @directive Multiple permission validation, show if any is satisfied (v-auths="[xxx,xxx]")
 * @directive Multiple permission validation, show only if all are satisfied (v-auth-all="[xxx,xxx]")
 */
export function authDirective(app: App) {
	// Single permission validation (v-auth="xxx")
	app.directive('auth', {
		mounted(el, binding) {
			const stores = BtnPermissionStore();
			if (!stores.data.some((v: string) => v === binding.value)) el.parentNode.removeChild(el);
		},
	});
	// Multiple permissions, show if any satisfied (v-auths="[xxx,xxx]")
	app.directive('auths', {
		mounted(el, binding) {
			let flag = false;
			const stores = BtnPermissionStore();
			stores.data.map((val: string) => {
				binding.value.map((v: string) => {
					if (val === v) flag = true;
				});
			});
			if (!flag) el.parentNode.removeChild(el);
		},
	});
	// Multiple permissions, show if all satisfied (v-auth-all="[xxx,xxx]")
	app.directive('auth-all', {
		mounted(el, binding) {
			const stores = BtnPermissionStore();
			const flag = judementSameArr(binding.value, stores.data);
			if (!flag) el.parentNode.removeChild(el);
		},
	});
}
