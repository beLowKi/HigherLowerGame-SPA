import { EventEmitter, Injectable, signal, WritableSignal } from '@angular/core';
import { firstValueFrom, } from 'rxjs';

import { SteamApp } from '../../models/steam_app';
import { AppData } from '../app-data/app-data';

import { LRUCache } from 'lru-cache';

// NOTE < 4 will mess with GamePage scrolling
export const GAME_QUEUE_SIZE : number = 15;

// Difficulty scaling variables
// Uses exponential decay formula: y(x) = Ae^(kx) + C
// "range/2" = BASE_SIZE_RANGE*e^(SIZE_RANGE_DECAY_RATE * score) + MINIMUM_SIZE_RANGE
// NOTE that games can have closer totalSizes than this, the formula
// just sets the max distance. 

// Default totalSize range when score is 0; currently 100 GB
export const BASE_SIZE_RANGE : number = 100000000000;        

// Decay rate for totalSize range
export const SIZE_RANGE_DECAY_RATE : number = -0.55;     

// Minimum totalSize range; currently 50 MB
export const MINIMUM_TOTALSIZE_RANGE : number = 50000000        


@Injectable({
  providedIn: 'root',
})
export class GameLogic {
  // 2 active apps used during size comparisons
  // private _activeApps = new BehaviorSubject<SteamApp[]>([]);
  // public readonly activeApps$ = this._activeApps.asObservable();

  /* TODO
  
    Queue-cache process:

    (Every time queue.length < 2)
    1. Query database for (GAME_QUEUE_SIZE - queue.length) random SteamApps
      > Filter out gamesCache keys
      > Bind 'totalSize' to range determined by average of gamesCache values
    2. Add them to the back of the queue
    3. Add {appId: totalSize} entries to gamesCache

    (Every game cycle)
    1. Check first 2 games in queue based on whether 
      "higher" or "lower" was selected
    2. If game was lost, then stop here
    3. Pop first game in queue 
  */
  
  // Defined while GameLogic is waiting for the database
  // to return a list of SteamApps which will refresh "appQueue"
  private appRefresh : Promise<SteamApp[]> | undefined;
  readonly refreshed = new EventEmitter<void>();
  
  // Queue of SteamApp IDs which fill in to "activeApps" after each cycle.
  // private _appQueue = new BehaviorSubject<SteamApp[]>([]);
  // public readonly appQueue$ = this._appQueue.asObservable();

  private _appQueue : WritableSignal<SteamApp[]> = signal([]);
  readonly appQueue = this._appQueue.asReadonly();

  // Cache of {appId: totalSize} for
  // a number of SteamApps shown during a game.
  // This is used to remove duplicates from API queries and
  // for difficulty scaling. 
  private gamesCache = new LRUCache<number, number>({
    max: 20,
    updateAgeOnGet: false,
    updateAgeOnHas: false
  });
  
  // Game state
  private _score: WritableSignal<number> = signal(0);
  readonly score = this._score.asReadonly();
  
  private _gameLost : WritableSignal<boolean> = signal(false);
  public readonly gameLost = this._gameLost.asReadonly();
  readonly gameOver = new EventEmitter<void>();
  
  constructor(private appData : AppData) {}

  
  // Refreshes game queue
  private queueRefresh() : void {
    if (this.appRefresh) {
      return;
    }
    
    // Getting number of empty slots
    let queue : SteamApp[] = this._appQueue();
    const numEmptySlots : number = GAME_QUEUE_SIZE - queue.length;
    if (numEmptySlots <= 0) {
      return;
    }

    // Querying database
    const idBlacklist : number[] = [...this.gamesCache.keys()];
    const totalSizeBounds = this.getSizeBounds();

    // Samples (numEmptySlots) random SteamApps
    this.appRefresh = firstValueFrom(this.appData.sampleApps(
      {
        appId: {$nin: idBlacklist}, 
        totalSize: totalSizeBounds,
        
        /*
          This predicate isn't necessary, but it filters
          by SteamApps with at least 1 good mobile and desktop image. 
          It helps with the visuals by ensuring every app has
          images that work in both layouts.
        */
        $and: [
          {
            $or: [
              { "images.600x900": {$exists: true} },
              { "images.600x900_2x": {$exists: true} },
            ]
          },
          {
            $or: [
              { "images.header": {$exists: true} },
              { "images.logo": {$exists: true} },
            ]
          }
        ]
      }, numEmptySlots
    ));
    
    // Queuing the handling of the sample
    this.appRefresh
      .then((value: SteamApp[]) => {
        // Refilling queue
        value.forEach((app: SteamApp) => {
          queue.push(app);
          // this.gamesCache.set(app.appId, app.totalSize);
        })
        
        this._appQueue.set(queue);

        // DEBUG - displays each apps totalSize
        // console.log("Queue refreshed");
        // value.forEach((app) => {
        //   console.log(`\t${Object.values(app.names).at(0)} - ${app.totalSize}`);
        // });
        
        // Request fulfilled
        this.appRefresh = undefined;
        this.refreshed.emit();
      })

      .catch((err) => {
        console.log(`Error refreshing game queue: ${err}`);
      });
  }
  

