export interface User {
    id: number;
    username: string;
    email: string;
    is_superuser: boolean;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
    last_login: string;
    groups: any[];
    user_permissions: any[];
    avatar: string;
    nickname: string;
    roles: any[];
}