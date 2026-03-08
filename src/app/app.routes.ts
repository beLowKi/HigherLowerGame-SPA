import { Routes } from '@angular/router';

import { HomePage } from './home-page/home-page';
import { GamePage } from './game-page/game-page';
import { GameOver } from './game-over/game-over';

export const routes: Routes = [
    { path: '', component: HomePage, pathMatch: 'full' },
    { path: 'game-page', component: GamePage, pathMatch: 'full' },
    { path: 'game-over', component: GameOver }
];
