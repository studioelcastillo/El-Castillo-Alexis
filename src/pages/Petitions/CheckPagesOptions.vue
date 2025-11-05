<template>
  <template v-for="(pageType, index) in pagesOptions" :key="index">
    <span>{{ pagesLabel[index] }}</span><br>
    <q-checkbox
      v-for="(page, index2) in pageType"
      :key="index2"
      v-model="selectedPages"
      :val="page"
      :label="page"
      color="teal"
      @update:model-value="validateMaxPetitions()"
      :disable="userId == 0"
    />
    <q-separator />
  </template>
  <!-- {{ userId }}
  {{ selectedPages }} 
   {{ pagesOptions }}-->
</template>

<script>

import { xMisc } from 'src/mixins/xMisc.js'
import { sGate } from 'src/mixins/sGate.js'

export default {
  name: 'CheckPagesOptions',
  mixins: [xMisc, sGate],
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'create'
    },
    userId: {
      type: Number,
      default: 0
    },
    notIncludePages: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      sUser: {},
      pages: {
        private:[
          'LIVEJASMIN',
          'STREAMATE',
          'IMLIVE',
          'FLIRT4FREE',
          'SKYPRIVATE',
          'XLOVECAM',
          'STREAMRAY',
          'ADULTWORK',
          'SAKURALIVE'
        ],
        token: [
          'CHATURBATE',
          'BONGACAMS',
          'CAM4',
          'CAMSODA',
          'CAMSODA ALIADOS',
          'MYDIRTYHOBBY',
          'STRIPCHAT',
          'CHERRY',
          'DREAMCAM'
        ],
        content: [
          'ONLYFANS',
          'ONLYFANS_VIP',
          'F2F',
          'FANSLY',
          'FANCENTRO',
          'XHAMSTER',
          'SWIPEY.AI',
          'CHARMS',
          'PORNHUB',
          'SEXCOM',
          'LOYALFANS',
          'LOVERFANS',
          'MANYVIDS',
          //'KWIKY'
        ],
        social: [
          'MYLINKDROP',
          'INSTAGRAM',
          'X',
          'TIKTOK',
          'TELEGRAM',
          'REDDIT',
          'LOVENSE',
          'AMAZON',
          'TWITCH',
          'DISCORD'
        ]
      },
      pagesLabel: {
        private: 'Páginas privadas',
        token: 'Páginas de tokens',
        content: 'Páginas de contenido',
        social: 'Redes sociales'
      }
    }
  },
  computed: {
    selectedPages: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    pagesOptions() {
      return Object.fromEntries(
        Object.entries(this.pages).map(([key, values]) => [
          key,
          values.filter(value => !this.notIncludePages.includes(value))
        ])
      )
    }
  },
  mounted () {
    this.sUser = this.decryptSession('user')
  },
  methods: {
    validateMaxPetitions () {
      this.$emit('validate-max-petitions')
    }
  }
}
</script>