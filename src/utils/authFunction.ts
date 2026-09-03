import { judementSameArr } from '/@/utils/arrayOperation';
import { BtnPermissionStore } from '/@/stores/btnPermission';
import { useUserInfo } from '/@/stores/userInfo';

const ACTION_ALIAS: Record<string, string[]> = {
	Create: ['create', 'Create', 'create'],
	Update: ['update', 'Update', 'partial_update', 'partialUpdate'],
	Delete: ['destroy', 'Delete', 'delete', 'Del', 'del', 'Remove', 'remove'],
	List: ['list', 'List', 'Search', 'search', 'Query', 'query'],
	Search: ['list', 'List', 'Search', 'search', 'Query', 'query'],
	Retrieve: ['retrieve', 'Retrieve', 'Get', 'get'],
	Permission: ['update', 'Update', 'Permission', 'permission'],
	Edit: ['update', 'Update', 'Edit', 'edit'],
	Del: ['destroy', 'Delete', 'delete', 'Del', 'del'],
	Export: ['export', 'Export'],
	ResetPassword: ['reset_password', 'ResetPassword', 'resetPassword'],
	Match: ['match', 'Match'],
};

function normalizeCodes(code: string): string[] {
	const arr = [code];
	if (code.includes(':')) {
		const [mod, act] = code.split(':');
		arr.push(`${mod.toLowerCase()}:${act.toLowerCase()}`);
		arr.push(`${mod.charAt(0).toUpperCase()}${mod.slice(1)}:${act}`);
		if (ACTION_ALIAS[act]) {
			ACTION_ALIAS[act].forEach((v: string) => {
				arr.push(`${mod}:${v}`);
				arr.push(`${mod.toLowerCase()}:${v}`);
			});
		}
	}
	return arr;
}

/**
 * Check if the current user is a super admin
 * @returns boolean
 */
function isSuperAdmin(): boolean {
	const userInfo = useUserInfo();
	return userInfo.userInfos.is_superuser === true;
}

/**
 * Single permission validation
 * @param value Permission value
 * @returns `true` if has permission, otherwise `false`
 */
export function auth(value: string): boolean {
	if (isSuperAdmin()) return true;
	const stores = BtnPermissionStore();
	const variants = new Set(normalizeCodes(value));
	return stores.data.some((v: string) => variants.has(v) || normalizeCodes(v).some(nv => variants.has(nv)));
}

/**
 * Multiple permission validation; `true` if any is satisfied
 * @param value Permission values
 * @returns `true` if has permission, otherwise `false`
 */
export function auths(value: Array<string>): boolean {
	if (isSuperAdmin()) return true;
	return value.some((v: string) => auth(v));
}

/**
 * Multiple permission validation; `true` only if all are satisfied
 * @param value Permission values
 * @returns `true` if has permission, otherwise `false`
 */
export function authAll(value: Array<string>): boolean {
	if (isSuperAdmin()) return true;
	const stores = BtnPermissionStore();
	return judementSameArr(value, stores.data) || value.every((v: string) => auth(v));
}