import { Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { StartScreenComponent } from './start-screen/start-screen.component';
import { ChangeTeamsComponent } from './change-teams/change-teams.component';
import { SummaryComponent } from './summary/summary.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { HowToPlayComponent } from './how-to-play/how-to-play.component';

export const routes: Routes = [
    { path: '',            component: WelcomeComponent },
    { path: 'menu',        component: StartScreenComponent },
    { path: 'how-to-play', component: HowToPlayComponent },
    { path: 'game',        component: GameComponent },
    { path: 'changeNames', component: ChangeTeamsComponent },
    { path: 'summary',     component: SummaryComponent },
    { path: '**',          component: WelcomeComponent }
];
