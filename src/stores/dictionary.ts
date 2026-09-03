import { defineStore } from 'pinia';
import { DictionaryStates } from './interface';
import { request } from '../utils/service';

export const urlPrefix = '/api/init/dictionary/';
export const BUTTON_VALUE_TO_COLOR_MAPPING: any = {
	1: 'success',
	true: 'success',
	0: 'danger',
	false: 'danger',
	Search: 'warning', // Query
	Update: 'primary', // Edit
	Create: 'success', // Create
	Retrieve: 'info', // Retrieve
	Delete: 'danger', // Delete
};

export function getButtonSettings(objectSettings: any) {
	return objectSettings.map((item: any) => ({
		label: item.label,
		value: item.value,
		color: item.color || BUTTON_VALUE_TO_COLOR_MAPPING[item.value],
	}));
}

/**
 * Dictionary management state
 * @methods getSystemDictionarys Fetch system dictionary data
 */
export const DictionaryStore = defineStore('Dictionary', {
	state: (): DictionaryStates => ({
		data: {},
	}),
	actions: {
		async getSystemDictionarys() {
			const ret: any = await request({
				url: '/api/init/dictionary/?dictionary_key=all',
				method: 'get',
			});
			this._processDictionaryData(ret.data);
		},
		setFromBootstrap(data: any) {
			this._processDictionaryData(data);
		},
		_processDictionaryData(dataList: any[]) {
			dataList.forEach((item: any) => {
				let childrens = item.children;
				childrens.forEach((children: any) => {
					switch (children.type) {
						case 1:
							children.value = Number(children.value)
							break
						case 6:
							children.value = children.value === 'true'
							break
					}
				})
				this.data[item.value] = childrens
			});
		},
	},
	persist: {
		enabled: true,
	},
});