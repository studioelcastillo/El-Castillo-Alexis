<template>
  <q-page class="flex flex-center">
    <q-inner-loading :showing="true">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-mt-md">Autenticando...</div>
    </q-inner-loading>
  </q-page>
</template>

<script>
import { defineComponent, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "src/supabaseClient";

export default defineComponent({
  name: "AuthCallback",
  setup() {
    const router = useRouter();

    onMounted(async () => {
      // Supabase automatically handles the hash/fragment.
      // After onAuthStateChange fires SIGNED_IN (handled in boot/supabase.js),
      // we just need to wait a bit or redirect manually if boot/supabase didn't.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        // If no session after a few seconds, go to login
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    });
  },
});
</script>
