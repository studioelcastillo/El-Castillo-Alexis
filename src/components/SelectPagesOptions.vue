<template>
    <q-select
      filled
      use-input
      hide-selected
      fill-input
      input-debounce="0"
      v-model="selectedPage"
      label="Pagina"
      label-color="primary"
      :options="options"
      :error="errorMessage != ''"
      :error-message="errorMessage"
      :readonly="mode == 'show' || mode == 'edit' || readonly"
      @filter="filterFn"
    />
  </template>
  
  <script>
  
  export default {
    name: 'SelectPagesOptions',
    props: {
      modelValue: {
        type: Object,
        required: true
      },
      mode: {
        type: String,
        default: 'create'
      },
      readonly:{
        type: Boolean,
        default: false
      },
      errorMessage: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        pages: [
          { label: 'Páginas privadas', value: 'private', disable: true },
          { label: 'LIVEJASMIN', value: 'LIVEJASMIN' },
          { label: 'STREAMATE', value: 'STREAMATE' },
          { label: 'IMLIVE', value: 'IMLIVE' },
          { label: 'FLIRT4FREE', value: 'FLIRT4FREE' },
          { label: 'SKYPRIVATE', value: 'SKYPRIVATE' },
          { label: 'XLOVECAM', value: 'XLOVECAM' },
          { label: 'STREAMRAY', value: 'STREAMRAY' },
          { label: 'ADULTWORK', value: 'ADULTWORK' },
          { label: 'SAKURALIVE', value: 'SAKURALIVE' },
          { label: 'Páginas de tokens', value: 'token', disable: true },
          { label: 'CHATURBATE', value: 'CHATURBATE' },
          { label: 'CHATURBATE(2)', value: 'CHATURBATE(2)' },
          { label: 'BONGACAMS', value: 'BONGACAMS' },
          { label: 'CAM4', value: 'CAM4' },
          { label: 'CAMSODA', value: 'CAMSODA' },
          { label: 'CAMSODA ALIADOS', value: 'CAMSODA ALIADOS' },
          { label: 'MYDIRTYHOBBY', value: 'MYDIRTYHOBBY' },
          { label: 'STRIPCHAT', value: 'STRIPCHAT' },
          { label: 'CHERRY', value: 'CHERRY' },
          { label: 'DREAMCAM', value: 'DREAMCAM' },
          { label: 'Páginas de contenido', value: 'content', disable: true },
          { label: 'ONLYFANS', value: 'ONLYFANS' },
          { label: 'ONLYFANS_VIP', value: 'ONLYFANS_VIP' },
          { label: 'F2F', value: 'F2F' },
          { label: 'FANSLY', value: 'FANSLY' },
          { label: 'FANCENTRO', value: 'FANCENTRO' },
          { label: 'XHAMSTER', value: 'XHAMSTER' },
          { label: 'SWIPEY.AI', value: 'SWIPEY.AI' },
          { label: 'CHARMS', value: 'CHARMS' },
          { label: 'PORNHUB', value: 'PORNHUB' },
          { label: 'SEXCOM', value: 'SEXCOM' },
          { label: 'LOYALFANS', value: 'LOYALFANS' },
          { label: 'LOVERFANS', value: 'LOVERFANS' },
          { label: 'MANYVIDS', value: 'MANYVIDS' },
          //{ label: 'KWIKY', value: 'KWIKY' },
          { label: 'Redes sociales', value: 'social', disable: true },
          { label: 'MYLINKDROP', value: 'MYLINKDROP' },
          { label: 'INSTAGRAM', value: 'INSTAGRAM' },
          { label: 'X', value: 'X' },
          { label: 'TIKTOK', value: 'TIKTOK' },
          { label: 'TELEGRAM', value: 'TELEGRAM' },
          { label: 'REDDIT', value: 'REDDIT' },
          { label: 'LOVENSE', value: 'LOVENSE' },
          { label: 'AMAZON', value: 'AMAZON' },
          { label: 'TWITCH', value: 'TWITCH' },
          { label: 'DISCORD', value: 'DISCORD' }
        ],
        options: []
      }
    },
    computed: {
      selectedPage: {
        get() {
          return { label: this.modelValue, value: this.modelValue }
        },
        set(value) {
          this.$emit('update:modelValue', value.value)
        }
      }
    },
    methods: {
      filterFn (val, update, abort) {
        update(() => {
          this.options = this.pages.filter(page => {
            const searchTerm = val.toLowerCase();
            return page.label.toLowerCase().includes(searchTerm);
          });
        })
      }
    }
    
  }
  </script>