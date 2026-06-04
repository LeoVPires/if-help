import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Chamado } from '../../../core/modals/chamado';

@Component({
  selector: 'app-dashboard-public',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './dashboard-public.html',
  styleUrl: './dashboard-public.scss',
})
export class DashboardPublic implements OnChanges, AfterViewInit {
  @Input() chamados: Chamado[] = [];

  // O DataSource do Material é o que faz a mágica da tabela funcionar
  dataSource = new MatTableDataSource<Chamado>();

  // As colunas que serão exibidas (sem o ID e sem as Ações)
  displayedColumns: string[] = ['localizacao', 'demanda', 'status', 'abertura'];

  // Contadores para os Cards Superiores
  countAberto = 0;
  countExecucao = 0;
  countConcluido = 0;

  // Guarda qual card está ativo no momento para o filtro
  activeStatusFilter: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chamados'] && this.chamados) {
      this.dataSource.data = this.chamados;
      this.updateCounters();
      this.setupCustomFilter();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Filtro geral da barra de pesquisa
  applySearchFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // Se estiver filtrando por texto, limpamos o filtro de status dos cards
    this.activeStatusFilter = null;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Filtro ao clicar nos Cards Superiores
  toggleStatusFilter(status: string) {
    if (this.activeStatusFilter === status) {
      // Se clicar no mesmo card, desativa o filtro
      this.activeStatusFilter = null;
      this.dataSource.filter = '';
    } else {
      this.activeStatusFilter = status;
      this.dataSource.filter = status.trim().toLowerCase();
    }
  }

  private updateCounters() {
    this.countAberto = this.chamados.filter((c) => c.status === 'Aberto').length;
    this.countExecucao = this.chamados.filter((c) => c.status === 'Em Execução').length;
    this.countConcluido = this.chamados.filter((c) => c.status === 'Fechado').length;
  }

  private setupCustomFilter() {
    // Ensina o Material Table a buscar em campos combinados (ex: bloco + sala)
    this.dataSource.filterPredicate = (data: Chamado, filter: string) => {
      const dataStr =
        `${data.bloco} ${data.sala} ${data.categoria} ${data.descricao} ${data.status}`.toLowerCase();
      return dataStr.includes(filter);
    };
  }
}
