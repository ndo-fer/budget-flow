import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export const initNativeUI = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Make status bar blend with the app (Dark text on light background)
    await StatusBar.setStyle({ style: Style.Light });
    
    // Optional: make status bar transparent to let background bleed through
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Handle hardware back button to not exit app immediately
    App.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.pathname;
      if (path !== "/home" && path !== "/auth" && canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
    
    console.log("[Capacitor] Native UI Polish initialized.");
  } catch (error) {
    console.warn("[Capacitor] Error initializing native UI:", error);
  }
};
