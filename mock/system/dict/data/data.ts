import Mock from 'mockjs'
import {faker} from '@faker-js/faker'
import dictionary from './data_type'

const Random = Mock.Random;
const count = 10

const list: Array<dictionary> = [
    {
        id: 48,
        type: 0,
        value: 'windows',
        label: 'windows',
        sort: 1,
        status: 1,
        remark: '',
        parent_id: 47,
        create_datetime: '2023-07-06T08:06:07.000Z',
        creator_id: 1,
        update_datetime: '2023-07-06T08:06:07.000Z',
        modifier: 'admin',
        dept_belong_id: 1,
        description: '',
        is_value: true,
    },
    {
        id: 49,
        type: 0,
        value: 'linux',
        label: 'linux',
        sort: 2,
        status: 1,
        remark: '',
        parent_id: 47,
        create_datetime: '2023-07-06T08:06:07.000Z',
        creator_id: 1,
        update_datetime: '2023-07-06T08:06:07.000Z',
        modifier: 'admin',
        dept_belong_id: 1,
        description: '',
        is_value: true,
    }
];


export const GetList = function () {
    return {
        code: 2000,
        data: [
            {
                id: 48,
                type: 0,
                value: 'windows',
                label: 'windows',
                sort: 1,
                status: 1,
                remark: '',
                parent_id: 47,
                create_datetime: '2023-07-06T08:06:07.000Z',
                creator_id: 1,
                update_datetime: '2023-07-06T08:06:07.000Z',
                modifier: 'admin',
                dept_belong_id: 1,
                description: '',
                is_value: true,
            },
            {
                id: 49,
                type: 0,
                value: 'linux',
                label: 'linux',
                sort: 2,
                status: 1,
                remark: '',
                parent_id: 47,
                create_datetime: '2023-07-06T08:06:07.000Z',
                creator_id: 1,
                update_datetime: '2023-07-06T08:06:07.000Z',
                modifier: 'admin',
                dept_belong_id: 1,
                description: '',
                is_value: true,
            }
        ],
        msg: '获取成功'
    }
}