<!-- reemplazar users_users por commissions, analizar como mostrar los usuarios y el estudio (probablemente unicammente los hijos directos) -->
<template>
  <q-layout view="lHr LpR lFr">
    <q-header elevated class="bg-accent text-black">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <img src="~assets/icons/elcatillo_logo_black.png" style="width: 50px;">
          <!-- <b v-if="studioData && studioData.length !== 0" style="margin-left: 10px;"> {{ studioData.std_name }}</b> -->
          <b style="margin-left: 10px;">EL CASTILLO GROUP SAS</b>
        </q-toolbar-title>

        <NotificationPanel v-if="notification"/>

        <q-btn dense flat round @click="toggleRightDrawer" style="margin: 15px 10px 15px 0px; border: 1px solid #d5d5d5;">
          <q-avatar size="46px" :style="{backgroundColor: avatarColor, color: avatarTextColor}">
            {{shortName(sUser.user_name, sUser.user_surname)}}
          </q-avatar>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- drawer content -->
    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" bordered class="bg-black text-white">
      <!-- generals menus -->
      <q-list v-if="essentialLinks.generals.length > 0">
        <q-item-label header>Generales</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.generals" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
      <!-- shop menus -->
      <q-list v-if="essentialLinks.shop.length > 0">
        <q-item-label header>Tienda</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.shop" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
      <!-- models menus -->
      <q-list v-if="essentialLinks.models.length > 0">
        <q-item-label header>Modelos</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.models" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
      <q-list v-if="essentialLinks.commissions.length > 0">
        <q-item-label header>Comisiones</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.commissions" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
      <!-- reports menus -->
      <q-list v-if="essentialLinks.reports.length > 0">
        <q-item-label header>Reportes</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.reports" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
      <!-- system menus -->
      <q-list v-if="essentialLinks.system.length > 0">
        <q-item-label header>Sistema</q-item-label>
        <EssentialLink v-for="(link, index) in essentialLinks.system" :key="index" v-bind="link" v-model:currentUrl="currentUrl"/>
      </q-list>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" behavior="mobile" elevated :breakpoint="400">
      <q-scroll-area style="height: calc(100% - 250px); margin-top: 250px; border-right: 1px solid #ddd">
        <q-list padding>
          <q-item clickable v-ripple @click="downloadExtension()">
            <q-item-section avatar>
              <q-icon name="download" />
            </q-item-section>

            <q-item-section>
              <span >
                Descargar extensión de Chrome
                <q-chip outline size="sm" color="blue" text-color="white">
                  v {{ extensionVersion }}
                </q-chip>
              </span>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="downloadDesktopApp()">
            <q-item-section avatar>
              <q-icon name="download" />
            </q-item-section>
            <q-item-section>
              <span >
                Descargar aplicación de escritorio
                <q-chip outline size="sm" color="indigo" text-color="white">
                  v {{ desktopAppVersion }}
                </q-chip>
              </span>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="openYTVideo()">
            <q-item-section avatar>
              <q-icon name="play_arrow" />
            </q-item-section>

            <q-item-section>
              <span >
                Como instalar la extensión de Chrome
              </span>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="goTo('change-password')">
            <q-item-section avatar>
              <q-icon name="key" />
            </q-item-section>

            <q-item-section>
              Cambio de contraseña
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="logOut()" class="text-red">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>

            <q-item-section>
              Cerrar sesión
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-img class="absolute-top" src="~assets/bg/vector-abstract-landscape-illustration-1.jpg" style="height: 250px">
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm" :style="{backgroundColor: avatarColor, color: avatarTextColor}">
            {{shortName(sUser.user_name, sUser.user_surname)}}
          </q-avatar>
          <div class="text-weight-bold">{{ sUser.user_name }} {{ sUser.user_surname }}</div>
          <div>{{ sUser.user_email }}</div>
        </div>
      </q-img>
    </q-drawer>

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
      <router-view @update-user-session="updateUserSession" />
    </q-page-container>

    <q-footer class="bg-dark text-white">
      <q-toolbar>
        <div>Vr. {{ version }} | {{ sUser.user_name }} {{ sUser.user_surname }} | {{ convertUTCDateToLocalDate(nowDatetime, 'DD-MM-YYYY HH:mm:ss') }}</div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import NotificationPanel from 'components/NotificationPanel.vue'
