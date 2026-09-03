import * as api from './api';
import {
    UserPageQuery,
    AddReq,
    DelReq,
    EditReq,
    CreateCrudOptionsProps,
    CreateCrudOptionsRet,
    dict
} from '@fast-crud/fast-crud';
import {commonCrudConfig} from "/@/utils/commonCrud";
import {computed,shallowRef} from "vue";
import dvaSelect from "/@/components/dvaSelect/index.vue";
import { i18n } from '/@/i18n';
const t = i18n.global.t;
export const createCrudOptions = function ({
                                               crudExpose,
                                               isEcharts,
                                               initChart
                                           }: CreateCrudOptionsProps): CreateCrudOptionsRet {
    const pageRequest = async (query: UserPageQuery) => {
        return await api.GetList(query);
    };
    const editRequest = async ({form, row}: EditReq) => {
        form.id = row.id;
        return await api.UpdateObj(form);
    };
    const delRequest = async ({row}: DelReq) => {
        return await api.DelObj(row.id);
    };
    const addRequest = async ({form}: AddReq) => {
        return await api.AddObj(form);
    };
    return {
        crudOptions: {
            request: {
                pageRequest,
                addRequest,
                editRequest,
                delRequest,
            },
            actionbar: {
                buttons: {
                    add: {
                        show: true,
                    },
                    showEcharts: {
                        type: 'warning',
                        text: computed(() => {
                            return isEcharts.value ? '隐藏图表' : '显示图表'
                        }),
                        click: () => {
                            isEcharts.value = !isEcharts.value;
                        }
                    }
                },
            },
            rowHandle: {
                fixed: 'right',
                width: 100,
                buttons: {
                    view: {
                        type: 'text',
                    },
                    edit: {
                        show: false,
                    },
                    remove: {
                        show: false,
                    },
                },
            },
            columns: {
                _index: {
                    title: t('message.importExcel.sortNumber'),
                    form: {show: false},
                    column: {
                        //type: 'index',
                        align: 'center',
                        width: '70px',
                        columnSetDisabled: true, // Disabled in column settings
                        formatter: (context) => {
                            // Calculate sequence number, customizable rule, accumulates across pages
                            let index = context.index ?? 1;
                            let pagination = crudExpose!.crudBinding.value.pagination;
                            return ((pagination!.currentPage ?? 1) - 1) * pagination!.pageSize + index + 1;
                        },
                    },
                },
                search: {
                    title: t('message.importExcel.keywordLabel'),
                    column: {
                        show: false,
                    },
                    search: {
                        show: true,
                        component: {
                            props: {
                                clearable: true,
                            },
                            placeholder: t('message.inputKeyword'),
                        },
                    },
                    form: {
                        show: false,
                        component: {
                            props: {
                                clearable: true,
                            },
                        },
                    },
                },
                username: {
                    title: t('message.testCustomComponent'),
                    dict:dict({
                        url({form}){
                            return  '/api/system/role/'
                        },
                        label:'name',
                        value:'id'
                        }),
                    form: {
                        component: {
                            // Local reference to sub-table, must be wrapped with shallowRef
                            name: shallowRef(dvaSelect),
                        }
                    }
                },
                // username: {
                //     title: 'Login Username',
                //     search: {
                //         disabled: false,
                //     },
                //     type: 'input',
                //     column: {
                //         minWidth: 120,
                //     },
                //     form: {
                //         disabled: true,
                //         component: {
                //             placeholder: 'Please enter login username',
                //         },
                //     },
                // },
                ip: {
                    title: t('message.loginIp'),
                    search: {
                        disabled: false,
                    },
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        disabled: true,
                        component: {
                            placeholder: t('message.pleaseInputLoginIp'),
                        },
                    },
                },
                isp: {
                    title: t('message.operatorCompany'),
                    search: {
                        disabled: true,
                    },
                    disabled: true,
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputOperator'),
                        },
                    },
                },
                continent: {
                    title: t('message.continent'),
                    type: 'input',
                    column: {
                        minWidth: 90,
                    },
                    form: {
                        disabled: true,
                        component: {
                            placeholder: t('message.pleaseInputContinent'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                country: {
                    title: t('message.country'),
                    type: 'input',
                    column: {
                        minWidth: 90,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputCountry'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                province: {
                    title: t('message.province'),
                    type: 'input',
                    column: {
                        minWidth: 80,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputProvince'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                city: {
                    title: t('message.city'),
                    type: 'input',
                    column: {
                        minWidth: 80,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputCity'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                district: {
                    title: t('message.countyDistrict'),
                    key: '',
                    type: 'input',
                    column: {
                        minWidth: 80,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputCountyDistrict'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                area_code: {
                    title: t('message.areaCode'),
                    type: 'input',
                    column: {
                        minWidth: 90,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputAreaCode'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                country_english: {
                    title: t('message.englishFullName'),
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputEnglishFullName'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                country_code: {
                    title: t('message.shortName'),
                    type: 'input',
                    column: {
                        minWidth: 100,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputShortName'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                longitude: {
                    title: t('message.longitude'),
                    type: 'input',
                    disabled: true,
                    column: {
                        minWidth: 100,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputLongitude'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                latitude: {
                    title: t('message.latitude'),
                    type: 'input',
                    disabled: true,
                    column: {
                        minWidth: 100,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputLatitude'),
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                login_type: {
                    title: t('message.loginType'),
                    type: 'dict-select',
                    search: {
                        disabled: false,
                    },
                    dict: dict({
                        data: [
                            {label: '普通登录', value: 1},
                            {label: '微信扫码登录', value: 2},
                        ],
                    }),
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseSelectLoginType'),
                        },
                    },
                },
                os: {
                    title: t('message.operatingSystem'),
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputOs'),
                        },
                    },
                },
                browser: {
                    title: t('message.browserName'),
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputBrowserName'),
                        },
                    },
                },
                agent: {
                    title: t('message.agentInfo'),
                    disabled: true,
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        component: {
                            placeholder: t('message.pleaseInputAgentInfo'),
                        },
                    },
                },
                ...commonCrudConfig({
                    create_datetime: {
                        search: true
                    }
                })
            },
        },
    };
};
