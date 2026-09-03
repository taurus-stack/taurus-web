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
import {dictionary} from '/@/utils/dictionary';
import {successMessage} from '/@/utils/message';
import {auth} from "/@/utils/authFunction";
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

    /**
     * Lazy loading
     * @param row
     * @returns {Promise<unknown>}
     */
    const loadContentMethod = (tree: any, treeNode: any, resolve: Function) => {
        pageRequest({pcode: tree.code}).then((res: APIResponseData) => {
            resolve(res.data);
        });
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
                        show: auth('area:Create'),
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
						show: auth('area:Update')
                    },
                    remove: {
                        iconRight: 'Delete',
                        type: 'text',
						show: auth('area:Delete')
                    },
                },
            },
            pagination: {
                show: false,
            },
            table: {
                rowKey: 'id',
                lazy: true,
                load: loadContentMethod,
                treeProps: {children: 'children', hasChildren: 'hasChild'},
            },
            columns: {
                _index: {
                    title: t('message.pages.areas.table.columns.index'),
                    form: {show: false},
                    column: {
                        type: 'index',
                        align: 'center',
                        width: '70px',
                        columnSetDisabled: true, // Disabled in column settings
                    },
                },
                // pcode: {
                // 	title: 'Parent Area',
                // 	show: false,
                // 	search: {
                // 		show: true,
                // 	},
                // 	type: 'dict-tree',
                // 	form: {
                // 		component: {
                // 			showAllLevels: false, // Show only the last level
                // 			props: {
                // 				elProps: {
                // 					clearable: true,
                // 					showAllLevels: false, // Show only the last level
                // 					props: {
                // 						checkStrictly: true, // Selection does not need to reach the last level
                // 						emitPath: false,
                // 						clearable: true,
                // 					},
                // 				},
                // 			},
                // 		},
                // 	},
                // },
                name: {
                    title: t('message.pages.areas.table.columns.name'),
                    search: {
                        show: true,
                    },
                    treeNode: true,
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {required: true, message: t('message.pages.areas.validation.nameRequired')},
                        ],
                        component: {
                            placeholder: t('message.pages.areas.form.namePlaceholder'),
                        },
                    },
                },
                code: {
                    title: t('message.pages.areas.table.columns.code'),
                    search: {
                        show: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 90,
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {required: true, message: t('message.pages.areas.validation.codeRequired')},
                        ],
                        component: {
                            placeholder: t('message.pages.areas.form.codePlaceholder'),
                        },
                    },
                },
                pinyin: {
                    title: t('message.pages.areas.table.columns.pinyin'),
                    search: {
                        disabled: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 120,
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {required: true, message: t('message.pages.areas.validation.pinyinRequired')},
                        ],
                        component: {
                            placeholder: t('message.pages.areas.form.pinyinPlaceholder'),
                        },
                    },
                },
                level: {
                    title: t('message.pages.areas.table.columns.level'),
                    search: {
                        disabled: true,
                    },
                    type: 'input',
                    column: {
                        minWidth: 100,
                    },
                    form: {
                        disabled: false,
                        rules: [
                            // Form validation rules
                            {required: true, message: t('message.pages.areas.validation.levelRequired')},
                        ],
                        component: {
                            placeholder: t('message.pages.areas.form.levelPlaceholder'),
                        },
                    },
                },
                initials: {
                    title: t('message.pages.areas.table.columns.initials'),
                    column: {
                        minWidth: 100,
                    },
                    form: {
                        rules: [
                            // Form validation rules
                            {required: true, message: t('message.pages.areas.validation.initialsRequired')},
                        ],

                        component: {
                            placeholder: t('message.pages.areas.form.initialsPlaceholder'),
                        },
                    },
                },
                enable: {
                    title: t('message.pages.areas.table.columns.enable'),
                    search: {
                        show: true,
                    },
                    type: 'dict-radio',
                    column: {
                        minWidth: 90,
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
            },
        },
    };
};
