import {faker} from '@faker-js/faker';
import Mock from 'mockjs';
import {Host} from './data_type';
import {createPageData, SuccessResponse} from '../../../utils/tools'

function createRandomHost(): Host {
    return Mock.mock({
        id: '@increment(1)',
        host_name: faker.internet.domainName(),
        host_ip: faker.internet.ipv4(),
        host_port: faker.number.int(),
        host_user: faker.person.firstName(),
        host_password: faker.internet.password(),
        host_type: faker.helpers.arrayElement(['linux', 'windows']),
        host_status: faker.helpers.arrayElement(['0', '1']),
        host_remark: faker.lorem.sentence(),
        del_flag: faker.helpers.arrayElement(['0', '1']),
        create_datetime: faker.date.past(),
        update_datetime: faker.date.past(),
        create_by: faker.number.int(),
        update_by: faker.number.int(),
        host_group_id: faker.number.int(),
        app_id: faker.number.int(),
    });
}


export const GetList = function (current = 1, size = 10) {
    return createPageData(current, size, createRandomHost);
};

export const GetMyHostInfo = function (id: number) {
    return SuccessResponse({
        normal: faker.number.int({min: 1, max: 100}),
        exception: faker.number.int({min: 1, max: 100})
    })
};