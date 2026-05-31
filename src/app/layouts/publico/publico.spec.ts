import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Publico } from './publico';

describe('Publico', () => {
  let component: Publico;
  let fixture: ComponentFixture<Publico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publico],
    }).compileComponents();

    fixture = TestBed.createComponent(Publico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
