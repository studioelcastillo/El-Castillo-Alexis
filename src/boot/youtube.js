import { boot } from 'quasar/wrappers'

import { createManager } from '@vue-youtube/core';
import { createApp } from 'vue';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  // something to do
  app.use(createManager()).mount('#app');
})
