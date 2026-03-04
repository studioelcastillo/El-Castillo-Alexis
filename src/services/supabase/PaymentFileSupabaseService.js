import { supabase } from "../../supabaseClient";
import { applyQueryFilters } from "./queryUtils";

const mapPaymentFileFromDb = (row) => ({
  ...row,
  payfile_id: row.payf_id,
  payfile_description: row.payf_name,
  payfile_filename: row.payf_url,
  payfile_template: row.payf_type,
  payfile_total: row.payf_total ?? 0,
});

const mapPaymentFileToDb = (params) => {
  const payload = { ...params };

  delete payload.token;
  delete payload.payfile_id;

  if (payload.payfile_description !== undefined) {
    payload.payf_name = payload.payfile_description;
    delete payload.payfile_description;
  }

  if (payload.payfile_filename !== undefined) {
    payload.payf_url = payload.payfile_filename;
    delete payload.payfile_filename;
  }

  if (payload.payfile_template !== undefined) {
    payload.payf_type = payload.payfile_template;
    delete payload.payfile_template;
  }

  if (payload.payfile_total !== undefined) {
    payload.payf_total = payload.payfile_total;
    delete payload.payfile_total;
  }

  return payload;
};

export default {
  async getPaymentsFiles(params) {
    let query = supabase.from("payment_files").select("*");
    if (params.pay_id) query = query.eq("pay_id", params.pay_id);
    if (params.query) {
      query = applyQueryFilters(query, params.query);
    }
    const { data, error } = await query;
    const mapped = (data || []).map(mapPaymentFileFromDb);
    return { data: { data: mapped }, error };
  },

  async addPaymentFile(params) {
    const payload = mapPaymentFileToDb(params);
    const { data, error } = await supabase
      .from("payment_files")
      .insert([payload])
      .select()
      .single();
    const mapped = data ? mapPaymentFileFromDb(data) : data;
    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async getPaymentFile(params) {
    const { data, error } = await supabase
      .from("payment_files")
      .select("*")
      .eq("payf_id", params.id)
      .single();
    const mapped = data ? [mapPaymentFileFromDb(data)] : [];
    return { data: { data: mapped }, error };
  },

  async editPaymentFile(params) {
    const { id, ...updateData } = params;
    const payload = mapPaymentFileToDb(updateData);
    const { data, error } = await supabase
      .from("payment_files")
      .update(payload)
      .eq("payf_id", id)
      .select()
      .single();
    const mapped = data ? mapPaymentFileFromDb(data) : data;
    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async delPaymentFile(params) {
    const { error } = await supabase
      .from("payment_files")
      .delete()
      .eq("payf_id", params.id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },
};
