import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AppData } from '../services/app-data/app-data';
import { GamePanel } from '../game-panel/game-panel';
import { GameLogic } from '../services/game-logic/game-logic';

@Component({
  selector: 'app-game-page',
  imports: [CommonModule, GamePanel],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
  providers: [AppData],
  // changeDetection: ChangeDetectionStrategy.Default,
})
export class GamePage implements OnInit {    
  constructor(
    public game : GameLogic,
    private router : Router,
  ) {}

  ngOnInit(): void {    
    this.game.startGame();
    
    this.game.gameLost$.subscribe({
      next: (value: any) => {
        if (value) {
          // const score : number = this.game.score();
          this.router.navigate(['game-over']);
        }
      },

      error: (error: any) => {
        console.log(`Error: ${error.message}`);
      }
    })
  }
}
