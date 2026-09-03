import * as api from '/@/api/taurus/template/api';
import { dict, CreateCrudOptionsProps, CreateCrudOptionsRet, compute } from '@fast-crud/fast-crud';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { auth } from '/@/utils/authFunction';
import { VAceEditor } from 'vue3-ace-editor';
import { shallowRef } from 'vue';
import ScriptArgument from '/@/views/taurus/ops/script/components/ScriptArgument/index.vue';
import EnvEditor from '/@/views/taurus/ops/script/components/Environment/index.vue';
import { i18n } from '/@/i18n';

import 'ace-builds/src-noconflict/theme-github_light_default';
import 'ace-builds/src-noconflict/theme-github_dark';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/snippets/sh';

const t = i18n.global.t;

export const createCrudOptions = function ({}: CreateCrudOptionsProps): CreateCrudOptionsRet {
  return {
    crudOptions: {
      request: {
        pageRequest: async (query: any) => await api.GetList(query),
        addRequest: async ({ form }: any) => await api.AddObj(form),
        editRequest: async ({ form, row }: any) => {
          form.id = row.id;
          return await api.UpdateObj(form);
        },
        delRequest: async ({ row }: any) => await api.DelObj(row.id),
      },
      actionbar: actionbar(auth('template:Create'), auth('template:Edit'), auth('template:Del')),
      rowHandle: rowHandle(true, false, auth('template:Edit'), auth('template:Del')),
      columns: {
        search: {
          title: t('message.pages.template.table.columns.keyword'),
          type: 'input',
          column: { show: false },
          search: {
            show: true,
            component: { props: { clearable: true }, placeholder: t('message.pages.template.form.keywordPlaceholder') },
          },
          form: { show: false },
        },
        template_name: {
          title: t('message.pages.template.table.columns.templateName'),
          type: 'input',
          column: { minWidth: 150, showOverflowTooltip: true },
          form: {
            col: { span: 24 },
            rules: [{ required: true, message: t('message.pages.template.form.templateNameRequired'), trigger: 'blur' }],
            component: { props: { clearable: true }, placeholder: t('message.pages.template.form.templateNamePlaceholder') },
          },
        },
        share: {
          title: t('message.pages.template.table.columns.share'),
          type: 'dict-radio',
          column: { width: 80 },
          dict: dict({
            data: [
              { value: false, label: t('message.pages.template.dict.share.no'), color: 'info' },
              { value: true, label: t('message.pages.template.dict.share.yes'), color: 'primary' },
            ],
          }),
          form: { value: false },
        },
        script_type: {
          title: t('message.pages.template.table.columns.scriptType'),
          type: 'dict-radio',
          column: { width: 100 },
          dict: dict({
            data: [
              { value: 'sh', label: t('message.pages.template.dict.scriptType.shell'), color: 'primary' },
              { value: 'python', label: t('message.pages.template.dict.scriptType.python'), color: 'success' },
            ],
          }),
          form: { value: 'sh' },
        },
        editor_theme: {
          title: t('message.pages.template.table.columns.editorTheme'),
          type: 'dict-radio',
          column: { show: false },
          dict: dict({
            data: [
              { value: 'github_light_default', label: t('message.pages.template.dict.editorTheme.light') },
              { value: 'github_dark', label: t('message.pages.template.dict.editorTheme.dark') },
            ],
          }),
          form: { value: 'github_light_default' },
        },
        script_content: {
          title: t('message.pages.template.table.columns.scriptContent'),
          type: 'textarea',
          column: { show: false },
          form: {
            col: { span: 24 },
            component: {
              name: VAceEditor,
              vModel: 'value',
              lang: compute(({ form }: any) => form.script_type),
              theme: compute(({ form }: any) => form.editor_theme),
              style: { height: '500px' },
              options: {
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 4,
                fontSize: 14,
              },
            },
            rules: [{ required: true, message: t('message.pages.template.form.scriptContentRequired'), trigger: 'blur' }],
            value: '',
          },
        },
        args: {
          title: t('message.pages.template.table.columns.args'),
          type: 'textarea',
          column: { show: false },
          form: {
            col: { span: 24 },
            component: {
              name: shallowRef(ScriptArgument),
              vModel: 'args',
            },
            valueBuilder: ({ form, row }: any) => {
              try {
                form.args = typeof row.args === 'string' ? JSON.parse(row.args || '[]') : row.args || [];
              } catch {
                form.args = [];
              }
            },
            valueResolve: ({ form }: any) => {
              form.args = JSON.stringify(form.args || []);
            },
            value: '[]',
          },
        },
        envs: {
          title: t('message.pages.template.table.columns.envs'),
          type: 'textarea',
          column: { show: false },
          form: {
            col: { span: 24 },
            component: {
              name: shallowRef(EnvEditor),
              vModel: 'modelValue',
            },
            value: '[]',
          },
        },
        timeout: {
          title: t('message.pages.template.table.columns.timeout'),
          type: 'number',
          column: { width: 110 },
          form: {
            component: { props: { min: 0 }, placeholder: t('message.pages.template.form.timeoutPlaceholder') },
            value: 0,
          },
        },
        status: {
          title: t('message.pages.template.table.columns.status'),
          type: 'dict-radio',
          column: { width: 90 },
          dict: dict({
            data: [
              { value: 1, label: t('message.pages.template.dict.status.enabled'), color: 'primary' },
              { value: 0, label: t('message.pages.template.dict.status.disabled'), color: 'danger' },
            ],
          }),
          form: { value: 1 },
        },
        creator_name: {
          title: t('message.pages.template.table.columns.creatorName'),
          type: 'text',
          column: { width: 100 },
          form: { show: false },
        },
        create_datetime: {
          title: t('message.pages.template.table.columns.createDatetime'),
          type: 'datetime',
          column: { width: 170 },
          form: { show: false },
        },
      },
      form: {
        wrapper: {
          is: 'el-drawer',
          size: '60%',
          destroyOnClose: true,
        },
        labelWidth: '110px',
      },
      table: {
        rowKey: 'id',
      },
    },
  };
};