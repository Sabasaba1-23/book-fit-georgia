import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookfit.georgia',
  appName: 'book-fit-georgia',
  webDir: 'dist',
  server: {
    url: 'https://fitbook.my',
    cleartext: true,
  },
};

export default config;


