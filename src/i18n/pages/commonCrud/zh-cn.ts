// 定义内容
export default {
    message: {
        pages: {
            commonCrud: {
                fields: {
                    deptBelongId: '所属部门',
                    description: '备注',
                    modifierName: '修改人',
                    creatorName: '创建人',
                    updateDatetime: '更新时间',
                    createDatetime: '创建时间',
                },
                placeholders: {
                    description: '请输入内容',
                    startTime: '开始时间',
                    endTime: '结束时间',
                },
                helpers: {
                    deptBelongId: '默认不填则为当前创建用户的部门ID',
                },
                shortcuts: {
                    lastWeek: '最近一周',
                    lastMonth: '最近一个月',
                    lastThreeMonths: '最近三个月',
                },
            },
        },
    },
};
