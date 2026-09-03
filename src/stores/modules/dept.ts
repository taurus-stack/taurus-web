import {defineStore} from "pinia";
import {request} from "/@/utils/service";
import XEUtils from "xe-utils";
import {toRaw} from 'vue'
export const useDeptInfoStore = defineStore('deptInfo', {
    state:()=>(
        {
            list:[],
            tree:[],
        }
    ),
    actions:{
      async requestDeptInfo() {
            const ret = await request({
                url: '/api/system/dept/all_dept/'
            })
            this._processDeptData(ret.data);
        },
        setFromBootstrap(data: any) {
            this._processDeptData(data);
        },
        _processDeptData(data: any[]) {
            this.list = data;
            this.tree = XEUtils.toArrayTree(data, {parentKey:'parent', strict:true});
        },
        async getDeptById(id:any){

        },
        async getParentDeptById(id: any){
            const tree = toRaw(this.tree)
            const obj =  XEUtils.findTree(tree, item => item.id == id)
            return  obj
        }
    }
})