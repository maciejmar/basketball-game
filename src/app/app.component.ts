import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';
import { RouterModule } from '@angular/router';
import { SQLiteService } from './services/sqlite.service';
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
}
}