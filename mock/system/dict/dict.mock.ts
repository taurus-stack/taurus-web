import {defineMock} from 'vite-plugin-mock-dev-server';

// 注释掉 host_type mock，使用真实后端 API
// export default defineMock([{
//     url: '/api/system/dict/host_type/',
//     method: 'GET',
//     body: ({query, params, body, headers}) => {
//         console.debug("🚀 ~ file:dict.mock.ts method:body line:8 -----", params)
//         return GetList();
//     },
// }
// ]);

export default defineMock([]);