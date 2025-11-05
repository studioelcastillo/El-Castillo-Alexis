import moment from 'moment/min/moment-with-locales';
import momentTZ from 'moment-timezone'
import { date } from 'quasar';

/* INDEX
 * convertUTCDateToLocalDate(): Format date to an expecific format.
 * monthDiff(): Get the difference in months between 2 Dates.
 * addDaysToDate(): Add (n) days to Date.
 * addMonthsToDate(): Add (n) months to Date.
 * getMonthName(): Get month name.
 * getMonthShortName(): Get short month name.
 */

export const xMiscDate = {
  data () {
    return {
      days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
      daysShort: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
      daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
      months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Augosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'],
      monthsSelect: [
        { label: '', value: '' },
        { label: 'Enero', value: 1 },
        { label: 'Febrero', value: 2 },
        { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 },
        { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 },
        { label: 'Augosto', value: 8 },
        { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 },
        { label: 'Diciembre', value: 12 },
      ],
      today: "Hoy",
      locale: {
        es: {
          days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
          daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
          months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
          monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
          firstDayOfWeek: 1, // 0-6, 0 - Sunday, 1 Monday, ...
          format24h: true,
          pluralDay: 'dias'
        }
      }
    }
  },
  methods: {
    // format date to an expecific format
    convertUTCDateToLocalDate (date, format = 'YYYY-MM-DD HH:mm:ss') {
      if (date) {
        return momentTZ.utc(date).local().format(format)
      } else {
        return ''
      }
    },
    // get the difference in months between 2 Dates
    monthDiff (d1, d2) {
      var months
      months = (d2.getFullYear() - d1.getFullYear()) * 12
      months -= d1.getMonth()
      months += d2.getMonth()
      return months <= 0 ? 0 : months
    },
    // add (n) days to Date
    addDaysToDate (date, days) {
      var res = new Date(date)
      res.setDate(res.getDate() + days)
      return res
    },
    // add (n) months to Date
    addMonthsToDate (date, months) {
      var res = new Date(date)
      res.setMonth(res.getMonth() + months)
      return res
    },
    // get month name
    getMonthName (m) {
      return this.months[m]
    },
    // get short month name
    getMonthShortName (m) {
      return this.monthsShort[m]
    },
    getTodayFormated (format = "YYYY/MM/DD") {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      if (format == "YYYY/MM/DD") {
        today = yyyy + '/' + mm + '/' + dd;
      }
      return today;
    },
    getMonthIndex (monthName) {
      return this.months.indexOf(monthName) + 1;
    },
    // get time to notifications
    fromNow (date) {
      momentTZ.defineLocale('es', moment.localeData('es')._config)
      return (momentTZ().diff(momentTZ(date), 'days') > 10) ? this.convertUTCDateToLocalDate(date) : momentTZ(date).fromNow()
    },
    // get time to notifications
    diffDays (date) {
      momentTZ.defineLocale('es', moment.localeData('es')._config)
      var diff = 0;
      if (date !== '') {
        /* Obtenemos un moment de ahora mismo */
        const fecha_inicio = moment();
        /* Obtenemos un moment de la fecha indicada anteriormente */
        const fecha_termino = moment(date);

        /* Calculamos la diferencia y la mostramos en el documento */
        diff = fecha_termino.diff(fecha_inicio, 'years');
      }

      return Math.abs(diff)
    },
    diffHours (dateI, dateF = moment()) {
      dateF = (dateF) ? dateF : moment()
      momentTZ.defineLocale('es', moment.localeData('es')._config)
      var diff = 0;
      if (date !== '') {
        /* Obtenemos un moment de ahora mismo */
        const fecha_inicio = momentTZ(dateF);
        /* Obtenemos un moment de la fecha indicada anteriormente */
        const fecha_termino = momentTZ( (dateI.includes('Z')) ? dateI : dateI + 'Z' );

        /* Calculamos la diferencia y la mostramos en el documento */
        diff = fecha_termino.diff(fecha_inicio, 'h');
      }

      return Math.abs(diff)
    },
    diffTime (dateI, dateF = moment()) {
      dateF = (dateF) ? dateF : moment()
      momentTZ.defineLocale('es', moment.localeData('es')._config)
      var diff = 0;
      if (date !== '') {
        /* Obtenemos un moment de ahora mismo */
        const fecha_inicio = momentTZ(dateF);
        /* Obtenemos un moment de la fecha indicada anteriormente */
        const fecha_termino = momentTZ( (dateI.includes('Z')) ? dateI : dateI + 'Z' );

        /* Calculamos la diferencia y la mostramos en el documento */
        diff = fecha_termino.diff(fecha_inicio, 's');
      }

      let segundosP = Math.abs(diff);
      let h = (Math.floor(segundosP / 3600))
      let m = (Math.floor(segundosP / 60 ) % 60)
      let s = (Math.round(segundosP % 60))

      return {
        h: h,
        m: m,
        s: s
      }
    },
    formatSeconds (seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}
