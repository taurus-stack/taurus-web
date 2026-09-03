import {faker} from '@faker-js/faker';
import Mock from 'mockjs';
import {Record, RecordDetail} from './data_type';
import {createPageData, SuccessResponse} from '../../../utils/tools'

function createRandomRecordDetail(): RecordDetail {
    return Mock.mock({
        id: '@increment(1)',
        record_id: '@increment(1)',
        seq: '@increment(1)',
        stdin: faker.string.sample({min: 1, max: 100}),
        stdout: faker.string.sample({min: 1, max: 100}),
        stderr: faker.string.sample({min: 1, max: 100}),
        create_datetime: faker.date.past(),
        update_datetime: faker.date.past(),
        create_by: faker.number.int(),
        update_by: faker.number.int(),
    })
}

function createRandomRecord(): Record {
    return Mock.mock({
        id: '@increment(1)',
        uuid: faker.string.uuid(),
        seq: '@increment(1)',
        host_id: '@increment(1)',
        host_ip: faker.internet.ip(),
        template_id: '@increment(1)',
        template_name: faker.person.jobTitle(),
        script_type: faker.helpers.arrayElement(['shell', 'python']),
        script_content: faker.word.words(),
        run_as: faker.person.firstName(),
        envs: faker.string.sample({min: 1, max: 10}),
        args: faker.helpers.multiple(faker.number.int, {min: 1, max: 10}),
        editor_theme: faker.helpers.arrayElement(['github_light_default','github_dark']),
        timeout: faker.number.int({min: 1, max: 3600}),
        record_details: faker.helpers.multiple(createRandomRecordDetail, {min: 1, max: 10}),
        stdin: faker.string.sample({min: 1, max: 100}),
        stdout: faker.string.sample({min: 1, max: 100}),
        stderr: faker.string.sample({min: 1, max: 100}),
        return_code: faker.number.int({min: 0, max: 255}),
        status: faker.number.int({min: 0, max: 4}),
        archive: faker.datatype.boolean(),
        start_datetime: faker.date.past(),
        end_datetime: faker.date.past(),
        create_datetime: faker.date.past(),
        update_datetime: faker.date.past(),
        create_by: faker.number.int(),
        update_by: faker.number.int(),
    });
}


export const GetList = function (current = 1, size = 10) {
    return createPageData(current, size, createRandomRecord);
};

export const GetObj = function (id: number) {
    return createRandomRecord();
};

export const GetMyTaskInfo = function (id: number) {
    return SuccessResponse({
        total: faker.number.int({min: 1, max: 100}),
        success: faker.number.int({min: 0, max: 100}),
        failed: faker.number.int({min: 0, max: 100}),
        running: faker.number.int({min: 0, max: 100}),
        cancel: faker.number.int({min: 0, max: 100}),
        exception: faker.number.int({min: 0, max: 100}),
        timeout: faker.number.int({min: 0, max: 100}),
    })
};