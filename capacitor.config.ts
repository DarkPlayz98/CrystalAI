import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crystal.app',
  appName: 'Crystal',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#090d16'
    },
    NavigationBar: {
      style: 'DARK',
      backgroundColor: '#090d16'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '390279102837-u12a9h0n65uo9orbaa4h3j0anvleses9.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    Haptics: {
      enabled: true
    }
  }
};

export default config;
