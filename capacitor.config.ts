import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookfit.georgia',
  appName: 'FitBook Georgia',
  webDir: 'dist',
  // For development hot-reload, uncomment the server block below:
  // server: {
  //   url: 'https://fitbook.my',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#FFFCFA',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
