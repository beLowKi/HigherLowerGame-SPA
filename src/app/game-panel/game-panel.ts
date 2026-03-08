import { Component, Input, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppData, API_URL } from '../services/app-data/app-data';
import { Router } from '@angular/router';
import { GameLogic } from '../services/game-logic/game-logic';
import { SteamApp } from '../models/steam_app';

@Component({
  selector: 'app-game-panel',
  imports: [CommonModule],
  templateUrl: './game-panel.html',
  styleUrl: './game-panel.css',
  providers: [AppData],
  changeDetection: ChangeDetectionStrategy.Default
})
export class GamePanel implements OnInit {  
  @Input('app') app! : SteamApp;
  @Input('revealed') revealed : boolean = false;
    
  constructor(
    private router: Router,
    private appData: AppData,
    private game : GameLogic
  ) { }
  
  higherClicked() : void {
    this.game.higherSelect();
  }

  lowerClicked() : void {
    this.game.lowerSelect();
  }
  
  getName() : string {
    if (!this.app) {
      return 'n/a';
    }
    
    // console.log(this.app.names);
    const lang = this.getCurrentLanguage();
    
    for (const field in this.app.names) {
      if (field.includes(lang)) {
        return this.app.names[field];
      }
    }

    return 'n/a'
  }
  
  getImage() : string {
    return API_URL + '/apps/images/' + this.app.appId;
  }
  
  getSizeDisplay() : string {
    if (!this.app) {
      return '0 MB';
    }
    
    let out : string = '';

    // Showing gigabytes
    if (this.app.totalSize >= 1e9) {
      out = ( this.app.totalSize / 1e9 ).toFixed(2) + ' GB';
      
    // Showing megabytes
    } else if (this.app.totalSize >= 1e6) {
      out = (this.app.totalSize / 1e6).toFixed(2) + ' MB';

    // Showing kilobytes
    } else {
      out = (this.app.totalSize / 1e3).toFixed(2) + ' KB';
    }

    return out;
  }
  
  getCurrentLanguage() : string {
    // TODO
    return 'english'
  }

  ngOnInit(): void {}
}
