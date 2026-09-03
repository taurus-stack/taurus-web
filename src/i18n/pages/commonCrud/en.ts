// Define content
export default {
    message: {
        pages: {
            commonCrud: {
                fields: {
                    deptBelongId: 'Owning Dept',
                    description: 'Remark',
                    modifierName: 'Modified By',
                    creatorName: 'Created By',
                    updateDatetime: 'Update Time',
                    createDatetime: 'Create Time',
                },
                placeholders: {
                    description: 'Please enter content',
                    startTime: 'Start Time',
                    endTime: 'End Time',
                },
                helpers: {
                    deptBelongId: 'If empty, defaults to the creating user\'s dept ID',
                },
                shortcuts: {
                    lastWeek: 'Last Week',
                    lastMonth: 'Last Month',
                    lastThreeMonths: 'Last 3 Months',
                },
            },
        },
    },
};
