import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { APP_CONSTANTS } from '../shared/app.constants';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  readonly appName: string = APP_CONSTANTS.APP_NAME;
  readonly appDescription: string = APP_CONSTANTS.APP_DESCRIPTION;
  
  constructor(
    private titleService: Title,
    private router: Router
  ) {}

  startNewGame() : void {
    // console.log('Starting new game');
    this.router.navigate(['game-page'])
  }
  
  ngOnInit(): void {
    this.titleService.setTitle(this.appName)
  }
}
