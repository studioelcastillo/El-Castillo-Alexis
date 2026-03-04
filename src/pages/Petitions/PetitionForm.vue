<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <q-card flat bordered class="my-card" v-if="!disabledView">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-card-section v-if="!isDialog">
              <div class="q-px-md q-gutter-sm">
                <q-btn
                  color="black"
                  @click="goTo('petitions')"
                  :label="'&lt; ' + 'Regresar'"
                />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{ initTitle }}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card
              flat
              bordered
              class="my-card bg-warning text-black q-px-sm"
              v-if="modelStudioNotFound"
            >
              <q-card-section>
                <div class="q-pa-md q-gutter-sm">
                  <!--<h3><b></b></h3>-->
                  <h5 class="subtitle">
                    No se encontro ningun estudio con contrato activo
                  </h5>
                </div>
              </q-card-section>
            </q-card>
            <div v-else>
              <q-card-section>
                <h5 v-if="!isDialog" class="is-size-3">{{ initTitle }}</h5>
                <br v-if="!isDialog" />
                <!-- Datos Basicos -->
                <q-card flat bordered class="my-card">
                  <q-card-section>
                    <h6 v-if="!isDialog">Datos solicitud</h6>

                    <div class="row q-col-gutter-sm">
                      <div class="col-xs-12 col-sm-12">
                        <q-select
                          filled
                          v-model="petition.type"
                          label="Tipo"
                          label-color="primary"
                          :options="types"
                          lazy-rules
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          :readonly="
                            mode == 'show' ||
                            mode == 'edit' ||
                            readonlyFields.type
                          "
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="
                          openGate('create-petitions', sUser.prof_id) &&
                          mode == 'create'
                        "
                      >
                        <q-select
                          filled
                          v-model="petition.user_id"
                          label="Modelo"
                          label-color="primary"
                          use-input
                          hide-selected
                          fill-input
                          :options="models"
                          @filter="getModels"
                          hint="Digitar al menos 3 caracteres para seleccionar modelo"
                          @update:model-value="updatedUser"
                        >
                          <template v-slot:no-option>
                            <q-item>
                              <q-item-section class="text-grey">
                                Sin resultados
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="
                          openGate('create-petitions', sUser.prof_id) &&
                          (mode == 'show' ||
                            mode == 'edit' ||
                            studios_models.length > 1)
                        "
                      >
                        <q-select
                          filled
                          v-model="petition.stdmod_id"
                          label="Contrato"
                          label-color="primary"
                          :options="studios_models"
                          lazy-rules
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          :readonly="
                            mode == 'show' ||
                            mode == 'edit' ||
                            readonlyFields.stdmod_id
                          "
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="
                          petition.type == 'REPORTE' ||
                          mode == 'show' ||
                          mode == 'edit'
                        "
                      >
                        <select-pages-options
                          v-model="petition.page[0]"
                          :mode="mode"
                          :readonly="
                            mode == 'show' ||
                            mode == 'edit' ||
                            readonlyFields.page
                          "
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="
                          petition.type == 'CREACIÓN DE CUENTA' &&
                          mode == 'create'
                        "
                      >
                        <br />
                        <h5>Páginas</h5>
                        <br />
                        <check-pages-options
                          v-model="petition.page"
                          :mode="mode"
                          @validate-max-petitions="validateMaxPetitions"
                          :user-id="petition.user_id"
                          :not-include-pages="notIncludePages"
                        />
                        <h6 v-if="petition.user_id != 0">
                          Solicitudes en curso ({{
                            petition.page.length + page_count_pending_petitions
                          }}/4)
                        </h6>
                        <span v-if="pagesErrorShow" class="text-red"
                          >Debe ingresar al menos una pagina</span
                        ><br />
                      </div>
                      <div
                        :class="
                          mode == 'create'
                            ? 'col-xs-12 col-sm-12'
                            : 'col-xs-12 col-sm-6'
                        "
                      >
                        <q-input
                          filled
                          v-model="petition.nick"
                          :label="mode !== 'create' ? 'Nick sugerido' : 'Nick'"
                          label-color=""
                          lazy-rules
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          :readonly="
                            mode == 'show' ||
                            mode == 'edit' ||
                            readonlyFields.nick
                          "
                        />
                      </div>
                      <div class="col-xs-12 col-sm-6" v-if="mode !== 'create'">
                        <q-input
                          filled
                          v-model="petitionStateSend.ptn_nick_final"
                          label="Nick"
                          label-color=""
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          readonly
                        />
                      </div>
                      <div
                        :class="
                          mode == 'create'
                            ? 'col-xs-12 col-sm-12'
                            : 'col-xs-12 col-sm-6'
                        "
                      >
                        <q-input
                          filled
                          v-model="petition.password"
                          :label="
                            mode !== 'create' ? 'Clave sugerida' : 'Clave'
                          "
                          label-color=""
                          lazy-rules
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          :readonly="
                            mode == 'show' ||
                            mode == 'edit' ||
                            readonlyFields.password
                          "
                        />
                      </div>
                      <div class="col-xs-12 col-sm-6" v-if="mode !== 'create'">
                        <q-input
                          filled
                          v-model="petitionStateSend.ptn_password_final"
                          label="Clave"
                          label-color=""
                          :rules="[(val) => !!val || 'Este campo es requerido']"
                          readonly
                        />
                      </div>
                      <div class="col-xs-12 col-sm-12" v-if="mode !== 'create'">
                        <q-input
                          filled
                          v-model="petitionStateSend.ptn_payment_pseudonym"
                          label="Pseudónimo de pago"
                          label-color=""
                          readonly
                        />
                      </div>
                      <div class="col-xs-12 col-sm-12" v-if="mode !== 'create'">
                        <q-input
                          filled
                          v-model="petitionStateSend.ptn_mail"
                          label="Correo"
                          label-color=""
                          readonly
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="
                          mode !== 'create' && petition.page[0] == 'XLOVECAM'
                        "
                      >
                        <q-input
                          filled
                          v-model="petition.linkacc"
                          label="Link de cuenta"
                          label-color=""
                          readonly
                        />
                      </div>
                      <div class="col-xs-12 col-sm-12" v-if="mode == 'create'">
                        <q-input
                          filled
                          v-model="petition.observation"
                          label="Observacion"
                          label-color=""
                          lazy-rules
                          :readonly="
                            mode == 'show' || readonlyFields.observation
                          "
                          type="textarea"
                        />
                      </div>
                    </div>
                  </q-card-section> </q-card
                ><br />
                <q-card
                  flat
                  bordered
                  class="my-card"
                  v-if="this.mode == 'edit' || this.mode == 'show'"
                >
                  <q-card-section>
                    <h6 v-if="!isDialog">Modelo</h6>
                    <div class="row q-col-gutter-sm">
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="mode == 'show' || mode == 'edit'"
                      >
                        <q-input
                          filled
                          v-model="model.name"
                          label="Modelo"
                          label-color=""
                          lazy-rules
                          readonly
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="mode == 'show' || mode == 'edit'"
                      >
                        <q-input
                          filled
                          v-model="model.identification"
                          label="Identificación"
                          label-color=""
                          lazy-rules
                          readonly
                        />
                      </div>
                      <div
                        class="col-xs-12 col-sm-12"
                        v-if="mode == 'show' || mode == 'edit'"
                      >
                        <q-input
                          filled
                          v-model="model.category"
                          label="Categoria"
                          label-color=""
                          lazy-rules
                          readonly
                        />
                      </div>
                    </div>
                    <div v-if="additionalModels.length > 0">
                      <q-separator spaced="0px" /><br />
                      <h6>
                        Datos compañer@<span v-if="additionalModels.length > 1"
                          >s</span
                        >
                      </h6>
                      <div
                        v-for="(additionalModel, amkey) in additionalModels"
                        class="row q-col-gutter-sm"
                        :key="amkey"
                      >
                        <div class="col-xs-12 col-sm-12">
                          <span>Compañer@ {{ amkey + 1 }} : </span>
                        </div>
                        <div class="col-xs-12 col-sm-4">
                          <q-input
                            filled
                            v-model="additionalModel.name"
                            label="Nombre"
                            label-color=""
                            readonly
                          />
                        </div>
                        <div class="col-xs-12 col-sm-4">
                          <q-input
                            filled
                            v-model="additionalModel.identification"
                            label="Identificación"
                            label-color=""
                            readonly
                          />
                        </div>
                        <div class="col-xs-12 col-sm-4">
                          <q-input
                            filled
                            type=""
                            v-model="additionalModel.birthdate"
                            label="Fecha nacimiento"
                            label-color="primary"
                            mask="date"
                            readonly
                          />
                        </div>
                      </div>
                    </div>
                    <br />
                    <div>
                      <q-btn
                        color="primary"
                        icon="file_download"
                        label="Documentos"
                        @click="downloadModelDocs"
                      />
                    </div>
                  </q-card-section> </q-card
                ><br />
              </q-card-section>
              <q-separator inset />
              <q-card-section v-if="mode == 'create'">
                <div>
                  <q-btn
                    type="submit"
                    class="bg-primary text-white submit1"
                    label="Enviar"
                  />
                </div>
              </q-card-section>
              <q-card-section
                v-else-if="
                  mode == 'show' && openGate('edit-petitions', sUser.prof_id)
                "
              >
                <div>
                  <q-btn
                    class="bg-primary text-white submit1"
                    label="Editar"
                    @click="this.mode = 'edit'"
                  />
                </div>
              </q-card-section>
            </div>
          </q-form>
          <q-card-section
            v-if="(mode == 'show' || mode == 'edit') && !modelStudioNotFound"
          >
            <h6>Estados de la solicitud</h6>
            <q-stepper
              v-model="step"
              vertical
              animated
              header-nav
              ref="stepper"
            >
              <q-step
                v-for="(petitionState, key) in petitionsStates"
                :key="key"
                :name="key + 1"
                :title="statesLabels[petitionState.ptnstate_state]"
                :caption="convertUTCDateToLocalDate(petitionState.created_at)"
                :icon="this.statesIcons[petitionState.ptnstate_state]"
                :done-icon="this.statesIcons[petitionState.ptnstate_state]"
                :active-icon="this.statesIcons[petitionState.ptnstate_state]"
                :done="true"
                :active-color="this.statesColors[petitionState.ptnstate_state]"
                :inactive-color="
                  this.statesColors[petitionState.ptnstate_state]
                "
                :done-color="this.statesColors[petitionState.ptnstate_state]"
              >
                {{ petitionState.ptnstate_observation }}
                <br />
                <span style="font-size: 12px">{{
                  petitionState.user.user_name +
                  " " +
                  petitionState.user.user_name2 +
                  " " +
                  petitionState.user.user_surname +
                  " " +
                  petitionState.user.user_surname2
                }}</span>
              </q-step>
              <q-step
                v-if="
                  this.mode == 'edit' &&
                  openGate('edit-petitions', sUser.prof_id) &&
                  showLastStep
                "
                :name="petitionsStates.length + 1"
                title="Siguiente estado"
                icon="double_arrow"
                done-icon="double_arrow"
                active-icon="double_arrow"
                active-color="blue-10"
              >
                <q-form
                  ref="petitionStateForm"
                  @submit.prevent="submitForm"
                  :lazy-validation="true"
                >
                  <div class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-12">
                      <q-input
                        filled
                        v-model="petitionStateSend.ptn_nick_final"
                        label="Nick"
                        label-color=""
                        lazy-rules
                        :rules="[(val) => !!val || 'Este campo es requerido']"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-12">
                      <q-input
                        filled
                        v-model="petitionStateSend.ptn_mail"
                        label="Correo"
                        label-color=""
                        lazy-rules
                        :rules="[(val) => !!val || 'Este campo es requerido']"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-12">
                      <q-input
                        filled
                        v-model="petitionStateSend.ptn_password_final"
                        label="Clave"
                        label-color=""
                        lazy-rules
                        :rules="[(val) => !!val || 'Este campo es requerido']"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-12">
                      <q-input
                        filled
                        v-model="petitionStateSend.ptn_payment_pseudonym"
                        label="Pseudónimo de pago"
                        label-color=""
                        lazy-rules
                        :rules="[(val) => !!val || 'Este campo es requerido']"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-12">
                      <q-input
                        filled
                        v-model="petitionStateSend.ptnstate_observation"
                        label="Observación"
                        label-color=""
                        lazy-rules
                        type="textarea"
                        @update:model-value="onObservationInput"
                      />
                      <div
                        v-if="previousObservations.length > 0"
                        class="q-mt-sm"
                      >
                        <q-btn
                          v-for="(obs, index) in previousObservations"
                          :key="index"
                          @click="selectObservation(obs)"
                          :color="'primary'"
                          :text-color="getContrastYIQ('primary')"
                          :style="{ backgroundColor: 'primary' }"
                          class="q-mb-sm observation-btn"
                          no-caps
                          align="left"
                        >
                          <div class="observation-text">{{ obs }}</div>
                        </q-btn>
                      </div>
                    </div>
                    <div
                      class="col-xs-12 col-sm-12"
                      v-if="petition.page[0] == 'XLOVECAM'"
                    >
                      <q-input
                        filled
                        v-model="petition.linkacc"
                        label="Link de cuenta"
                        label-color=""
                        lazy-rules
                        :rules="[(val) => !!val || 'Este campo es requerido']"
                      />
                    </div>
                  </div>
                </q-form>
                <q-stepper-navigation>
                  <q-btn
                    flat
                    @click="submitState('APROBADA')"
                    color="primary"
                    :label="
                      stateConfirmBtn[
                        petitionsStates[petitionsStates.length - 1]
                          .ptnstate_state
                      ]
                    "
                    :class="
                      'q-ml-sm text-' +
                      stateConfirmBtnColors[
                        petitionsStates[petitionsStates.length - 1]
                          .ptnstate_state
                      ]
                    "
                  />
                  <q-btn
                    flat
                    @click="submitState('RECHAZADA')"
                    color="primary"
                    label="Rechazar"
                    class="q-ml-sm text-red"
                  />
                </q-stepper-navigation>
              </q-step>
            </q-stepper>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import PetitionService from "src/services/PetitionService";
