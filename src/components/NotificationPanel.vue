<template>
  <q-btn v-if="!routeIsNotification" round icon="notifications" class="q-mr-md" @click="fixedNotifications()" @mouseleave="closeNotifications()" @mouseover="openNotifications()">
    <q-badge v-if="noRead > 0" floating color="red" rounded> {{ noRead }} </q-badge>
    <q-menu fit v-model="showNotifications" @mouseleave="closeNotifications(2)" @mouseover="openNotifications(2)">
      <q-list class="q-my-md" style="min-width: 100px">
        <q-banner inline-actions class="q-pa-sm q-mx-lg">
          <div class="text-h5 text-weight-bolder">
            NOTIFICACIONES
          </div>
          <template v-slot:action>
            <q-btn flat color="primary" label="Ver todo" @click="goTo('notifications')"/>
          </template>
        </q-banner>
        <q-infinite-scroll @load="onLoad" :offset="10" :initial-index="1">
          <q-item v-for="(x, index) in notifications" :key="index" class="q-mx-md" style="border-radius: 25px;" :style="(x.noti_read) ? 'opacity: 0.5;' : ''" @click="read(x.noti_id, index)" clickable>
            <q-item-section avatar>
              <div style="width: 4.7rem;">
                <q-btn round :size="(x.noti_type) ? 'md' : 'lg'">
                  <q-avatar color="white" text-color="black" :icon="getMenuIcon(x.noti_menu)" :size="(x.noti_type) ? 'md' : 'xl'"></q-avatar>
                </q-btn>
                <template v-if="x.noti_type">
                  <q-avatar :color="getNotificationColor(x.noti_type)" text-color="white" :icon="getNotificationIcon(x.noti_type)" size="md" style="position: relative; bottom: -10px; right: 15px;"></q-avatar>
                </template>
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label lines="1">
                <span class="text-weight-medium">{{x.noti_title}}</span>
              </q-item-label>
              <q-item-label caption>{{x.noti_data}}</q-item-label>
            </q-item-section>
            <q-item-section side bottom>
              <q-item-label caption>{{fromNow((x.created_at) ? x.created_at : Date())}}</q-item-label>
            </q-item-section>
          </q-item>
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script>
import NotificationService from 'src/services/NotificationService'
import { defineComponent, ref } from 'vue'
import { xMisc } from '../mixins/xMisc.js'
import { sGate } from '../mixins/sGate.js'

export default defineComponent({
  name: 'NotificationPanel',
  mixins: [xMisc, sGate],
  data() {
    return {
      showing: false,
      showing2: false,
      fixed: false,
      isOverNotification: false,
      indexNotification: 1,
      notifications: [],
      length: 4,
      records: null,
      isLoading: false,
      noRead: 0
    }
  },
  computed: {
    showNotifications() {
      return (this.fixed || (this.showing || this.showing2))
    },
    routeIsNotification() {
      return (this.$route.path === '/notifications')
    }
  },
  watch: {
    async routeIsNotification () {
      if (!this.routeIsNotification) {
        this.notifications = []
        this.records = null
        this.noRead = 0
        await this.getNotifications(0)
      }
    }
  },
  async created () {
    await this.getNotifications(0)
    this.listen()
  },
  methods: {
    listen() {
      this.$echo.channel('notifications-user-' + this.decryptSession('user').user_id).listen('NewNotification', payload => {
        this.notifications.unshift(payload.notification)
        this.records += 1
        this.noRead += 1
        this.$q.notify({
          type: 'info',
          message: `Tienes una nueva notificacion`
        })
      })
    },
    async onLoad (index, done) {
      if (index > 1 && this.records !== this.notifications.length && !this.isLoading) {
        await this.getNotifications(this.notifications.length);
        done()
      }
      else {
        (this.records === this.notifications.length) ? done(true) : done()
      }
    },
    async getNotifications (skip = 0) {
      try {
        if (!this.isLoading) {
          this.isLoading = true
          let filters = 'start=' + skip + '&length=' + this.length
          var response = await NotificationService.getNotifications({ token: this.decryptSession('token'), filters: filters })
          this.records = response.data.recordsTotal
          this.noRead = response.data.NoRead
          const dataset = response.data.data
          for (var i = 0; i < dataset.length; i++) {
            this.notifications.push(dataset[i])
          }
          this.isLoading = false
        }
      } catch (error) {
        this.isLoading = false
        this.errorsAlerts(error)
      }
    },
    fixedNotifications () {
      this.fixed = !this.fixed
    },
    openNotifications (op = 1) {
      let show = (op === 1) ? this.showing : this.showing2
      if (!show) {
        (op === 1) ? this.showing = true : this.showing2 = true
      }
    },
    async closeNotifications (op = 1) {
      await this.sleep(200); 
      this.closeNotificationsMenu(op);
    },
    closeNotificationsMenu (op = 1) {
      let show = (op === 1) ? this.showing : this.showing2
      if (show) {
        (op === 1) ? this.showing = false : this.showing2 = false
      }
    },
    sleep (ms) {
      return new Promise(
        resolve => setTimeout(resolve, ms)
      )
    },
    async read (id, position) {
      try {
        if (!this.notifications[position].noti_read) {
          var response = await NotificationService.readNotification({ token: this.decryptSession('token'), id: id })
          if (response.data.status === 'Success') {
            this.noRead = this.noRead - 1
            this.notifications[position].noti_read = true
          }
        }
      } catch (error) {
        this.errorsAlerts(error)
      }      
    }
  }
})
</script>
