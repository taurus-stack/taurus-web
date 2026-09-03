import type {SexType} from '@faker-js/faker';

export interface Host {
    id: number;
    host_name: string;
    host_ip: string;
    host_port: number;
    host_user: string;
    host_password: string;
    host_type: string;
    host_status: string;
    host_remark: string;
    create_datetime: string;
    update_datetime: string;
    create_by: number;
    update_by: number;
    del_flag: string;
    host_group_id: number;
    app_id: number;
}



