import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nowaste.ai',
  appName: 'No Waste AI',
  webDir: 'out',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com'],
    },
  },
};

export default config;
