<template>
  <q-layout view="lHr LpR lFr">

    <q-header v-if="showHeader" elevated class="text-white" style="background-color: #115767">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-img
            class="q-my-xs"
            width="185px"
            fit="fill"
            src="~assets/icons/logo.png"
          />
          <!-- <b style="color: #3e295f; margin-left: 10px;"><u>Geckode</u></b> Threshold -->
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- drawer content -->
    <q-page-container>
      <!-- env -->
      <div v-if="env === 'test'" style="width: 100%;">
        <center>
          <div style="
            background-color: #00b59b;
            margin-bottom: 10px;
            padding-top: 5px;
            height: 40px;
            width: 100%;
            text-align: center;
            font-weight: bolder;
            font-size: 20px;
            color: white;
          ">AMBIENTE DE PRUEBAS
          </div>
        </center>
      </div>
      <!-- content -->
      <div class="row q-col-gutter-sm justify-center">
        <div class="col-md-9 col-xs-12">
          <router-view />
        </div>
      </div>
    </q-page-container>

  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { xMisc } from '../mixins/xMisc.js'
import { sGate } from '../mixins/sGate.js'
import { nMenu } from '../mixins/nMenu.js'

const linksList = nMenu

export default defineComponent({
  name: 'MainLayout',
  mixins: [xMisc, sGate],
  components: {
  },
  props: {
    showHeader: {
      type: Boolean,
      default: true
    },
    showFAB: {
      type: Boolean,
      default: false
    }
  },
  setup () {
    return {
      notification: (process.env.NOTIFICATION_BUTTON && process.env.NOTIFICATION_BUTTON.toUpperCase() === 'TRUE'),
      env: process.env.ENVIRONMENT,
      sUser: {
        user_name: '',
        user_email: '',
      },
      avatarColor: '#000000',
      avatarTextColor: 'white',
      // essentialLinks: linksList,
      essentialLinks: {
        generals: [],
        cv: [],
        reports: [],
        system: [],
      },
    }
  },
  data() {
    return {
      nowDatetime: null,
      wspTooltip: false,
    }
  },
  created () {
    console.log(process.env.NOTIFICATION_BUTTON)
    this.avatarColor = this.getRandomColor()
    this.avatarTextColor = this.getContrastYIQ(this.avatarColor)
    this.getMenu()
    // set now interval
    this.updateDatetimeNow()
    setInterval(this.updateDatetimeNow.bind(this), 1000) // update every 1 seconds
    // set now interval
    // this.validateActive()
    // setInterval(this.validateActive.bind(this), 1000) // update every 1 seconds

    // wsp fab animation
    var _this = this
    this.wspTooltip = true
    setTimeout(() => {
      _this.wspTooltip = false
    }, 10000)
  },
  methods: {
    getMenu (type) {},
    // add menu to group
    addMenu (menu) {
      switch (menu.group) {
      case 'generals':
        this.essentialLinks.generals.push(menu)
        break
      case 'cv':
        this.essentialLinks.cv.push(menu)
        break
      case 'reports':
        this.essentialLinks.reports.push(menu)
        break
      case 'system':
        this.essentialLinks.system.push(menu)
        break
      default:
        this.essentialLinks.default.push(menu)
        break
      }
    },
    updateDatetimeNow() {
      this.nowDatetime = new Date
    },
    validateActive() {
      console.log('onValidaActive')
      // validate active
      var currentUrl = this.getCurrentURL()                         // http://localhost:3032/users/edit/1 || http://localhost:3032/users
      currentUrl = currentUrl.replace(/.*\/\/.*?\/(.*?)\//gi, '$1') // users                              || http://localhost:3032/users       
      currentUrl = currentUrl.replace(/.*\/\/.*?\/(.*?)$/gi, '$1')  // users                              || users                      

      // // loop links
      // for (var i = 0; i < this.essentialLinks.generals.length; i++) {
      //   if (currentUrl === this.essentialLinks.generals[i].link) {
      //     this.essentialLinks.generals[i].active = true
      //   } else {
      //     this.essentialLinks.generals[i].active = false
      //   }        
      // }
      // for (var i = 0; i < this.essentialLinks.system.length; i++) {
      //   if (currentUrl === this.essentialLinks.system[i].link) {
      //     this.essentialLinks.system[i].active = true
      //   } else {
      //     this.essentialLinks.system[i].active = false
      //   }        
      // }

      for (var i = 0; i < linksList.length; i++) {
        if (currentUrl === linksList[i].link) {
          linksList[i].active = true
        } else {
          linksList[i].active = false
        }        
      }

      linksList.push({
        title: 'Inicio2',
        group: 'generals',
        // caption: 'quasar.dev',
        icon: 'home',
        link: 'home',
      })

      this.essentialLinks.generals = []
      this.essentialLinks.system = []
      this.getMenu()
    }
  }
})
</script>
<style type="text/css">
  body {
    background-color: #ECF0F3;
  }
  .q-drawer-container aside {
    background-color: #FAFAFA;
  }
</style>
