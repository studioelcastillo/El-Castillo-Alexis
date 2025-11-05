<template>
  <q-layout view="hHh lpR fFf">
    <!-- test env -->
    <div v-if="env === 'test'" style="width: 100%; margin-top: 50px;">
      <center>
        <div style="
          background-color: #00b59b;
          margin-bottom: 10px;
          padding-top: 15px;
          height: 60px;
          width: 50%;
          text-align: center;
          font-weight: bolder;
          font-size: 20px;
          color: white;
        ">AMBIENTE DE PRUEBAS
        </div>
      </center>
    </div>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>

</template>
<script>
export default {
  name: 'AuthLayout',
  data () {
    return {
      env: process.env.ENVIRONMENT,
    }
  }
}
</script>
