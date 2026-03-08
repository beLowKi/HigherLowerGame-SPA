import { TestBed } from '@angular/core/testing';

import { AppData } from './app-data';

describe('AppData', () => {
  let service: AppData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
