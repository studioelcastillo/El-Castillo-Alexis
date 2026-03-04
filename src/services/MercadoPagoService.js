/**
 * MercadoPagoService - Integración con Pasarela de Pagos
 * NOTA: Este servicio se mantiene usando Axios porque se comunica con la API de Mercado Pago,
 * no con la base de datos de Supabase.
 */
import { api } from "../boot/axios";

export default {
  addPreference(params) {
    return api.post("api/mercadopago/preference", params, {
      headers: { Authorization: "Bearer " + params.token },
    });
  },
  feedback(params) {
    return api.post("api/mercadopago/feedback", params, {
      headers: { Authorization: "Bearer " + params.token },
    });
  },
};
