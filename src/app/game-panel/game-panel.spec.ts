import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePanel } from './game-panel';

describe('GamePanel', () => {
  let component: GamePanel;
  let fixture: ComponentFixture<GamePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
