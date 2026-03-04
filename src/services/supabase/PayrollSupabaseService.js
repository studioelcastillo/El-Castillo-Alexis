import { supabase } from "../../supabaseClient";

export default {
  // ── PERÍODOS DE NÓMINA ──────────────────────────────────

  async getPayrollPeriods(params) {
    let query = supabase
      .from("payroll_periods")
      .select("*")
      .order("payroll_period_start_date", { ascending: false });

    if (params.std_id) query = query.eq("std_id", params.std_id);

    const { data, error } = await query;
    return { data: { status: "success", data: data || [] }, error };
  },

  async autoGeneratePeriod(params) {
    const targetDate =
      params.target_date || new Date().toISOString().split("T")[0];

    // Calcular fechas según el intervalo del estudio
    const { data: studio } = await supabase
      .from("studios")
      .select("payroll_liquidation_interval")
      .eq("std_id", params.std_id)
      .single();

    const interval = studio?.payroll_liquidation_interval || "MENSUAL";
    const startDate = new Date(targetDate);
    let endDate = new Date(targetDate);

    if (interval === "SEMANAL") {
      // Inicio: lunes de la semana actual
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else if (interval === "QUINCENAL") {
      if (startDate.getDate() <= 15) {
        startDate.setDate(1);
        endDate.setDate(15);
      } else {
        startDate.setDate(16);
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0
        );
      }
    } else {
      // MENSUAL
      startDate.setDate(1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }

    const formatDate = (d) => d.toISOString().split("T")[0];

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("payroll_periods")
      .select("payroll_period_id")
      .eq("std_id", params.std_id)
      .eq("payroll_period_start_date", formatDate(startDate))
      .eq("payroll_period_end_date", formatDate(endDate));

    if (existing && existing.length > 0) {
      return {
        data: {
          status: "success",
          message: "El período ya existe",
          data: existing[0],
        },
      };
    }

    const { data, error } = await supabase
      .from("payroll_periods")
      .insert([
        {
          std_id: params.std_id,
          payroll_period_start_date: formatDate(startDate),
          payroll_period_end_date: formatDate(endDate),
          payroll_period_state: "ABIERTO",
          payroll_period_interval: interval,
          is_auto_generated: true,
        },
      ])
      .select()
      .single();

    return { data: { status: "success", data }, error };
  },

  async autoGenerateNextPeriods(params) {
    const count = params.count || 3;
    const results = [];

    // Obtener el último período existente
    const { data: lastPeriod } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("std_id", params.std_id)
      .order("payroll_period_end_date", { ascending: false })
      .limit(1)
      .single();

    let baseDate;
    if (lastPeriod) {
      baseDate = new Date(lastPeriod.payroll_period_end_date);
      baseDate.setDate(baseDate.getDate() + 1);
    } else {
      baseDate = new Date();
    }

    for (let i = 0; i < count; i++) {
      const result = await this.autoGeneratePeriod({
        std_id: params.std_id,
        target_date: baseDate.toISOString().split("T")[0],
      });
      results.push(result.data?.data);

      // Avanzar al siguiente período
      const { data: studio } = await supabase
        .from("studios")
        .select("payroll_liquidation_interval")
        .eq("std_id", params.std_id)
        .single();

      const interval = studio?.payroll_liquidation_interval || "MENSUAL";
      if (interval === "SEMANAL") {
        baseDate.setDate(baseDate.getDate() + 7);
      } else if (interval === "QUINCENAL") {
        baseDate.setDate(baseDate.getDate() + 15);
      } else {
        baseDate.setMonth(baseDate.getMonth() + 1);
      }
    }

    return { data: { status: "success", data: results } };
  },

  async closePeriod(periodId) {
    const { data, error } = await supabase
      .from("payroll_periods")
      .update({ payroll_period_state: "CERRADO" })
      .eq("payroll_period_id", periodId)
      .select()
      .single();
    return { data: { status: error ? "error" : "success", data }, error };
  },

  async openPeriod(periodId) {
    const { data, error } = await supabase
      .from("payroll_periods")
      .update({ payroll_period_state: "ABIERTO" })
      .eq("payroll_period_id", periodId)
      .select()
      .single();
    return { data: { status: error ? "error" : "success", data }, error };
  },

  async deletePeriod(periodId) {
    const { error } = await supabase
      .from("payroll_periods")
      .delete()
      .eq("payroll_period_id", periodId);
    return { data: { status: error ? "error" : "success" }, error };
  },

  // ── PERÍODOS DE COMISIÓN ────────────────────────────────

  async getCommissionPeriods(params) {
    // Los períodos de comisión son los periods normales (liquidación de modelos)
    let query = supabase
      .from("periods")
      .select("*")
      .order("period_start_date", { ascending: false });

    if (params.std_id) {
      // Obtener períodos que tengan streams del estudio
      const { data: streams } = await supabase
        .from("models_streams")
        .select("period_id")
        .eq("std_id", params.std_id)
        .not("period_id", "is", null);

      const periodIds = [
        ...new Set((streams || []).map((s) => s.period_id).filter(Boolean)),
      ];
      if (periodIds.length > 0) {
        query = query.in("period_id", periodIds);
      }
    }

    const { data, error } = await query;
    return {
      data: {
        status: "success",
        data: (data || []).map((p) => ({
          period_id: p.period_id,
          period_start_date: p.period_start_date,
          period_end_date: p.period_end_date,
          period_state: p.period_state,
        })),
      },
      error,
    };
  },

  async getPeriodsByIds(periodIds) {
    if (!periodIds || periodIds.length === 0) {
      return { data: { status: "success", data: [] } };
    }

    const { data, error } = await supabase
      .from("periods")
      .select("*")
      .in("period_id", periodIds);

    return {
      data: {
        status: "success",
        data: (data || []).map((p) => ({
          period_id: p.period_id,
          period_start_date: p.period_start_date,
          period_end_date: p.period_end_date,
          period_state: p.period_state,
        })),
      },
      error,
    };
  },

  // ── TRANSACCIONES DE NÓMINA ─────────────────────────────

  async getPayrollTransactions(payrollPeriodId) {
    const { data, error } = await supabase
      .from("payroll_transactions")
      .select("*")
      .eq("payroll_period_id", payrollPeriodId);

    return {
      data: { success: data && data.length > 0, data: data || [] },
      error,
    };
  },

  // ── EMPLEADOS ELEGIBLES ─────────────────────────────────

  async getEligibleEmployees(stdId) {
    // Obtener empleados con contratos activos tipo LABORAL del estudio
    const { data: studioModels, error } = await supabase
      .from("studios_models")
      .select("*, users(user_id, user_name, user_surname, user_identification)")
      .eq("std_id", stdId)
      .eq("stdmod_active", true)
      .eq("stdmod_contract_type", "LABORAL");

    const eligible = (studioModels || []).length;
    const { count: total } = await supabase
      .from("studios_models")
      .select("stdmod_id", { count: "exact", head: true })
      .eq("std_id", stdId)
      .eq("stdmod_active", true);

    return {
      data: {
        success: true,
        data: {
          counts: {
            eligible,
            ineligible: (total || 0) - eligible,
            total: total || 0,
          },
          employees: studioModels || [],
        },
      },
      error,
    };
  },

  // ── LIQUIDACIÓN DE NÓMINA (PREVIEW/PROCESS) ─────────────

  async previewPayroll(params) {
    const { std_id, payroll_period_id, commission_period_ids } = params;

    // 1. Obtener empleados elegibles
    const { data: studioModels } = await supabase
      .from("studios_models")
      .select("*, users(user_id, user_name, user_surname, user_identification)")
      .eq("std_id", std_id)
      .eq("stdmod_active", true)
      .eq("stdmod_contract_type", "LABORAL");

    const employees = studioModels || [];
    const payrollData = [];

    for (const sm of employees) {
      const user = sm.users || {};
      const baseSalary = parseFloat(sm.stdmod_monthly_salary || 0);

      // Obtener comisiones del período seleccionado
      let commissions = 0;
      const commissionDetails = [];

      if (commission_period_ids && commission_period_ids.length > 0) {
        // Obtener ganancias de las modelos que este empleado monitorea
        const { data: streams } = await supabase
          .from("models_streams")
          .select(
            "modstr_earnings_cop, modacc_id, models_accounts(stdmod_id, studios_models(user_id_model, users(user_name, user_surname)))"
          )
          .eq("std_id", std_id)
          .in("period_id", commission_period_ids);

        // Calcular comisiones basadas en el porcentaje del empleado
        const commPercent = parseFloat(sm.stdmod_percent || 0);
        const earningsByModel = {};
        (streams || []).forEach((s) => {
          const modelName = s.models_accounts?.studios_models?.users
            ? `${s.models_accounts.studios_models.users.user_name} ${s.models_accounts.studios_models.users.user_surname}`
            : "Desconocido";
          if (!earningsByModel[modelName]) earningsByModel[modelName] = 0;
          earningsByModel[modelName] += parseFloat(s.modstr_earnings_cop || 0);
        });

        Object.entries(earningsByModel).forEach(
          ([modelName, totalEarnings]) => {
            const commission = totalEarnings * (commPercent / 100);
            commissions += commission;
            commissionDetails.push({
              model_name: modelName,
              commission_percentage: commPercent,
              total_earnings: totalEarnings,
              commission_amount: commission,
            });
          }
        );
      }

      // Obtener conceptos adicionales (horas extras)
      const { data: concepts } = await supabase
        .from("payroll_concepts")
        .select("*")
        .eq("payroll_period_id", payroll_period_id)
        .eq("stdmod_id", sm.stdmod_id);

      let extraHoursTotal = 0;
      const salaryComposition = [
        {
          concepto: "Salario base",
          porcentaje: "100.00",
          valor: baseSalary,
          isEditable: false,
        },
      ];
      (concepts || []).forEach((c) => {
        extraHoursTotal += parseFloat(c.concept_total || 0);
        salaryComposition.push({
          concepto: c.concept_description || c.concept_type,
          porcentaje: c.concept_surcharge_percentage,
          valor: parseFloat(c.concept_total || 0),
          isEditable: true,
          concept_id: c.payroll_concept_id,
        });
      });

      const totalSalary = baseSalary + extraHoursTotal;

      // Cálculos de prestaciones sociales (Colombia)
      const prestaciones = {
        prima: totalSalary * 0.0833,
        cesantias: totalSalary * 0.0833,
        intereses_cesantias: totalSalary * 0.0833 * 0.12,
        vacaciones: totalSalary * 0.0417,
      };

      // Seguridad Social (% empleador)
      const socialSecurity = {
        salud_empleador: totalSalary * 0.085,
        pension_empleador: totalSalary * 0.12,
        arl: totalSalary * 0.00522,
        salud_empleado: totalSalary * 0.04,
        pension_empleado: totalSalary * 0.04,
      };

      // Parafiscales
      const parafiscales = {
        sena: sm.stdmod_has_sena ? totalSalary * 0.02 : 0,
        icbf: sm.stdmod_has_icbf ? totalSalary * 0.03 : 0,
        caja: sm.stdmod_has_caja_compensacion ? totalSalary * 0.04 : 0,
      };

      const totalDeducciones =
        socialSecurity.salud_empleado + socialSecurity.pension_empleado;
      const totalNeto = totalSalary + commissions - totalDeducciones;

      payrollData.push({
        employee_id: user.user_id,
        employee_name: `${user.user_name || ""} ${
          user.user_surname || ""
        }`.trim(),
        stdmod_id: sm.stdmod_id,
        total_salary: totalSalary,
        commissions,
        total_deducciones: totalDeducciones,
        total_neto: totalNeto,
        prestaciones,
        social_security: socialSecurity,
        parafiscales,
        salary_composition: salaryComposition,
        commission_details: commissionDetails,
        expand: false,
      });
    }

    return { data: { success: true, data: payrollData } };
  },

  async processPayroll(params) {
    const { std_id, payroll_period_id, commission_period_ids } = params;

    // Generar preview primero
    const preview = await this.previewPayroll(params);
    const payrollData = preview.data?.data || [];

    if (payrollData.length === 0) {
      return {
        data: { success: false, message: "No hay empleados para liquidar" },
      };
    }

    // Guardar transacciones de nómina
    const records = payrollData.map((emp) => ({
      payroll_period_id,
      stdmod_id: emp.stdmod_id,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      total_salary: emp.total_salary,
      commissions: emp.commissions,
      total_deducciones: emp.total_deducciones,
      total_neto: emp.total_neto,
      prestaciones: emp.prestaciones,
      social_security: emp.social_security,
      parafiscales: emp.parafiscales,
      salary_composition: emp.salary_composition,
      commission_details: emp.commission_details,
      commission_periods: commission_period_ids || [],
    }));

    const { data, error } = await supabase
      .from("payroll_transactions")
      .insert(records)
      .select();

    if (error)
      return { data: { success: false, message: error.message }, error };

    // Marcar período como LIQUIDADO
    await supabase
      .from("payroll_periods")
      .update({ payroll_period_state: "LIQUIDADO" })
      .eq("payroll_period_id", payroll_period_id);

    return { data: { success: true, data: payrollData } };
  },

  // ── CONCEPTOS (HORAS EXTRAS) ────────────────────────────

  async addConcept(params) {
    const { data, error } = await supabase
      .from("payroll_concepts")
      .insert([params])
      .select()
      .single();
    return { data: { status: error ? "error" : "success", data }, error };
  },

  async deleteConcept(conceptId) {
    const { error } = await supabase
      .from("payroll_concepts")
      .delete()
      .eq("payroll_concept_id", conceptId);
    return { data: { status: error ? "error" : "success" }, error };
  },

  // ── PDF (fallback — sin servidor Laravel no hay PDF) ────

  async getPayrollPdf(payrollTransId) {
    // Sin servidor Laravel, generamos los datos para exportar
    const { data, error } = await supabase
      .from("payroll_transactions")
      .select("*")
      .eq("payroll_trans_id", payrollTransId)
      .single();

    return { data: { data }, error };
  },
};
