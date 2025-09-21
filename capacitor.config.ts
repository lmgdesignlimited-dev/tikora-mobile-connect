import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c9aed3406d3541c5be49ac35ef753fbf',
  appName: 'Tikora',
  webDir: 'dist',
  server: {
    url: 'https://c9aed340-6d35-41c5-be49-ac35ef753fbf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF6600",
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;