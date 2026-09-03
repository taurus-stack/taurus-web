import {ElNotification  as message} from 'element-plus'
import {Session} from "/@/utils/storage";
import {getWsBaseURL} from "/@/utils/baseUrl";
// @ts-ignore
import socket from '@/types/api/socket'
import {useUserInfo} from "/@/stores/userInfo";
import { i18n } from '/@/i18n';
const t = i18n.global.t;
const websocket: socket = {
    websocket: null,
    connectURL: getWsBaseURL(),
    // Open flag
    socket_open: false,
    // Heartbeat timer
    hearbeat_timer: null,
    // Heartbeat send interval
    hearbeat_interval: 2 * 1000,
    // Whether to auto-reconnect
    is_reonnect: true,
    // Reconnect max count
    reconnect_count: 3,
    // Current reconnect count attempted
    reconnect_current: 1,
    // Reconnect timer
    reconnect_timer: null,
    // Reconnect interval
    reconnect_interval: 5 * 1000,
    init: (receiveMessage: Function | null) => {
        if (!('WebSocket' in window)) {
            message.warning(t('message.browserNotSupportWebSocket'))
            return null
        }
        const token = Session.get('token')
        if(!token){
            // message.warning('WebSocket authentication failed')
            return null
        }
        const wsUrl = `${getWsBaseURL()}ws/${token}/`
        websocket.websocket = new WebSocket(wsUrl)
        websocket.websocket.onmessage = (e: any) => {
            if (receiveMessage) {
                receiveMessage(e)
            }
        }
        websocket.websocket.onclose = (e: any) => {
            websocket.socket_open = false
            useUserInfo().setWebSocketState(websocket.socket_open);
            // Need to reconnect
            if (websocket.is_reonnect) {
                websocket.reconnect_timer = setTimeout(() => {
                    // Exceeded reconnect count
                    if (websocket.reconnect_current > websocket.reconnect_count) {
                        clearTimeout(websocket.reconnect_timer)
                        websocket.is_reonnect = false
                        websocket.socket_open = false
                        useUserInfo().setWebSocketState(websocket.socket_open);
                        return
                    }
                    // Record reconnect count
                    websocket.reconnect_current++
                    websocket.reconnect()
                }, websocket.reconnect_interval)
            }
        }
        // Connected successfully
        websocket.websocket.onopen = function () {
            websocket.socket_open = true
            useUserInfo().setWebSocketState(websocket.socket_open);
            websocket.is_reonnect = true
            // Reset reconnect count after successful connection to avoid permanent stop after cumulative disconnections
            websocket.reconnect_current = 1
            // Start heartbeat
            websocket.heartbeat()
        }
        // Connection error
        websocket.websocket.onerror = function () { }
    },
    heartbeat: () => {
        websocket.hearbeat_timer && clearInterval(websocket.hearbeat_timer)

        websocket.hearbeat_timer = setInterval(() => {
            let data = {
                token: Session.get('token')
            }
            websocket.send(data)
        }, websocket.hearbeat_interval)
    },
    send: (data:string, callback = null) => {
        // Send directly if open
        if (websocket.websocket.readyState === websocket.websocket.OPEN) {
            websocket.websocket.send(JSON.stringify(data))
            // @ts-ignore
            callback && callback()
        } else {
            clearInterval(websocket.hearbeat_timer)
            // message({
            //     type: 'warning',
            //     message: 'Socket connection lost',
            //     duration: 1000,
            // })
            websocket.socket_open = false
            useUserInfo().setWebSocketState(websocket.socket_open);
        }
    },
    close: () => {
        websocket.is_reonnect = false
        // Clean up heartbeat and reconnect timers
        websocket.hearbeat_timer && clearInterval(websocket.hearbeat_timer)
        websocket.reconnect_timer && clearTimeout(websocket.reconnect_timer)
        if (websocket.websocket) {
            websocket.websocket.close()
            websocket.websocket = null;
        }
        websocket.socket_open = false
        useUserInfo().setWebSocketState(websocket.socket_open);
    },
    /**
     * Reconnect
     */
    reconnect: () => {
        if (websocket.websocket && !websocket.is_reonnect) {
            websocket.close()
        }
        websocket.init(null)
    },
}
export default websocket;
