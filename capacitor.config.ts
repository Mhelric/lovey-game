import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.loveygames.app',
  appName: 'Lovey Game',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
