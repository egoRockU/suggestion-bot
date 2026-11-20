import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Suggestion Bot',
    description: 'Suggests replies to messages in Gmail and Google Chat using Claude on your computer.',
    permissions: ['sidePanel', 'storage'],
    // The local helper (see helper/server.mjs).
    host_permissions: ['http://127.0.0.1:43117/*'],
  },
});
