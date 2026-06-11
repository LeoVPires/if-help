import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPublic } from './dashboard-public';

describe('DashboardPublic', () => {
  let component: DashboardPublic;
  let fixture: ComponentFixture<DashboardPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPublic],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPublic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
