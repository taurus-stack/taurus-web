import * as api from '/@/api/taurus/supervisor/log';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { logConfig } from './table';
import { useRoute } from 'vue-router';

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const route = useRoute();
	const hostId = route.query.host_id as string;
	const hostName = route.query.host_name as string;

	const pageRequest = async (query: UserPageQuery) => {
		if (hostId) {
			query.host = hostId;
		}
		return await api.GetList(query);
	};
	const editRequest = async ({ form, row }: EditReq) => {
		form.id = row.id;
		return await api.UpdateObj(form);
	};
	const delRequest = async ({ row }: DelReq) => {
		return await api.DelObj(row.id);
	};
	const addRequest = async ({ form }: AddReq) => {
		return await api.AddObj(form);
	};
	return {
		crudOptions: {
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			actionbar: logConfig.actionbar,
			rowHandle: logConfig.rowHandle,
			columns: logConfig.columns,
		},
	};
};