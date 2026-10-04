import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ColaboradoresService } from '../../data-access/services/colaboradores.service';
import { ToastService } from '../../shared/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-aceptar-invitacion-colaborador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aceptar-invitacion-colaborador.page.html',
  styleUrl: './aceptar-invitacion-colaborador.page.css'
})
export class AceptarInvitacionColaboradorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly colaboradoresService = inject(ColaboradoresService);
  private readonly toastService = inject(ToastService);
  private readonly themeService = inject(ThemeService);

  registerForm: FormGroup;
  token = signal<string | null>(null);
  enviando = signal<boolean>(false);
  errorGenerico = signal<string | null>(null);
  exito = signal<boolean>(false);
  
  mostrarPassword = signal<boolean>(false);

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
      telefono: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.errorGenerico.set('Enlace de invitación inválido o incompleto.');
    } else {
      this.token.set(token);
    }
  }

  togglePasswordVisibility() {
    this.mostrarPassword.set(!this.mostrarPassword());
  }

  async onSubmit() {
    if (this.registerForm.invalid || !this.token()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorGenerico.set(null);

    const formValue = this.registerForm.value;

    try {
      await this.colaboradoresService.aceptarInvitacion({
        token: this.token()!,
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        dni: formValue.dni,
        telefono: formValue.telefono,
        password: formValue.password
      });
      
      this.exito.set(true);
      this.toastService.mostrar('Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'success');
      setTimeout(() => {
        this.router.navigate(['/']); // Redirect to login or home
      }, 3000);
    } catch (error: any) {
      console.error(error);
      if (error?.status === 400 || error?.status === 404) {
        this.errorGenerico.set('El enlace de invitación es inválido o ha expirado.');
      } else if (error?.status === 409) {
        this.errorGenerico.set('Ya existe un usuario registrado con este DNI.');
      } else {
        this.errorGenerico.set('Ocurrió un error al procesar tu solicitud. Inténtalo más tarde.');
      }
      this.toastService.mostrar(this.errorGenerico()!, 'error');
    } finally {
      this.enviando.set(false);
    }
  }
}
