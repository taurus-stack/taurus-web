import {Random} from 'mockjs';

export function createPageData(current = 1, size = 10, factory) {
    return {
        code: 2000,
        data: (function () {
            const list = [];
            for (let i = 0; i < size; i++) {
                list.push(factory());
            }
            return list;
        })(),
        currentPage: current,
        pageSize: size,
        total: (function () {
            return Random.natural(size, size * 3 + Random.natural(1, 10));
        })(),
        msg: '获取成功'
    };
}

export function SuccessResponse(data, ...args) {
    return {
        code: 2000,
        data: data,
        msg: '获取成功',
        ...args
    };
}

export function FailResponse(msg, code = 5000) {
    return {
        code: code,
        data: {},
        msg: msg
    };
}