  // Game cycle - moves to next 2 games in queue, refreshing if necessary
  private async cycleGames() : Promise<void> {
    // Waits for ongoing appRefresh if any
    if (this.appRefresh) {
      await this.appRefresh;
    }
    
    // console.log("cycling games");
    
    // Pulling first app in queue
    let queue = this._appQueue();
    const removedApp : SteamApp | undefined = queue.shift();
    
    // Caching app's totalSize for future 
    // queue refreshes and difficulty calculations
    if (removedApp !== undefined) {
      this.gamesCache.set(removedApp.appId, removedApp.totalSize);
    }
    
    this._appQueue.set(queue);
    // console.log(`[GameLogic] Post-cycle queue has ${queue.length} apps`);
    
    // Queuing a refresh
    if (queue.length < 3) {
      // console.log("[GameLogic] Queuing refresh post cycle");
      this.queueRefresh();
    }
  }
  

  // Returns the current range for SteamApps' totalSize 
  // based on score and sizes of recently shown games.  
  getSizeBounds() : {$gte: number, $lte?: number} {
    const score : number = this._score();
    if (score <= 0) {
      return { $gte: 1 }
    }
    
    // Calculating baseSize for totalSize range
    const gameSizes : number[] = [...this.gamesCache.values()];
    let baseSize : number = 0;
    if (gameSizes.length > 0) {
      // Gets average totalSize of cached games
      // const baseSize : number = gameSizes.reduce((prev, curr) => prev + curr, 0);
      
      // Uses median instead of average
      gameSizes.sort();
      baseSize = gameSizes[Math.floor(gameSizes.length / 2)];
    }
    
    // Depending on score, determine range
    const maxDiff : number = BASE_SIZE_RANGE * 
      Math.E^(SIZE_RANGE_DECAY_RATE * score) + MINIMUM_TOTALSIZE_RANGE;

    const min: number = Math.max(1, baseSize - maxDiff); 
    const max: number = ( baseSize + maxDiff );
    // console.log(
    //   `Size bounds: [${min}, ${max}]\n` + 
    //   `\nBase size: ${baseSize}` +
    //   `\nScore: ${score}`
    // )
    return {
      $gte: min,
      $lte: max
    }
  }


  // Returns game 1 (on the left) which is just the first
  // SteamApp in the queue. May be undefined. 
  getGame1() : SteamApp | undefined {
    return this._appQueue().at(0);
  }
  
  
  // Returns game 2 (on the right) which is just the second
  // SteamApp in the queue. May be undefined.
  getGame2() : SteamApp | undefined {
    return this._appQueue().at(1);
  }
  
  
  // Simulates 'higher' being selected for _game2
  higherSelect() : void {
    // console.log('Selected higher');
    const queue = this._appQueue();
    if (queue.length < 2) {
      return;
    }
    
    // Checking if game was lost
    const app1 = queue[0];
    const app2 = queue[1];
    if (app1.totalSize > app2.totalSize) {
      this._gameLost.set(true);
      this.gameOver.emit();
      return;
    }
    
    // Incrementing _score
    this._score.set(this._score() + 1)

    // Next iteration
    this.cycleGames();
  }


  // Simulates 'lower' being selected for _game2
  lowerSelect() : void {
    // console.log('Selected lower');
    const queue = this._appQueue();
    if (queue.length < 2) {
      return;
    }
    
    // Checking if game was lost
    const app1 = queue[0];
    const app2 = queue[1];
    if (app1.totalSize < app2.totalSize) {
      this._gameLost.set(true);
      this.gameOver.emit();
      return;
    }
    
    // Incrementing _score
    this._score.set(this._score() + 1)

    // Next iteration
    this.cycleGames();
  }


  // Returns the next game in the preloaded cache
  // nextGame() : SteamApp {
  //   // TODO
  // }


  // Initializes game state
  startGame() : void {        
    this.reset();
    
    // Begins first game cycle
    this.cycleGames();
  }


  // Resets game state
  reset() : void {
    if (this._score() > 0) {
      this._score.set(0)
    }
    
    // TBD queue doesn't need to reset, and it may
    // be beneficial to use preloaded queue for future games
    // Though, without shuffling, it will mean that the app a user lost
    // on will be the first revealed app after selecting "Play Again".
    this._appQueue.set([]);
    
    // this._score.set(0);
    if (this._gameLost()) {
      this._gameLost.set(false);
    }
  }
}
