import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Chamado } from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class ChamadosService {
  getChamados(): Observable<Chamado[]> {
    return of([
      {
        id: '1042',
        bloco: 'Bloco A',
        sala: 'Sala 102',
        categoria: 'Infraestrutura',
        descricao: 'Ar condicionado não gela',
        canalAbertura: 'formulario',
        status: 'Em Execução',
        prioridade: 'Alta',
        criadoPor: 'aluno@ifce.edu.br',
        criadoEm: '2026-05-29',
        atribuidoPara: '',
        idGrupo: 'bloco_a_sala_102_infraestrutura',
      },
      {
        id: '1043',
        bloco: 'Bloco A',
        sala: 'Sala 102',
        categoria: 'Infraestrutura',
        descricao: 'Filtro de ar sujo',
        canalAbertura: 'qrcode',
        status: 'Aberto',
        prioridade: 'Média',
        criadoPor: 'aluno@ifce.edu.br',
        criadoEm: '2026-05-29',
        atribuidoPara: '',
        idGrupo: 'bloco_a_sala_102_infraestrutura',
      },
    ]);
  }
}
