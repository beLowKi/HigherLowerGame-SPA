import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { SteamApp } from '../../models/steam_app';
import { AppData } from '../app-data/app-data';
// import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class GameLogic {
  game1       : WritableSignal<SteamApp | null> = signal(null);
  game2       : WritableSignal<SteamApp | null> = signal(null);
  appIdsSeen  : Signal<Set<number>> = signal(new Set<number>());
  score       : Signal<number> = signal(0);

  private gameOver = new BehaviorSubject<boolean>(false);
  gameLost$    : Observable<boolean> = this.gameOver.asObservable();
  
  constructor(
    // private router : Router,
    private appData : AppData
  ) {}


  higherSelect() : void {
    // console.log('Selected higher');
    
    const game1 = this.game1();
    const game2 = this.game2();
    
    if ( !(game1 && game2) ) {
      console.log(`Undefined games: Game1=${this.game1} Game2=${this.game2}`);
      return;
    }
    
    // Checking if game was lost

    this.gameOver.next(game1.totalSize > game2.totalSize);
    if (this.gameOver.getValue()) {
      // console.log(`Lost: Game1=${game1.toString()} Game2=${game2.toString()}`);
      return;
    }
    
    // Incrementing score
    this.score = signal(this.score() + 1);
    // console.log('Incrementing score');

    // Next game
    this.cycleGames();
  }

  lowerSelect() : void {
    // console.log('Selected lower');
    
    const game1 = this.game1();
    const game2 = this.game2();
    
    if ( !(game1 && game2) ) {
      console.log(`Undefined games: Game1=${this.game1} Game2=${this.game2}`);
      return;
    }
    
    // Checking if game was lost
    this.gameOver.next(game1.totalSize < game2.totalSize);    
    if (this.gameOver.getValue()) {
      // console.log(`Lost: Game1=${game1.toString()} Game2=${game2.toString()}`);
      return;
    }
    
    // Incrementing score
    this.score = signal(this.score() + 1);
    // this.score.set(this.score() + 1);
    // console.log('Incrementing score');

    // Next game
    this.cycleGames();
  }

  cycleGames() : void {
    // console.log('Cycling games');
    
    const game1 = this.game1();
    const game2 = this.game2();
    
    if ( !(game1 && game2) ) {
      return;
    }
    
    // TODO determine how many rounds until apps can start repeating; i.e., when they're no longer filtered from the query.
    const filter: (number | undefined)[] = [
      game1.appId,
      game2.appId
    ];
    
    // TODO add ids of apps seen this run to filter
        
    this.appData.queryApps({ appId: {$nin: filter}, totalSize: { $gt: 0 } }).subscribe({
      next: (value: any) => {
        if ( !(this.game1() && this.game2()) ) {
          return;
        }

        this.game1.set(this.game2());
        
        // TBD maybe this should be preloaded and stored in a this.nextGame?
        this.game2.set(value[ Math.floor(Math.random() * value.length) ]);
      },

      error: (error: any) => {
        console.log('Error: ' + error);
      }
    });
  }

  startGame() : void {        
    this.reset();
    
    // Randomly loads two Apps into game state
    this.appData.queryApps( { totalSize: { $gt: 0 } } ).subscribe({
      next: (value: any) => {
        // console.log(`Loaded ${value.length} Games`);
        
        let index = Math.floor(Math.random() * value.length);
        this.game1.set(value[index]);
        // this.game1.set(value[ Math.floor(Math.random() * value.length) ]);
        
        while (value[index] == this.game1()) {
          index = Math.floor(Math.random() * value.length);
        }
        
        this.game2.set(value[index]);
                
        const game1 = this.game1();
        const game2 = this.game2();
        if ( !(game1 && game2) ) {
          console.log('Error: could not read games');
          return;
        }

        console.log(`Starting game with Game1=${game1.appId} Game2=${game2.appId}`);
      },

      error: (error: any) => {
        console.log('Error: ' + error.message);
      }
    });
  }

  reset() : void {
    this.game1.set(null);
    this.game2.set(null);
    this.appIdsSeen = signal(new Set<number>());
    this.score = signal(0);
    this.gameOver.next(false);
  }
}
