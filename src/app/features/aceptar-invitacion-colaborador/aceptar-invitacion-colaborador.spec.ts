import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AceptarInvitacionColaborador } from './aceptar-invitacion-colaborador';

describe('AceptarInvitacionColaborador', () => {
  let component: AceptarInvitacionColaborador;
  let fixture: ComponentFixture<AceptarInvitacionColaborador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AceptarInvitacionColaborador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AceptarInvitacionColaborador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
