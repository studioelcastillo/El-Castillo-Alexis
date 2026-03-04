<template>
  <q-card class="q-mt-md" v-if="studioId > 0">
    <q-card-section>
      <div class="text-h6 q-mb-md">Períodos de nómina</div>

      <!-- Configuración automática -->
      <!-- <div class="row q-col-gutter-md q-mb-md" v-if="parentMode !== 'show'">
        <div class="col-md-6">
          <q-toggle
            v-model="autoGenerate"
            label="Generar períodos automáticamente"
            @update:model-value="updateAutoGeneration"
            color="primary"
          />
        </div>
      </div> -->

      <!-- Botones para generar períodos -->
      <div class="q-mb-md" v-if="autoGenerate && parentMode !== 'show'">
        <q-btn
          @click="generateCurrentPeriod"
          label="Generar período actual"
          color="primary"
          icon="add_circle"
          :loading="generating"
          size="sm"
        />
        <q-btn
          @click="generateNextPeriods"
          label="Generar próximos 3 períodos"
          color="secondary"
          icon="schedule"
          class="q-ml-sm"
          :loading="generating"
          size="sm"
        />
      </div>

      <!-- Lista de períodos existentes -->
      <q-table
        :rows="Array.isArray(periods) ? periods : []"
        :columns="periodColumns"
        title="Períodos"
        dense
        :loading="loading"
        v-model:pagination="pagination"
        row-key="payroll_period_id"
      >
        <template v-slot:body-cell-interval_used="props">
          <q-td :props="props">
            <q-chip
              :color="getIntervalColor(props.value)"
              text-color="white"
              size="sm"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-auto_generated="props">
          <q-td :props="props">
            <q-chip
              :color="props.value ? 'green' : 'orange'"
              text-color="white"
              size="sm"
            >
              {{ props.value ? "Automático" : "Manual" }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-state="props">
          <q-td :props="props">
            <q-chip
              :color="getStateColor(props.value)"
              text-color="white"
              size="sm"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="
                props.row.payroll_period_state === 'ABIERTO' &&
                parentMode !== 'show'
              "
              @click="closePeriod(props.row)"
              icon="lock"
              size="sm"
              color="orange"
              round
              flat
            >
              <q-tooltip>Cerrar período</q-tooltip>
            </q-btn>
            <q-btn
              v-else-if="
                props.row.payroll_period_state === 'CERRADO' &&
                parentMode !== 'show'
              "
              @click="openPeriod(props.row)"
              icon="lock_open"
              size="sm"
              color="green"
              round
              flat
            >
              <q-tooltip>Abrir período</q-tooltip>
            </q-btn>
            <q-btn
              v-if="!props.row.is_auto_generated && parentMode !== 'show'"
              @click="deletePeriod(props.row)"
              icon="delete"
              size="sm"
              color="red"
              round
              flat
            >
              <q-tooltip>Eliminar período manual</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script>
import { xMisc } from "src/mixins/xMisc.js";
import { sGate } from "src/mixins/sGate.js";
import PayrollService from "src/services/PayrollService";

export default {
  name: "StudioPayrollPeriods",
  mixins: [xMisc, sGate],
  props: {
    studioId: {
      type: Number,
      required: true,
    },
    liquidationInterval: {
      type: String,
      default: "",
    },
    payrollLiquidationInterval: {
      type: String,
      default: "MENSUAL",
    },
    parentMode: {
      type: String,
      default: "edit",
    },
  },

  data() {
    return {
      autoGenerate: true,
      periods: [],
      loading: false,
      generating: false,
      periodColumns: [
        {
          name: "payroll_period_id",
          label: "ID",
          field: "payroll_period_id",
          align: "left",
          sortable: true,
        },
        {
          name: "start_date",
          label: "Fecha Inicio",
          field: "payroll_period_start_date",
          align: "left",
          sortable: true,
          format: (val) => this.formatDate(val),
        },
        {
          name: "end_date",
          label: "Fecha Fin",
          field: "payroll_period_end_date",
          align: "left",
          sortable: true,
          format: (val) => this.formatDate(val),
        },
        {
          name: "interval_used",
          label: "Intervalo Usado",
          field: "payroll_period_interval",
          align: "center",
        },
        {
          name: "state",
          label: "Estado",
          field: "payroll_period_state",
          align: "center",
        },
        {
          name: "auto_generated",
          label: "Tipo",
          field: "is_auto_generated",
          align: "center",
        },
        {
          name: "actions",
          label: "Acciones",
          align: "center",
        },
      ],
      pagination: {
        sortBy: "payroll_period_start_date",
        descending: true,
        page: 1,
        rowsPerPage: 5,
      },
    };
  },

  computed: {
    intervalColor() {
      return this.payrollLiquidationInterval === "SEMANAL"
        ? "blue"
        : this.payrollLiquidationInterval === "QUINCENAL"
        ? "purple"
        : "green";
    },
    intervalText() {
      return this.payrollLiquidationInterval === "SEMANAL"
        ? "Semanal"
        : this.payrollLiquidationInterval === "QUINCENAL"
        ? "Quincenal"
        : "Mensual";
    },
  },

  watch: {
    studioId() {
      if (this.studioId > 0) {
        this.loadPeriods();
      }
    },
  },

  mounted() {
    if (this.studioId > 0) {
      this.loadPeriods();
    }
  },

  methods: {
    async loadPeriods() {
      try {
        this.loading = true;
        const response = await PayrollService.getPayrollPeriods({
          std_id: this.studioId,
        });
        this.periods = response.data?.data || [];
      } catch (error) {
        this.periods = [];
        this.errorsAlerts(error);
      } finally {
        this.loading = false;
      }
    },

    async generateCurrentPeriod() {
      try {
        this.generating = true;
        await PayrollService.autoGeneratePeriod({
          std_id: this.studioId,
          target_date: new Date().toISOString().split("T")[0],
        });
        this.alert("positive", "Período generado exitosamente");
        this.loadPeriods();
      } catch (error) {
        this.errorsAlerts(error);
      } finally {
        this.generating = false;
      }
    },

    async generateNextPeriods() {
      try {
        this.generating = true;
        await PayrollService.autoGenerateNextPeriods({
          std_id: this.studioId,
          count: 3,
        });
        this.alert("positive", "Períodos futuros generados");
        this.loadPeriods();
      } catch (error) {
        this.errorsAlerts(error);
      } finally {
        this.generating = false;
      }
    },

    async closePeriod(period) {
      this.$q
        .dialog({
          title: "Confirmar",
          message: "¿Estás seguro de cerrar este período de nómina?",
          cancel: "Cancelar",
          ok: "Cerrar",
          persistent: true,
        })
        .onOk(async () => {
          try {
            await PayrollService.closePeriod(period.payroll_period_id);
            this.alert("positive", "Período cerrado exitosamente");
            this.loadPeriods();
          } catch (error) {
            this.errorsAlerts(error);
          }
        });
    },

    async openPeriod(period) {
      this.$q
        .dialog({
          title: "Confirmar",
          message: "¿Estás seguro de abrir este período de nómina?",
          cancel: "Cancelar",
          ok: "Abrir",
          persistent: true,
        })
        .onOk(async () => {
          try {
            await PayrollService.openPeriod(period.payroll_period_id);
            this.alert("positive", "Período abierto exitosamente");
            this.loadPeriods();
          } catch (error) {
            this.errorsAlerts(error);
          }
        });
    },

    async deletePeriod(period) {
      this.$q
        .dialog({
          title: "Confirmar",
          message: "¿Estás seguro de eliminar este período de nómina manual?",
          cancel: "Cancelar",
          ok: "Eliminar",
          persistent: true,
        })
        .onOk(async () => {
          try {
            await PayrollService.deletePeriod(period.payroll_period_id);
            this.alert("positive", "Período eliminado exitosamente");
            this.loadPeriods();
          } catch (error) {
            this.errorsAlerts(error);
          }
        });
    },

    updateAutoGeneration() {
      console.log("Auto generation changed:", this.autoGenerate);
    },

    getIntervalColor(interval) {
      return interval === "SEMANAL"
        ? "blue"
        : interval === "QUINCENAL"
        ? "purple"
        : "green";
    },

    getStateColor(state) {
      return state === "ABIERTO"
        ? "green"
        : state === "CERRADO"
        ? "orange"
        : "red";
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
