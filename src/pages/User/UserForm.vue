<template>
  <div class="q-pa-md">
    <div class="row">
      <div v-if="disableView" class="col-12"></div>
      <div v-else class="col-12">
        <q-card flat bordered class="my-card">
          <q-form
            @submit="onSubmit"
            class="q-gutter-md"
            @change="checkUsersCoincidence"
          >
            <q-card-section v-if="!isDialog && this.mode !== 'edit-myprofile'">
              <div class="q-px-md q-gutter-sm">
                <q-btn color="black" @click="goTo('users')" :label="'&lt; ' + 'Regresar'" />
              </div>
            </q-card-section>

            <q-separator v-if="!isDialog" class="q-my-none" inset />

            <q-card-section v-if="isDialog" class="row items-center q-pb-none">
              <h5 class="is-size-3">{{initTitle}}</h5>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator v-if="isDialog" inset />

            <q-card-section>
              <div  class="flex justify-between items-center w-full">
                <div>
                  <h5 v-if="!isDialog" class="is-size-3">{{initTitle}}</h5>
                </div>
                <div v-if="skipUserCoincidenceLength > 0">
                  <a href onclick="event.preventDefault()" @click="$refs.usercoincidence.showComponent()" style="font-size:18px;"> 
                    <q-icon name="warning" color="warning" size="sm" />
                    Existen otros {{ skipUserCoincidenceLength }} usuarios que coinciden
                  </a>
                </div>
              </div>
              
              <br v-if="!isDialog">

              <!-- Datos Basicos -->
              <q-card flat bordered class="my-card">
                <q-card-section>
                  <h6 v-if="!isDialog">Datos Basicos</h6>

                    <div class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-12" v-if="this.mode !== 'edit-myprofile'">
                      <q-select
                      filled
                      v-model="user.prof_id"
                      label="Perfil"
                      label-color="primary"
                      :options="profiles"
                      lazy-rules
                      :rules="[
                        val => !!val || 'Este campo es requerido'
                      ]"
                      :readonly="mode == 'show' || readonlyFields.prof_id || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      /><br>
                    </div>
                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      v-model="user.name"
                      label="Nombre"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => !!val || 'Este campo es requerido',
                        val => (this.validateOnlyLetters(val) || this.user.prof_id.value === 2) || 'Debe digitar unicamente letras'
                      ]"
                      :readonly="mode == 'show' || readonlyFields.name || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-input
                      filled
                      v-model="user.name2"
                      label="Segundo nombre"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        val => this.validateOnlyLetters(val) || 'Debe digitar unicamente letras',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.name2 || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type=""
                      v-model="user.surname"
                      label="Apellidos"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        val => (this.validateOnlyLetters(val) || this.user.prof_id.value === 2) || 'Debe digitar unicamente letras'
                      ]"
                      :readonly="mode == 'show' || readonlyFields.surname || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-input
                      filled
                      type=""
                      v-model="user.surname2"
                      label="Segundo apellido"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        val => this.validateOnlyLetters(val) || 'Debe digitar unicamente letras',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.surname2 || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type="email"
                      v-model="user.personal_email"
                      label="Email personal"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validarEmail(val) || 'Por favor escriba un correo real',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.personal_email || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)" class="col-xs-12 col-sm-6">
                      <q-select
                      filled
                      v-model="user.identification_type"
                      label="Tipo Identificación"
                      label-color=""
                      :options="['CEDULA DE CIUDADANÍA', 'CEDULA DE EXTRANJERÍA', 'PASAPORTE', 'NIT', 'PEP']"
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.identification_type || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)" class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type=""
                      v-model="user.issued_in"
                      label="Lugar de expedición"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.issued_in || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type=""
                      v-model="user.identification"
                      label="Identificación"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => !!val || 'Este campo es requerido',
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        val => this.validateMinLength(val, 5) || 'Mínimo 5 caracteres',
                        val => /^[a-zA-Z0-9]*$/.test(val) || 'Espacio o carácteres inválidos'
                      ]"
                      :readonly="mode == 'show' || readonlyFields.identification || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-select
                      filled
                      v-model="user.sex"
                      label="Sexo"
                      label-color=""
                      :options="['', 'MASCULINO', 'FEMENINO', 'OTRO']"
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.sex || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type=""
                      v-model="user.telephone"
                      label="Teléfono"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        val => this.validateMinLength(val, 6) || 'Mínimo 6 caracteres',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.telephone || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6">
                       <q-input
                      filled
                      type=""
                      v-model="user.birthdate"
                      label="Fecha nacimiento"
                      label-color="primary"
                      mask="date"
                      :rules="(mode != 'edit-myprofile') ? [
                        val => !!val || 'Este campo es requerido'
                      ] : []"
                      readonly
                      >
                      <template v-slot:append v-if="mode != 'show' && mode != 'edit-myprofile' && (mode== 'create' || openGate('edit-users', sUser.prof_id) || openGate('myprofile', sUser.prof_id))">
                        <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="user.birthdate" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                          </q-date>
                        </q-popup-proxy>
                        </q-icon>
                      </template>
                      </q-input>
                    </div>

                    <div class="col-xs-12 col-sm-6">
                      <q-input
                      filled
                      type=""
                      v-model="user.address"
                      label="Dirección"
                      label-color=""
                      lazy-rules
                      :rules="[
                        val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.address || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-select
                      filled
                      v-model="user.country"
                      label="Pais"
                      label-color=""
                      :options="countries"
                      lazy-rules
                      :rules="[
                        val => !!val.value || 'Este campo es requerido',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.country || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      @update:model-value="updateDepartments"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-select
                      filled
                      v-model="user.department"
                      label="Departamento"
                      label-color=""
                      :options="departments"
                      lazy-rules
                      :rules="[
                        val => !!val.value || 'Este campo es requerido',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.department || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      @update:model-value="updateCities"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-select
                      filled
                      v-model="user.city_id"
                      label="Ciudad"
                      label-color=""
                      :options="cities"
                      lazy-rules
                      :rules="[
                        val => !!val.value || 'Este campo es requerido',
                      ]"
                      :readonly="mode == 'show' || readonlyFields.city_id || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-select
                      filled
                      v-model="user.rh"
                      label="RH"
                      label-color=""
                      :options="['', 'A +', 'A -', 'B +', 'B -', 'AB +', 'AB -', 'O +', 'O -']"
                      lazy-rules
                      :readonly="mode == 'show' || readonlyFields.model_category || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>

                    <div class="col-xs-12 col-sm-6" v-if="user.prof_id !== null && openGate('models-fields-users-create', user.prof_id.value)">
                      <q-select
                      filled
                      v-model="user.model_category"
                      label="Categoria"
                      label-color=""
                      :options="['HETEROSEXUAL', 'HOMOSEXUAL', 'TRANSEXUAL', 'PAREJA']"
                      lazy-rules
                      :rules="(mode != 'edit-myprofile') ? [
                        val => !!val || 'Este campo es requerido'
                      ] : []"
                      :readonly="mode == 'show' || readonlyFields.model_category || mode === 'edit-myprofile'  || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                    </div>
                    </div>
                    <div v-if="user.prof_id && openGate('models-fields-users-create', user.prof_id.value) && user.model_category == 'PAREJA'">
                    <q-separator spaced="0px"/><br>
                    <h6>Datos compañer@<span v-if="additionalModels.length > 1">s</span></h6>
                    <q-btn v-if="mode != 'show' && mode != 'edit-myprofile' && openGate('edit-users', sUser.prof_id)" square color="teal" icon="add" @click="addPartner()"/><br><br>
                    <div v-for="(additionalModel, amkey) in additionalModels" class="row q-col-gutter-sm" :key="amkey">
                      <div class="col-xs-12 col-sm-12">
                      <span>Compañer@ {{ amkey + 1 }} : </span>
                      <a v-if="mode != 'show' && mode != 'edit-myprofile'" class="text-red text-h5 text-weight-bolder" style="cursor: pointer; margin-left: 2px" @click="deletePartner(amkey)"> <q-icon name="indeterminate_check_box"/> </a>
                      </div>
                      <div class="col-xs-12 col-sm-4">
                      <q-input
                        filled
                        v-model="additionalModel.name"
                        label="Nombre"
                        label-color=""
                        lazy-rules
                        :rules="[
                        val => !!val || 'Este campo es requerido',
                        val => this.validateOnlyLetters(val) || 'Debe digitar unicamente letras',
                        ]"
                        :readonly="mode == 'show' || mode == 'edit-myprofile' || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
                      />
                      </div>
                      <div class="col-xs-12 col-sm-4">
                      <q-input
                        filled
                        v-model="additionalModel.identification"
                        label="Identificación"
                        label-color=""
                        lazy-rules
                        :rules="[
                        val => !!val || 'Este campo es requerido'
                        ]"
                        :readonly="mode == 'show' || mode == 'edit-myprofile' || (!openGate('edit-users', sUser.prof_id) && mode == 'edit' && !openGate('myprofile', sUser.prof_id))"
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
                        :rules="[
                        val => !!val || 'Este campo es requerido',
                        ]"
                        readonly
                      >
                        <template v-slot:append v-if="mode != 'show' && mode != 'edit-myprofile' && (mode == 'create' || openGate('edit-users', sUser.prof_id) || openGate('myprofile', sUser.prof_id))">
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="additionalModel.birthdate" mask="YYYY-MM-DD">
                            <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                          </q-popup-proxy>
                        </q-icon>
                        </template>
                      </q-input>
                      </div>
                    </div>
                  </div>
                  <q-separator spaced="0px" v-if="user.prof_id && openGate('models-fields-users-create', user.prof_id.value)" /><br>
                  <div v-if="user.prof_id && openGate('models-fields-users-create', user.prof_id.value)" class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-12">
                      <div>
                        <span>Imagen:</span>
                        <q-icon name="question_mark" size="2rem">
                          <q-tooltip class="bg-black" anchor="center right" self="center left" max-width="35rem">
                            <div style="font-size: 14px; white-space: pre-line;">Recomendado subir imagen con una relacion de aspecto 1:1</div>
                          </q-tooltip>
                        </q-icon>
                        <br>
                        <br>
                        <q-file
                          v-show="false"
                          v-model="user.image"
                          @update:model-value="handleImageUpload"
                          ref="image"
                          v-if="user.prof_id.value !== 4 && user.prof_id.value !== 5"
                        />
                        <div
                          class="my-card text-white"
                          style="display: flex; height: 16rem; width: 16rem; justify-content: center; align-items: end; border-radius: 500px; overflow: auto;"
                          :style="{
                            backgroundImage: 'url(' + ((imageUrl === '') ? '/src/assets/icons/models.png' : imageUrl) + ')',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundColor: '#b5b5b5',
                            cursor: ((mode == 'create' || mode == 'edit') && (user.prof_id.value !== 4 && user.prof_id.value !== 5)) ? 'pointer' : 'inherit'
                          }"
                          @click="((mode == 'create' || mode == 'edit') && (openGate('edit-users', sUser.prof_id) || openGate('myprofile', sUser.prof_id))) ? this.$refs.image.$el.click() : false"
                        >
                          <q-btn v-if="(mode == 'create' || mode == 'edit') && (openGate('edit-users', sUser.prof_id) || openGate('myprofile', sUser.prof_id)) && (user.prof_id.value !== 4 && user.prof_id.value !== 5)" flat style="width: 100%; background-color: #000000;"><q-icon name="add_a_photo" style="color: #E5D18E;"/></q-btn>
                        </div>
                      </div>
                      <br>
                    </div>
                    <div class="col-xs-12 col-sm-12">
                      <q-input v-if="mode == 'show' || mode == 'edit-myprofile' || (!openGate('edit-users', sUser.prof_id) && !openGate('myprofile', sUser.prof_id))" filled type="" label="Activo" label-color="primary" readonly>
                        <template v-slot:append>
                          <q-chip v-if="user.active" color="green-3">SI</q-chip>
                          <q-chip v-else  color="red-3">NO</q-chip>
                        </template>
                      </q-input>
                      <q-toggle
                        v-else
                        v-model="user.active"
                        color="green"
                        :label="(user.active) ? 'Activo' : 'Inactivo'"
                        checked-icon="check"
                        unchecked-icon="clear"
                      />
                      <br>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <br>
              <!-- Datos Bancarios -->
              <q-card flat bordered class="my-card">
                <q-card-section>
                  <h6 v-if="!isDialog">Datos Bancarios</h6>

                  <div class="row q-col-gutter-sm">
                    <div class="col-xs-4 col-sm-4">
                      <gk-autocomplete
                        filled
                        v-model="user.bank_entity"
                        label="Banco"
                        label-color=""
                        :options="[
                          '',
                          'BANCO DE BOGOTA',
                          'BANCO POPULAR',
                          'BANCOLOMBIA',
                          'BANCO BBVA',
                          'COLPATRIA',
                          'BANCO DE OCCIDENTE',
                          'BANCO CAJA SOCIAL',
                          'BANCO DAVIVIENDA',
                          'BANCO AV VILLAS',
                          'BANCOOMEVA',
                          'SCOTIABANK',
                          'NEQUI'
                        ]"
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.bank_entity || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>

                    <div class="col-xs-4 col-sm-4">
                      <q-input
                        filled
                        type=""
                        v-model="user.bank_account"
                        label="Nro. de cuenta"
                        label-color=""
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.bank_account || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>

                    <div class="col-xs-4 col-sm-4">
                      <q-select
                        filled
                        v-model="user.bank_account_type"
                        label="Tipo de cuenta"
                        label-color=""
                        :options="['', 'CORRIENTE', 'AHORRO']"
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.bank_account_type || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>

                    <div class="col-xs-4 col-sm-4">
                      <q-input
                        filled
                        type=""
                        v-model="user.beneficiary_name"
                        label="Nombre del beneficiario"
                        label-color=""
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.beneficiary_name || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>

                    <div class="col-xs-4 col-sm-4">
                      <q-input
                        filled
                        type=""
                        v-model="user.beneficiary_document"
                        label="Nro. de documento del beneficiario"
                        label-color=""
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.beneficiary_document || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>

                    <div class="col-xs-4 col-sm-4">
                      <q-select
                        filled
                        v-model="user.beneficiary_document_type"
                        label="Tipo de identificación del beneficiario"
                        label-color=""
                        :options="['', 'CEDULA CUIDADANIA', 'CEDULA EXTRANJERIA', 'PASAPORTE', 'NIT', 'PPT']"
                        lazy-rules
                        :rules="[
                          val => this.validateMaxLength(val, 255) || 'Máximo 255 caracteres',
                        ]"
                        :readonly="mode == 'show' || readonlyFields.beneficiary_document_type || !openGate('edit-users-bank-data', sUser.prof_id)"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

            </q-card-section>

            <q-separator inset />

            <user-other-permissions
              v-if="user.prof_id && user.prof_id.value === 3"
              filled
              v-model="user.otherPermissions"
              label="Otros permisos y funcionalidades especiales"
              :readonly="mode == 'show'"
            />
            <q-separator v-if="user.prof_id && user.prof_id.value === 3" inset />
            <studio-model-form-fields
              v-if ="openGate('add-users-with-contract', sUser.prof_id) && mode === 'create'"
              v-model="studioModel"
              mode="create_stepper"
            />
            <q-separator v-if="openGate('add-users-with-contract', sUser.prof_id)" inset />

            <q-card-section v-if="mode == 'create' || mode == 'edit' || mode == 'edit-myprofile'">
              <div>
                <div class="flex justify-between items-center w-full">
                  <div>
                    <q-btn v-if="openGate('edit-users', sUser.prof_id) || openGate('edit-users-bank-data', sUser.prof_id) || (openGate('myprofile', sUser.prof_id) && mode === 'edit-myprofile')" type="submit" class="bg-primary text-white submit1" label="Enviar"/>
                    <q-btn v-if="mode == 'edit'" @click="(isDialog) ? this.$emit('close') : this.mode = 'show';" label="Cancelar" />
                    <q-btn v-else-if="mode != 'edit-myprofile'" @click="(isDialog) ? this.$emit('close') : goTo('users')" label="Cancelar" />
                  </div>
                  <div v-if="skipUserCoincidenceLength > 0">
                    <a href onclick="event.preventDefault()" @click="$refs.usercoincidence.showComponent()" style="font-size:18px;"> 
                      <q-icon name="warning" color="warning" size="sm" />
                      Existen otros {{ skipUserCoincidenceLength }} usuarios que coinciden
                    </a>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-section v-else-if="mode == 'show'">
              <div>
                <q-btn v-if="openGate('edit-users', sUser.prof_id)" class="bg-primary text-white submit1" label="Editar" @click="this.mode = 'edit'" />
              </div>
            </q-card-section>
          </q-form>
        </q-card><br>

        <q-card flat bordered class="my-card" v-if="(this.mode == 'show' || this.mode == 'edit' || this.mode == 'edit-myprofile')">
          <q-card-section>
            <h5 class="is-size-3">Documentos</h5><br>
            <q-list bordered class="rounded-borders">
              <template v-for="(modelImgs, expansion_index) in modelsImgs" :key="expansion_index">
                <q-expansion-item
                  v-if="expansion_index == 0 || user.model_category == 'PAREJA'"
                  expand-separator
                  :icon="modelsImgsIcons[expansion_index]"
                  :label="(expansion_index === 0) ? user.name + ' ' + user.name2 +' ' + user.surname + ' ' + user.surname2 : additionalModels[expansion_index - 1].name"
                  :caption="'Modelo ' + (expansion_index + 1)"
                >
                  <q-card>
                    <q-card-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-xs-12 col-sm-4 row q-mt-sm q-mb-sm flex items-end" v-for="(modelImg, doc_index) in modelImgs" :key="doc_index">
                          <div style="width: 95%;" class="flex items-end">
                            <div class="flex items-center justify-between">
                              <h6 style="min-width: " >{{ modelsLabels[doc_index] }}:</h6>
                              <q-icon name="question_mark" size="2rem">
                                <q-tooltip class="bg-black" anchor="bottom middle" self="top middle" max-width="35rem">
                                  <div style="font-size: 14px; white-space: pre-line;">{{ modelsImgsInfo[doc_index] }}</div>
                                </q-tooltip>
                              </q-icon>  
                            </div>
                            <q-file
                              v-show="false"
                              v-model="modelImg.img_file"
                              @update:model-value="handleDocumentUpload(expansion_index, doc_index)"
                              :ref="'modelsImgs' + expansion_index"
                            />
                            <div
                              class="my-card text-white full-width"
                              style="display: flex; height: 25rem; justify-content: center; align-items: end; border-radius: 0px; overflow: auto;"
                              :style="{
                                backgroundImage: 'url(' + ((modelImg != null && modelImg.img_url !== '') ? modelImg.img_url : this.getApiUrl('/images/models/documents_preview/' + modelsLabelsDocs[doc_index] + '.jpeg')) + ')',
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundColor: 'rgba(255,255,255,0.4)',
                                backgroundBlendMode: (modelImg != null && modelImg.img_url !== '') ? 'normal' : 'lighten',
                                cursor: ((mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (!openGate('myprofile', sUser.prof_id))) ? 'pointer' : 'inherit'
                              }"
                              @click="((mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id))) ? this.$refs[refToModelsImg(expansion_index)][doc_index].$el.click() : false"
                            >
                              <div class="flex justify-between" style="width:100%;">
                                <q-btn v-if="(mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id))" flat :style="{ width: (modelImg.img_url === '') ? '100%' : '48%', backgroundColor: 'rgba(0,0,0,1)'}">
                                  <q-icon name="add_a_photo" style="color: #E5D18E;"/>
                                </q-btn>
                                <q-btn v-if="openGate('delete-multimedia', sUser.prof_id) && modelImg.img_url !== ''" @click="deleteDocument($event,modelImg.doc_id, 'document', [expansion_index, doc_index])" flat style="width: 48%; background-color: #F44336;">
                                  <q-icon name="delete_forever" style="color: white;"/>
                                </q-btn>
                              </div>
                            </div>
                          </div>
                          <br>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
        <br>
        <q-card flat bordered class="my-card" v-if="(this.mode == 'show' || this.mode == 'edit' || this.mode == 'edit-myprofile')">
          <q-card-section>
            <h5 class="is-size-3">Multimedia</h5><br>
            <q-list bordered class="rounded-borders">
              <q-expansion-item
                expand-separator
                icon="play_arrow"
                label="Videos"
              >
                <div style="padding-right: 1rem; padding-left: 1rem;">
                  <div class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-1 q-mt-sm q-mb-sm q-pr-sm" v-if="(openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id)) && (mode == 'create' || mode == 'edit' || mode == 'edit-myprofile')">
                      <div style="width: 95%; height: 100%;">
                        <q-file
                          v-show="false"
                          v-model="videoFile"
                          @update:model-value="uploadVideoDocument"
                          ref="videofile"
                        />
                        <div
                          class="my-card text-white full-width"
                          style="display: flex; height: 100%; justify-content: center; align-items: end; border-radius: 0px; overflow: auto;"
                          :style="{
                            backgroundImage: 'url(' + this.getApiUrl('/uploads/videos/video_upload.png') + ')',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            minHeight: '10rem',
                            cursor: (mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') ? 'pointer' : 'inherit'
                          }"
                          @click="((mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id))) ? this.$refs.videofile.$el.click() : false"
                        >
                          <q-btn v-if="(mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id))" flat style="width: 100%; background-color: #000000;"><q-icon name="video_call" style="color: #E5D18E;"/></q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                  <br>
                  <q-list bordered class="rounded-borders" v-for="(videos, key) in videosUploaded" :key="key">
                    <q-expansion-item
                      expand-separator
                      :label="key"
                    >
                      <q-card>
                        <q-card-section>
                          <div class="row q-col-gutter-sm">
                            <div class="col-xs-12 col-sm-3 q-mt-sm q-mb-sm q-pr-sm" v-for="(video, key2) in videos" :key="key2">
                              <video id="video-presentation" controls controlsList="nodownload" style="width: 100%; max-height: 20rem;">
                                <source :src="this.getApiUrl('/uploads/videos/' + video.doc_url)" type="video/mp4">
                              </video>
                              <q-btn v-if="openGate('delete-multimedia', sUser.prof_id)" @click="deleteDocument($event, video.doc_id, 'video')" flat style="width: 100%; background-color: #F44336;"><q-icon name="delete_forever" style="color: white;"/></q-btn>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </q-list>
                </div>
              </q-expansion-item>
              <q-expansion-item
                expand-separator
                icon="image"
                label="Imagenes"
              >
                <div style="padding-right: 1rem; padding-left: 1rem;">
                  <div class="row q-col-gutter-sm">
                    <div class="col-xs-12 col-sm-1 q-mt-sm q-mb-sm q-pr-sm" v-if="(openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id)) && (mode == 'create' || mode == 'edit' || mode == 'edit-myprofile')">
                      <div style="width: 95%; height: 100%;">
                        <q-file
                          v-show="false"
                          v-model="imageFile"
                          @update:model-value="uploadImageMultimediaDocument"
                          ref="imagefile"
                        />
                        <div
                          class="my-card text-white full-width"
                          style="display: flex; height: 100%; justify-content: center; align-items: end; border-radius: 0px; overflow: auto;"
                          :style="{
                            backgroundImage: 'url(' + this.getApiUrl('/uploads/images/image_upload.png') + ')',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            minHeight: '10rem',
                            cursor: (mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') ? 'pointer' : 'inherit'
                          }"
                          @click="((mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id))) ? this.$refs.imagefile.$el.click() : false"
                        >
                          <q-btn v-if="(mode == 'create' || mode == 'edit' || mode == 'edit-myprofile') && (openGate('add-multimedia', sUser.prof_id) || openGate('myprofile', sUser.prof_id))" flat style="width: 100%; background-color: #000000;"><q-icon name="add_photo_alternate" style="color: #E5D18E;"/></q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                  <br>
                  <q-list bordered class="rounded-borders" v-for="(images, key) in imagesUploaded" :key="key">
                    <q-expansion-item
                      expand-separator
                      :label="key"
                    >
                      <q-card>
                        <q-card-section>
                          <div class="row q-col-gutter-sm">
                            <div class="col-xs-12 col-sm-3 q-mt-sm q-mb-sm q-pr-sm" v-for="(image, key2) in images" :key="key2">
                              <img :src="this.getApiUrl('/uploads/images/' + image.doc_url)" :alt="image.doc_label" style="width: 100%; max-height: 20rem;"> 
                              <q-btn v-if="openGate('delete-multimedia', sUser.prof_id)" @click="deleteDocument($event, image.doc_id, 'image_multimedia')" flat style="width: 100%; background-color: #F44336;"><q-icon name="delete_forever" style="color: white;"/></q-btn>
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </q-list>
                </div>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>
        <StudiosModels
          v-if="(this.mode == 'show' || this.mode == 'edit' || this.mode === 'edit-myprofile') && user.id > 0 && openGate('menu-studios_models', sUser.prof_id)"
          :is-subgrid="true"
          :parent-mode="(this.mode == 'edit-myprofile') ? 'show' : this.mode"
          parent-table="users"
          parent-field="user_id_model"
          :parent-id="user.id"
          :user-model="{label: user.name + ' ' + user.name2 + ' ' + user.surname + ' ' + user.surname2, value: user.id}"
        />
        <Transactions v-if="(this.mode == 'show' || this.mode == 'edit') && user.id > 0 && openGate('menu-transactions', sUser.prof_id) && user.prof_id && openGate('is-model', user.prof_id.value)" :is-subgrid="true" :parent-mode="mode" parent-table="users" parent-field="user_id" :parent-id="user.id" :is-model="user.prof_id && openGate('is-model', user.prof_id.value)" />
        <UserCoincidence v-if="openGate('user-coincidence', sUser.prof_id)" :user="user" ref="usercoincidence" @submit-skip="skipUserCoincidence" :is-creating="(mode === 'create')" @unify-user="unifyUser" />
        <ModelsStreams v-if="openGate('menu-models_streams', sUser.prof_id) && (this.mode == 'show' || this.mode == 'edit') && this.user.id !== 0 && user.prof_id && openGate('is-model', user.prof_id.value)" :is-subgrid="true" :parent-mode="mode" parent-table="models_accounts" parent-field="user_id" :model-id="this.user.id" />
      </div>
    </div>
  </div>
