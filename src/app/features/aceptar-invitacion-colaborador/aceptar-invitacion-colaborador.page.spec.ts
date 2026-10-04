import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AceptarInvitacionColaboradorPage } from './aceptar-invitacion-colaborador.page';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ColaboradoresService } from '../../data-access/services/colaboradores.service';
import { ToastService } from '../../shared/services/toast.service';

describe('AceptarInvitacionColaboradorPage', () => {
  let component: AceptarInvitacionColaboradorPage;
  let fixture: ComponentFixture<AceptarInvitacionColaboradorPage>;
  let mockColabService: jasmine.SpyObj<ColaboradoresService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockColabService = jasmine.createSpyObj('ColaboradoresService', ['aceptarInvitacion']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AceptarInvitacionColaboradorPage, ReactiveFormsModule],
      providers: [
        { provide: ColaboradoresService, useValue: mockColabService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'token' ? 'valid-token' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AceptarInvitacionColaboradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and set token from route', () => {
    expect(component).toBeTruthy();
    expect(component.token()).toBe('valid-token');
  });

  it('should submit form when valid', fakeAsync(() => {
    component.registerForm.patchValue({
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      telefono: '1122334455',
      password: 'password123'
    });

    mockColabService.aceptarInvitacion.and.returnValue(Promise.resolve());

    component.onSubmit();
    tick();

    expect(mockColabService.aceptarInvitacion).toHaveBeenCalledWith({
      token: 'valid-token',
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      telefono: '1122334455',
      password: 'password123'
    });
    
    expect(component.exito()).toBeTrue();
    expect(mockToastService.mostrar).toHaveBeenCalledWith('Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'success');
    
    tick(3000);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('should handle error when token is invalid', fakeAsync(() => {
    component.registerForm.patchValue({
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      telefono: '1122334455',
      password: 'password123'
    });

    mockColabService.aceptarInvitacion.and.returnValue(Promise.reject({ status: 404 }));

    component.onSubmit();
    tick();

    expect(component.errorGenerico()).toBe('El enlace de invitación es inválido o ha expirado.');
    expect(mockToastService.mostrar).toHaveBeenCalledWith('El enlace de invitación es inválido o ha expirado.', 'error');
  }));

  it('should handle form validation', () => {
    component.registerForm.patchValue({
      nombre: '', // invalid
      apellido: 'Perez',
      dni: '123', // invalid format
      telefono: '1122334455',
      password: 'short' // invalid length
    });

    component.onSubmit();

    expect(mockColabService.aceptarInvitacion).not.toHaveBeenCalled();
    expect(component.registerForm.touched).toBeTrue();
  });
});
