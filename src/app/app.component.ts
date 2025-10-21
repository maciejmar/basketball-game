import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';
import { RouterModule } from '@angular/router';
import { SQLiteService } from './services/sqlite.service';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { AdmobService }  from '../app/admob.service';



declare var Ump: {
  verifyConsent(
    isAgeConsent: boolean,
    isDebug: boolean,
    testDeviceHashId: string,
    success: (res: { consent: boolean; hasShownDialog: boolean; formAvailable: boolean }) => void,
    error: (err: any) => void
  ): void;
  forceForm(
    success: (res: { consent: boolean; hasShownDialog: boolean; formAvailable: boolean }) => void,
    error: (err: any) => void
  ): void;
  reset(): void;
};
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'basketball-shots-game';

constructor(private sqliteService: SQLiteService, private admob:   AdmobService
) {}

  async ngOnInit() {
    await this.sqliteService.initializeDatabase();
    
  
  // 2) Wait for device ready, then run consent + ads
  document.addEventListener('deviceready', () => this.startUp(), { once: true });
}

private async startUp(): Promise<void> {
  console.log('⚡️ AppComponent startUp fired');
  // 3) UMP: GDPR consent flow
  await this.runConsentFlow();

  // 4) AdMob: only after consent
  await this.admob.init();
  // optionally immediately show a banner:
  // await this.admob.showBanner();
}

private runConsentFlow(): Promise<void> {
  return new Promise((resolve) => {
    Ump.verifyConsent(
      /*isAgeConsent*/ false,
      /*isDebug*/       false,
      /*testDeviceHashId*/ '',
      () => resolve(),       // form shown or not needed
      () => resolve()        // on error we still proceed
    );
  });
}

// Optional UI hook if you want "Privacy Options" later:
async openPrivacyOptions(): Promise<void> {
  Ump.forceForm(
    () => {
      // consent re-done → you could refresh ads here
    },
    err => console.error('UMP forceForm error', err)
  );
}
}