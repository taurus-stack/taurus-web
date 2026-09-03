export default {
    message: {
        pages: {
            schedule: {
                pageTitle: '定時任務',
                pageDesc: '管理腳本和工作流的定時調度，支援 Cron、固定間隔和一次性執行',

                // ===== actionbar =====
                btnNew: '新建定時任務',
                btnRunNow: '立即執行',
                btnEnable: '啟用',
                btnDisable: '停用',
                btnViewExecutions: '執行記錄',

                // ===== execution dialog =====
                execDialogTitle: '執行記錄',
                execColId: 'ID',
                execColScheduleName: '任務名稱',
                execColStatus: '狀態',
                execColStartTime: '開始時間',
                execColEndTime: '結束時間',
                execColErrorMessage: '錯誤資訊',

                // ===== columns =====
                colName: '任務名稱',
                colDescription: '描述',
                colScheduleType: '調度類型',
                colCronExpression: 'Cron 表達式',
                colIntervalSeconds: '間隔秒數',
                colRunOnceAt: '執行時間',
                colTargetType: '目標類型',
                colTemplate: '腳本模板',
                colWorkflow: '工作流',
                colDagVersion: 'DAG 版本',
                colHosts: '目標主機',
                colEnvs: '環境變數',
                colArgs: '參數',
                colStatus: '狀態',
                colLastRunTime: '上次執行時間',
                colNextRunTime: '下次執行時間',
                colCreateDatetime: '建立時間',

                // ===== dict labels =====
                typeCron: 'Cron 表達式',
                typeInterval: '固定間隔',
                typeOnce: '一次性',
                targetScript: '單個腳本',
                targetWorkflow: '工作流',
                statusDisabled: '停用',
                statusEnabled: '啟用',

                // ===== form =====
                formPlaceholderCron: '分 時 日 月 週',
                formHelperDagVersion: '留空則使用工作流目前發佈版本',
                formPlaceholderDagVersion: '目前發佈版',
                formPlaceholderEnvs: 'JSON 格式，如 {"KEY": "value"}',
                formPlaceholderArgs: 'JSON 陣列格式，如 ["arg1", "arg2"]',

                // ===== validation =====
                valNameRequired: '任務名稱必填',
                valScheduleTypeRequired: '調度類型必選',
                valCronRequired: 'Cron 表達式必填',
                valIntervalRequired: '間隔秒數必填',
                valRunOnceRequired: '執行時間必填',
                valTargetTypeRequired: '目標類型必選',
                valTemplateRequired: '腳本模板必選',
                valWorkflowRequired: '工作流必選',
                valHostsRequired: '目標主機必選',

                // ===== messages =====
                msgEnableSuccess: '定時任務已啟用',
                msgDisableSuccess: '定時任務已停用',
                msgRunSubmitted: '任務已提交執行',
                msgLoadExecutionsFailed: '取得執行記錄失敗',
            },
        },
    },
};
