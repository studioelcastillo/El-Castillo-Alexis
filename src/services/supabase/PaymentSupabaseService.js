import { supabase } from "../../supabaseClient";
import { applyQueryFilters, normalizeQueryString } from "./queryUtils";

const mapPaymentFileFromDb = (row) => ({
  ...row,
  payfile_id: row.payf_id,
  payfile_description: row.payf_name,
  payfile_filename: row.payf_url,
  payfile_template: row.payf_type,
  payfile_total: row.payf_total ?? 0,
});

const enrichPaymentsWithPaymentFiles = async (rows) => {
  const payfileIds = [
    ...new Set(rows.map((row) => row.payfile_id).filter(Boolean)),
  ];

  if (payfileIds.length === 0) {
    return rows;
  }

  const { data: paymentFiles } = await supabase
    .from("payment_files")
    .select("*")
    .in("payf_id", payfileIds);

  const fileMap = new Map(
    (paymentFiles || []).map((file) => [file.payf_id, mapPaymentFileFromDb(file)])
  );

  return rows.map((row) => ({
    ...row,
    payment_file: fileMap.get(row.payfile_id) || null,
  }));
};

const enrichPaymentsWithStudioModels = async (rows) => {
  const stdIds = [...new Set(rows.map((row) => row.std_id).filter(Boolean))];
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];

  if (stdIds.length === 0 || userIds.length === 0) {
    return rows;
  }

  const { data: studioModels } = await supabase
    .from("studios_models")
    .select(
      "stdmod_id, std_id, user_id_model, studio:studios(std_id, std_name), user_model:users(user_id, user_name, user_surname)"
    )
    .in("std_id", stdIds)
    .in("user_id_model", userIds);

  const modelMap = new Map(
    (studioModels || []).map((model) => [
      `${model.std_id}:${model.user_id_model}`,
      model,
    ])
  );

  return rows.map((row) => {
    const model = modelMap.get(`${row.std_id}:${row.user_id}`);
    if (model) {
      return {
        ...row,
        studio_model: model,
      };
    }
    return row;
  });
};

const resolvePaymentPayload = async (params) => {
  const payload = { ...params };

  delete payload.token;

  const stdmodId = payload.stdmod_id;
  delete payload.stdmod_id;

  const periodSince = payload.pay_period_since;
  const periodUntil = payload.pay_period_until;
  delete payload.pay_period_since;
  delete payload.pay_period_until;

  if (stdmodId && (!payload.user_id || !payload.std_id)) {
    const { data: studioModel } = await supabase
      .from("studios_models")
      .select("std_id, user_id_model")
      .eq("stdmod_id", stdmodId)
      .single();

    if (studioModel) {
      payload.std_id = payload.std_id || studioModel.std_id;
      payload.user_id = payload.user_id || studioModel.user_id_model;
    }
  }

  if (!payload.period_id && (periodSince || periodUntil)) {
    let periodQuery = supabase
      .from("periods")
      .select("period_id, period_start_date, period_end_date")
      .limit(1);

    if (periodSince) {
      periodQuery = periodQuery.eq("period_start_date", periodSince);
    }

    if (periodUntil) {
      periodQuery = periodQuery.eq("period_end_date", periodUntil);
    }

    const { data: periodData } = await periodQuery.maybeSingle();
    if (periodData) {
      payload.period_id = periodData.period_id;
    }
  }

  return payload;
};

export default {
  async getPayments(params) {
    let query = supabase
      .from("payments")
      .select(
        `*,
        user:users(user_id, user_name, user_surname),
        studio:studios(std_id, std_name),
        period:periods(period_id, period_start_date, period_end_date, period_state)`
      );

    if (params.period_id) query = query.eq("period_id", params.period_id);
    if (params.std_id) query = query.eq("std_id", params.std_id);
    if (params.user_id) query = query.eq("user_id", params.user_id);
    if (params.query) {
      const queryParams = normalizeQueryString(params.query);
      query = applyQueryFilters(query, queryParams);
    }

    const { data, error } = await query;
    const mapped = (data || []).map((row) => ({
      ...row,
      pay_period_since: row.period?.period_start_date || null,
      pay_period_until: row.period?.period_end_date || null,
      period_state: row.period?.period_state || null,
    }));

    const withFiles = await enrichPaymentsWithPaymentFiles(mapped);
    const enriched = await enrichPaymentsWithStudioModels(withFiles);
    return { data: { data: enriched }, error };
  },

  async getPayment(params) {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `*,
        user:users(user_id, user_name, user_surname),
        studio:studios(std_id, std_name),
        period:periods(period_id, period_start_date, period_end_date, period_state)`
      )
      .eq("pay_id", params.id)
      .single();

    if (!data) {
      return { data: { data: [] }, error };
    }

    const mapped = {
      ...data,
      pay_period_since: data.period?.period_start_date || null,
      pay_period_until: data.period?.period_end_date || null,
      period_state: data.period?.period_state || null,
    };

    const withFiles = await enrichPaymentsWithPaymentFiles([mapped]);
    const enriched = await enrichPaymentsWithStudioModels(withFiles);
    return { data: { data: enriched }, error };
  },

  async addPayment(params) {
    const payload = await resolvePaymentPayload(params);
    const { data, error } = await supabase
      .from("payments")
      .insert([payload])
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async editPayment(params) {
    const { id, ...updateData } = params;
    const payload = await resolvePaymentPayload(updateData);
    const { data, error } = await supabase
      .from("payments")
      .update(payload)
      .eq("pay_id", id)
      .select()
      .single();

    return { data: { data: data, status: error ? "Error" : "Success" }, error };
  },

  async delPayment(params) {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("pay_id", params.id);

    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
