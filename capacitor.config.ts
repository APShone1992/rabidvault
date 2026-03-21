import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.rabidvault.app',
  appName: 'The Rabid Vault',
  webDir:  'dist',
  server: {
    androidScheme: 'https',
    cleartext:     false,
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration:  2000,
      backgroundColor:     '#0d0d12',
      showSpinner:         false,
      androidSpinnerStyle: 'small',
      splashFullScreen:    true,
      splashImmersive:     true,
    },
    StatusBar: {
      style:           'DARK',
      backgroundColor: '#0d0d12',
    },
    Camera: {
      // Used for comic cover scanning and barcode scanning
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize:             'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
