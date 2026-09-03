import { CrudOptions, CrudExpose, dict, compute as fastCompute } from '@fast-crud/fast-crud';
import { ElMessage } from 'element-plus';
import * as api from '../../../api/taurus/schedule/api';
import { request } from '/@/utils/service';
import { i18n } from '/@/i18n';
import { useEditionStore } from '/@/editions';
import { editionColumnShow } from '/@/editions/useEditionColumn';
const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: { crudExpose: CrudExpose }): CrudOptions {
    const pageRequest = async (query: any) => {
        return await api.GetList(query);
    };
    const editRequest = async ({ form, row }: any) => {
        form.id = row.id;
        return await api.UpdateObj(form);
    };
    const delRequest = async ({ row }: any) => {
        return await api.DelObj(row.id);
    };
    const addRequest = async ({ form }: any) => {
        return await api.AddObj(form);
    };

    return {
        request: {
            pageRequest,
            addRequest,
            editRequest,
            delRequest,
        },
        actionbar: {
            buttons: {
                add: {
                    text: t('message.pages.schedule.btnNew'),
                },
            },
        },
        rowHandle: {
            fixed: 'right',
            width: 380,
            buttons: {
                enable: {
                    text: t('message.pages.schedule.btnEnable'),
                    type: 'success',
                    show: ({ row }: any) => row.status === 0,
                    click: async ({ row }: any) => {
                        await api.EnableSchedule(row.id);
                        ElMessage.success(t('message.pages.schedule.msgEnableSuccess'));
                        crudExpose.doRefresh();
                    },
                },
                disable: {
                    text: t('message.pages.schedule.btnDisable'),
                    type: 'warning',
                    show: ({ row }: any) => row.status === 1,
                    click: async ({ row }: any) => {
                        await api.DisableSchedule(row.id);
                        ElMessage.success(t('message.pages.schedule.msgDisableSuccess'));
                        crudExpose.doRefresh();
                    },
                },
                runNow: {
                    text: t('message.pages.schedule.btnRunNow'),
                    type: 'primary',
                    click: async ({ row }: any) => {
                        await api.RunNow(row.id);
                        ElMessage.success(t('message.pages.schedule.msgRunSubmitted'));
                    },
                },
                edit: {},
                remove: {},
            },
        },
        columns: {
            name: {
                title: t('message.pages.schedule.colName'),
                type: 'input',
                search: { show: true },
                column: {
                    minWidth: 150,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valNameRequired') }],
                },
            },
            description: {
                title: t('message.pages.schedule.colDescription'),
                type: 'textarea',
                column: {
                    show: false,
                },
                form: {
                    component: {
                        props: {
                            rows: 3,
                        },
                    },
                },
            },
            schedule_type: {
                title: t('message.pages.schedule.colScheduleType'),
                type: 'dict-select',
                search: { show: true },
                dict: dict({
                    data: [
                        { value: 'cron', label: t('message.pages.schedule.typeCron') },
                        { value: 'interval', label: t('message.pages.schedule.typeInterval') },
                        { value: 'once', label: t('message.pages.schedule.typeOnce') },
                    ],
                }),
                column: {
                    minWidth: 120,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valScheduleTypeRequired') }],
                },
            },
            cron_expression: {
                title: t('message.pages.schedule.colCronExpression'),
                type: 'input',
                show: ({ form }: any) => form.schedule_type === 'cron',
                column: {
                    show: false,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valCronRequired') }],
                    component: {
                        placeholder: t('message.pages.schedule.formPlaceholderCron'),
                    },
                },
            },
            interval_seconds: {
                title: t('message.pages.schedule.colIntervalSeconds'),
                type: 'number',
                show: ({ form }: any) => form.schedule_type === 'interval',
                column: {
                    show: false,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valIntervalRequired') }],
                },
            },
            run_once_at: {
                title: t('message.pages.schedule.colRunOnceAt'),
                type: 'datetime',
                show: ({ form }: any) => form.schedule_type === 'once',
                column: {
                    show: false,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valRunOnceRequired') }],
                },
            },
            target_type: {
                title: t('message.pages.schedule.colTargetType'),
                type: 'dict-select',
                dict: dict({
                    getData: async () => {
                        const items = [{ value: 'script', label: t('message.pages.schedule.targetScript') }];
                        if (useEditionStore().hasFeature('WORKFLOW_DAG_ENGINE')) {
                            items.push({ value: 'workflow', label: t('message.pages.schedule.targetWorkflow') });
                        }
                        return items;
                    },
                }),
                column: {
                    minWidth: 100,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valTargetTypeRequired') }],
                },
            },
            template: {
                title: t('message.pages.schedule.colTemplate'),
                type: 'dict-select',
                show: ({ form }: any) => form.target_type === 'script',
                column: {
                    show: false,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valTemplateRequired') }],
                    component: {
                        name: 'fs-api-select',
                        vModel: 'modelValue',
                        props: {
                            url: '/api/taurus/template/',
                            labelField: 'name',
                            valueField: 'id',
                        },
                    },
                },
            },
            workflow: {
                title: t('message.pages.schedule.colWorkflow'),
                type: 'dict-select',
                column: {
                    show: editionColumnShow('WORKFLOW_DAG_ENGINE'),
                },
                form: {
                    show: fastCompute(({ form }: any) =>
                        useEditionStore().hasFeature('WORKFLOW_DAG_ENGINE') && form.target_type === 'workflow'
                    ),
                    rules: [{ required: true, message: t('message.pages.schedule.valWorkflowRequired') }],
                    component: {
                        name: 'fs-api-select',
                        vModel: 'modelValue',
                        props: {
                            url: '/api/taurus/workflow/',
                            labelField: 'name',
                            valueField: 'id',
                        },
                    },
                },
            },
            dag_version: {
                title: t('message.pages.schedule.colDagVersion'),
                type: 'dict-select',
                column: {
                    show: editionColumnShow('WORKFLOW_DAG_VERSIONING'),
                },
                form: {
                    show: fastCompute(({ form }: any) =>
                        useEditionStore().hasFeature('WORKFLOW_DAG_VERSIONING') &&
                        form.target_type === 'workflow' &&
                        !!form.workflow
                    ),
                    helper: t('message.pages.schedule.formHelperDagVersion'),
                    component: {
                        props: {
                            clearable: true,
                            placeholder: t('message.pages.schedule.formPlaceholderDagVersion'),
                        },
                    },
                    dict: dict({
                        getData: async ({ form }: any) => {
                            if (!form?.workflow) return [];
                            const res = await request({
                                url: `/api/taurus/workflow/${form.workflow}/dag_versions/`,
                                method: 'get',
                            });
                            const items = res?.data || res || [];
                            return items.map((v: any) => ({
                                value: v.id,
                                label: `v${v.version}`,
                            }));
                        },
                    }),
                },
            },
            hosts: {
                title: t('message.pages.schedule.colHosts'),
                type: 'dict-select',
                show: ({ form }: any) => form.target_type === 'script',
                column: {
                    show: false,
                },
                form: {
                    rules: [{ required: true, message: t('message.pages.schedule.valHostsRequired') }],
                    component: {
                        name: 'fs-api-select',
                        vModel: 'modelValue',
                        props: {
                            url: '/api/taurus/host/',
                            labelField: 'host_ip',
                            valueField: 'id',
                            multiple: true,
                        },
                    },
                },
            },
            envs: {
                title: t('message.pages.schedule.colEnvs'),
                type: 'input',
                column: {
                    show: false,
                },
                form: {
                    component: {
                        props: {
                            placeholder: t('message.pages.schedule.formPlaceholderEnvs'),
                        },
                    },
                },
            },
            args: {
                title: t('message.pages.schedule.colArgs'),
                type: 'input',
                column: {
                    show: false,
                },
                form: {
                    component: {
                        props: {
                            placeholder: t('message.pages.schedule.formPlaceholderArgs'),
                        },
                    },
                },
            },
            status: {
                title: t('message.pages.schedule.colStatus'),
                type: 'dict-select',
                search: { show: true },
                dict: dict({
                    data: [
                        { value: 0, label: t('message.pages.schedule.statusDisabled'), color: 'danger' },
                        { value: 1, label: t('message.pages.schedule.statusEnabled'), color: 'success' },
                    ],
                }),
                column: {
                    minWidth: 80,
                },
            },
            last_run_time: {
                title: t('message.pages.schedule.colLastRunTime'),
                type: 'datetime',
                column: {
                    minWidth: 180,
                },
            },
            next_run_time: {
                title: t('message.pages.schedule.colNextRunTime'),
                type: 'datetime',
                column: {
                    minWidth: 180,
                },
            },
            create_datetime: {
                title: t('message.pages.schedule.colCreateDatetime'),
                type: 'datetime',
                column: {
                    minWidth: 180,
                },
                form: {
                    show: false,
                },
            },
        },
    };
};
