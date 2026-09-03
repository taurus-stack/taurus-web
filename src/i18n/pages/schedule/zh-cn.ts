export default {
    message: {
        pages: {
            schedule: {
                pageTitle: '定时任务',
                pageDesc: '管理脚本和工作流的定时调度，支持 Cron、固定间隔和一次性执行',

                // ===== actionbar =====
                btnNew: '新建定时任务',
                btnRunNow: '立即执行',
                btnEnable: '启用',
                btnDisable: '禁用',
                btnViewExecutions: '执行记录',

                // ===== execution dialog =====
                execDialogTitle: '执行记录',
                execColId: 'ID',
                execColScheduleName: '任务名称',
                execColStatus: '状态',
                execColStartTime: '开始时间',
                execColEndTime: '结束时间',
                execColErrorMessage: '错误信息',

                // ===== columns =====
                colName: '任务名称',
                colDescription: '描述',
                colScheduleType: '调度类型',
                colCronExpression: 'Cron 表达式',
                colIntervalSeconds: '间隔秒数',
                colRunOnceAt: '执行时间',
                colTargetType: '目标类型',
                colTemplate: '脚本模板',
                colWorkflow: '工作流',
                colDagVersion: 'DAG 版本',
                colHosts: '目标主机',
                colEnvs: '环境变量',
                colArgs: '参数',
                colStatus: '状态',
                colLastRunTime: '上次执行时间',
                colNextRunTime: '下次执行时间',
                colCreateDatetime: '创建时间',

                // ===== dict labels =====
                typeCron: 'Cron 表达式',
                typeInterval: '固定间隔',
                typeOnce: '一次性',
                targetScript: '单个脚本',
                targetWorkflow: '工作流',
                statusDisabled: '禁用',
                statusEnabled: '启用',

                // ===== form =====
                formPlaceholderCron: '分 时 日 月 周',
                formHelperDagVersion: '留空则使用工作流当前发布版本',
                formPlaceholderDagVersion: '当前发布版',
                formPlaceholderEnvs: 'JSON 格式，如 {"KEY": "value"}',
                formPlaceholderArgs: 'JSON 数组格式，如 ["arg1", "arg2"]',

                // ===== validation =====
                valNameRequired: '任务名称必填',
                valScheduleTypeRequired: '调度类型必选',
                valCronRequired: 'Cron 表达式必填',
                valIntervalRequired: '间隔秒数必填',
                valRunOnceRequired: '执行时间必填',
                valTargetTypeRequired: '目标类型必选',
                valTemplateRequired: '脚本模板必选',
                valWorkflowRequired: '工作流必选',
                valHostsRequired: '目标主机必选',

                // ===== messages =====
                msgEnableSuccess: '定时任务已启用',
                msgDisableSuccess: '定时任务已禁用',
                msgRunSubmitted: '任务已提交执行',
                msgLoadExecutionsFailed: '获取执行记录失败',
            },
        },
    },
};
