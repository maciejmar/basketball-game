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

  async init() {
    await AdMob.initialize();
  }

  async showBanner() {
    const opts: BannerAdOptions = {
      adId:    this.bannerId,
      adSize:  BannerAdSize.ADAPTIVE_BANNER,
      position:BannerAdPosition.BOTTOM_CENTER,
      isTesting: !environment.production
    };
    await AdMob.showBanner(opts);
  }

  async removeBanner() {
    await AdMob.removeBanner();
  }

  async showInterstitial() {
    try {
      await AdMob.prepareInterstitial({ adId: this.interstitialId, isTesting: !environment.production });
      await AdMob.showInterstitial();
    } catch {
      // swallow errors
    }
  }
}