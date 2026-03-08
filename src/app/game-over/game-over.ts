import { Component, Input, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameLogic } from '../services/game-logic/game-logic';

@Component({
  selector: 'app-game-over',
  imports: [CommonModule],
  templateUrl: './game-over.html',
  styleUrl: './game-over.css',
  // providers: [GameLogic]
})
export class GameOver implements OnInit {
  // @Input('score') score! : number;

  score! : number;
  
  constructor(
    private router : Router,
    public game : GameLogic
  ) {}

  toHomePage() : void {
    this.router.navigate(['']);
  }
  
  restart() : void {
    this.router.navigate(['game-page']);
  }
  
  getWonImg() : SafeUrl {
    return '';
  }
  
  getLossImg() : SafeUrl {
    return '';
  }
  
  getEndMessage() : string {
    return 'Test ending message';
  }
  
  ngOnInit(): void {
    this.score = this.game.score();
  }
}
