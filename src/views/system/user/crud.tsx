import * as api from './api';
import {
    dict,
    UserPageQuery,
    AddReq,
    DelReq,
    EditReq,
    compute,
    CreateCrudOptionsProps,
    CreateCrudOptionsRet
} from '@fast-crud/fast-crud';
import {request} from '/@/utils/service';
import {dictionary} from '/@/utils/dictionary';
import {successMessage} from '/@/utils/message';
import {auth} from '/@/utils/authFunction';
import {SystemConfigStore} from "/@/stores/systemConfig";
import {storeToRefs} from "pinia";
import {computed} from "vue";
import { Md5 } from 'ts-md5';
import {commonCrudConfig} from "/@/utils/commonCrud";
import {i18n} from '/@/i18n';

const t = i18n.global.t;

export const createCrudOptions = function ({crudExpose}: CreateCrudOptionsProps): CreateCrudOptionsRet {
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

    const exportRequest = async (query: UserPageQuery) => {
        return await api.exportData(query)
    }

    const resetToDefaultPasswordRequest = async (row:EditReq)=>{
        await api.resetToDefaultPassword(row.id)
        successMessage(t('message.pages.user.dialog.resetPasswordSuccess'))
    }

    const systemConfigStore = SystemConfigStore()
    const {systemConfig} = storeToRefs(systemConfigStore)
    const getSystemConfig = computed(() => {
        // console.log(systemConfig.value)
        return systemConfig.value
    })


    return {
        crudOptions: {
            table: {
                remove: {
                    confirmMessage: t('message.pages.user.dialog.deleteConfirm'),
                },
            },
            request: {
                pageRequest,
                addRequest,
                editRequest,
                delRequest,
            },
            form: {
                initialForm: {
                    password: computed(() => {
                        return systemConfig.value['base.default_password']
                    }),
                }
            },
            actionbar: {
                buttons: {
                    add: {
                        show: auth('user:Create')
                    },
                    export: {
                        text: t('message.pages.user.buttons.export'),// Button text
                        title: t('message.pages.user.buttons.export'),// Hover tooltip
                        show: auth('user:Export'),
                        click() {
                            return exportRequest(crudExpose!.getSearchFormData())
                        }
                    }
                }
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
                        iconRight: 'Edit',
                        type: 'text',
                        show: auth('user:Update'),
                    },
                    remove: {
                        iconRight: 'Delete',
                        type: 'text',
                        show: auth('user:Delete'),
                    },
                    custom: {
                        text: t('message.pages.user.buttons.resetPassword'),
                        type: 'text',
                        show: auth('user:ResetPassword'),
                        tooltip: {
                            placement: 'top',
                            content: t('message.pages.user.buttons.resetPassword'),
                        },
                        //@ts-ignore
                        click: (ctx: any) => {
                            const {row} = ctx;
                            resetToDefaultPasswordRequest(row)
                        },
                    },
                },
            },
            columns: {
                _index: {
                    title: t('message.pages.user.table.columns.index'),
                    form: {show: false},
                    column: {
                        type: 'index',
                        align: 'center',
                        width: '70px',
                        columnSetDisabled: true, // Disabled in column settings
                    },
                },
                username: {
                    title: t('message.pages.user.table.columns.username'),
                    search: {
                        show: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 100, // Min column width
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {
                                required: true,
                                message: t('message.pages.user.validation.usernameRequired'),
                            },
                        ],
                        component: {
                            placeholder: t('message.pages.user.form.usernamePlaceholder'),
                        },
                    },
                },
                password: {
                    title: t('message.pages.user.form.password'),
                    type: 'password',
                    column: {
                        show: false,
                    },
                    editForm: {
                        show: false,
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {
                                required: true,
                                message: t('message.pages.user.validation.passwordRequired'),
                            },
                        ],
                        component: {

                            span: 12,
                            showPassword: true,
                            placeholder: t('message.pages.user.form.passwordPlaceholder'),
                        },
                    },
                    valueResolve({form}) {
                        if (form.password) {
                            form.password = Md5.hashStr(form.password)
                        }
                    }
                },
                name: {
                    title: t('message.pages.user.table.columns.name'),
                    search: {
                        show: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 100, // Min column width
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {
                                required: true,
                                message: t('message.pages.user.validation.nameRequired'),
                            },
                        ],
                        component: {
                            span: 12,
                            placeholder: t('message.pages.user.form.namePlaceholder'),
                        },
                    },
                },
                dept: {
                    title: t('message.pages.user.table.columns.dept'),
                    search: {
                        disabled: true,
                    },
                    type: 'dict-tree',
                    dict: dict({
                        isTree: true,
                        url: '/api/system/dept/all_dept/',
                        value: 'id',
                        label: 'name'
                    }),
                    column: {
                        minWidth: 150, // Min column width
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {
                                required: true,
                                message: t('message.pages.user.validation.deptRequired'),
                            },
                        ],
                        component: {
                            filterable: true,
                            placeholder: t('message.pages.user.form.deptPlaceholder'),
                            props: {
                                checkStrictly:true,
                                props: {
                                    value: 'id',
                                    label: 'name',
                                },
                            },
                        },
                    },
                },
                role: {
                    title: t('message.pages.user.table.columns.role'),
                    search: {
                        disabled: true,
                    },
                    type: 'dict-select',
                    dict: dict({
                        url: '/api/system/role/',
                        value: 'id',
                        label: 'name',
                    }),
                    column: {
                        minWidth: 100, // Min column width
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {
                                required: true,
                                message: t('message.pages.user.validation.roleRequired'),
                            },
                        ],
                        component: {
                            multiple: true,
                            filterable: true,
                            placeholder: t('message.pages.user.form.rolePlaceholder'),
                        },
                    },
                },
                mobile: {
                    title: t('message.pages.user.table.columns.mobile'),
                    search: {
                        show: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 120, // Min column width
                    },
                    form: {
                        rules: [
                            {
                                max: 20,
                                message: t('message.pages.user.validation.mobileInvalid'),
                                trigger: 'blur',
                            },
                            {
                                pattern: /^1[3-9]\d{9}$/,
                                message: t('message.pages.user.validation.mobileInvalid'),
                            },
                        ],
                        component: {
                            placeholder: t('message.pages.user.form.mobilePlaceholder'),
                        },
                    },
                },
                email: {
                    title: t('message.pages.user.table.columns.email'),
                    column: {
                        width: 260,
                    },
                    form: {
                        rules: [
                            {
                                type: 'email',
                                message: t('message.pages.user.validation.emailInvalid'),
                                trigger: ['blur', 'change'],
                            },
                        ],
                        component: {
                            placeholder: t('message.pages.user.form.emailPlaceholder'),
                        },
                    },
                },
                gender: {
                    title: t('message.pages.user.table.columns.gender'),
                    type: 'dict-select',
                    dict: dict({
                        data: dictionary('gender'),
                    }),
                    form: {
                        value: 1,
                        component: {
                            span: 12,
                        },
                    },
                    component: {props: {color: 'auto'}}, // Auto-coloring
                },
                user_type: {
                    title: t('message.pages.user.table.columns.userType'),
                    search: {
                        show: true,
                    },
                    type: 'dict-select',
                    dict: dict({
                        data: dictionary('user_type'),
                    }),
                    column: {
                        minWidth: 100, // Min column width
                    },
                    form: {
                        show: false,
                        value: 0,
                        component: {
                            span: 12,
                        },
                    },
                },
                is_active: {
                    title: t('message.pages.user.table.columns.status'),
                    search: {
                        show: true,
                    },
                    type: 'dict-radio',
                    column: {
                        component: {
                            name: 'fs-dict-switch',
                            activeText: '',
                            inactiveText: '',
                            style: '--el-switch-on-color: var(--el-color-primary); --el-switch-off-color: #dcdfe6',
                            onChange: compute((context) => {
                                return () => {
                                    api.UpdateObj(context.row).then((res: APIResponseData) => {
                                        successMessage(res.msg as string);
                                    });
                                };
                            }),
                        },
                    },
                    dict: dict({
                        data: dictionary('button_status_bool'),
                    }),
                },
                avatar: {
                    title: t('message.pages.user.table.columns.avatar'),
                    type: 'avatar-cropper',
                    form: {
                        show: false,
                    },
                    column: {
                        minWidth: 400, // Min column width
                    },
                },
                ...commonCrudConfig({
                    dept_belong_id: {
                        form: true,
                        table: true
                    }
                })
            },
        },
    };
};
