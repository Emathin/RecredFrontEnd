import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Colaboradores } from './colaboradores';
import { ColaboradoresService } from '../../../../data-access/services/colaboradores.service';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('Colaboradores', () => {
  let component: Colaboradores;
  let fixture: ComponentFixture<Colaboradores>;
  let mockColabService: jasmine.SpyObj<ColaboradoresService>;
  let mockAlumnosService: jasmine.SpyObj<AlumnosService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    mockColabService = jasmine.createSpyObj('ColaboradoresService', ['listarColaboradores', 'invitarColaborador', 'eliminarColaborador']);
    mockAlumnosService = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);

    mockColabService.listarColaboradores.and.returnValue(Promise.resolve([]));
    mockAlumnosService.asegurarCargados.and.returnValue(Promise.resolve([
      { id: '1', nombre: 'Juan', apellido: 'Perez', grado: '1A', colegioId: 'c1', saldo: 0, urlFotoPerfil: null }
    ]));

    await TestBed.configureTestingModule({
      imports: [Colaboradores, ReactiveFormsModule],
      providers: [
        { provide: ColaboradoresService, useValue: mockColabService },
        { provide: AlumnosService, useValue: mockAlumnosService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Colaboradores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', async () => {
    await fixture.whenStable();
    expect(mockColabService.listarColaboradores).toHaveBeenCalled();
    expect(mockAlumnosService.asegurarCargados).toHaveBeenCalled();
    expect(component.alumnos().length).toBe(1);
  });

  it('should open modal and populate form array', async () => {
    await fixture.whenStable();
    component.abrirModalInvitacion();
    expect(component.mostrarModal()).toBeTrue();
    expect(component.studentIdsControls.length).toBe(1);
  });

  it('should send invitation when form is valid', async () => {
    await fixture.whenStable();
    component.abrirModalInvitacion();
    
    component.inviteForm.patchValue({
      email: 'test@test.com',
      studentIds: [true]
    });

    mockColabService.invitarColaborador.and.returnValue(Promise.resolve());

    await component.invitar();

    expect(mockColabService.invitarColaborador).toHaveBeenCalledWith({
      email: 'test@test.com',
      assignedStudentIds: ['1']
    });
    expect(mockToastService.mostrar).toHaveBeenCalledWith('Invitación enviada exitosamente.', 'success');
    expect(component.mostrarModal()).toBeFalse();
  });

  it('should not send invitation if no student selected', async () => {
    await fixture.whenStable();
    component.abrirModalInvitacion();
    
    component.inviteForm.patchValue({
      email: 'test@test.com',
      studentIds: [false]
    });

    await component.invitar();

    expect(mockColabService.invitarColaborador).not.toHaveBeenCalled();
    expect(mockToastService.mostrar).toHaveBeenCalledWith('Debes seleccionar al menos un alumno.', 'error');
  });

  it('should delete collaborator', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockColabService.eliminarColaborador.and.returnValue(Promise.resolve());

    await component.eliminarColaborador('test-id');

    expect(mockColabService.eliminarColaborador).toHaveBeenCalledWith('test-id');
    expect(mockToastService.mostrar).toHaveBeenCalledWith('Colaborador eliminado.', 'success');
    expect(mockColabService.listarColaboradores).toHaveBeenCalledTimes(2); // init + refresh
  });
});