</template>

<script>
import ModelsStreams from 'src/pages/ModelStream/ModelsStreams.vue'
import UserCoincidence from 'src/pages/User/Components/UserCoincidence.vue'
import Transactions from 'src/pages/Transaction/Transactions.vue'
import UserService from 'src/services/UserService'
import LocationService from 'src/services/LocationService'
import DocumentService from 'src/services/DocumentService'
import ProfileService from 'src/services/ProfileService'
import UserOtherPermissions from 'src/components/UserOtherPermissions.vue'
import StudiosModels from 'src/pages/StudioModel/StudiosModels.vue'
import GkAutocomplete from 'src/components/GkAutocomplete.vue'
import StudioModelFormFields from '../StudioModel/StudioModelFormFields.vue'
import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'Users-form',
  mixins: [xMisc, sGate],
  components: {
    UserOtherPermissions,
    StudiosModels,
    Transactions,
    GkAutocomplete,
    UserCoincidence,
    ModelsStreams,
    StudioModelFormFields
  },
  props: {
    isDialog: {
      type: String,
      default: null
    },
    parentTable: {
      type: String,
      default: null
    },
    parentField: {
      type: String,
      default: null
    },
    parentId: {
      type: Number,
      default: null
    },
    dialogChildId: {
      type: Number,
      default: null
    },
    modeprop: {
      type: String,
      default: ''
    },
  },
  data () {
    return {
      sUser: {},
      mode: (this.$route.params.id) ? 'edit' : 'create',
      initTitle: 'Crear usuario',
      user: {
        id: 0,
        identification: '',
        identification_type: '',
        issued_in: '',
        name: '',
        name2: '',
        surname: '',
        surname2: '',
        email: '',
        telephone: '',
        address: '',
        active: true,
        prof_id: null,
        image: '',
        otherPermissions: {},
        beneficiary_name: '',
        beneficiary_document: '',
        beneficiary_document_type: '',
        country: { label: '', value: '' },
        department: { label: '', value: '' },
        city_id: { label: '', value: '' },
        rh: '',
        model_category: 'HETEROSEXUAL',
        birthdate: '',
        personal_email: '',
        sex: ''
      },
      readonlyFields: {
        identification: false,
        identification_type: false,
        issued_in: false,
        name: false,
        name2: false,
        surname: false,
        surname2: false,
        email: false,
        telephone: false,
        address: false,
        active: false,
        image: false,
        prof_id: false,
        beneficiary_name: false,
        beneficiary_document: false,
        beneficiary_document_type: false,
        country: false,
        department: false,
        city_id: false,
        model_category: false,
        personal_email: false,
        sex: false
      },
      profiles: [],
      studios: [],
      countries: [],
      departments: [],
      cities: [],
      additionalModels: [],
      additionalModelsTodelete: [],
      expanded: false,
      imageUrl: '',
      modelsImgs: [[]],
      modelsLabels: ["Identificación Frente", "Identificación Reverso", "Identificación en Mano", "Identificación Frente y Reverso", "Foto Perfil", "Otro Documento/Foto con Fecha"],
      modelsLabelsDocs: ["IMG_ID_FRONT", "IMG_ID_BACK", "IMG_ID_HAND", "IMG_ID_FRONTBACK", "IMG_PROFILE", "IMG_OTHER"],
      modelsImgsIcons: [],
      modelsImgsInfo: ["Consejos relacionado a Identificación Frente", "Consejos relacionado a Identificación Reverso", "Consejos relacionado a Identificación en Mano",
       "Consejos relacionado a Identificación Frente y Reverso", " Consejos relacionado a Foto Perfil", 
       "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. \n Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      ],
      videoFile: '',
      videosUploaded: [],
      imageFile: '',
      imagesUploaded: [],
      disableView: false,
      skipUserCoincidenceBool: false,
      skipUserCoincidenceComment: '',
      skipUserCoincidenceLength: 0,
      studioModel: {
        id: 0,
        std_id: '',
        stdroom_id: '',
        user_id_model: '',
        start_at: '',
        finish_at: '',
        active: true,
        percent: '',
        rtefte: '',
        created_at: '',
        stdshift_id: '',
        commission_type: '',
        goal: '',
        contract_type: 'MANDANTE - MODELO',
        contract_number: '',
        country: { label: '', value: '' },
        department: { label: '', value: '' },
        city_id: { label: '', value: '' }
      }
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
    // if mode is sended from modeprop
    if (this.modeprop != '') {
      this.mode = this.modeprop
    // if mode is sended from subgrid
    } else if ((this.$route.params.id && !this.isDialog) || (this.isDialog && this.parentId !== null && this.dialogChildId !== null)) {
      this.mode = 'edit'
    }
    if (this.mode !== 'edit-myprofile' && !this.openGate('show-users', this.sUser.prof_id)) {
      this.disableView = true
    }
    if ((this.mode === 'edit' || this.mode === 'show' || this.mode === 'edit-myprofile') && !this.disableView) {
      this.getData()
    } else if (this.additionalModels.length == 0) {
      this.addPartner()
    }

    if (this.mode === 'edit-myprofile') {
      this.myProfileInit()
    }
    this.getSelects()
  },
  methods: {
    myProfileInit () {
      this.readonlyFields.identification = true
      this.readonlyFields.identification_type = true
      this.readonlyFields.issued_in = true
      this.readonlyFields.name = true
      this.readonlyFields.name2 = true
      this.readonlyFields.surname = true
      this.readonlyFields.surname2 = true
      this.readonlyFields.surname2 = true
      this.readonlyFields.email = true
      this.readonlyFields.address = true
      this.readonlyFields.active = true
      this.readonlyFields.image = true
      this.readonlyFields.prof_id = true
      this.readonlyFields.beneficiary_name = true
      this.readonlyFields.beneficiary_document = true
      this.readonlyFields.beneficiary_document_type = true
      this.readonlyFields.country = true
      this.readonlyFields.model_category = true
      this.readonlyFields.sex = true
    },
    async onSubmit () {
      await this.checkUsersCoincidence()
      try {
        this.activateLoading('Cargando')
        const boolCoincidence = (this.$refs.usercoincidence !== undefined) && (this.$refs.usercoincidence != null)
        if ((boolCoincidence && this.$refs.usercoincidence.dataset.length === 0) || this.skipUserCoincidenceBool || this.mode === 'edit-myprofile' || !this.openGate('user-coincidence', this.sUser.prof_id)) {
          this.skipUserCoincidenceBool = false
          const boolDataUserCoincidence = boolCoincidence && (this.$refs.usercoincidence.dataset !== undefined) && (this.$refs.usercoincidence.dataset != null)
          // POST
          if (this.mode === 'create') {
            var record = await UserService.addUser({
              user_identification: this.user.identification,
              user_identification_type: this.user.identification_type,
              user_issued_in: this.user.issued_in,
              user_name: this.user.name,
              user_name2: this.user.name2,
              user_surname: this.user.surname,
              user_surname2: this.user.surname2,
              user_email: this.user.email,
              user_telephone: this.user.telephone,
              user_birthdate: this.user.birthdate,
              user_address: this.user.address,
              prof_id: this.user.prof_id.value,
              user_sex: this.user.sex,
              user_bank_entity: this.user.bank_entity,
              user_bank_account: this.user.bank_account,
              user_bank_account_type: this.user.bank_account_type,
              user_active: this.user.active,
              other_permissions: this.user.otherPermissions,
              user_beneficiary_name: this.user.beneficiary_name,
              user_beneficiary_document: this.user.beneficiary_document,
              user_beneficiary_document_type: this.user.beneficiary_document_type,
              city_id: this.user.city_id.value,
              user_rh: this.user.rh,
              user_model_category: this.user.model_category,
              additional_models: this.additionalModels,
              users_coincidences: (boolDataUserCoincidence && this.$refs.usercoincidence.dataset.length > 0) ? this.$refs.usercoincidence.dataset : [],
              users_coincidences_observation: this.skipUserCoincidenceComment,
              user_personal_email: this.user.personal_email,
              studio_model: {
                std_id: this.studioModel.std_id.value,
                stdroom_id: this.studioModel.stdroom_id.value,
                user_id_model: this.studioModel.user_id_model.value,
                stdmod_start_at: this.studioModel.start_at,
                stdmod_finish_at: this.studioModel.finish_at,
                stdmod_active: this.studioModel.active,
                stdmod_percent: this.studioModel.percent,
                stdmod_rtefte: this.studioModel.rtefte,
                stdshift_id: this.studioModel.stdshift_id.value,
                stdmod_commission_type: this.studioModel.commission_type,
                stdmod_goal: this.studioModel.goal,
                stdmod_contract_type: this.studioModel.contract_type,
                city_id: this.studioModel.city_id.value,
              },
              token: this.decryptSession('token')
            })
            this.alert('positive', 'Creado')
            this.user.id = record.data.data.user_id
            if (this.mode !== 'edit-myprofile') {
              this.$route.params.id = record.data.data.user_id
            }
          } else if (this.mode === 'edit') {
            var record = await UserService.editUser({
              id: this.user.id,
              user_identification: this.user.identification,
              user_identification_type: this.user.identification_type,
              user_issued_in: this.user.issued_in,
              user_name: this.user.name,
              user_name2: this.user.name2,
              user_surname: this.user.surname,
              user_surname2: this.user.surname2,
              user_email: this.user.email,
              user_telephone: this.user.telephone,
              user_birthdate: this.user.birthdate,
              user_address: this.user.address,
              prof_id: this.user.prof_id.value,
              user_sex: this.user.sex,
              user_bank_entity: this.user.bank_entity,
              user_bank_account: this.user.bank_account,
              user_bank_account_type: this.user.bank_account_type,
              user_active: this.user.active,
              other_permissions: this.user.otherPermissions,
              user_beneficiary_name: this.user.beneficiary_name,
              user_beneficiary_document: this.user.beneficiary_document,
              user_beneficiary_document_type: this.user.beneficiary_document_type,
              city_id: this.user.city_id.value,
              user_rh: this.user.rh,
              user_model_category: this.user.model_category,
              additional_models: this.additionalModels,
              additional_models_todelete: this.additionalModelsTodelete,
              users_coincidences: (boolDataUserCoincidence && this.$refs.usercoincidence.dataset.length > 0) ? this.$refs.usercoincidence.dataset : [],
              users_coincidences_observation: this.skipUserCoincidenceComment,
              user_personal_email: this.user.personal_email,
              token: this.decryptSession('token')
            })
            this.alert('positive', 'Actualizado')
          } else if (this.mode === 'edit-myprofile') {
            var record = await UserService.editMyProfile({
              id: this.user.id,
              user_telephone: this.user.telephone,
              city_id: this.user.city_id.value,
              user_personal_email: this.user.personal_email,
              token: this.decryptSession('token')
            })
            this.alert('positive', 'Actualizado')
          }

          if (this.isDialog) {
            this.$emit('save')
          } else {
            // if can edit >> edit, else >> show
            if (this.mode !== 'edit-myprofile') { 
              this.mode = (this.openGate('edit-users', this.sUser.prof_id) || this.openGate('edit-users-bank-data', this.sUser.prof_id)) ? 'edit' : 'show'
              this.goTo('users/' + this.mode + '/' + this.user.id)
            } else {
              this.goTo('myprofile')
            }
            this.getData()
          }
          this.uploadImage()
        } else if (boolCoincidence) {
          this.$refs.usercoincidence.isSubmiting = true
          this.$refs.usercoincidence.showComponent()
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
          if (error.response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.message)
          } else if (error.response.data.code === 'USER_ALREADY_EXISTS') {
            this.alert('warning', 'Ya existe un usuario registrado con este email')
          } else {
            this.alert('warning', error.response.data.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    handleImageUpload () {
      if (this.user.image) {
        this.imageUrl = URL.createObjectURL(this.user.image)
      }
    },
    async uploadImage () {
      try {
        this.activateLoading('Cargando')
        // var response = {}
        var data = new FormData()
        if (this.user.image !== '') {
          data.append('files', this.user.image)
          await UserService.uploadImage({ id: this.user.id, data: data, token: this.decryptSession('token') })
          this.alert('positive', 'Imágen cargada con éxito')
          this.user.image = ''
        }
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getData (userId=null) {
      if (this.mode === 'edit') {
        this.initTitle = 'Editar usuario'
      } else if (this.mode === 'show') {
        this.initTitle = 'Ver usuario'
      } else if (this.mode === 'edit-myprofile') {
        this.initTitle = 'Mi perfil'
      }
      
      try {
        this.activateLoading('Cargando')
        var user_id
        if (userId) {
          user_id = userId
        } else if (this.mode === 'edit-myprofile') {
          user_id = this.sUser.user_id
        }
        else {
          user_id = this.$route.params.id
        }
        var response = await UserService.getUser({ id: user_id, token: this.decryptSession('token') })
        if (response.data.data.length > 0) {
          this.user.id = response.data.data[0].user_id
          this.user.identification = response.data.data[0].user_identification
          this.user.identification_type = response.data.data[0].user_identification_type
          this.user.issued_in = response.data.data[0].user_issued_in
          this.user.name = response.data.data[0].user_name
          this.user.name2 = response.data.data[0].user_name2
          this.user.surname = response.data.data[0].user_surname
          this.user.surname2 = response.data.data[0].user_surname2
          this.user.email = response.data.data[0].user_email
          this.user.telephone = response.data.data[0].user_telephone
          this.user.birthdate = response.data.data[0].user_birthdate
          this.user.sex = response.data.data[0].user_sex
          this.user.address = response.data.data[0].user_address
          this.user.bank_entity = response.data.data[0].user_bank_entity
          this.user.bank_account = response.data.data[0].user_bank_account
          this.user.bank_account_type = response.data.data[0].user_bank_account_type
          this.user.active = response.data.data[0].user_active
          this.user.beneficiary_name = response.data.data[0].user_beneficiary_name
          this.user.beneficiary_document = response.data.data[0].user_beneficiary_document
          this.user.beneficiary_document_type = response.data.data[0].user_beneficiary_document_type
          this.user.rh = response.data.data[0].user_rh
          this.user.model_category = response.data.data[0].user_model_category
          this.user.personal_email = response.data.data[0].user_personal_email
          if (response.data.data[0].city) {
            this.user.country = { label: response.data.data[0].city.department.country.country_name, value: response.data.data[0].city.department.country.country_id }
            await this.updateDepartments()
            this.user.department = { label: response.data.data[0].city.department.dpto_name, value: response.data.data[0].city.department.dpto_id }
            await this.updateCities()
            this.user.city_id = { label: response.data.data[0].city.city_name, value: response.data.data[0].city.city_id }
          }
          if (response.data.data[0].profile) {
            this.user.prof_id = {
              label: response.data.data[0].profile.prof_name,
              value: response.data.data[0].profile.prof_id
            }
          }

          // permissions
          this.user.otherPermissions = {}
          if (response.data.data[0].permissions) {
            for (let index = 0; index < response.data.data[0].permissions.length; index++) {
              this.user.otherPermissions[response.data.data[0].permissions[index].userperm_feature] = response.data.data[0].permissions[index].userperm_state
            }
          }

          // prevent change on update
          if (!this.imageUrl) {
            if (response.data.data[0].prof_id === 4  || response.data.data[0].prof_id === 5) { //MODELO O MODELO SATELITE
              let documentGeted = response.data.data[0].latest_documents.find(doc => doc.doc_label === 'IMG_PROFILE' && doc.doc_type === 'image')
              this.imageUrl = (typeof documentGeted !== 'undefined' && documentGeted.doc_url) ? this.getApiUrl('/images/models/documents/' + documentGeted.doc_url) : ''
            } else {
              this.imageUrl = (response.data.data[0].user_image) ? this.getApiUrl('/images/models/' + response.data.data[0].user_image)  : ''  
            }
          }
          this.modelsImgs = [[]]
          var iconIndex = 0
          for (var i = 0; i < 6; i++) {
            let documentGeted = response.data.data[0].latest_documents.find(doc => doc.doc_label === this.modelsLabelsDocs[i] && doc.doc_type === 'image')
            if (documentGeted) {
              this.modelsImgs[0].push({ img_url: this.getApiUrl('/images/models/documents/' + documentGeted.doc_url), img_file: '', doc_id: documentGeted.doc_id })
              iconIndex++
            } else {
              this.modelsImgs[0].push({ img_url: '', img_file: '' })
            }
          }
          if (iconIndex === 6) {
            this.modelsImgsIcons.push('done_all')
          } else {
            this.modelsImgsIcons.push('pending_actions')
          }
          if (response.data.data[0].additional_models && response.data.data[0].additional_models.length > 0) {
            this.additionalModels = []
            response.data.data[0].additional_models.forEach((additional_model, index) => {
              this.additionalModels.push({
                name: additional_model.usraddmod_name,
                identification: additional_model.usraddmod_identification,
                birthdate: additional_model.usraddmod_birthdate,
                usraddmod_id: additional_model.usraddmod_id
                //model_category: additional_model.usraddmod_category,
              })
              this.modelsImgs.push([])
              iconIndex = 0
              for (var i = 0; i < 6; i++) {
                let documentGeted = additional_model.latest_documents.find(doc => doc.doc_label === this.modelsLabelsDocs[i] && doc.doc_type === 'image')
                if (documentGeted) {
                  this.modelsImgs[index + 1].push({ img_url: this.getApiUrl('/images/models/documents/' + documentGeted.doc_url), img_file: '', doc_id: documentGeted.doc_id })
                } else {
                  this.modelsImgs[index + 1].push({ img_url: '', img_file: '' })
                }
              }
              if (iconIndex === 6) {
                this.modelsImgsIcons.push('done_all')
              } else {
                this.modelsImgsIcons.push('pending_actions')
              }
            })
          } else {
            this.addPartner()
          }
          this.getVideosDocument()
          this.getImagesMultimediaDocument()
          this.checkUsersCoincidence()
        } else {
          this.disableView = true
        }
        this.disableLoading()
      } catch (error) {
        this.errorsAlerts(error)
        this.disableLoading()
      }
    },
    async getSelects () {
      var response
      this.operationsCenter = []
      // profiles
      this.profiles = []
      response = await ProfileService.getProfiles({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.profiles.push({
          label: response.data.data[u].prof_name,
          value: response.data.data[u].prof_id
        })
      }

      response = await LocationService.getCountries({ token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.countries.push({
          label: response.data.data[u].country_name,
          value: response.data.data[u].country_id
        })
      }
    },
    async updateDepartments () {
      this.departments = []
      var response = await LocationService.getDepartments({ country_id: this.user.country.value, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.departments.push({
          label: response.data.data[u].dpto_name,
          value: response.data.data[u].dpto_id
        })
      }
      this.user.department = { label: '', value: '' }
      this.user.city_id = { label: '', value: '' }
      this.cities = []
    },
    async updateCities () {
      this.cities = []
      var response = await LocationService.getCities({ dpto_id: this.user.department.value, token: this.decryptSession('token') })
      for (var u = 0; u < response.data.data.length; u++) {
        this.cities.push({
          label: response.data.data[u].city_name,
          value: response.data.data[u].city_id
        })
      }
      this.user.city_id = { label: '', value: '' }
    },
    addPartner () {
      this.additionalModels.push({ name: '', identification: '', birthdate: '', model_category: '' })
    },
    deletePartner (key) {
      if (this.additionalModels.length > 1) {
        if(this.mode === 'edit' && this.additionalModels[key].usraddmod_id) {
          this.additionalModelsTodelete.push(this.additionalModels[key].usraddmod_id)
          this.modelsImgs.splice((key + 1), 1)
        }
        this.additionalModels.splice(key, 1)
      }
    },
    handleDocumentUpload (model_index, doc_index) {
      if (model_index === 0 && doc_index === 4) { // foto de perfil del usuario principal
        this.imageUrl = URL.createObjectURL(this.modelsImgs[model_index][doc_index].img_file)
      }
      if (this.modelsImgs[model_index] && this.modelsImgs[model_index][doc_index]) {
        this.uploadImageDocument(model_index, doc_index)
      }
    },
    refToModelsImg (index) {
      return 'modelsImgs' + index
    },
    async uploadImageDocument (model_index, doc_index) {
      try {
        this.activateLoading('Cargando')
        const maxSize = 8 * 1024 * 1024 // 8MB
        if (this.modelsImgs[model_index][doc_index].img_file.size > maxSize) {
          this.alert('warning', 'El archivo a subir es demasiado pesado (8MB max)')
        } else {
          var data = new FormData()
          if (this.modelsImgs[model_index][doc_index].img_file !== '') {
            data.append('files', this.modelsImgs[model_index][doc_index].img_file)
            data.append('doc_label', this.modelsLabelsDocs[doc_index])
            data.append('user_id', this.user.id)
            if (model_index > 0) {
              data.append('usraddmod_id', this.additionalModels[model_index - 1].usraddmod_id)
            }
            if (this.modelsImgs[model_index][doc_index].doc_id) {
              data.append('doc_id', this.modelsImgs[model_index][doc_index].doc_id)
            }
            const response = await DocumentService.uploadImage({ data: data, token: this.decryptSession('token') })
            this.modelsImgs[model_index][doc_index].doc_id = response.data.data
            this.modelsImgs[model_index][doc_index].img_url = URL.createObjectURL(this.modelsImgs[model_index][doc_index].img_file)
            this.alert('positive', 'Documento cargado con éxito')
            // this.user.image = ''
          }
        }
        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        if (error.response && error.response.status && error.response.status === 422 && error.response.data && error.response.data.message) {
          this.alert('warning', error.response.data.message)
        }
        else if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async uploadVideoDocument () {
      try {
        this.activateLoading('Cargando')
        const maxSize = 8 * 1024 * 1024 // 8MB
        if (this.videoFile.size > maxSize) {
          this.alert('warning', 'El archivo a subir es demasiado pesado (8MB max)')
        } else {
          var data = new FormData()
          if (this.videoFile !== '') {
            data.append('files', this.videoFile)
            data.append('user_id', this.user.id)
            await DocumentService.uploadVideo({ data: data, token: this.decryptSession('token') })
            this.alert('positive', 'Video cargado con éxito')
            this.getVideosDocument()
          }
        }
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.status && error.response.status === 422 && error.response.data && error.response.data.message) {
          this.alert('warning', error.response.data.message)
        }
        else if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async uploadImageMultimediaDocument () {
      try {
        this.activateLoading('Cargando')
        const maxSize = 8 * 1024 * 1024 // 8MB
        if (this.imageFile.size > maxSize) {
          this.alert('warning', 'El archivo a subir es demasiado pesado (8MB max)')
        } else {
          var data = new FormData()
          if (this.imageFile !== '') {
            data.append('files', this.imageFile)
            data.append('user_id', this.user.id)
            await DocumentService.uploadImageMultimedia({ data: data, token: this.decryptSession('token') })
            this.alert('positive', 'Imagen cargado con éxito')
            this.getImagesMultimediaDocument()
          }  
        }    
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.status && error.response.status === 422 && error.response.data && error.response.data.message) {
          this.alert('warning', error.response.data.message)
        }
        else if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getVideosDocument () {
      try {
        this.activateLoading('Cargando')
        const user_id = (this.mode === 'edit-myprofile') ? this.sUser.user_id : this.$route.params.id
        var response = await DocumentService.getUserVideos({ id: user_id, token: this.decryptSession('token') })
        this.videosUploaded = response.data.data
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async getImagesMultimediaDocument () {
      try {
        this.activateLoading('Cargando')
        const user_id = (this.mode === 'edit-myprofile') ? this.sUser.user_id : this.$route.params.id
        var response = await DocumentService.getUserImagesMultimedia({ id: user_id, token: this.decryptSession('token') })
        this.imagesUploaded = response.data.data
        this.disableLoading()
      } catch (error) {
        console.log(error)
        this.disableLoading()
        if (error.response && error.response.data.error && error.response.data.error.code && error.response.data.error.message) {
          if (error.response.data.error.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.error.message)
          } else {
            this.alert('warning', error.response.data.error.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    },
    async deleteDocument (event, documentId, type, docIndexes) {
      if (type === 'document') {
        event.stopPropagation()
      }
      const msg_type = (type === 'image_multimedia' || type === 'document') ? 'imagen' : 'video'
      this.$q.dialog({
        title: 'Confirmar',
        message: '¿Estás seguro de eliminar este ' + msg_type + '?',
        cancel: 'Cancelar',
        ok: 'Aceptar',
        persistent: true
      }).onOk(async () => {
        try {
          this.activateLoading('Cargando')
          var response = await DocumentService.deleteDocument({ id: documentId, type: type, token: this.decryptSession('token') })
          if (response.data.status === 'success') {
            this.alert('positive', 'Eliminado')
            this.getVideosDocument()
            this.getImagesMultimediaDocument()
            if (type === 'document') {
              if (docIndexes[0] === 0 && docIndexes[1] === 4) { // foto de perfil del usuario principal
                this.imageUrl = ''
              }
              this.modelsImgs[docIndexes[0]][docIndexes[1]].img_url = ''
              this.modelsImgs[docIndexes[0]][docIndexes[1]].doc_id = null
            }
          } else {
            if (response.data.code === 'UNEXPECTED_ERROR') {
              this.alert('negative', response.data.message)
            } else {
              this.alert('warning', response.data.message)
            }
          }
          this.disableLoading()
        } catch (error) {
          this.activateLoading('Cargando')
          if (error.response && error.response.data && error.response.data.code && error.response.data.message) {
            if (error.response.data.code === 'UNEXPECTED_ERROR') {
              this.alert('negative', error.response.data.message)
            } else {
              this.alert('warning', error.response.data.message)
            }
          } else {
            this.errorsAlerts(error)
          }
          this.disableLoading()
        }
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    },
    toggleInstructions () {
      // if (this.needHelp) {
      //   this.needHelp = false
      //   this.helpText = 'Ayuda'
      // } else {
      //   this.needHelp = true
      //   this.helpText = 'Cerrar ayuda'
      // }
    },
    async checkUsersCoincidence () {
      const boolCoincidence = (this.$refs.usercoincidence !== undefined) && (this.$refs.usercoincidence != null)
      if (boolCoincidence) {
        await this.$refs.usercoincidence.checkUsers()
        this.skipUserCoincidenceLength = this.$refs.usercoincidence.dataset.length  
      }
    },
    skipUserCoincidence (comment) {
      this.skipUserCoincidenceComment = comment
      this.skipUserCoincidenceBool = true
      this.onSubmit()
    },
    async unifyUser (userId) {
      try {
        this.activateLoading('Cargando')
        await UserService.overwriteUser({
          id: userId,
          user_identification: this.user.identification,
          user_identification_type: this.user.identification_type,
          user_issued_in: this.user.issued_in,
          user_name: this.user.name,
          user_name2: this.user.name2,
          user_surname: this.user.surname,
          user_surname2: this.user.surname2,
          user_email: this.user.email,
          user_telephone: this.user.telephone,
          user_birthdate: this.user.birthdate,
          user_address: this.user.address,
          prof_id: this.user.prof_id?.value,
          user_sex: this.user.sex,
          user_bank_entity: this.user.bank_entity,
          user_bank_account: this.user.bank_account,
          user_bank_account_type: this.user.bank_account_type,
          user_active: this.user.active,
          other_permissions: this.user.otherPermissions,
          user_beneficiary_name: this.user.beneficiary_name,
          user_beneficiary_document: this.user.beneficiary_document,
          user_beneficiary_document_type: this.user.beneficiary_document_type,
          city_id: this.user.city_id?.value,
          user_rh: this.user.rh,
          user_model_category: this.user.model_category,
          additional_models: this.additionalModels,
          additional_models_todelete: this.additionalModelsTodelete,
          user_personal_email: this.user.personal_email,
          token: this.decryptSession('token')
        })
        this.alert('positive', 'Actualizado')
        if (this.isDialog) {
          this.$emit('save')
        } else {
          this.mode = (this.openGate('edit-users', this.sUser.prof_id) || this.openGate('edit-users-bank-data', this.sUser.prof_id)) ? 'edit' : 'show'
          this.goTo('users/' + this.mode + '/' + userId)
          this.getData(userId)
        }
        this.uploadImage() 
        this.disableLoading()
      } catch (error) {
        this.disableLoading()
        if (error?.response?.data?.message) {
          if (error.response.data.code === 'UNEXPECTED_ERROR') {
            this.alert('negative', error.response.data.message)
          } else if (error.response.data.code === 'USER_ALREADY_EXISTS') {
            this.alert('warning', 'Ya existe un usuario registrado con este email')
          } else {
            this.alert('warning', error.response.data.message)
          }
        } else {
          this.errorsAlerts(error)
        }
      }
    }
  }
}
</script>
