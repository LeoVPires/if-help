import { AuthService, UserPerfil } from './../../core/services/auth';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { DashboardAdmin } from './dashboard-admin/dashboard-admin';
import { DashboardPublic } from './dashboard-public/dashboard-public';
import { Agrupamento, Chamado } from '../../core/modals/chamado';
import { ChamadosService } from '../../core/services/chamados';
import { AgrupamentosService } from '../../core/services/agrupamento';
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
  private agrupamentosService = inject(AgrupamentosService);

  chamados: Chamado[] = [];
  agrupamentos: Agrupamento[] = [];

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

    const chamadosSub = this.chamadosService.getChamados().subscribe({
      next: (chamados) => {
        this.chamados = chamados;
      },
    });

    const agrupamentosSub = this.agrupamentosService.getAgrupamentos().subscribe({
      next: (agrupamentos) => {
        this.agrupamentos = agrupamentos;
      },
    });

    this.subs.add(chamadosSub);
    this.subs.add(agrupamentosSub);
  }

  ngOnDestroy(): void {
    // Evita vazamento de memória desinscrevendo tudo de uma vez
    this.subs.unsubscribe();
  }
}
