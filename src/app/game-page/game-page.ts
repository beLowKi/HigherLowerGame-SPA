import { 
  Component, OnInit, WritableSignal, signal, 
  ViewChild, ViewChildren, QueryList, 
  ElementRef, EventEmitter, HostListener, 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AppData } from '../services/app-data/app-data';
import { GamePanel } from '../game-panel/game-panel';
import { GameLogic } from '../services/game-logic/game-logic';
import { SteamApp } from '../models/steam_app';

@Component({
  selector: 'app-game-page',
  imports: [CommonModule, GamePanel],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
  providers: [AppData],
})
export class GamePage implements OnInit {    
  @ViewChild('panelContainer') panelContainer?: ElementRef;
  @ViewChildren(GamePanel) gamePanels!: QueryList<GamePanel>;
  
  // Apps currently loaded as GamePanels
  private _activeApps: WritableSignal<SteamApp[]> = signal([]);
  readonly activeApps = this._activeApps.asReadonly();

  // Ongoing scroll of GamePanel container
  private scrolling : WritableSignal<boolean> = signal(false);
  readonly scrollEnded = new EventEmitter<void>();
  private scrollCount : number = 0;
  

  constructor(
    private router : Router,
    // private renderer : Renderer2,
    public game : GameLogic,
  ) {
  }
  
  
  @HostListener('window:resize', ['$event'])
  onWindowResized(event?: any) : void {
    // console.log("Pre-panelContainer");
    const panelContainer = this.panelContainer;
    if (!panelContainer) {
      return;
    }
    
    // Adjusts panelContainer's scroll so the current games stay on screen. 
    // console.log("Here");
    const scrollXPerPanel = window.innerWidth / 2;
    const scrollYPerPanel = window.innerHeight / 2;
    panelContainer.nativeElement.scrollTop = this.scrollCount * scrollYPerPanel;
    panelContainer.nativeElement.scrollLeft = this.scrollCount * scrollXPerPanel;
  }
  
  
  // GamePanel 'buttonSelected' callback
  async onPanelButtonSelected(event: GamePanel) : Promise<void> {
    // Awaiting ongoing scroll
    if (this.scrolling()) {
      const panelContainer = this.panelContainer;
      if (panelContainer) {
        // console.log("Awaiting pending scroll");
        
        const scrollEnd = () => {
          // console.log("Scroll ended");
          this.onPanelButtonSelected(event);
          panelContainer.nativeElement.removeEventListener('scrollend', scrollEnd);
        }

        panelContainer.nativeElement.addEventListener('scrollend', scrollEnd);
      }
      
      return;
    }
    
    const panelContainer = this.panelContainer;
    if (panelContainer) {
      // TBD this scrolls both top and left so
      // there doesn't need to be a screenWidth check implementation
      // Unsure if there are downsides to this.
      this.scrolling.set(true);
      await new Promise<void>((resolve) => {
        const onScroll = () => {
          panelContainer.nativeElement.removeEventListener('scrollend', onScroll);
          resolve();
        };

        panelContainer.nativeElement.addEventListener('scrollend', onScroll);

        panelContainer.nativeElement.scrollBy({
          top: panelContainer.nativeElement.clientHeight / 2,
          left: panelContainer.nativeElement.clientWidth / 2,
          behavior: 'smooth'
        });
      });

      // console.log("Scroll ended")
      this.scrolling.set(false);
      this.scrollCount += 1;
      this.scrollEnded.emit();
    };
  }
  
  // Resets GamePanel scrolling
  resetPanelPositions() : void {
    // console.log("Resetting scroll position");
    const panelContainer = this.panelContainer;
    if (!panelContainer) {
      return;
    }
    
    panelContainer.nativeElement.scrollTop = 0;
    panelContainer.nativeElement.scrollLeft = 0;
    this.scrollCount = 0;
  }


  ngOnInit() : void {    
    // Loads refreshed app queue
    this.game.refreshed.subscribe({
      next: () => {
        const refresh = () => {
          // Resetting scroll position
          this.resetPanelPositions();
          
          const appQueue = this.game.appQueue();
          // console.log(`Game page set active games as ${appQueue}`);
          
          // FIXME I don't know why, but 
          // this._activeApps.set(value)
          // doesn't trigger a re-render like this code?
          let total: SteamApp[] = [];
          appQueue.forEach((v) => {
            total.push(v);
          });

          this._activeApps.set(total);
        }
        
        // Binds the end of an ongoing scroll
        // to the refresh. This smoothly transitions from
        // the panel shuffle to the newly loaded panels.
        if (this.scrolling()) {
          this.scrollEnded.subscribe(() => refresh());
          return; 
        }

        refresh();
      },

      error: (err: any) => {
        console.log(`[GamePage] Error loading appQueue: ${err}`);
      }
    });
        
    // Moving to game-over page when game is lost
    this.game.gameOver.subscribe(() => {
      this.router.navigate(['game-over']);
    })

    // Initial load
    const initQueue : SteamApp[] = this.game.appQueue();
    if (this._activeApps().length <= 0 || initQueue.length > 0) {
      this._activeApps.set(initQueue);
      // console.log(`Set to ${initQueue}`);
    }
    
    this.game.startGame();
  }
}
