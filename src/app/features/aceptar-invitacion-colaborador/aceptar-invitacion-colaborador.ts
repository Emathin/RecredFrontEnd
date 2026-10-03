import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ColaboradorService } from '../../data-access/services/colaborador.service';
import { ToastService } from '../../shared/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-aceptar-invitacion-colaborador',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './aceptar-invitacion-colaborador.html',
  styleUrl: '../perfil-usuario/perfil-usuario.page.css',
})
export class AceptarInvitacionColaborador implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly toastService = inject(ToastService);
  private readonly themeService = inject(ThemeService);

  token = '';
  cargando = signal(false);
  fotoPreview = signal<string | null>(null);
  mostrarPassword = signal(false);

  form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[^\\s]+$/)] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onFotoSeleccionada(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.fotoPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    try {
      await this.colaboradorService.aceptarInvitacion({
        token: this.token,
        ...this.form.getRawValue()
      });
      this.toastService.mostrar('Cuenta creada exitosamente! Ya pod&eacute;s iniciar sesi&oacute;n.', 'success', 8000);
      this.router.navigate(['/seleccion-tipo-cuenta']);
    } catch (err: any) {
      const msg = err?.error?.message || err.message || 'Error al procesar la invitaci&oacute;n';
      this.toastService.mostrar(msg, 'error');
    } finally {
      this.cargando.set(false);
    }
  }
}
