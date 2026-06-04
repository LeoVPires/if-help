import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { Chamado } from './../../../core/modals/chamado';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

interface ChamadoPublicRow {
  id: string;

  localizacao: string;

  categoria: string;

  status: string;

  abertura: string;
}

@Component({
  selector: 'app-dashboard-public',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './dashboard-public.html',
  styleUrl: './dashboard-public.scss',
})
export class DashboardPublic implements AfterViewInit, OnChanges {
  @Input({ required: true })
  chamados: Chamado[] = [];

  displayedColumns = ['localizacao', 'categoria', 'status', 'abertura'];

  searchControl = new FormControl('');

  selectedStatus = 'todos';

  dataSource = new MatTableDataSource<ChamadoPublicRow>([]);

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chamados']) {
      this.dataSource.data = this.chamados.map((chamado) => ({
        id: chamado.id,

        localizacao: `${chamado.bloco} - ${chamado.sala}`,

        categoria: chamado.categoria,

        status: chamado.status,

        abertura: this.formatarData(chamado.criadoEm),
      }));
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;

    this.dataSource.sort = this.sort;

    this.configurarFiltros();
  }

  private configurarFiltros() {
    this.dataSource.filterPredicate = (item, filter) => {
      const value = filter.toLowerCase();

      return (
        item.localizacao.toLowerCase().includes(value) ||
        item.categoria.toLowerCase().includes(value)
      );
    };

    this.searchControl.valueChanges.subscribe((value) => {
      this.dataSource.filter = (value ?? '').trim().toLowerCase();
    });
  }

  filterStatus(status: string) {
    this.selectedStatus = status;

    this.dataSource.filterPredicate = (item) => {
      if (status === 'todos') {
        return true;
      }

      return item.status === status;
    };

    this.dataSource.filter = Math.random().toString();
  }

  private formatarData(dataIso: string): string {
    return new Date(dataIso).toLocaleDateString('pt-BR');
  }
}
