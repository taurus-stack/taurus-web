import {
    dict,
    compute,
    ScopeContext
} from "@fast-crud/fast-crud";
import {auth} from "/@/utils/authFunction";
import {actionbar, rowHandle} from "/@/views/taurus/config/utils/common";
import EnvEditor from "/@/views/taurus/ops/script/components/Environment/index.vue"
import {VAceEditor} from "vue3-ace-editor";
import ArgEditor from "/@/views/taurus/ops/script/components/ScriptArgument/index.vue"
import {shallowRef} from "vue";
import { i18n } from '/@/i18n';

import "ace-builds/src-noconflict/theme-github_light_default"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-github_dark"
import "ace-builds/src-noconflict/mode-python"
import "ace-builds/src-noconflict/snippets/python"
import "ace-builds/src-noconflict/mode-sh"
import "ace-builds/src-noconflict/snippets/sh"
import "ace-builds/src-noconflict/ext-prompt"
import "ace-builds/src-noconflict/ext-inline_autocomplete"

const t = i18n.global.t;

const common_columns = {
    search: {
        title: t('message.pages.template.table.columns.keyword'),
        column: {
            show: false,
        },
        search: {
            show: true,
            component: {
                props: {
                    clearable: true,
                },
                placeholder: t('message.pages.template.form.keywordPlaceholder'),
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
        title: t('message.pages.template.table.columns.id'),
        type: 'input',
        column: {},
        form: {
            disabled: true,
            show: false,
        }
    },
    template_name: {
        title: t('message.pages.template.table.columns.templateName'),
        type: 'input',
        column: {},
        form: {
            rules: [{required: true, message: t('message.pages.template.form.templateNameRequired'), trigger: 'blur'}],
            component: {
                placeholder: t('message.pages.template.form.templateNamePlaceholder'),
            },
        },
    },
    share: {
        title: t('message.pages.template.table.columns.share'),
        type: 'dict-radio',
        dict: dict({
            value: 'value',
            label: 'text',
            data: [
                {
                    value: false,
                    text: t('message.pages.template.dict.share.no'),
                    color: 'primary'
                },
                {
                    value: true,
                    text: t('message.pages.template.dict.share.yes'),
                    color: 'danger'
                }
            ]
        }),
        column: {
            show: true,
        },
        form: {
            value: false,
        }
    },
    script_type: {
        title: t('message.pages.template.table.columns.scriptType'),
        type: 'dict-radio',
        dict: dict({
            value: 'value',
            label: 'text',
            data: [
                {
                    value: 'sh',
                    text: t('message.pages.template.dict.scriptType.shell'),
                    color: 'primary'
                },
                {
                    value: 'python',
                    text: t('message.pages.template.dict.scriptType.python'),
                    color: 'danger'
                }
            ]
        }),
        column: {
            show: true,
        },
        form: {
            value: 'sh',
        },
        addForm: {},
        editForm: {}
    },
    editor_theme: {
        title: t('message.pages.template.table.columns.editorTheme'),
        type: 'dict-radio',
        dict: dict({
            value: 'value',
            label: 'label',
            data: [
                {
                    value: 'github_light_default',
                    label: t('message.pages.template.dict.editorTheme.light'),
                    color: 'primary'
                },
                {
                    value: 'github_dark',
                    label: t('message.pages.template.dict.editorTheme.dark'),
                    color: 'danger'
                },
            ]
        }),
        column: {
            show: false,
        },
        form: {
            value: 'github_light_default',
        }
    },
    script_content: {
        title: t('message.pages.template.table.columns.scriptContent'),
        type: 'textarea',
        column: {
            show: false,
        },
        form: {
            col: {
                span: 24,
            },
            component: {
                name: VAceEditor,
                vModel: 'value',
                lang: compute(({row, form}) => {
                    return form.script_type
                }),
                theme: compute(({row, form}) => {
                    return form.editor_theme
                }),
                style: {
                    height: '500px'
                },
                options: {
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 4,
                    fontSize: 16,
                }
            },
            value: '',
        },
    },

    args: {
        title: t('message.pages.template.table.columns.args'),
        type: 'textarea',
        column: {
            show: false,
        },
        form: {
            component: {
                name: shallowRef(ArgEditor),
                vModel: 'args',
            },
            valueBuilder(context: any) {
                context.form.args = JSON.parse(context.row.args)
            },
            valueResolve(context: any) {
                context.form.args = JSON.stringify(context.form.args)
            },
            value: "\[\]",
        },
    },
    envs: {
        title: t('message.pages.template.table.columns.envs'),
        type: 'textarea',
        row: 10,
        column: {
            show: false,
        },
        form: {
            component: {
                name: shallowRef(EnvEditor),
                vModel: 'modelValue',
            },
            value: "\[\]",
        },

        viewForm: {
            show: true,
        },
    },

    timeout: {
        title: t('message.pages.template.table.columns.timeout'),
        type: 'number',
        column: {
            show: true,
        },
        form: {
            rules: [{required: true, message: t('message.pages.template.form.timeoutRequired'), trigger: 'blur'}],
            component: {
                placeholder: t('message.pages.template.form.timeoutPlaceholder'),
                slots: {
                    suffix: () => {
                        return t('message.pages.template.form.timeoutSuffix')
                    }
                }
            },
            value: 0,
        },
    },
    status: {
        title: t('message.pages.template.table.columns.status'),
        type: 'dict-radio',
        dict: dict({
            value: 'value',
            label: 'text',
            data: [
                {
                    value: 1,
                    text: t('message.pages.template.dict.status.enabled'),
                    color: 'primary'
                },
                {
                    value: 0,
                    text: t('message.pages.template.dict.status.disabled'),
                    color: 'danger'
                }
            ]
        }),
        column: {
            show: true,
        },
        form: {
            value: 1,
        }
    },
}
const common_forms = {
    form: {
        labelWidth: '100px',
        doReset(context: ScopeContext) {
            console.log(context)
            if (context.form.args && typeof context.form.args === 'string') {
                context.form.args = JSON.parse(context.form.args)
            }
            console.log('do reset', context);
        }
    },
    searchForm: {},
    addForm: {},
    editForm: {},
    viewForm: {},
}
export const templateListConfig = {
    actionbar: actionbar(true, auth('template:Edit'), auth('template:Del')),
    rowHandle: rowHandle(true, true, true, true),
    columns: {
        ...common_columns,
    },
    form: {
        ...common_forms.form,
    },
    searchForm: {
        ...common_forms.searchForm,
    },
    viewForm: {
        ...common_forms.viewForm,
    },
    editForm: {
        ...common_forms.editForm,
    },
    addForm: {
        ...common_forms.addForm,
    },
}

export const myTemplateConfig = {
    actionbar: actionbar(false, auth('template:Edit'), auth('template:Del')),
    rowHandle: rowHandle(true, true, true, true),
    columns: {...common_columns},
}