import { Component, OnInit } from '@angular/core';

import { DashboardAdmin } from './dashboard-admin/dashboard-admin';
import { DashboardPublic } from './dashboard-public/dashboard-public';
import { Chamado } from '../../core/modals/chamado';
import { ChamadosService } from '../../core/services/chamados';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardAdmin, DashboardPublic],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  chamados: Chamado[] = [];

  role: 'admin' | 'aluno' = 'aluno';

  constructor(private chamadosService: ChamadosService) {}

  ngOnInit(): void {
    this.chamadosService.getChamados().subscribe((chamados) => {
      this.chamados = chamados;
    });
  }
}
