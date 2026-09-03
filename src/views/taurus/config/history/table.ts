import {dict} from "@fast-crud/fast-crud";
import {commonCrudConfig} from "/@/utils/commonCrud";
import {auth} from "/@/utils/authFunction";
import {actionbar, rowHandle} from "/@/views/taurus/config/utils/common";
import {GetObj} from "/@/api/taurus/record/api";
import { i18n } from '/@/i18n';
const t = i18n.global.t;

const common_columns = {
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
    id: {
        title: 'ID',
        type: 'input',
        column: {},
        form: {
            disabled: true,
            show: false,
        }
    },
    seq: {
        title: t('message.importExcel.sortNumber'),
        type: 'input',
        column: {},
        form: {
            show: false,
            component: {
                placeholder: t('message.importExcel.pleaseInputSerialNo'),
            },
        },
    },
    uuid: {
        title: 'UUID',
        type: 'input',
        column: {},
        form: {
            show: false,
            component: {
                placeholder: t('message.pleaseInputUuid'),
            },
        },
    },
    host_ip: {
        title: t('message.hostIpLower'),
        search: {
            show: true,
            component: {
                clearable: true,
            }
        },
        type: 'input',
        column: {},
        form: {
            rules: [{required: true, message: t('message.pleaseInputHostIpMark'), trigger: 'blur'}],
            disabled: true,
            component: {
                placeholder: t('message.pleaseInputHostIp'),
                clearable: true,
            },
        },
    },
    host_id: {
        title: t('message.hostId'),
        search: {
            show: false,
            component: {
                clearable: true,
            }
        },
        disabled: true,
        type: 'input',
        column: {
            show: false,
            minWidth: 120,
        },
    },
    // username: {
    //     title: 'Username',
    //     type: 'input',
    //     column: {
    //         show:false,
    //         minWidth: 80,
    //     },
    //     form: {
    //         component: {
    //             placeholder: 'Enter username',
    //         },
    //     },
    //     component: {props: {color: 'auto'}}, // Auto-colorize
    // },
    template_name: {
        title: t('message.templateName'),
        type: 'input',
        search: {
            show: true,
            component: {
                clearable: true,
            }
        },
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputTplName'),
            },
        },
        component: {props: {color: 'auto'}}, // Auto-colorize
    },
    template_id: {
        title: t('message.templateId'),
        type: 'input',
        column: {
            show: false,
            minWidth: 120,
        },
        form: {
            component: {
                placeholder: t('message.pleaseInputTemplateId'),
            },
        },
    },
    script_type: {
        title: t('message.scriptType'),
        type: 'dict-select',
        column: {
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseSelectScriptType'),
            },
        },
        dict: dict({
            value: 'id',
            label: 'text',
            data: [
                {id: 'shell', text: 'shell'},
                {id: 'python', text: 'python'},
            ]
        }),
    },
    script_content: {
        title: t('message.scriptContent'),
        type: 'textarea',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputScriptContent'),
            },
        },
    },
    run_as: {
        title: t('message.importExcel.execUser'),
        type: 'input',
        column: {
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputExecUser'),
            },
        },
    },
    start_datetime: {
        title: t('message.startTime'),
        type: 'datetime',
        column: {
            minWidth: 120,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseSelectStartTime'),
            },
        },
    },
    end_datetime: {
        title: t('message.endTime'),
        type: 'datetime',
        column: {
            minWidth: 120,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseSelectEndTime'),
            },
        },
    },
    return_code: {
        title: t('message.importExcel.returnCode'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputReturnCode'),
            },
        },
    },
    args: {
        title: t('message.parameter'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputParam'),
            },
        },
    },
    timeout: {
        title: t('message.timeout'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.pleaseInputTimeout'),
            },
        },
    },
    stdin: {
        title: t('message.input'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputInput'),
            },
        },
    },
    stdout: {
        title: t('message.output'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputOutput'),
            },
        },
    },
    stderr: {
        title: t('message.error'),
        type: 'input',
        column: {
            show: false,
            minWidth: 80,
        },
        form: {
            component: {
                placeholder: t('message.importExcel.pleaseInputError'),
            },
        },
    },
    status: {
        title: t('message.colStatus'),
        search: {
            show: true,
            component: {
                clearable: true,
            }
        },
        dict: dict({
            value: 'value',
            label: 'text',
            data: [
                {
                    value: 0,
                    text: t('message.statusSuccess'),
                    color: 'primary'
                },
                {
                    value: 1,
                    text: t('message.statusFailed'),
                    color: 'danger'
                },
                {
                    value: 2,
                    text: t('message.statusTimeout'),
                    color: 'warning'
                },
                {
                    value: 3,
                    text: t('message.statusCancelled'),
                    color: 'info'
                },
                {
                    value: 4,
                    text: t('message.statusRunning'),
                    color: 'success'
                },
                {
                    value: 5,
                    text: t('message.statusException'),
                    color: 'danger'
                }
            ]
        }),
        type: 'dict-select',
        column: {
            minWidth: 80,
        },
    },
    archive: {
        title: t('message.archive'),
        type: 'dict-select',
        dict: dict({
            value: 'value',
            label: 'text',
            data: [
                {
                    value: false,
                    text: t('message.noLabel'),
                    color: 'primary'
                },
                {
                    value: true,
                    text: t('message.yesLabel'),
                    color: 'danger'
                }
            ]
        }),
        column: {
            show: false,
            minWidth: 80,
        }
    },
    ...commonCrudConfig({
        'create_datetime': {
            table: false,
        }
    })
}
const common_forms = {
    form: {},
    addForm: {},
    editForm: {},
    searchForm: {},
    viewForm: {}
}

