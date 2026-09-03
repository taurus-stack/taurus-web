import { defineStore } from 'pinia'
import {GetList, GetObj, AddObj, UpdateObj, DelObj} from "/@/api/taurus/host/api";

export default defineStore({
    id: 'host',
    state: () => {
        return {
            host_list: [],
            host_list_total: 0,
            host_list_loading: false,
            host_list_query: {
                page: 1,
                limit: 20,
                keyword: '',
                order_by: '',
                order_type: '',
                status: '',
                online_status: '',
                host_type: '',
                host_name: '',
                host_ip: '',
                host_username: '',
            },
            host_list_search: '',
            host_list_page: 1,
            host_list_order_by: '',
        }
    },
    actions: {
        async getList(query: any) {
            this.host_list_loading = true;
            const res = await GetList(query);
            this.host_list = res.data.results;
            this.host_list_total = res.data.count;
            this.host_list_loading = false;
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
        }
    }
})