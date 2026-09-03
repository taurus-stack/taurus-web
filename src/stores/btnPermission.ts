import {defineStore} from "pinia";
import {DictionaryStates} from "/@/stores/interface";
import {request} from "/@/utils/service";

export const BtnPermissionStore = defineStore('BtnPermission', {
    state: (): DictionaryStates => ({
        data: []
    }),
    actions: {
        async getBtnPermissionStore() {
            const ret: any = await request({
                url: '/api/system/menu_button/menu_button_all_permission/',
                method: 'get',
            });
            this.data = ret.data;
        },
        setFromBootstrap(data: any) {
            this.data = data;
        },
    },
    persist: {
        enabled: true,
    },
});