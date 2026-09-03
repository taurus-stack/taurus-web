export default {
    message: {
        pages: {
            schedule: {
                pageTitle: 'Scheduled Tasks',
                pageDesc: 'Manage scheduled execution of scripts and workflows with Cron, fixed interval and one-shot modes',

                // ===== actionbar =====
                btnNew: 'New Scheduled Task',
                btnRunNow: 'Run Now',
                btnEnable: 'Enable',
                btnDisable: 'Disable',
                btnViewExecutions: 'Execution Records',

                // ===== execution dialog =====
                execDialogTitle: 'Execution Records',
                execColId: 'ID',
                execColScheduleName: 'Task Name',
                execColStatus: 'Status',
                execColStartTime: 'Start Time',
                execColEndTime: 'End Time',
                execColErrorMessage: 'Error Message',

                // ===== columns =====
                colName: 'Task Name',
                colDescription: 'Description',
                colScheduleType: 'Schedule Type',
                colCronExpression: 'Cron Expression',
                colIntervalSeconds: 'Interval (sec)',
                colRunOnceAt: 'Run At',
                colTargetType: 'Target Type',
                colTemplate: 'Script Template',
                colWorkflow: 'Workflow',
                colDagVersion: 'DAG Version',
                colHosts: 'Target Hosts',
                colEnvs: 'Environment Variables',
                colArgs: 'Arguments',
                colStatus: 'Status',
                colLastRunTime: 'Last Run Time',
                colNextRunTime: 'Next Run Time',
                colCreateDatetime: 'Created At',

                // ===== dict labels =====
                typeCron: 'Cron Expression',
                typeInterval: 'Fixed Interval',
                typeOnce: 'One Shot',
                targetScript: 'Single Script',
                targetWorkflow: 'Workflow',
                statusDisabled: 'Disabled',
                statusEnabled: 'Enabled',

                // ===== form =====
                formPlaceholderCron: 'min hour day month week',
                formHelperDagVersion: 'Leave empty to use the workflow\'s current published version',
                formPlaceholderDagVersion: 'Current Published',
                formPlaceholderEnvs: 'JSON format, e.g. {"KEY": "value"}',
                formPlaceholderArgs: 'JSON array format, e.g. ["arg1", "arg2"]',

                // ===== validation =====
                valNameRequired: 'Task name is required',
                valScheduleTypeRequired: 'Schedule type is required',
                valCronRequired: 'Cron expression is required',
                valIntervalRequired: 'Interval seconds is required',
                valRunOnceRequired: 'Run time is required',
                valTargetTypeRequired: 'Target type is required',
                valTemplateRequired: 'Script template is required',
                valWorkflowRequired: 'Workflow is required',
                valHostsRequired: 'Target hosts are required',

                // ===== messages =====
                msgEnableSuccess: 'Scheduled task enabled',
                msgDisableSuccess: 'Scheduled task disabled',
                msgRunSubmitted: 'Task submitted for execution',
                msgLoadExecutionsFailed: 'Failed to load execution records',
            },
        },
    },
};
