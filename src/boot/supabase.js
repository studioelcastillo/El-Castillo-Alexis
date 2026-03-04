import { boot } from "quasar/wrappers";
import { supabase } from "src/supabaseClient";
import { encryptSession } from "src/mixins/xMisc";
import AuthSupabaseService from "src/services/supabase/AuthSupabaseService";

export default boot(({ app, router }) => {
  app.config.globalProperties.$supabase = supabase;

  // Listen for auth state changes to sync with legacy session
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      // Sync with legacy localStorage
      encryptSession("token", session.access_token);

      try {
        const { data: profile } = await AuthSupabaseService.getUserProfile(
          session.user.id
        );
        if (profile) {
          encryptSession("user", profile);
          // If we are on the login or callback page, redirect to home
          if (
            window.location.pathname === "/login" ||
            window.location.pathname === "/auth/callback"
          ) {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error syncing user profile:", err);
      }
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("dashboard_user");
      router.push("/login");
    }
  });
});
