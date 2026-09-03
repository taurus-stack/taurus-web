import {Host} from "../../host/data/data_type";
import {Template} from "../../template/data/data_type";

export interface Record {
    id: number;
    uuid: string,
    host_id: number,
    host: Host;
    template_id: number,
    template: Template;
    script_type: string,
    script_content: string,
    editor_theme: string,
    editor_options: string,
    run_as: string,
    envs: string,
    timeout: number,
    args: string,
    record_details: RecordDetail[],
    return_code: number,
    status: number,
    archive: boolean,
    start_datetime: string,
    end_datetime: string,
    create_datetime: string,
    update_datetime: string,
    create_by: number,
    update_by: number,
}

export interface RecordDetail {
    id: number,
    record_id: number;
    seq: number,
    stdin: string,
    stdout: string,
    stderr: string,
    create_datetime: string,
    update_datetime: string,
    create_by: number,
    update_by: number
}


