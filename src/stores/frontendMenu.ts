import {defineStore} from 'pinia';
import {FrontendMenu} from './interface';
import {Session} from '/@/utils/storage';
import {request} from '../utils/service';
import XEUtils from "xe-utils";
import {RouteRecordRaw} from "vue-router";
import {useKeepALiveNames} from "/@/stores/keepAliveNames";
import pinia from "/@/stores/index";
import { dynamicImport } from '/@/router/dynamicViews';

export const handleMenu = (menuData: Array<any>) => {
    const frameInRoutes:Array<any> = []
    const frameOutRoutes:Array<any> = []
    const cacheList:Array<any> = []
    const handleMeta = (item: any) => {
        item.path = item.web_path
        item.meta = {
            title: item.title,
            isLink: item.link_url,
            isHide: !item.visible,
            isKeepAlive: item.cache,
            isAffix: item.is_affix,
            isIframe: item.is_iframe,
            roles: ['admin'],
            icon: item.icon
        }
        item.component = dynamicImport(item.component as string)
        if(item.is_catalog){
            item.component = dynamicImport('layout/routerView/parent')
        }
        if(item.is_link){
            item.meta.isIframe = !item.is_iframe
            if(item.is_iframe){
                item.component = dynamicImport('layout/routerView/link')
            }else {
                item.component = dynamicImport('layout/routerView/iframes')
            }
        }else{
            if(item.is_iframe){
                const route = JSON.parse(JSON.stringify(item))
                route.meta.isLink = ''
                route.path = `${item.web_path}`
                route.name =  `${item.name}`
                route.meta.isIframe = true
                route.meta.isKeepAlive = false
                route.meta.isIframeOpen = true
                route.component = item.component
                frameOutRoutes.push(route)
                item.path = `${item.web_path}FrameOut`
                item.name =  `${item.name}FrameOut`
                item.meta.isLink = item.web_path
                item.meta.isIframe = !item.is_iframe
                item.component = dynamicImport('layout/routerView/link.vue')
            }
        }
        item.children && handleMeta(item.children);
        if (item.meta.isKeepAlive && item.meta.isKeepAlive && item.component_name != "") {
            cacheList.push(item.name);
        }
        return item
    }
    menuData.forEach((val) => {
        frameInRoutes.push(handleMeta(val))
    })
    const stores = useKeepALiveNames(pinia);
    stores.setCacheKeepAlive(cacheList);
    const validIds = new Set(frameInRoutes.map((i) => i.id));
    const validRoutes = frameInRoutes.filter((i) => !i.parent || validIds.has(i.parent));
    const data = XEUtils.toArrayTree(validRoutes, {
        parentKey: 'parent',
        strict: true,
    })
    const dynamicRoutes = [
        {
            path: '/home', name: 'home',
            component: dynamicImport('/system/home/index'),
            meta: {
                title: 'message.router.home',
                isLink: '',
                isHide: false,
                isKeepAlive: true,
                isAffix: true,
                isIframe: false,
                roles: ['admin'],
                icon: 'iconfont icon-shouye'
            }
        },
        ...data
    ]
    return {frameIn:dynamicRoutes,frameOut:frameOutRoutes}
}

export const useFrontendMenuStore = defineStore('frontendMenu',{
    state: (): FrontendMenu => ({
        arrayRouter: [],
        treeRouter: [],
        frameInRoutes:[],
        frameOutRoutes:[]
    }),
    actions:{
        async requestMenu(){
           return  request({
                url: '/api/system/menu/web_router/',
                method: 'get',
                params:{},
            }).then((res:any)=>{
                return res.data
           });
        },
        async handleRouter(){
            const menuData = await this.requestMenu();
            this.arrayRouter = menuData
            const {frameIn,frameOut} = handleMenu(menuData);
            this.treeRouter = [...frameIn,...frameOut]
            this.frameInRoutes=frameIn
            this.frameOutRoutes=frameOut
        },
        async getRouter(){
            await this.handleRouter()
            return {
                frameInRoutes:this.frameInRoutes,
                frameOutRoutes:this.frameOutRoutes,
                treeRouter:this.treeRouter
            }
        }
    }
})