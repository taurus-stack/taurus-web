import {defineStore} from "pinia";
import {GetList, AddObj, DelObj, GetObj, UpdateObj} from "/@/api/taurus/template/api";


export default defineStore('template', {
    state: () => ({
        template_id: 0,
        template_name: '',
        script_content: '',
        script_type: '',
        timeout: 0,
        envs: '',
        args: '',
        run_as: '',
        editor_theme: '',
        status: 0,
        share: false,
        template_list: [],
        template_list_total: 0,
        template_list_loading: false,
        template_list_search: '',
        template_list_page: 1,
    }),
    getters: {},
    actions: {
        async getList(query: any) {
            this.template_list_loading = true;
            const res = await GetList(query);
            this.template_list = res.data.results;
            this.template_list_total = res.data.count;
            this.template_list_loading = false;
        },
        async getObj(id: number) {
            return await GetObj(id);
        },
        async addObj(obj: any) {
            return await AddObj(obj);
        },
        async updateObj(obj: any) {
            return await UpdateObj(obj);
        },
        async delObj(id: number) {
            return await DelObj(id);
        },
    }
})