const common_tabs = {}

export const myTemplateConfig = {
    request: {},
    actionbar: actionbar(false, auth('history:Edit'), auth('history:Del')),
    rowHandle: rowHandle(true, false, false, true),
    columns: {
        ...common_columns,
    },
    form: {
        ...common_forms.form,
    },
    search: {},
    viewForm: {
        ...common_forms.viewForm,
    },
    editForm: {
        ...common_forms.editForm,
    },
    tabs: {
        ...common_tabs,
    },
    table: {},
    pagination: {},
    container: {},
    settings: {}
}

export const templateListConfig = {
    request: {},
    actionbar: actionbar(false, auth('history:Edit'), auth('history:Del')),
    rowHandle: rowHandle(true, false, false, true),
    columns: {
        ...common_columns,
    },
    form: {
        ...common_forms.form,
    },
    search: {},
    viewForm: {
        ...common_forms.viewForm,
    },
    editForm: {
        ...common_forms.editForm,
    },
    tabs: {
        ...common_tabs,
    },
    table: {},
    pagination: {},
    container: {},
    settings: {}
}

export const historyByStausConfig = {
    request: {},
    actionbar: actionbar(false, auth('history:Edit'), auth('history:Del')),
    rowHandle: {
        minWidth: 200,
        fixed: 'right',
        buttons: {
            view: {
                show: true,
                type: 'default',
                buttonProps: {
                    text: true,
                    type: 'default',
                    size: 'default',
                },
            },
            remove: {
                show: true,
                type: 'danger',
                buttonProps: {
                    type: 'danger',
                    size: 'default',
                    text: true,
                },
            },
            rerun: {
                show: ({ row }: any) => !row._isBatch,
                text: ({ row }: any) => t('message.rerun'),
                type: 'primary',
                buttonProps: {
                    text: true,
                    type: 'primary',
                    size: 'small',
                },
                click: ({ row }: any) => {
                    // Re-run logic will be implemented in the component
                },
            },
            rerunFailed: {
                show: ({ row }: any) => row._isBatch && row.record_details.some((item: any) => item.status === 1),
                text: '重新执行失败的',
                type: 'success',
                buttonProps: {
                    text: true,
                    type: 'success',
                    size: 'small',
                },
                click: ({ row }: any) => {
                    // Logic for re-running failed tasks will be implemented in the component
                },
            },
        },
    },
    columns: {
        $expand: {
            title: t('message.importExcel.expand'),
            form: { show: false },
            column: {
                type: "expand",
                align: "center",
                minWidth: "55px",
                columnSetDisabled: true // Disallow selection in column settings
            },
            order: -2,
        },
        ...common_columns,


    },
    form: {
        ...common_forms.form,
    },
    search: {},
    viewForm: {
        ...common_forms.viewForm,
    },
    editForm: {
        ...common_forms.editForm,
    },
    tabs: {
        show: true,
        name: 'status',
        type: "card", // Tabs type
        defaultOption: {
            // Show on first tab page
            show: true,
            value: "all", // Query value when clicking first tab
            label: t('message.tabAll') // Name of first tab
        }
    },
    table: {
        lazy: true,
        load: async (row: any, treeNode: any, resolve: (data: any[]) => void) => {
            const obj = await GetObj(row.id);
            resolve([...obj.record_details]);
        }
    },
    pagination: {},
    container: {},
    settings: {}
}