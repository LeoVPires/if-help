import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Imports
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Chamado } from '../../../core/modals/chamado';

// Interface para guardar o estado de todos os filtros juntos
interface FilterState {
  search: string;
  categoria: string;
  prioridade: string;
  cardFiltro: 'agrupamento' | 'alta' | 'triagem' | null;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];

  dataSource = new MatTableDataSource<Chamado>();
  displayedColumns: string[] = ['id', 'localizacao', 'demanda', 'status', 'acoes'];
  expandedElement: Chamado | null = null; // Controla a linha expandida

  // Contadores dos Cards
  countSugestoesAgrupamento = 0;
  countAltaPrioridade = 0;
  countAguardandoTriagem = 0;

  // Estado atual dos filtros
  filtros: FilterState = { search: '', categoria: '', prioridade: '', cardFiltro: null };

  // Listas para os Selects
  categoriasDisponiveis: string[] = ['Infraestrutura', 'TI', 'Limpeza', 'Administrativo'];
  prioridadesDisponiveis: string[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chamados'] && this.chamados) {
      this.dataSource.data = this.chamados;
      this.calcularContadores();
      this.configurarFiltroPersonalizado();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // --- LÓGICA DE FILTROS ---
  aplicarFiltroTexto(event: Event) {
    this.filtros.search = (event.target as HTMLInputElement).value;
    this.atualizarFiltroDataSource();
  }

  aplicarFiltroSelect(tipo: 'categoria' | 'prioridade', valor: string) {
    if (tipo === 'categoria') this.filtros.categoria = valor;
    if (tipo === 'prioridade') this.filtros.prioridade = valor;
    this.atualizarFiltroDataSource();
  }

  toggleCardFilter(filtroCard: 'agrupamento' | 'alta' | 'triagem') {
    this.filtros.cardFiltro = this.filtros.cardFiltro === filtroCard ? null : filtroCard;
    this.atualizarFiltroDataSource();
  }

  private atualizarFiltroDataSource() {
    // O Material Table espera uma string. Transformamos nosso objeto em string JSON.
    this.dataSource.filter = JSON.stringify(this.filtros);
  }

  private configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (data: Chamado, filterStr: string) => {
      const f: FilterState = JSON.parse(filterStr);
      let match = true;

      // 1. Filtro de Texto (Busca em ID, Bloco, Sala e Descrição)
      if (f.search) {
        const textToSearch =
          `${data.id} ${data.bloco} ${data.sala} ${data.descricao}`.toLowerCase();
        if (!textToSearch.includes(f.search.toLowerCase())) match = false;
      }

      // 2. Filtro de Categoria e Prioridade
      if (f.categoria && data.categoria !== f.categoria) match = false;
      if (f.prioridade && data.prioridade !== f.prioridade) match = false;

      // 3. Filtro dos Cards
      if (f.cardFiltro === 'alta' && data.prioridade !== 'Alta' && data.prioridade !== 'Crítica')
        match = false;
      if (f.cardFiltro === 'triagem' && (data.atribuidoPara !== '' || data.status !== 'Aberto'))
        match = false;
      if (f.cardFiltro === 'agrupamento') match = match && this.temDuplicatas(data);

      return match;
    };
  }

  // --- LÓGICA DE CONTADORES E AGRUPAMENTO ---
  private calcularContadores() {
    this.countAltaPrioridade = this.chamados.filter(
      (c) => c.prioridade === 'Alta' || c.prioridade === 'Crítica',
    ).length;
    this.countAguardandoTriagem = this.chamados.filter(
      (c) => c.atribuidoPara === '' && c.status === 'Aberto',
    ).length;

    // Calcula sugestões de agrupamento (chamados com mesmo idGrupo que ainda estão abertos)
    const grupos = this.chamados.filter((c) => c.status === 'Aberto').map((c) => c.idGrupo);
    const gruposDuplicados = grupos.filter((item, index) => grupos.indexOf(item) !== index);
    // Removemos duplicatas da lista de grupos duplicados para ter a contagem de chamados afetados
    this.countSugestoesAgrupamento = this.chamados.filter(
      (c) => c.status === 'Aberto' && gruposDuplicados.includes(c.idGrupo),
    ).length;
  }

  private temDuplicatas(chamado: Chamado): boolean {
    return this.chamados.some(
      (c) => c.idGrupo === chamado.idGrupo && c.id !== chamado.id && c.status === 'Aberto',
    );
  }

  // Busca chamados semelhantes para mostrar dentro do Expansion Panel
  getChamadosParaAgrupar(chamadoBase: Chamado): Chamado[] {
    return this.chamados.filter(
      (c) => c.idGrupo === chamadoBase.idGrupo && c.id !== chamadoBase.id && c.status === 'Aberto',
    );
  }

  toggleExpand(element: Chamado) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
}
