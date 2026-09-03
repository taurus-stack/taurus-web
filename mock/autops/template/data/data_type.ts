export interface Template{
    id: number;
    // 共享
    share: boolean;
    //管理者
    template_name: string,
    script_type: string,
    script_content: string,
    editor_theme: string,
    run_as: string,
    envs: string,
    timeout: number,
    args: string,
    status: number,
    create_datetime: string,
    update_datetime: string,
    create_by: number,
    update_by: number
}



