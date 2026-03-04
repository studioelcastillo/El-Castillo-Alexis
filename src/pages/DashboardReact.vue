<template>
  <q-page class="dashboard-react-page q-pa-none">
    <iframe
      v-if="ready"
      :src="iframeSrc"
      class="dashboard-react-frame"
      title="Dashboard React"
    />
  </q-page>
</template>

<script>
import { xMisc } from "src/mixins/xMisc.js";

export default {
  name: "DashboardReactPage",
  mixins: [xMisc],
  data() {
    return {
      iframeSrc: process.env.DASHBOARD_APP_URL || "/dashboard-app/",
      ready: false,
    };
  },
  mounted() {
    this.iframeSrc = this.normalizeDashboardUrl(this.iframeSrc);
    this.syncDashboardUser();
    this.ready = true;
  },
  methods: {
    normalizeDashboardUrl(value) {
      if (!value) return "/dashboard-app/";
      return value.endsWith("/") ? value : `${value}/`;
    },
    syncDashboardUser() {
      const user = this.decryptSession("user");
      const accessToken = this.decryptSession("token");
      if (!user) {
        localStorage.removeItem("dashboard_user");
        return;
      }

      try {
        const profile = user.profile || user.profiles || null;
        const profId = user.prof_id ?? profile?.prof_id ?? null;
        const normalizedUser = {
          ...user,
          profile,
          prof_id: profId ?? user.prof_id,
          access_token: accessToken || user.access_token,
        };
        localStorage.setItem("dashboard_user", JSON.stringify(normalizedUser));
      } catch (error) {
        localStorage.removeItem("dashboard_user");
      }
    },
  },
};
</script>

<style scoped>
.dashboard-react-page {
  height: 100%;
}

.dashboard-react-frame {
  border: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
