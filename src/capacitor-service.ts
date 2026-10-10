import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let isInitialized = false;

export async function initCapacitor() {
  if (isInitialized) return;
  isInitialized = true;

  const isNative = Capacitor.isNativePlatform();
  console.log('[Capacitor] Initializing Rawla Mandi Android app. Native platform:', isNative);

  // Apply mobile web safe areas & native styles
  document.body.classList.add('capacitor-platform');
  if (isNative) {
    document.body.classList.add('capacitor-native-android');
  }

  // 1. Configure StatusBar
  try {
    if (isNative) {
      // By default Rawla Mandi runs in dark mode theme (#020617)
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (err) {
    console.warn('[Capacitor] StatusBar configuration note:', err);
  }

  // 2. Hide Splash Screen smoothly once app boots
  try {
    if (isNative) {
      setTimeout(async () => {
        try {
          await SplashScreen.hide({ fadeOutDuration: 400 });
        } catch (e) {
          // ignore
        }
      }, 600);
    }
  } catch (err) {
    console.warn('[Capacitor] SplashScreen note:', err);
  }

  // 3. Android Hardware Back Button Handling
  try {
    if (isNative) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        console.log('[Capacitor] Hardware Back button pressed');

        // Check if any modal or popup is open and close it
        const closeButtons = document.querySelectorAll<HTMLButtonElement>(
          'button[title*="बंद"], button[aria-label*="close" i], button[aria-label*="Close" i], .fixed button svg[class*="lucide-x"], .fixed button svg[class*="lucide-x-mark"]'
        );
        if (closeButtons.length > 0) {
          const topCloseBtn = closeButtons[closeButtons.length - 1];
          topCloseBtn.click();
          triggerHaptic();
          return;
        }

        // Check if user is inside a shop detail view or dashboard
        const backToShopTools = document.querySelector<HTMLButtonElement>('button:has-text("वापस"), button:has-text("Back")');
        const customBackBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
          b => b.textContent?.includes('वापस') || b.textContent?.includes('Back')
        );

        if (customBackBtn) {
          customBackBtn.click();
          triggerHaptic();
          return;
        }

        if (canGoBack) {
          window.history.back();
        } else {
          // If on root page, exit app
          CapApp.exitApp();
        }
      });
    }
  } catch (err) {
    console.warn('[Capacitor] BackButton listener note:', err);
  }

  // 4. Network Status Monitoring (Offline/Online notification banner)
  try {
    Network.addListener('networkStatusChange', status => {
      console.log('[Capacitor] Network status changed:', status);
      updateNetworkBanner(status.connected);
    });

    // Check initial network status
    Network.getStatus().then(status => {
      if (!status.connected) {
        updateNetworkBanner(false);
      }
    });
  } catch (err) {
    console.warn('[Capacitor] Network listener note:', err);
  }

  // 5. Setup native vibration / haptic feedback on navigation interactions
  setupHapticInteractions();
}

/**
 * Triggers light haptic feedback if running on native device
 */
export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Light) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics not supported or permitted on device
    }
  }
}

/**
 * Attaches subtle haptic feedback to tab bar buttons and primary action buttons
 */
function setupHapticInteractions() {
  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement)?.closest('button, nav a, [role="button"]');
    if (target) {
      triggerHaptic(ImpactStyle.Light);
    }
  }, { passive: true });
}

/**
 * In-app offline indicator banner for native Android users
 */
function updateNetworkBanner(isConnected: boolean) {
  const existingBanner = document.getElementById('rawla-offline-banner');
  if (!isConnected) {
    if (!existingBanner) {
      const banner = document.createElement('div');
      banner.id = 'rawla-offline-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        background: #dc2626;
        color: #ffffff;
        font-family: 'Noto Sans Devanagari', sans-serif;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        padding: 6px 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      `;
      banner.innerHTML = `
        <span>⚠️ आप ऑफ़लाइन हैं (इंटरनेट बंद है)। स्थानीय डेटा प्रदर्शित किया जा रहा है।</span>
      `;
      document.body.appendChild(banner);
    }
  } else {
    if (existingBanner) {
      existingBanner.style.background = '#16a34a';
      existingBanner.innerHTML = `<span>✅ इंटरनेट पुनः कनेक्ट हो गया! डेटा सिंक हो रहा है...</span>`;
      setTimeout(() => {
        existingBanner.remove();
      }, 3000);
    }
  }
}
