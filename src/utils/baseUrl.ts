import {pluginsAll} from '/@/views/plugins/index';

/**
 * @description Check if running in tenant mode. Tenant mode replaces domain with domain + port.
 */
export const getBaseURL = function (url: null | string = null, isHost: null | boolean = null) {
    let baseURL = import.meta.env.VITE_API_URL as any;
    // If host is needed, return the protocol prefix + http address
    if (isHost && !baseURL.startsWith('http')) {
        baseURL = window.location.protocol + '//' + window.location.host + baseURL
    }
    let param = baseURL.split('/')[3] || '';
    // @ts-ignore
    if (pluginsAll && pluginsAll.indexOf('dvadmin3-tenants-web') !== -1 && (!param || baseURL.startsWith('/'))) {
        // 1. Replace 127.0.0.1 with the same domain as the frontend
        // 2. Replace IP address with the same domain as the frontend
        // 3. Replace /api or similar with the same domain as the frontend
        // document.domain

        var host = baseURL.split('/')[2];
        if (host) {
            var port = baseURL.split(':')[2] || 80;
            if (port === 80 || port === 443) {
                host = document.domain;
            } else {
                host = document.domain + ':' + port;
            }
            baseURL = baseURL.split('/')[0] + '//' + baseURL.split('/')[1] + host + '/' + param;
        } else {
            baseURL = location.protocol + '//' + location.hostname + (location.port ? ':' : '') + location.port + baseURL;
        }
    }
    if (url) {
        const regex = /^(http|https):\/\//;
        if (regex.test(url)) {
            return url
        } else {
            // JS check whether the URL ends with a slash
            return baseURL.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
        }
    }
    if (!baseURL.endsWith('/')) {
        baseURL += '/';
    }
    return baseURL;
};

export const getWsBaseURL = function () {
    const wsUrl = import.meta.env.VITE_WS_URL as any;
    if (wsUrl) {
        let baseURL = wsUrl;
        if (!baseURL.endsWith('/')) {
            baseURL += '/';
        }
        if (baseURL.startsWith('http')) {
            baseURL = baseURL.replace('http', 'ws');
        }
        return baseURL;
    }
    let baseURL = import.meta.env.VITE_API_URL as any;
    let param = baseURL.split('/')[3] || '';
    // @ts-ignore
    if (pluginsAll && pluginsAll.indexOf('dvadmin3-tenants-web') !== -1 && (!param || baseURL.startsWith('/'))) {
        // 1. Replace 127.0.0.1 with the same domain as the frontend
        // 2. Replace IP address with the same domain as the frontend
        // 3. Replace /api or similar with the same domain as the frontend
        // document.domain
        var host = baseURL.split('/')[2];
        if (host) {
            var port = baseURL.split(':')[2] || 80;
            if (port === 80 || port === 443) {
                host = document.domain;
            } else {
                host = document.domain + ':' + port;
            }
            baseURL = baseURL.split('/')[0] + '//' + baseURL.split('/')[1] + host + '/' + param;
        } else {
            baseURL = location.protocol + '//' + location.hostname + (location.port ? ':' : '') + location.port + baseURL;
        }
    } else if (param !== '' || baseURL.startsWith('/')) {
        baseURL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + (location.port ? ':' : '') + location.port + baseURL;
    }
    if (!baseURL.endsWith('/')) {
        baseURL += '/';
    }
    if (baseURL.startsWith('http')) {
        // https will also be replaced with wss by default
        baseURL = baseURL.replace('http', 'ws');
    }
    return baseURL;
};