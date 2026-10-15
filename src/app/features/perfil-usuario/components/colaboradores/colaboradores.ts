import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { ColaboradoresService, TutorResponseDTO } from '../../../../data-access/services/colaboradores.service';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Alumno } from '../../../../data-access/models/alumno.model';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './colaboradores.html',
  styleUrls: ['./colaboradores.css', '../../perfil-usuario.page.css'],
})
export class Colaboradores implements OnInit {
  private readonly colaboradoresService = inject(ColaboradoresService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  colaboradores = signal<TutorResponseDTO[]>([]);
  alumnos = signal<Alumno[]>([]);
  cargando = signal<boolean>(false);
  
  mostrarModal = signal<boolean>(false);
  enviando = signal<boolean>(false);
  colaboradorAEliminar = signal<TutorResponseDTO | null>(null);
  eliminando = signal<boolean>(false);

  inviteForm: FormGroup;

  constructor() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      studentIds: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);
    try {
      const [colabs, alums] = await Promise.all([
        this.colaboradoresService.listarColaboradores(),
        this.alumnosService.asegurarCargados()
      ]);
      const uniqueColabs = Array.from(
        new Map((colabs || []).filter(c => c.activa !== false).map(c => [c.id, c])).values()
      );
      this.colaboradores.set(uniqueColabs);
      this.alumnos.set(alums);
    } catch (error) {
      console.error(error);
      this.toastService.mostrar('Error al cargar datos de colaboradores.', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  abrirModalInvitacion() {
    this.inviteForm.reset();
    const studentsArray = this.inviteForm.get('studentIds') as FormArray;
    studentsArray.clear();
    
    this.alumnos().forEach(() => {
      studentsArray.push(new FormControl(false));
    });

    this.mostrarModal.set(true);
  }

  cerrarModalInvitacion() {
    this.mostrarModal.set(false);
  }

  get studentIdsControls() {
    return (this.inviteForm.get('studentIds') as FormArray).controls;
  }

  async invitar() {
    if (this.inviteForm.invalid) {
      return;
    }

    const formValue = this.inviteForm.value;
    const selectedStudentIds = this.alumnos()
      .filter((_, i) => formValue.studentIds[i])
      .map(a => a.id);

    if (selectedStudentIds.length === 0) {
      this.toastService.mostrar('Debes seleccionar al menos un alumno.', 'error');
      return;
    }

    this.enviando.set(true);
    try {
      await this.colaboradoresService.invitarColaborador({
        email: formValue.email,
        assignedStudentIds: selectedStudentIds
      });
      this.toastService.mostrar('Invitación enviada exitosamente.', 'success');
      this.cerrarModalInvitacion();
    } catch (error: any) {
      console.error(error);
      if (error?.status === 403) {
        this.toastService.mostrar('No tienes permisos para realizar esta acción.', 'error');
      } else if (error?.status === 409) {
        this.toastService.mostrar('El usuario ya es colaborador o tutor principal.', 'error');
      } else {
        this.toastService.mostrar('Error al enviar la invitación.', 'error');
      }
    } finally {
      this.enviando.set(false);
    }
  }

  abrirModalEliminar(colaborador: TutorResponseDTO) {
    this.colaboradorAEliminar.set(colaborador);
  }

  cerrarModalEliminar() {
    if (this.eliminando()) return;
    this.colaboradorAEliminar.set(null);
  }

  async confirmarEliminar() {
    const colab = this.colaboradorAEliminar();
    if (!colab) return;
    await this.ejecutarEliminar(colab.id);
    this.cerrarModalEliminar();
  }

  async eliminarColaborador(id: string) {
    await this.ejecutarEliminar(id);
  }

  private async ejecutarEliminar(id: string) {
    this.eliminando.set(true);
    try {
      await this.colaboradoresService.eliminarColaborador(id);
      this.toastService.mostrar('Colaborador eliminado.', 'success');
      // Optimistic update: remove from current list immediately
      this.colaboradores.update(list => list.filter(c => c.id !== id));
      await this.cargarDatos(); // Refresh list from backend
    } catch (error: any) {
      console.error(error);
      if (error?.status === 403) {
        this.toastService.mostrar('No tienes permisos para eliminar colaboradores.', 'error');
      } else {
        this.toastService.mostrar('Error al eliminar colaborador.', 'error');
      }
    } finally {
      this.eliminando.set(false);
    }
  }
}
