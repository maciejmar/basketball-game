import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeTeamsComponent } from './change-teams.component';

describe('ChangeTeamsComponent', () => {
  let component: ChangeTeamsComponent;
  let fixture: ComponentFixture<ChangeTeamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeTeamsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeTeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
