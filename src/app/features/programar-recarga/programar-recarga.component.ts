import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { Alumno } from '../../data-access/models/alumno.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-programar-recarga',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programar-recarga.component.html',
  styleUrls: ['./programar-recarga.component.css']
})
export class ProgramarRecargaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiBase = environment.apiUrl;

  readonly cargando = signal(false);
  readonly alumno = signal<Alumno | null>(null);

  readonly modoCobro = signal<'hoy' | 'dia_mes'>('hoy');
  readonly diaSeleccionado = signal<number>(5);
  readonly diasRapidos = [1, 5, 10, 15, 20];
  readonly hoy = new Date().getDate();

  readonly descripcionProximoCobro = computed(() => {
    if (this.modoCobro() === 'hoy') {
      return `Primer débito hoy. Se repetirá cada día ${this.hoy} de cada mes.`;
    }
    const dia = this.diaSeleccionado();
    const fecha = this.calcularFechaCobro(dia);
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const fechaStr = fecha.toLocaleDateString('es-AR', opciones);
    return `Primer débito el ${fechaStr}. Luego cada día ${dia} de cada mes.`;
  });

  ngOnInit() {
    const alumnoId = this.contextoService.alumnoId() || localStorage.getItem('alumnoId');
    if (alumnoId) {
      const al = this.alumnosService.getAlumnoById(alumnoId);
      if (al) {
        this.alumno.set(al);
      } else {
        this.volver();
      }
    } else {
      this.volver();
    }
  }

  volver() {
    this.router.navigate(['/']);
  }

  selectMonto(monto: number) {
    const input = document.getElementById('monto') as HTMLInputElement;
    if (input) input.value = monto.toString();
  }

  selectModo(modo: 'hoy' | 'dia_mes') {
    this.modoCobro.set(modo);
  }

  selectDia(dia: number) {
    this.diaSeleccionado.set(dia);
  }

  onDiaCustomChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > 28) val = 28;
    this.diaSeleccionado.set(val);
  }

  calcularFechaCobro(diaDelMes: number): Date {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth();
    const hoy = ahora.getDate();

    let fecha: Date;
    if (diaDelMes > hoy) {
      fecha = new Date(anio, mes, diaDelMes, 12, 0, 0);
    } else {
      fecha = new Date(anio, mes + 1, diaDelMes, 12, 0, 0);
    }
    return fecha;
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    const input = document.getElementById('monto') as HTMLInputElement;
    const montoStr = input ? input.value : '0';
    const monto = Number(montoStr);
    if (!monto || monto < 1) {
      this.toastService.mostrar('Por favor ingresa un monto válido.', 'error');
      return;
    }

    this.cargando.set(true);
    const alumnoId = this.alumno()?.id;

    try {
      const body: {
        studentId?: string;
        amount: number;
        frequency: number;
        frequencyType: string;
        startDate?: string;
      } = {
        studentId: alumnoId,
        amount: monto,
        frequency: 1,
        frequencyType: 'months'
      };

      if (this.modoCobro() === 'dia_mes') {
        const fecha = this.calcularFechaCobro(this.diaSeleccionado());
        body.startDate = fecha.toISOString();
      }

      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiBase}/payments/schedule-topup`, body)
      );
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        this.cargando.set(false);
        this.toastService.mostrar('Error: No se recibió la URL de pago.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      this.cargando.set(false);
      this.toastService.mostrar('Ocurrió un error al procesar la solicitud.', 'error');
    }
  }
}
