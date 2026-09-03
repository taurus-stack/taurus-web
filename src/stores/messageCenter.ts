import {defineStore} from "pinia";
/**
 * Message center
 */
export const messageCenterStore = defineStore('messageCenter', {
    state: () => ({
        // Unread messages
        unread: 0
    }),
    actions: {
        async setUnread (number:any) {
           this.unread = number
        }
    },
});
