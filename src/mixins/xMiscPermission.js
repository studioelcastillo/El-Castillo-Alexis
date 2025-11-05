export const xMiscPermission = {
  data () {
    return {
    }
  },
  methods: {
    getPermissionValue (permission) {
      var sUser = this.decryptSession('user')
      var value = false
      if (sUser && sUser.permissions && sUser.permissions[permission] == 'SI') {
        value = true
      } else if (sUser && sUser.permissions) {
        for (var i = 0; i < sUser.permissions.length; i++) {
          if (sUser.permissions[i].userperm_feature == permission && sUser.permissions[i].userperm_state == 'SI') {
            value = true
          }
        }
      }
      return value
    }
  }
}
