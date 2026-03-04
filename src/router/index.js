import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import AuthService from 'src/services/AuthService'
import { decryptSession } from 'src/mixins/xMisc.js'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */


export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE) // default process.env.VUE_ROUTER_BASE = '/'
  })

  // Se heredo de la version anterior pero no se documento que hace (validar despues)
  Router.beforeEach((to, from, next) => {
    document.title = to.meta.title
    // Si la ruta de navegacion a donde se dirige es /logout >> elimina sesion
    if (to.name === 'logout') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('dashboard_user')
      window.location.href = '/login'
    }

    const reqSession = to.matched.some(route => route.meta.requiresSession)
    // Validate session with AuthService
    if (reqSession && localStorage.getItem('token')) {
      try {
        AuthService.checkSession({ token: decryptSession('token') }).then(isValidSession => {
          if (isValidSession.data?.session === "active") {
            next()
          } else {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            localStorage.removeItem('dashboard_user')
            window.location.href = '/login'
          }
        }).catch(error => {
          // console.error('Error validating session:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          localStorage.removeItem('dashboard_user')
          window.location.href = '/login'
        })
      } catch (error) {
        // console.error('Error validating session:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('dashboard_user')
        window.location.href = '/login'
      }
    } else if (!reqSession) {
      if (to.name === 'login' && localStorage.getItem('token')) {
        //next({ name: 'home' })
        window.location.href = '/dashboard'
      } else {
        next()
      }
    } else {
      window.location.href = '/login'
      //next({ name: 'login' })
    }
  })

  return Router
})
