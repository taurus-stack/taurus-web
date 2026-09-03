import {faker} from '@faker-js/faker';
import Mock from 'mockjs';
import {Template} from './data_type';
import {createPageData, SuccessResponse} from '../../../utils/tools'

const var1 = JSON.stringify([
    {'key': 'jwj', 'value': 18},
    {'key': 'liliu', 'value': 20},
    {'key': 'lill', 'value': 23}
])
const var2 = JSON.stringify([{'key': 'name', 'value': 'jwj'}, {'key': 'age', 'value': 18}])

function createRandomTemplate(): Template {
    return Mock.mock({
        id: '@increment(1)',
        share: faker.datatype.boolean(),
        template_id: '@increment(1)',
        template_name: faker.person.jobTitle(),
        script_type: faker.helpers.arrayElement(['sh', 'python']),
        script_content: faker.word.words(),
        run_as: faker.person.firstName(),
        envs: var1,
        args: var2,
        editor_theme: faker.helpers.arrayElement(['github_dark', 'github_light_default']),
        timeout: faker.number.int({min: 1, max: 3600}),
        status: faker.number.int({min: 0, max: 1}),
        create_datetime: faker.date.past(),
        update_datetime: faker.date.past(),
        create_by: faker.number.int(),
        update_by: faker.number.int(),
    });
}


export const GetList = function (current = 1, size = 10) {
    return createPageData(current, size, createRandomTemplate);
};

export const GetObj = function (id: number) {
    return createRandomTemplate();
};

export const GetMyScriptInfo = function (id: number) {
    return SuccessResponse({
        shell: faker.number.int({min: 1, max: 100}),
        python: faker.number.int({min: 1, max: 100})
    })
};
