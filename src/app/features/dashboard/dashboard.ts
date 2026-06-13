import { AuthService, UserPerfil } from './../../core/services/auth';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { DashboardAdmin } from './dashboard-admin/dashboard-admin';
import { DashboardPublic } from './dashboard-public/dashboard-public';
import { Chamado } from '../../core/modals/chamado';
import { ChamadosService } from '../../core/services/chamados';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardAdmin, DashboardPublic, AsyncPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private chamadosService = inject(ChamadosService);

  chamados: Chamado[] = [];
  userRole: 'admin' | 'servidor' | 'aluno' = 'aluno';
  private subs = new Subscription();

  ngOnInit(): void {
    // 1. Escuta o perfil do usuário para saber a Role real vinda do Firestore
    const authSub = this.authService.usuarioPerfil$.subscribe((perfil: UserPerfil | null) => {
      if (perfil) {
        this.userRole = perfil.role;
        // Aqui no futuro você pode criar um "getChamadosPorRole(perfil.role)"
      }
    });
    this.subs.add(authSub);

    // 2. Carrega os chamados do serviço
    const chamadosSub = this.chamadosService.getChamados().subscribe({
      next: (chamados) => {
        this.chamados = chamados;
      },
      error: (err) => {
        console.error('Erro detectado no getChamados:', err);
      },
    });
    this.subs.add(chamadosSub);
  }

  ngOnDestroy(): void {
    // Evita vazamento de memória desinscrevendo tudo de uma vez
    this.subs.unsubscribe();
  }
}
