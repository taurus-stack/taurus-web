import {GetList} from '/@/api/taurus/template/api'
import {CreateCrudOptionsProps, CreateCrudOptionsRet, UserPageQuery} from "@fast-crud/fast-crud";
import {myTemplateConfig} from "/@/views/taurus/config/template/table";
import {ref} from "vue";

export const createCrudOptions = function ({crudExpose, context}: CreateCrudOptionsProps): CreateCrudOptionsRet {
    const pageRequest = async (query: UserPageQuery) => {
        return await GetList(query);
    };

    const selectedRowKeys = ref([]);

    const onSelectionChange = (changed: any) => {
        selectedRowKeys.value = changed.map((item: any) => item.id);
    };
    return {
        crudOptions: {
            settings: {
                plugins: {
                    // Here we use the row selection plugin to generate row selection crudOptions config, which will be merged into crudOptions
                    rowSelection: {
                        enabled: true,
                        order: -2,
                        before: true,
                        props: {
                            multiple: false,
                            crossPage: true,
                            selectedRowKeys,
                            onSelectedChanged(selected) {
                                console.log("已选择变化：", selected);
                            }
                        }
                    }
                }
            },
            request: {
                pageRequest,
            },
            actionbar: myTemplateConfig.actionbar,
            rowHandle: myTemplateConfig.rowHandle,
            columns: {
                ...myTemplateConfig.columns,
            },
            table: {
                rowKey: 'id',
                onSelectionChange
            }
        }
        , selectedRowKeys
    }
}