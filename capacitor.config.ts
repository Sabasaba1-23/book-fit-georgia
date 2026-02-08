import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookfit.georgia',
  appName: 'book-fit-georgia',
  webDir: 'dist',
  ios: {
    // Exclude plugins that have compatibility issues with iOS/Swift Package Manager
    includePlugins: []
  }
};

export default config;


