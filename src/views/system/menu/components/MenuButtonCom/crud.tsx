import {AddReq, DelReq, EditReq, dict, CreateCrudOptionsRet, CreateCrudOptionsProps} from '@fast-crud/fast-crud';
import * as api from './api';
import {auth} from '/@/utils/authFunction'
import {request} from '/@/utils/service';
import { successNotification } from '/@/utils/message';
import { ElMessage } from 'element-plus';
import {i18n} from '/@/i18n';

const t = i18n.global.t;
// crudOptions configuration
export const createCrudOptions = function ({crudExpose, context}: CreateCrudOptionsProps): CreateCrudOptionsRet {
    const pageRequest = async () => {
        if (context!.selectOptions.value.id) {
            return await api.GetList({menu: context!.selectOptions.value.id} as any);
        } else {
            return undefined;
        }
    };
    const editRequest = async ({form, row}: EditReq) => {
        return await api.UpdateObj({...form, menu: row.menu});
    };
    const delRequest = async ({row}: DelReq) => {
        return await api.DelObj(row.id);
    };
    const addRequest = async ({form}: AddReq) => {
        return await api.AddObj({...form, ...{menu: context!.selectOptions.value.id}});
    };
    return {
        crudOptions: {
            pagination:{
                show:false
            },
            search: {
                container: {
                    action: {
                        // Button bar configuration
                        col: {
                            span: 8,
                        },
                    },
                },
            },
            actionbar: {
                buttons: {
                    add: {
                        show: auth('btn:Create')
                    },
                    batchAdd: {
						show: true,
						type: 'primary',
						text: t('message.pages.menu.buttons.batchGenerate'),
						click: async () => {
							if (context!.selectOptions.value.id == undefined) {
								ElMessage.error(t('message.pages.menu.buttons.selectMenu'));
								return;
							}
							const result = await api.BatchAdd({ menu: context!.selectOptions.value.id });
							if (result.code == 2000) {
								successNotification(result.msg);
								crudExpose.doRefresh();
							}
						},
					},
                },
            },
            rowHandle: {
                // Fixed right side
                fixed: 'right',
                width: 200,
                buttons: {
                    view: {
                        show: false,
                    },
                    edit: {
                        icon: '',
                        type: 'primary',
                        show: auth('btn:Update')
                    },
                    remove: {
                        show: auth('btn:Delete')
                    },
                },
            },
            request: {
                pageRequest,
                addRequest,
                editRequest,
                delRequest,
            },
            form: {
                col: {span: 24},
                labelWidth: '100px',
                wrapper: {
                    is: 'el-dialog',
                    width: '600px',
                },
            },
            columns: {
                _index: {
                    title: t('message.pages.menu.buttons.index'),
                    form: {show: false},
                    column: {
                        type: 'index',
                        align: 'center',
                        width: '70px',
                        columnSetDisabled: true, // Disabled in column settings
                    },
                },
                search: {
                    title: t('message.pages.menu.buttons.search'),
                    column: {show: false},
                    type: 'text',
                    search: {show: true},
                    form: {
                        show: false,
                        component: {
                            placeholder: t('message.pages.menu.buttons.searchPlaceholder'),
                        },
                    },
                },
                id: {
                    title: 'ID',
                    type: 'text',
                    column: {show: false},
                    search: {show: false},
                    form: {show: false},
                },
                name: {
                    title: t('message.pages.menu.buttons.permissionName'),
                    type: 'text',
                    search: {show: true},
                    column: {
                        minWidth: 120,
                        sortable: true,
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.menu.validation.permissionNameRequired')}],
                        component: {
                            placeholder: t('message.pages.menu.buttons.permissionNamePlaceholder'),
                            props: {
                                clearable: true,
                                allowCreate: true,
                                filterable: true,
                            },
                        },
                        helper: {
                            render() {
                                return <el-alert title={t('message.pages.menu.helpers.manualInputTitle')} type="warning"
                                                 description={t('message.pages.menu.helpers.manualInputDesc')}/>;
                            },
                        },
                    },
                },
                value: {
                    title: t('message.pages.menu.buttons.permissionValue'),
                    type: 'text',
                    search: {show: false},
                    column: {
                        width: 200,
                        sortable: true,
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.menu.validation.permissionValueRequired')}],
                        placeholder: t('message.pages.menu.buttons.permissionValuePlaceholder'),
                        helper: {
                            render() {
                                return <el-alert title={t('message.pages.menu.helpers.uniqueValueTitle')} type="warning"
                                                 description={t('message.pages.menu.helpers.uniqueValueDesc')}/>;
                            },
                        },
                    },
                },
                method: {
                    title: t('message.pages.menu.buttons.requestMethod'),
                    search: {show: false},
                    type: 'dict-select',
                    column: {
                        width: 120,
                        sortable: true,
                    },
                    dict: dict({
                        data: [
                            {label: 'GET', value: 0},
                            {label: 'POST', value: 1, color: 'success'},
                            {label: 'PUT', value: 2, color: 'warning'},
                            {label: 'DELETE', value: 3, color: 'danger'},
                        ],
                    }),
                    form: {
                        rules: [{required: true, message: t('message.pages.menu.validation.required')}],
                    },
                },
                api: {
                    title: t('message.pages.menu.buttons.apiEndpoint'),
                    search: {show: false},
                    type: 'dict-select',
                    dict: dict({
                        getData() {
                            return request({url: '/api/schema/'}).then((res: any) => {
                                const ret = Object.keys(res.paths);
                                const data = [];
                                for (const item of ret) {
                                    const obj: any = {};
                                    obj.label = item;
                                    obj.value = item;
                                    data.push(obj);
                                }
                                return data;
                            });
                        },
                    }),
                    column: {
                        minWidth: 250,
                        sortable: true,
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.menu.validation.required')}],
                        component: {
                            props: {
                                allowCreate: true,
                                filterable: true,
                                clearable: true,
                            },
                        },
                        helper: {
                            render() {
                                return <el-alert title={t('message.pages.menu.helpers.apiHelperTitle')}
                                                 type="warning"/>;
                            },
                        },
                    },
                },
            },
        },
    };
};