import UserService from "src/services/UserService";
import { supabase } from "src/supabaseClient";
import CheckPagesOptions from "./CheckPagesOptions.vue";
import SelectPagesOptions from "src/components/SelectPagesOptions.vue";
import { xMisc } from "src/mixins/xMisc.js";
import { sGate } from "src/mixins/sGate.js";

export default {
  name: "Petition-form",
  mixins: [xMisc, sGate],
  components: { CheckPagesOptions, SelectPagesOptions },
  props: {
    isDialog: {
      type: String,
      default: null,
    },
    parentTable: {
      type: String,
      default: null,
    },
    parentField: {
      type: String,
      default: null,
    },
    parentId: {
      type: Number,
      default: null,
    },
    dialogChildId: {
      type: Number,
      default: null,
    },
    modeprop: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      sUser: {},
      mode: this.$route.params.id ? "edit" : "create",
      initTitle: "Crear solicitud",
      petition: {
        id: 0,
        type: "",
        nick: "",
        password: "",
        page: [],
        page_before: [],
        page_count_pending_petitions: 0,
        observation: "",
        user_id: 0,
        stdmod_id: 0,
        linkacc: "",
      },
      studios_models: [],
      models: [],
      pagesErrorShow: false,
      petitionUserName: "",
      readonlyFields: {
        type: false,
        nick: false,
        page: false,
        observation: false,
        password: false,
        user_id: false,
        stdmod_id: false,
      },
      types: ["CREACIÓN DE CUENTA", "REPORTE"],
      pages: [
        "BONGACAMS",
        "CAM4",
        "CAMSODA ALIADOS",
        "CHATURBATE",
        "FLIRT4FREE",
        "IMLIVE",
        "LIVEJASMIN",
        "ONLYFANS",
        "MYDIRTYHOBBY",
        "MYFREECAMS",
        "SKYPRIVATE",
        "STREAMATE",
        "STREAMRAY",
        "STRIPCHAT",
        "XHAMSTER",
        "XLOVECAM",
        "CHERRY",
        "DREAMCAM",
      ],
      notIncludePages: [],
      petitionsStates: [],
      petitionStateSend: {
        ptn_payment_pseudonym: "",
        ptn_nick_final: "",
        ptn_mail: "",
        ptn_password_final: "",
        ptnstate_observation: "",
      },
      petitionStateObservation: "",
      step: 1,
      statesColors: {
        "EN PROCESO": "orange",
        PENDIENTE: "deep-purple",
        APROBADA: "green",
        RECHAZADA: "red",
      },
      statesIcons: {
        "EN PROCESO": "settings",
        PENDIENTE: "hourglass_bottom",
        APROBADA: "done",
        RECHAZADA: "close",
      },
      stateTransitionApprove: {
        "EN PROCESO": "PENDIENTE",
        PENDIENTE: "APROBADA",
      },
      stateConfirmBtn: {
        "EN PROCESO": "Procesar",
        PENDIENTE: "Aprobar",
      },
      stateConfirmBtnColors: {
        "EN PROCESO": "deep-purple",
        PENDIENTE: "green",
      },
      statesLabels: {
        "EN PROCESO": "ABIERTO",
        PENDIENTE: "EN PROCESO",
        APROBADA: "APROBADA",
        RECHAZADA: "RECHAZADA",
      },
      model: {
        user_id: 0,
        name: "",
        identification: "",
        category: "",
      },
      additionalModels: [],
      showLastStep: false,
      sended: false,
      modelStudioNotFound: false,
      disabledView: false,
      previousObservations: [],
    };
  },
  mounted() {
    this.sUser = this.decryptSession("user");
    if (this.openGate("create-petition-own", this.sUser.prof_id)) {
      this.petition.user_id = this.sUser.user_id;
      this.checkModelAssociatedToStudio();
      this.getStudiosModelsByModel();
    }
    if (this.modeprop != "") {
      this.mode = this.modeprop;
    } else if (
      (this.$route.params.id && !this.isDialog) ||
      (this.isDialog && this.parentId !== null && this.dialogChildId !== null)
    ) {
      this.mode = "edit";
    }

    if (
      this.mode === "create" &&
      !(
        this.openGate("create-petition-own", this.sUser.prof_id) ||
        this.openGate("create-petitions", this.sUser.prof_id)
      )
    ) {
      this.disabledView = true;
    }
    if (this.mode === "edit" || this.mode === "show") {
      this.getData();
    }
    this.getMaxPetitions();
  },
  methods: {
    async onSubmit() {
      if (this.petition.page.length == 0) {
        this.pagesErrorShow = true;
        return;
      }
      try {
        this.activateLoading("Cargando");
        if (!this.sended) {
          this.sended = true;
          if (
            this.mode === "create" &&
            (this.openGate("create-petitions", this.sUser.prof_id) ||
              this.openGate("create-petition-own", this.sUser.prof_id))
          ) {
            var record = await PetitionService.addPetitions({
              ptn_type: this.petition.type,
              ptn_nick: this.petition.nick,
              ptn_password: this.petition.password,
              ptn_page: this.petition.page,
              user_id: this.openGate("create-petitions", this.sUser.prof_id)
                ? this.petition.user_id.value
                : this.petition.user_id,
              stdmod_id: this.petition.stdmod_id.value,
              ptnstate_observation: this.petition.observation,
              token: this.decryptSession("token"),
            });
            this.alert("positive", "Creado");
            this.petition.id = record.data.data.ptn_id;
          }
          this.sended = false;
          //var modeUrl = (this.openGate('edit-petitions', this.sUser.prof_id)) ? 'edit' : 'show'
          this.goTo("petitions");
        }
        this.disableLoading();
      } catch (error) {
        // console.log(error)
        this.disableLoading();
        if (
          error.response &&
          error.response.data &&
          error.response.data.code &&
          error.response.data.message
        ) {
          if (error.response.data.code === "UNEXPECTED_ERROR") {
            this.alert("negative", error.response.data.message);
          } else if (error.response.data.code === "MISSING_DOCUMENTS") {
            this.$q.notify({
              message:
                '<a href="' +
                (this.openGate("create-petitions", this.sUser.prof_id)
                  ? this.getFrontUrl(
                      "users/edit/" + this.petition.user_id.value,
                      "_blank"
                    )
                  : this.getFrontUrl("myprofile", "_blank")) +
                '" target="_blank">' +
                error.response.data.message +
                "</a>",
              html: true,
              color: "warning",
              textColor: "black",
              actions: [
                {
                  icon: "supervisor_account",
                  color: "black",
                  round: true,
                  handler: () => {
                    this.openGate("create-petitions", this.sUser.prof_id)
                      ? this.goTo(
                          "users/edit/" + this.petition.user_id.value,
                          "_blank"
                        )
                      : this.goTo("myprofile", "_blank");
                  },
                },
              ],
            });
            // this.alert('warning', )
          } else {
            this.alert("warning", error.response.data.message);
          }
        } else {
          this.errorsAlerts(error);
        }
        this.sended = false;
      }
    },
    async getData() {
      if (this.mode === "edit") {
        this.initTitle = "Gestionar solicitud";
      } else if (this.mode === "show") {
        this.initTitle = "Ver solicitud";
      }

      try {
        this.activateLoading("Cargando");
        const ptn_id = this.$route.params.id;
        var response = await PetitionService.getPetition({
          id: ptn_id,
          token: this.decryptSession("token"),
        });
        if (response.data.data.length > 0) {
          this.petition.id = response.data.data[0].ptn_id;
          this.petition.type = response.data.data[0].ptn_type;
          this.petition.nick = response.data.data[0].ptn_nick;
          this.petition.password = response.data.data[0].ptn_password;
          this.petition.page[0] = response.data.data[0].ptn_page;
          this.petition.user_id = response.data.data[0].user_id;
          this.petitionsStates = response.data.data[0].petition_state;
          this.model.user_id = response.data.data[0].user.user_id;
          this.model.name =
            response.data.data[0].user.user_name +
            " " +
            response.data.data[0].user.user_name2 +
            " " +
            response.data.data[0].user.user_surname +
            " " +
            response.data.data[0].user.user_surname2;
          this.model.identification =
            response.data.data[0].user.user_identification;
          this.model.category = response.data.data[0].user.user_model_category;
          this.petitionStateSend.ptn_payment_pseudonym =
            response.data.data[0].ptn_payment_pseudonym;
          this.petitionStateSend.ptn_nick_final =
            response.data.data[0].ptn_nick_final;
          this.petitionStateSend.ptn_mail = response.data.data[0].ptn_mail;
          this.petitionStateSend.ptn_password_final =
            response.data.data[0].ptn_password_final;
          this.petition.stdmod_id = {
            label:
              response.data.data[0].studio_model.stdmod_id +
              " " +
              response.data.data[0].studio_model.studio.std_name,
            value: 0,
          };
          this.petition.linkacc = response.data.data[0].ptn_linkacc;

          this.additionalModels = [];
          response.data.data[0].user.additional_models.forEach(
            (additional_model, index) => {
              this.additionalModels.push({
                name: additional_model.usraddmod_name,
                identification: additional_model.usraddmod_identification,
                birthdate: additional_model.usraddmod_birthdate,
              });
            }
          );
          this.showLastStep = !["APROBADA", "RECHAZADA"].includes(
            this.petitionsStates[this.petitionsStates.length - 1].ptnstate_state
          )
            ? true
            : false;
        } else {
          this.disabledView = true;
        }
        this.disableLoading();
      } catch (error) {
        this.errorsAlerts(error);
        this.disableLoading();
      }
    },
    async getMaxPetitions() {
      if (
        this.mode === "create" &&
        (this.openGate("create-petition-own", this.sUser.prof_id) ||
          typeof this.petition.user_id.value !== "undefined")
      ) {
        const userId = this.openGate("create-petition-own", this.sUser.prof_id)
          ? this.petition.user_id
          : this.petition.user_id.value;
        var response = await PetitionService.getAccountCreations({
          user_id: userId,
          token: this.decryptSession("token"),
        });
        this.page_count_pending_petitions = response.data.data.length;
        this.petition.page = [];
        this.notIncludePages = response.data.data;
      }
    },
    async insertState(state) {
      const stateToTransition =
        state === "APROBADA"
          ? this.stateTransitionApprove[
              this.petitionsStates[this.petitionsStates.length - 1]
                .ptnstate_state
            ]
          : "RECHAZADA";
      if (this.openGate("edit-petitions", this.sUser.prof_id)) {
        const titleDialog = state === "APROBADA" ? "¿APROBAR?" : "¿RECHAZAR?";
        const actionDialog = state === "APROBADA" ? "aprobar" : "rechazar";
        this.$q
          .dialog({
            title: titleDialog,
            message:
              "¿Estas seguro que deseas " + actionDialog + " esta solicitud?",
            cancel: true,
            persistent: true,
          })
          .onOk(() => {
            if (!this.sended) {
              this.sended = true;
              this.sendState(stateToTransition);
              this.petitionStateObservation = "";
              this.getData();
            }
            this.sended = false;
          });
      }
    },
    submitState(state) {
      if (state === "RECHAZADA") {
        this.insertState(state);
      } else {
        const form = this.$refs.petitionStateForm;
        form.validate().then((success) => {
          if (success) {
            this.insertState(state);
          }
        });
      }
    },
    async sendState(stateToTransition) {
      try {
        var record = await PetitionService.addPetitionState({
          ptn_id: this.petition.id,
          ptnstate_state: stateToTransition,
          ptnstate_observation: this.petitionStateSend.ptnstate_observation,
          ptn_nick_final: this.petitionStateSend.ptn_nick_final,
          ptn_mail: this.petitionStateSend.ptn_mail,
          ptn_password_final: this.petitionStateSend.ptn_password_final,
          ptn_payment_pseudonym: this.petitionStateSend.ptn_payment_pseudonym,
          ptn_linkacc: this.petition.linkacc,
          token: this.decryptSession("token"),
        });
      } catch (error) {
        this.disableLoading();
        if (
          error.response &&
          error.response.data &&
          error.response.data.code &&
          error.response.data.message
        ) {
          if (error.response.data.code === "UNEXPECTED_ERROR") {
            this.alert("negative", error.response.data.message);
          } else {
            this.alert("warning", error.response.data.message);
          }
        } else {
          this.errorsAlerts(error);
        }
      }
    },
    async downloadModelDocs() {
      try {
        const { data } = await supabase.storage
          .from("el-castillo")
          .list(`documents/users/${this.model.user_id}`);

        if (data && data.length > 0) {
          for (const file of data) {
            const { data: fileData } = supabase.storage
              .from("el-castillo")
              .getPublicUrl(
                `documents/users/${this.model.user_id}/${file.name}`
              );
            if (fileData?.publicUrl) {
              window.open(fileData.publicUrl, "_blank");
            }
          }
        } else {
          this.alert("info", "No se encontraron documentos para este usuario");
        }
      } catch (error) {
        console.error("Error downloading documents:", error);
        this.alert("warning", "Error al descargar documentos");
      }
    },
    validateMaxPetitions() {
      if (this.petition.page.length > 4 - this.page_count_pending_petitions) {
        this.petition.page = this.petition.page_before;
      } else {
        this.petition.page_before = this.petition.page;
        this.pagesErrorShow = false;
      }
    },
    async getModels(val, update, abort) {
      if (val.length < 3) {
        abort();
        return;
      }
      try {
        var response = await UserService.getModelsByOwnerStudio({
          search: val,
          prof_ids: [4, 5],
          token: this.decryptSession("token"),
        });
        update(() => {
          this.models = response.data.data;
        });
      } catch (error) {
        this.errorsAlerts(error);
      }
    },
    async checkModelAssociatedToStudio() {
      var response = await PetitionService.checkModelStudio({
        user_id: this.sUser.user_id,
        token: this.decryptSession("token"),
      });
      this.modelStudioNotFound = response.data.status == "fail" ? true : false;
    },
    async getStudiosModelsByModel() {
      try {
        const user_id = this.openGate("create-petitions", this.sUser.prof_id)
          ? this.petition.user_id.value
          : this.petition.user_id;
        var response = await PetitionService.getStudiosModelsByModel({
          user_id: user_id,
          token: this.decryptSession("token"),
        });
        this.studios_models = response.data.data;
        this.petition.stdmod_id = this.studios_models[0];
      } catch (error) {
        this.disableLoading();
        if (
          error.response &&
          error.response.data &&
          error.response.data.code &&
          error.response.data.message
        ) {
          if (error.response.data.code === "UNEXPECTED_ERROR") {
            this.alert("negative", error.response.data.message);
          } else {
            this.alert("warning", error.response.data.message);
          }
        } else {
          this.errorsAlerts(error);
        }
      }
    },
    updatedUser() {
      this.getMaxPetitions();
      this.getStudiosModelsByModel();
    },
    async onObservationInput() {
      if (
        this.petitionStateSend.ptnstate_observation &&
        this.petitionStateSend.ptnstate_observation.length > 0
      ) {
        console.log(this.petitionStateSend.ptnstate_observation);
        try {
          const response = await PetitionService.getPreviousObservations({
            search: this.petitionStateSend.ptnstate_observation,
            token: this.decryptSession("token"),
          });
          this.previousObservations = response.data.data || [];
        } catch (error) {
          this.previousObservations = [];
        }
      } else {
        this.previousObservations = [];
      }
    },
    selectObservation(observation) {
      this.petitionStateSend.ptnstate_observation = observation;
      this.previousObservations = [];
    },
  },
};
</script>

<style scoped>
.observation-btn {
  height: auto !important;
  min-height: 32px !important;
  padding: 8px 12px !important;
  border-radius: 16px !important;
}

.observation-text {
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  text-align: left !important;
  line-height: 1.2 !important;
}
</style>
