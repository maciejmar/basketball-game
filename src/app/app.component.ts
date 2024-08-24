import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  template: '<app-game ngSkipHydration></app-game>',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'basketball-game';
}
