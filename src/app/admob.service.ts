import { Injectable } from '@angular/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize
} from '@capacitor-community/admob';
import { environment } from '../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private bannerId = environment.admob.banner;
  private interstitialId = environment.admob.interstitial;
  private isInitialized = false;

  async init() {
    try {
      await AdMob.initialize();
      this.isInitialized = true;
    } catch (e) {
      console.error('AdMob init error:', e);
    }
  }

  async showBanner() {
    if (!this.isInitialized) return;
    try {
      const opts: BannerAdOptions = {
        adId:    this.bannerId,
        adSize:  BannerAdSize.ADAPTIVE_BANNER,
        position:BannerAdPosition.BOTTOM_CENTER,
        isTesting: !environment.production
      };
      await AdMob.showBanner(opts);
    } catch (e) {
      console.error('showBanner error:', e);
    }
  }

  async removeBanner() {
    try {
      await AdMob.removeBanner();
    } catch (e) {
      console.error('removeBanner error:', e);
    }
  }

  async showInterstitial() {
    if (!this.isInitialized) return;
    try {
      await AdMob.prepareInterstitial({ adId: this.interstitialId, isTesting: !environment.production });
      await AdMob.showInterstitial();
    } catch {
      // swallow errors
    }
  }
}