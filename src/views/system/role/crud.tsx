import {CrudOptions, AddReq, DelReq, EditReq, dict, CrudExpose, compute} from '@fast-crud/fast-crud';
import * as api from './api';
import {dictionary} from '/@/utils/dictionary';
import {columnPermission} from '../../../utils/columnPermission';
import {successMessage} from '../../../utils/message';
import {auth} from '/@/utils/authFunction'
import {i18n} from '/@/i18n';
const t = i18n.global.t;

interface CreateCrudOptionsTypes {
    output: any;
    crudOptions: CrudOptions;
}

// crudOptions configuration
export const createCrudOptions = function ({
                                               crudExpose,
                                               rolePermission,
                                               handleDrawerOpen,
                                               handlePermCodeOpen,
                                           }: {
    crudExpose: CrudExpose;
    rolePermission: any;
    handleDrawerOpen: Function;
    handlePermCodeOpen: Function;
}): CreateCrudOptionsTypes {
    const pageRequest = async (query: any) => {
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

    // Permission check

    // @ts-ignore
    // @ts-ignore
    return {
        crudOptions: {
            request: {
                pageRequest,
                addRequest,
                editRequest,
                delRequest,
            },
            pagination: {
                show: true
            },
            actionbar: {
                buttons: {
                    add: {
                        show: auth('role:Create')
                    }
                }
            },
            rowHandle: {
                // Fixed right side
                fixed: 'right',
                width: 320,
                buttons: {
                    view: {
                        show: true,
                    },
                    edit: {
                        show: auth('role:Update'),
                    },
                    remove: {
                        show: auth('role:Delete'),
                    },
                    permission: {
                        type: 'primary',
                        text: t('message.pages.role.dialog.menuPermission'),
                        show: auth('role:Permission'),
                        tooltip: {
                            placement: 'top',
                            content: t('message.pages.role.dialog.menuPermissionConfig'),
                        },
                        click: (context: any): void => {
                            const {row} = context;
                            handleDrawerOpen(row);
                        },
                    },
                    perm_code: {
                        type: 'warning',
                        text: t('message.pages.role.dialog.interfacePermission'),
                        show: auth('role:Permission'),
                        tooltip: {
                            placement: 'top',
                            content: t('message.pages.role.dialog.interfacePermissionCodeConfig'),
                        },
                        click: (context: any): void => {
                            const {row} = context;
                            handlePermCodeOpen(row);
                        },
                    },
                },
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
                    title: t('message.pages.role.table.columns.index'),
                    form: {show: false},
                    column: {
                        type: 'index',
                        align: 'center',
                        width: '70px',
                        columnSetDisabled: true, // Disabled in column settings
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
                    title: t('message.pages.role.table.columns.name'),
                    type: 'text',
                    search: {show: true},
                    column: {
                        minWidth: 120,
                        sortable: 'custom',
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.role.validation.nameRequired')}],
                        component: {
                            placeholder: t('message.pages.role.form.namePlaceholder'),
                        },
                    },
                },
                key: {
                    title: t('message.pages.role.table.columns.key'),
                    type: 'text',
                    search: {show: false},
                    column: {
                        minWidth: 120,
                        sortable: 'custom',
                        columnSetDisabled: true,
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.role.validation.keyRequired')}],
                        component: {
                            placeholder: t('message.pages.role.form.keyPlaceholder'),
                        },
                    },
                    valueBuilder(context) {
                        const {row, key} = context
                        return row[key]
                    }
                },
                sort: {
                    title: t('message.pages.role.table.columns.sort'),
                    search: {show: false},
                    type: 'number',
                    column: {
                        minWidth: 90,
                        sortable: 'custom',
                    },
                    form: {
                        rules: [{required: true, message: t('message.pages.role.validation.sortRequired')}],
                        value: 1,
                    },
                },
                status: {
                    title: t('message.pages.role.table.columns.status'),
                    search: {show: true},
                    type: 'dict-radio',
                    column: {
                        width: 100,
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
                }
            },
        },
    };
};
