import { supabase } from "../../supabaseClient";

export default {
  // ── INDICADORES ──────────────────────────────────
  async getIndicators({ per_id = null, std_id = null } = {}) {
    const { data, error } = await supabase.rpc("get_dashboard_indicators", {
      p_per_id: per_id,
      p_std_id: std_id,
    });
    return { data, error };
  },

  // ── TAREAS ────────────────────────────────────────
  async getTasks(user_id) {
    const { data, error } = await supabase.rpc("get_dashboard_tasks", {
      p_user_id: user_id,
    });
    return { data, error };
  },

  // ── GRÁFICAS: ganancias x plataforma x período ───
  async getCharts({ per_id = null, std_id = null } = {}) {
    let query = supabase
      .from("models_streams")
      .select("modstr_earnings_usd, modstr_date, std_id, models_accounts(modacc_app)")
      .order("modstr_date", { ascending: true });

    if (std_id) query = query.eq("std_id", std_id);
    if (per_id) query = query.eq("period_id", per_id);

    const { data, error } = await query;

    if (data) {
      const categories = [...new Set(data.map((row) => row.modstr_date))];
      const grouped = {};

      data.forEach((row) => {
        const platform = row.models_accounts?.modacc_app || "Sin plataforma";
        if (!grouped[platform]) {
          grouped[platform] = {
            name: platform,
            data: new Array(categories.length).fill(0),
          };
        }
        const dateIndex = categories.indexOf(row.modstr_date);
        grouped[platform].data[dateIndex] += parseFloat(
          row.modstr_earnings_usd || 0
        );
      });

      return {
        data: {
          series: Object.values(grouped),
          categories: categories,
        },
        error,
      };
    }
    return { data, error };
  },

  // ── METAS POR MODELO ─────────────────────────────
  async getModelGoals({ per_id = null, std_id = null, user_id = null } = {}) {
    let periodRange = null;

    if (per_id) {
      const { data: periodData, error: periodError } = await supabase
        .from("periods")
        .select("period_start_date, period_end_date")
        .eq("period_id", per_id)
        .single();

      if (!periodError) {
        periodRange = periodData;
      }
    }

    let goalsQuery = supabase.from("models_goals").select(`
        modgoal_id,
        modgoal_amount,
        modgoal_percent,
        modgoal_type,
        modgoal_date,
        stdmod_id,
        studios_models(
          stdmod_id,
          std_id,
          stdmod_commission_type,
          user_id_model,
          users(user_identification, user_name, user_surname),
          studios(std_name)
        )
      `);

    if (std_id) goalsQuery = goalsQuery.eq("studios_models.std_id", std_id);
    if (user_id) goalsQuery = goalsQuery.eq("studios_models.user_id_model", user_id);
    if (periodRange) {
      goalsQuery = goalsQuery
        .gte("modgoal_date", periodRange.period_start_date)
        .lte("modgoal_date", periodRange.period_end_date);
    }

    const { data: goalsData, error: goalsError } = await goalsQuery;

    if (goalsError) {
      return { data: null, error: goalsError };
    }

    const stdmodIds = [...new Set(
      (goalsData || []).map((goal) => goal.stdmod_id).filter(Boolean)
    )];
    const earningsByStdmod = {};

    if (stdmodIds.length > 0) {
      let streamsQuery = supabase
        .from("models_streams")
        .select("stdmod_id, modstr_earnings_usd, std_id, period_id");

      if (per_id) streamsQuery = streamsQuery.eq("period_id", per_id);
      if (std_id) streamsQuery = streamsQuery.eq("std_id", std_id);
      streamsQuery = streamsQuery.in("stdmod_id", stdmodIds);

      const { data: streamsData, error: streamsError } = await streamsQuery;

      if (streamsError) {
        return { data: null, error: streamsError };
      }

      (streamsData || []).forEach((row) => {
        const key = row.stdmod_id;
        earningsByStdmod[key] =
          (earningsByStdmod[key] || 0) +
          parseFloat(row.modstr_earnings_usd || 0);
      });
    }

    const grouped = {};

    (goalsData || []).forEach((goal) => {
      const studioModel = goal.studios_models;
      if (!studioModel) return;

      const stdmodId = studioModel.stdmod_id || goal.stdmod_id;
      const user = studioModel.users || {};
      const commissionType =
        studioModel.stdmod_commission_type || goal.modgoal_type || null;

      if (!grouped[stdmodId]) {
        grouped[stdmodId] = {
          stdmod_id: stdmodId,
          std_id: studioModel.std_id,
          std_name: studioModel.studios?.std_name || "",
          stdmod_commission_type: commissionType,
          user_id_model: studioModel.user_id_model,
          user_identification: user.user_identification || "",
          user_name: user.user_name || "",
          user_surname: user.user_surname || "",
          sum_goal: 0,
          sum_earnings: 0,
          goals: [],
        };
      }

      const amount = parseFloat(goal.modgoal_amount || 0);
      if (!Number.isNaN(amount)) {
        grouped[stdmodId].sum_goal = Math.max(grouped[stdmodId].sum_goal, amount);
        grouped[stdmodId].goals.push({
          amount,
          type: goal.modgoal_type,
        });
      }
    });

    const results = Object.values(grouped).map((entry) => {
      entry.sum_earnings = earningsByStdmod[entry.stdmod_id] || 0;

      if (entry.stdmod_commission_type === "SATELITE" && entry.goals.length > 0) {
        const amounts = entry.goals
          .filter((goal) => goal.type === "SATELITE" || !goal.type)
          .map((goal) => Number(goal.amount))
          .filter((value) => !Number.isNaN(value))
          .sort((a, b) => a - b);

        const tiers = [];
        let previous = 0;

        amounts.forEach((amount) => {
          tiers.push({ since: previous, until: amount });
          previous = amount + 1;
        });

        if (tiers.length > 0) {
          tiers[tiers.length - 1] = {
            since: tiers[tiers.length - 1].since,
            until: null,
          };
        }

        entry.goals = tiers;
      } else {
        entry.goals = null;
      }

      return entry;
    });

    return { data: results, error: null };
  },

  // ── METAS POR ESTUDIO ────────────────────────────
  async getStudioGoals({ per_id = null, std_id = null } = {}) {
    const { data: modelGoals, error } = await this.getModelGoals({ per_id, std_id });

    if (error) {
      return { data: null, error };
    }

    if (!modelGoals || modelGoals.length === 0) {
      return { data: [], error: null };
    }

    const grouped = {};

    modelGoals.forEach((model) => {
      const studioId = model.std_id;
      if (!studioId) return;

      if (!grouped[studioId]) {
        grouped[studioId] = {
          std_id: studioId,
          std_name: model.std_name || "",
          sum_goal: 0,
          sum_earnings: 0,
        };
      }

      grouped[studioId].sum_goal += Number(model.sum_goal || 0);
      grouped[studioId].sum_earnings += Number(model.sum_earnings || 0);
    });

    let studios = Object.values(grouped);

    if (!std_id) {
      const total = studios.reduce(
        (acc, studio) => {
          acc.sum_goal += studio.sum_goal || 0;
          acc.sum_earnings += studio.sum_earnings || 0;
          return acc;
        },
        { std_id: null, std_name: "TODOS", sum_goal: 0, sum_earnings: 0 }
      );
      studios = [total];
    }

    const data = studios.map((studio) => ({
      ...studio,
      goals: studio.sum_goal ? [{ since: 0, until: studio.sum_goal }] : null,
    }));

    return { data, error: null };
  },
};
