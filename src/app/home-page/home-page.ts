import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  constructor(
    private router: Router
  ) {}

  startNewGame() : void {
    console.log('Starting new game');
    this.router.navigate(['game-page'])
  }
  
  ngOnInit(): void {}
}
