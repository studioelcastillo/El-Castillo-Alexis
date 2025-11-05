export const xMiscCore = {
  data () {
    return {
    }
  },
  methods: {
    getExecutionColor (value) {
      if (value > 80) {
        return 'positive'
      } else if (value > 40) {
        return 'warning'
      } else {
        return 'negative'
      }
    }
  }
}