import StudioService from 'src/services/StudioService'
import { xMisc } from '../mixins/xMisc.js'
import { sGate } from '../mixins/sGate.js'
import { nMenu } from '../mixins/nMenu.js'

const linksList = nMenu

export default defineComponent({
  name: 'MainLayout',
  mixins: [xMisc, sGate],
  components: {
    EssentialLink,
    NotificationPanel
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      notification: (process.env.NOTIFICATION_BUTTON && process.env.NOTIFICATION_BUTTON.toUpperCase() === 'TRUE'),
      env: process.env.ENVIRONMENT,
      avatarColor: '#000000',
      avatarTextColor: 'white',
      // essentialLinks: linksList,
      essentialLinks: {
        generals: [],
        shop: [],
        models: [],
        reports: [],
        system: [],
        default: [],
        commissions: []
      },
      // leftDrawer
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      // rightDrawer
      rightDrawerOpen,
      toggleRightDrawer () {
        rightDrawerOpen.value = !rightDrawerOpen.value
      },
      version: '1.11.0',
      extensionVersion: '1.0.3',
      desktopAppVersion: '2.3.0',
    }
  },
  data() {
    return {
      sUser: {
        user_name: '',
        user_surname: '',
      },
      nowDatetime: null,
      currentUrl: '',
      studioData: []
    }
  },
  created () {
    // console.log(process.env.NOTIFICATION_BUTTON)
    this.sUser = this.decryptSession('user')
    if ([2].includes(this.sUser.prof_id)) {
      this.getStudio()
    }
    // console.log(this.studioData)
    this.avatarColor = this.getRandomColor()
    this.avatarTextColor = this.getContrastYIQ(this.avatarColor)
    this.getMenu()
    // set now interval
    this.updateDatetimeNow()
    setInterval(this.updateDatetimeNow.bind(this), 1000) // update every 1 seconds

    // current Url
    var currentUrl = this.getCurrentURL()                           // http://localhost:3032/users/edit/1 || http://localhost:3032/users
    currentUrl = currentUrl.replace(/.*\/\/.*?\/(.*?)\/.*/gi, '$1') // users                              || http://localhost:3032/users
    currentUrl = currentUrl.replace(/.*\/\/.*?\/(.*?)$/gi, '$1')    // users                              || users
    this.currentUrl = currentUrl
  },
  methods: {
    getMenu (type) {
      for (var i = 0; i < linksList.length; i++) {
        // if have sGate (require permisson)
        if (linksList[i].gate) {
          if (this.openGate(linksList[i].gate, this.sUser.prof_id)) {
            this.addMenu(linksList[i])
          }
        } else {
          this.addMenu(linksList[i])
        }
      }
    },
    // add menu to group
    addMenu (menu) {
      switch (menu.group) {
      case 'generals':
        this.essentialLinks.generals.push(menu)
        break
      case 'shop':
        this.essentialLinks.shop.push(menu)
        break
      case 'models':
        this.essentialLinks.models.push(menu)
        break
      case 'reports':
        this.essentialLinks.reports.push(menu)
        break
      case 'system':
        this.essentialLinks.system.push(menu)
        break
      case 'commissions':
        this.essentialLinks.commissions.push(menu)
        break
      default:
        this.essentialLinks.default.push(menu)
        break
      }
    },
    // update sessions from child element
    updateUserSession() {
      this.sUser = this.decryptSession('user')
    },
    updateDatetimeNow() {
      this.nowDatetime = new Date
    },
    downloadExtension () {
      let version = this.extensionVersion.replace(/\./g, '');
      let https = 'https://bygeckode.com/apps/el-castillo-sso-v' + version + '.zip';
      window.location.href = https;
    },
    downloadDesktopApp () {
      window.location.href = 'https://bygeckode.com/apps/El%20Castillo%20Setup%20' + this.desktopAppVersion + '.exe';
    },
    openYTVideo() {
      let https = 'https://www.youtube.com/watch?v=o9tub9Pr2Ys';
      window.open(https, '_blank');
    },
    async getStudio () {
      const response = await StudioService.getStudios({ query: 'std_active=true', id: this.sUser.user_id, token: this.decryptSession('token') })
      if (response.data.data.length > 0) {
        this.studioData = response.data.data[0]
      }
    }
  }
})
</script>
<style type="text/css">
  body {
    background-color: #FFFAEC;
  }
  .q-drawer-container aside {
    background-color: #FAFAFA;
  }
</style>
