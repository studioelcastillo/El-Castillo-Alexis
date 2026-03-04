<template>
  <div class="row index">
    <div class="col-md-5 col-sm-5 col-xs-12 login">
      <div class="logo">
        <center>
          <img
            src="~assets/icons/elcatillo_logo_black.png"
            alt="solidaria"
            style="height: 160px"
          />
        </center>
      </div>
      <center>
        <div class="form">
          <q-form @submit="login">
            <table>
              <tr>
                <td>
                  <q-input
                    ref="mail"
                    class="txtfield"
                    v-model="email"
                    filled
                    type="text"
                    label="Correo / Cédula"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <q-input
                    ref="password"
                    class="txtfield"
                    v-model="password"
                    filled
                    :type="isPwd ? 'password' : 'text'"
                    label="Contraseña"
                    required
                  >
                    <template v-slot:append>
                      <q-icon
                        :name="isPwd ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="isPwd = !isPwd"
                      />
                    </template>
                  </q-input>
                </td>
              </tr>
              <tr>
                <td style="text-align: right">
                  <!--<q-btn icon="policy" />-->
                  <q-checkbox v-model="policyAgreement" />
                  <a href @click="showDialog"> Acepto política de datos </a>
                </td>
              </tr>
              <tr>
                <br />
              </tr>
              <tr>
                <td style="text-align: right">
                  <a href="recovery-password" class="text-accent"
                    >Olvidé la clave</a
                  >
                </td>
              </tr>
              <tr>
                <td>
                  <q-btn
                    type="submit"
                    class="login-form-btn bg-primary"
                    label="iniciar sesión"
                  />
                </td>
              </tr>
              <tr>
                <td>
            <q-separator color="gray" size="12" class="q-my-md" />
          </td>
        </tr>
            </table>
            <q-dialog v-model="policyAgreementModal">
              <q-card style="width: 85%; max-width: 80vw">
                <q-card-section class="row items-center">
                  <q-avatar icon="policy" color="primary" text-color="white" />
                  <span class="q-ml-sm">Política de datos</span>
                  <br />
                  <span
                    class="q-ml-sm q-mt-md"
                    v-html="replace(policyAgreementDescription)"
                  ></span>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="No acepto"
                    color="primary"
                    @click="policyAgreement = false"
                    v-close-popup
                  />
                  <q-btn
                    flat
                    label="Acepto"
                    color="primary"
                    @click="policyAgreement = true"
                    v-close-popup
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-form>
        </div>
      </center>
      <br />
    </div>
  </div>
</template>
<script>
import AuthService from "src/services/AuthService";
import ApiModuleService from "src/services/ApiModuleService";
import { xMisc } from "src/mixins/xMisc.js";
export default {
  name: "LoginPage",
  mixins: [xMisc],
  components: {},
  data() {
    return {
      email: "",
      password: "",
      remember: false,
      isPwd: true,
      policyAgreement: false, // comprueba la respuesta del usuario
      policyAgreementModal: false,
      policyAgreementDescription: "",
      policyAgreementId: 0,
    };
  },
  mounted() {
    this.getDataPolicy();
  },
  methods: {
    showDialog(event) {
      event.preventDefault();
      this.policyAgreementModal = true;
    },
    async getDataPolicy() {
      try {
        const response = await AuthService.getActiveDataPolicy();
        this.policyAgreementDescription = response.data.data.pol_description;
        this.policyAgreementId = response.data.data.pol_id;
      } catch (error) {
        console.log(error);
      }
    },
    async login() {
      // let user
      let sesion;
      try {
        sesion = await AuthService.login({
          email: this.email,
          password: this.password,
          policyId: this.policyAgreementId,
          policyAnswer: this.policyAgreement,
        });
        if (sesion.data.status === "Success") {
          this.encryptSession("user", sesion.data.data.user);
          this.encryptSession("token", sesion.data.data.access_token);
          this.encryptSession("loghist", sesion.data.data.lgnhist_id);
          // Cargar permisos dinámicos de API para la sesión
          try {
            const user = sesion.data.data.user;
            if (user && user.user_id && user.prof_id) {
              const { data: perms } =
                await ApiModuleService.loadUserPermissions(
                  user.user_id,
                  user.prof_id
                );
              if (perms) {
                sessionStorage.setItem(
                  "api_permissions",
                  JSON.stringify(perms)
                );
              }
            }
          } catch (e) {
            console.warn(
              "[Login] No se pudieron cargar permisos dinámicos:",
              e.message
            );
          }
          this.vSession();
        } else {
          this.alert("warning", "Usuario y/o contraseña incorrectos");
        }
      } catch (error) {
        // console.log(error)
        // console.log(error.message)
        // console.log(error.response.data)
        if (error.response && error.response.status === 400) {
          this.alert("warning", "Usuario y/o contraseña incorrectos");
        } else if (
          error.response &&
          error.response.data &&
          error.response.status === 402
        ) {
          this.alert("warning", "Politica de datos no encontrada");
        } else if (
          error.response &&
          error.response.data &&
          error.response.status === 403
        ) {
          this.alert("warning", "Politica de datos no aceptada");
        } else if (
          error.response &&
          error.response.data &&
          error.response.status === 401
        ) {
          this.alert("warning", "Usuario y/o contraseña incorrectos");
        } else if (error && error.message) {
          this.alert("negative", error.message);
        } else {
          this.alert("negative", "Error con los credeciales de sesión");
        }
      }
    },
    replace(string) {
      return string.replace(/(?:\r\n|\r|\n)/g, "<br>");
    },
  },
};
</script>
<style type="text/css">
body {
  background: linear-gradient(135deg, #f8f4e9 5%, #e5d18e 95%, #f8f4e9 100%);
}

hr {
  text-align: center;
}

hr:after {
  background: #fff;
  content: "O";
  padding: 0 4px;
  position: relative;
  top: -13px;
  color: gray;
}
</style>
