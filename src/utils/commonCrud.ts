import { dict } from "@fast-crud/fast-crud";
import { shallowRef } from 'vue';
import { i18n } from '/@/i18n';
import deptFormat from "/@/components/dept-format/index.vue";

type CrudFieldOption = {
    form?: boolean;
    table?: boolean;
    search?: boolean;
    minWidth?: number;
};

type CrudOptions = {
    create_datetime?: CrudFieldOption;
    update_datetime?: CrudFieldOption;
    creator_name?: CrudFieldOption;
    modifier_name?: CrudFieldOption;
    dept_belong_id?: CrudFieldOption;
    description?: CrudFieldOption;
};

const t = (key: string) => i18n.global.t(`message.pages.commonCrud.${key}`);

export const commonCrudConfig = (options: CrudOptions = {}) => {
    return {
        dept_belong_id: {
            title: t('fields.deptBelongId'),
            type: 'dict-tree',
            search: {
                show: options.dept_belong_id?.search || false
            },
            dict: dict({
                url: '/api/system/dept/all_dept/',
                isTree: true,
                value: 'id',
                label: 'name',
                children: 'children',
            }),
            column: {
                align: 'center',
                width: 300,
                show: options.dept_belong_id?.table || false,
                component: {
                    name: shallowRef(deptFormat),
                    vModel: "modelValue",
                }
            },
            form: {
                show: options.dept_belong_id?.form || false,
                component: {
                    multiple: false,
                    clearable: true,
                    props: {
                        checkStrictly: true,
                        props: {
                            // Why write two levels of props here
                            // Because the props property name conflicts with fs's dynamic rendering props naming, so an extra level is needed
                            label: "name",
                            value: "id",
                        }
                    }
                },
                helper: t('helpers.deptBelongId')
            }
        },
        description: {
            title: t('fields.description'),
            search: {
                show: options.description?.search || false
            },
            type: 'textarea',
            column: {
                width: 100,
                show: options.description?.table || false,
            },
            form: {
                show: options.description?.form || false,
                component: {
                    placeholder: t('placeholders.description'),
                    showWordLimit: true,
                    maxlength: '200',
                }
            },
            viewForm: {
                show: true
            }
        },
        modifier_name: {
            title: t('fields.modifierName'),
            search: {
                show: options.modifier_name?.search || false
            },
            column: {
                width: 100,
                show: options.modifier_name?.table || false,
            },
            form: {
                show: false,
            },
            viewForm: {
                show: true
            }
        },
        creator_name: {
            title: t('fields.creatorName'),
            search: {
                show: options.creator_name?.search || false
            },
            column: {
                width: 100,
                show: options.creator_name?.table || false,
            },
            form: {
                show: false,
            },
            viewForm: {
                show: true
            }
        },
        update_datetime: {
            title: t('fields.updateDatetime'),
            type: 'datetime',
            search: {
                show: options.update_datetime?.search || false,
                col: { span: 8 },
                component: {
                    type: 'datetimerange',
                    props: {
                        'start-placeholder': t('placeholders.startTime'),
                        'end-placeholder': t('placeholders.endTime'),
                        'value-format': 'YYYY-MM-DD HH:mm:ss',
                        'picker-options': {
                            shortcuts: [{
                                text: t('shortcuts.lastWeek'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                                    picker.$emit('pick', [start, end]);
                                }
                            }, {
                                text: t('shortcuts.lastMonth'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                                    picker.$emit('pick', [start, end]);
                                }
                            }, {
                                text: t('shortcuts.lastThreeMonths'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                                    picker.$emit('pick', [start, end]);
                                }
                            }]
                        }
                    }
                },
                valueResolve(context: any) {
                    const { key, value } = context
                    // value resolution: convert component value to the format needed by backend
                    // executes conversion before submitting to backend after form save
                    if (value) {
                        context.form.update_datetime_after = value[0]
                        context.form.update_datetime_before = value[1]
                    }
                    //  ↑↑↑↑↑ Note this is form, not row
                }
            },
            column: {
                width: 160,
                show: options.update_datetime?.table || false,
            },
            form: {
                show: false,
            },
            viewForm: {
                show: true
            }
        },
        create_datetime: {
            title: t('fields.createDatetime'),
            type: 'datetime',
            search: {
                show: options.create_datetime?.search || false,
                col: { span: 8 },
                component: {
                    type: 'datetimerange',
                    props: {
                        'start-placeholder': t('placeholders.startTime'),
                        'end-placeholder': t('placeholders.endTime'),
                        'value-format': 'YYYY-MM-DD HH:mm:ss',
                        'picker-options': {
                            shortcuts: [{
                                text: t('shortcuts.lastWeek'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                                    picker.$emit('pick', [start, end]);
                                }
                            }, {
                                text: t('shortcuts.lastMonth'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                                    picker.$emit('pick', [start, end]);
                                }
                            }, {
                                text: t('shortcuts.lastThreeMonths'),
                                onClick(picker) {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                                    picker.$emit('pick', [start, end]);
                                }
                            }]
                        }
                    }
                },
                valueResolve(context: any) {
                    const { key, value } = context
                    if (value) {
                        context.form.create_datetime_after = value[0]
                        context.form.create_datetime_before = value[1]
                    }
                }
            },
            column: {
                width: options.create_datetime?.minWidth ? undefined : 160,
                minWidth: options.create_datetime?.minWidth || undefined,
                show: options.create_datetime?.table || false,
            },
            form: {
                show: false
            },
            viewForm: {
                show: true
            }
        }
    }
}
