<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card">
          <q-card-section>
            <div class="text-h5 text-weight-bolder">
              Notificaciones
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section>
            <q-splitter
              v-model="splitterModel"
              style="height: auto"
              :limits="[Math.round((defaultSplitterModel/2)), defaultSplitterModel]"
            >
              <template v-slot:before>
                <q-tabs
                  v-model="tab"
                  vertical
                  class="text-black"
                >
                  <q-tab v-for="(type, index) in types" :key="'t' + index" :name="type.name" style="justify-content: flex-start;">
                    <q-item>
                      <q-item-section avatar>
                        <div style="width: 4.7rem;">
                          <q-avatar color="white" text-color="black" :icon="type.icon" :size="'xl'"></q-avatar>
                        </div>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label lines="1">
                          <span class="text-weight-medium">{{type.name}}</span>
                        </q-item-label>
                      </q-item-section>
                      <q-space />
                      <q-item-section side bottom>
                        <q-item-label caption>{{ (noRead[type.name] > 0) ? noRead[type.name] : ''}}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-tab>
                </q-tabs>
              </template>

              <template v-slot:after>
                <q-tab-panels
                  v-model="tab"
                  animated
                  transition-prev="slide-down"
                  transition-next="slide-up"
                >
                  <q-tab-panel v-for="(t, ind) in types" :key="'tp' + ind" :name="t.name">
                    <q-infinite-scroll @load="onLoad" :offset="10" :initial-index="1">
                      <q-item v-for="(x, index) in notifications[t.name]" :key="'i' + t.name + '-' + index" class="q-mx-md" style="border-radius: 25px;" :style="(x.noti_read) ? 'opacity: 0.5;' : ''" @click="read(x.noti_id, index)" clickable>
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
                  </q-tab-panel>
                </q-tab-panels>
              </template>

            </q-splitter>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import NotificationService from 'src/services/NotificationService'
import { xMisc } from 'src/mixins/xMisc.js'

export default {
  name: 'NotificationsList',
  mixins: [xMisc],
  components: {
  },
  setup () {
    return {
    }
  },
  data () {
    return {
      tab: 'TODO',
      splitterModel: 30,
      defaultSplitterModel: this.splitterModel,
      loading: false,
      types: [],
      noRead: [],
      notifications: [],
      records: [],
      isLoading: false,
      length: 5,
    }
  },
  async created () {
    await this.getData();
    await this.getNotifications(0)
    this.listen()
  },
  methods: {
    listen() {
      this.$echo.channel('notifications-user-' + this.decryptSession('user').user_id).listen('NewNotification', payload => {
        let position = (payload.notification.noti_type) ? payload.notification.noti_type : 'GENERAL'
        if (!this.notifications[position]) {
          this.types.push({ name: position, icon: ( (position === 'GENERAL') ? 'label_off' : this.getNotificationIcon(position) ) })
          this.notifications[position] = []
          this.records[position] = 0
          this.noRead[position] = 0
        }
        this.notifications[position].unshift(payload.notification)
        this.notifications['TODO'].unshift(payload.notification)
        this.records[position] += 1
        this.records['TODO'] += 1
        this.noRead[position] += 1
        this.noRead['TODO'] += 1
      })
    },
    async getData () {
      try {
        this.loading = true
        var response = await NotificationService.getNotificationsData({ token: this.decryptSession('token') })
        this.types = []
        this.types.push({ name: 'TODO', icon: 'list'})
        this.notifications['TODO'] = []
        this.records['TODO'] = null
        const types = response.data.types
        for (var i = 0; i < types.length; i++) {
          if (types[i].noti_type === null) {
            this.types.push({ name: 'GENERAL', icon: 'label_off'})
            this.notifications['GENERAL'] = []
            this.records['GENERAL'] = null
          } else {
            this.types.push({ name: types[i].noti_type, icon: this.getNotificationIcon(types[i].noti_type)})
            this.notifications[types[i].noti_type] = []
            this.records[types[i].noti_type] = null
          }
        }

        const noRead = response.data.NoRead
        this.noRead['TODO'] = 0
        for (var i = 0; i < noRead.length; i++) {
          if (noRead[i].noti_type === null) {
            this.noRead['null'] = this.noRead['null'] + noRead[i].noRead
            this.noRead['GENERAL'] = noRead[i].noRead
          } else {
            this.noRead['null'] = this.noRead['null'] + noRead[i].noRead
            this.noRead[noRead[i].noti_type] = noRead[i].noRead
          }
        }

        this.loading = false
      } catch (error) {
        this.errorsAlerts(error)
        this.loading = false
      }
    },
    async onLoad (index, done) {
      if (index > 1 && this.records[this.tab] !== this.notifications[this.tab].length && !this.isLoading) {
        await this.getNotifications(this.notifications[this.tab].length);
        done()
      }
      else {
        (this.records[this.tab] === this.notifications[this.tab].length) ? done(true) : done()
      }
    },
    async getNotifications (skip = 0) {
      try {
        if (!this.isLoading) {
          this.isLoading = true
          let filters = 'start=' + skip + '&length=' + this.length
          if (this.tab === 'TODO' || this.tab === 'GENERAL') {
            filters += (this.tab === 'TODO') ? '' : '&noti_type=null'
          } else {
            filters += '&noti_type=' + this.tab
          }
          var response = await NotificationService.getNotifications({ token: this.decryptSession('token'), filters: filters })
          this.records[this.tab] = response.data.recordsTotal
          this.noRead[this.tab] = response.data.NoRead
          const dataset = response.data.data
          for (var i = 0; i < dataset.length; i++) {
            this.notifications[this.tab].push(dataset[i])
          }
          this.isLoading = false
        }
      } catch (error) {
        this.isLoading = false
        this.errorsAlerts(error)
      }
    },
    async read (id, position) {
      try {
        if (!this.notifications[this.tab][position].noti_read) {
          var response = await NotificationService.readNotification({ token: this.decryptSession('token'), id: id })
          if (response.data.status === 'Success') {
            this.noRead[this.tab] = this.noRead[this.tab] - 1
            this.notifications[this.tab][position].noti_read = true
            let id = this.notifications[this.tab][position].noti_id
            if (
              (this.notifications[this.tab][position].noti_type && this.notifications[this.tab][position].noti_type === this.tab)
              || (this.tab === 'GENERAL')
            ) {
              this.noRead['TODO'] = this.noRead['TODO'] - 1
              this.setRead(id, 'TODO')
            } else{
              let p = (this.notifications[this.tab][position].noti_type) ? this.notifications[this.tab][position].noti_type : 'GENERAL'
              this.setRead(id, p)
            }
          }
        }
      } catch (error) {
        this.errorsAlerts(error)
      }      
    },
    setRead (id, position) {
      this.noRead[position] = this.noRead[position] - 1
      for (let index = 0; index < this.notifications[position].length; index++) {
        if (this.notifications[position][index].noti_id === id) {
          this.notifications[position][index].noti_read = true
        }
      }
    }
  }
}
</script>
<style type="text/css">
  body {
    background: #ECF0F3;
  }
</style>
