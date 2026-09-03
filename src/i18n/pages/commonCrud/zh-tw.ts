// 定義內容
export default {
    message: {
        pages: {
            commonCrud: {
                fields: {
                    deptBelongId: '所屬部門',
                    description: '備註',
                    modifierName: '修改人',
                    creatorName: '創建人',
                    updateDatetime: '更新時間',
                    createDatetime: '創建時間',
                },
                placeholders: {
                    description: '請輸入內容',
                    startTime: '開始時間',
                    endTime: '結束時間',
                },
                helpers: {
                    deptBelongId: '默認不填則為當前創建用戶的部門ID',
                },
                shortcuts: {
                    lastWeek: '最近一週',
                    lastMonth: '最近一個月',
                    lastThreeMonths: '最近三個月',
                },
            },
        },
    },
};
