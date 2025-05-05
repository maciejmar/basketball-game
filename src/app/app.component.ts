import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';
import { RouterModule } from '@angular/router';
import { SQLiteService } from './services/sqlite.service';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'basketball-shots-game';

constructor(private sqliteService: SQLiteService) {}

  async ngOnInit() {
    await this.sqliteService.initializeDatabase();
  

   // Wait for the Capacitor deviceready event to ensure the native runtime is ready
   document.addEventListener('deviceready', async () => {
      try {
        await AdMob.initialize();
        console.log('AdMob initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize AdMob:', err);
      }
      document.addEventListener('deviceready', () => {
        // Log the list of registered Capacitor plugins
        console.log('Registered Plugins:', Object.keys(Capacitor.Plugins));
      }, false);
   }, false);
  }
}