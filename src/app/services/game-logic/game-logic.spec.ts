import { TestBed } from '@angular/core/testing';

import { GameLogic } from './game-logic';

describe('GameLogic', () => {
  let service: GameLogic;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameLogic);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
