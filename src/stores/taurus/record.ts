import {defineStore} from 'pinia'
import {getList, getObj, addObj, updateObj, delObj} from '/@/api/taurus/record'

export default defineStore('record', {
    state: () => ({
        record_list: [],
        record_list_total: 0,
        record_list_loading: false,
        record_list_search: '',
        record_list_page: 1,
        record_list_loading_text: '',
        record_list_page_size: 10,
        record_list_sort_by: 'id',
        record_list_sort_order: 'descending',
    }),
    actions: {
        async getList(query: any) {
            this.record_list_loading = true;
            const res = await getList(query);
            this.record_list = res.data.results;
            this.record_list_total = res.data.count;
            this.record_list_loading = false;
            return res;
        },
        async getObj(id: number) {
            return await getObj(id);
        },
        async addObj(obj: any) {
            return await addObj(obj);
        },
        async updateObj(obj: any) {
            return await updateObj(obj);
        },
        async delObj(id: number) {
            return await delObj(id);
        },
    }
})