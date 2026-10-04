import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TutorResponseDTO {
  readonly id: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string;
  readonly activa: boolean;
}

export interface InviteCollaboratorRequest {
  readonly email: string;
  readonly assignedStudentIds: string[];
}

export interface AcceptCollaboratorRequest {
  readonly token: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly dni: string;
  readonly telefono: string;
  readonly password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ColaboradoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/tutores/colaboradores`;

  async listarColaboradores(): Promise<TutorResponseDTO[]> {
    return firstValueFrom(
      this.http.get<TutorResponseDTO[]>(this.baseUrl)
    );
  }

  async invitarColaborador(request: InviteCollaboratorRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/invitar`, request)
    );
  }

  async eliminarColaborador(colaboradorId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${colaboradorId}`)
    );
  }

  async aceptarInvitacion(request: AcceptCollaboratorRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/aceptar`, request)
    );
  }
}
