import {defineStore} from "pinia";
import {GetList, AddObj, DelObj, GetObj, UpdateObj, GetSteps, AddStep, UpdateStep, DeleteStep} from "../../api/taurus/workflow/api";

export default defineStore('workflow', {
    state: () => ({
        workflow_list: [],
        workflow_list_total: 0,
        workflow_list_loading: false,
        current_workflow: null as any,
        current_steps: [] as any[],
    }),
    actions: {
        async getList(query: any) {
            this.workflow_list_loading = true;
            const res = await GetList(query);
            this.workflow_list = res.data.results;
            this.workflow_list_total = res.data.count;
            this.workflow_list_loading = false;
            return res;
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
        async getSteps(id: number) {
            const res = await GetSteps(id);
            this.current_steps = res.data;
            return res;
        },
        async addStep(id: number, data: any) {
            return await AddStep(id, data);
        },
        async updateStep(id: number, data: any) {
            return await UpdateStep(id, data);
        },
        async deleteStep(id: number, stepId: number) {
            return await DeleteStep(id, stepId);
        },
    }
})
