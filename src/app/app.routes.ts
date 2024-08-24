import { Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { StartScreenComponent } from './start-screen/start-screen.component';
import { ChangeTeamsComponent } from './change-teams/change-teams.component';
import { SummaryComponent } from './summary/summary.component';

export const routes: Routes = [
    { path: "",            component: StartScreenComponent,},
    { path: "game",        component: GameComponent},
    { path: "changeNames", component: ChangeTeamsComponent},
    { path: "summary", component: SummaryComponent },
    { path: '**',          component: StartScreenComponent }
];
