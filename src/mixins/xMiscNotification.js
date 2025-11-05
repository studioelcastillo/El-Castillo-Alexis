import { nMenu } from '../mixins/nMenu.js'

/* INDEX
 * getNotificationIcon(): Return icon
 * getNotificationColor(): Return color.
 * getMenuIcon(): Return icon from menu
 */

export const xMiscNotification = {
  data () {
    return {
      notificationTypes: {
        CREATE: {
          icon: 'add',
          color: 'green'
        },
        UPDATE: {
          icon: 'edit',
          color: 'yellow'
        },
        DELETE: {
          icon: 'clear',
          color: 'red'
        },
        INFO: {
          icon: 'info',
          color: 'blue'
        }
      }
    }
  },
  methods: {
    // return icon
    getNotificationIcon (type) {
      return (this.notificationTypes[type]) ? this.notificationTypes[type].icon : ''
    },
    // return color
    getNotificationColor (type) {
      return (this.notificationTypes[type]) ? this.notificationTypes[type].color : ''
    },
    // return icon from menu
    getMenuIcon (menu) {
      let icon = ''
      for (let index = 0; index < nMenu.length; index++) {
        if (nMenu[index].link.toLowerCase() === menu.toLowerCase()) {
          icon = nMenu[index].icon
        }
      }
      return icon
    }
  }
}
