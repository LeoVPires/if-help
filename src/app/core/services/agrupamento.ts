import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { ChamadosService } from './chamados';
import { Chamado, Agrupamento } from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class AgrupamentosService {
  private firestore = inject(Firestore);
  private chamadosService = inject(ChamadosService);

  // ================================
  // 1. CRIAR AGRUPAMENTO
  // ================================
  async criarAgrupamento(chamados: Chamado[]): Promise<string> {
    const ref = collection(this.firestore, 'agrupamentos');

    const ids = chamados.map((c) => c.id!) as string[];

    const agrupamento: Agrupamento = {
      idGrupo: chamados[0]?.idGrupo ?? '',
      chamadosIds: ids,
      status: this.calcularStatus(chamados),
      prioridade: this.calcularPrioridade(chamados),

      atribuidoPara: '',
      atribuidoParaNome: '',

      localCampus: chamados[0]?.localCampus ?? '',
      ambienteLocal: chamados[0]?.ambienteLocal ?? '',

      descricoes: chamados.map((c) => c.descricao),

      criadoEm: new Date().toISOString(),
    };

    const docRef = await addDoc(ref, agrupamento);

    await this.sincronizarChamados(docRef.id, agrupamento);

    return docRef.id;
  }

  // ================================
  // 2. SINCRONIZAR CHAMADOS
  // ================================
  private async sincronizarChamados(agrupamentoId: string, agrupamento: Agrupamento) {
    for (const chamadoId of agrupamento.chamadosIds) {
      await this.chamadosService.updateChamado(chamadoId, {
        agrupamentoId,
        status: agrupamento.status,
        prioridade: agrupamento.prioridade,
        atribuidoPara: agrupamento.atribuidoPara,
        atribuidoParaNome: agrupamento.atribuidoParaNome,
      });
    }
  }

  // ================================
  // 3. ATUALIZAR AGRUPAMENTO (SYNC TOTAL)
  // ================================
  async atualizarAgrupamento(agrupamentoId: string, dados: Partial<Agrupamento>): Promise<void> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const atual = snap.data() as Agrupamento;

    const atualizado: Agrupamento = {
      ...atual,
      ...dados,
    };

    await updateDoc(ref, dados);

    await this.sincronizarChamados(agrupamentoId, atualizado);
  }

  // ================================
  // 4. ADICIONAR CHAMADO AO AGRUPAMENTO
  // ================================
  async adicionarChamado(agrupamentoId: string, chamado: Chamado): Promise<void> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const agrupamento = snap.data() as Agrupamento;

    const novosIds = [...agrupamento.chamadosIds, chamado.id!];

    await updateDoc(ref, {
      chamadosIds: novosIds,
      descricoes: [...agrupamento.descricoes, chamado.descricao],
    });

    await this.chamadosService.updateChamado(chamado.id!, {
      agrupamentoId,
      status: agrupamento.status,
      prioridade: agrupamento.prioridade,
      atribuidoPara: agrupamento.atribuidoPara,
      atribuidoParaNome: agrupamento.atribuidoParaNome,
    });
  }

  // ================================
  // 5. REMOVER CHAMADO DO AGRUPAMENTO
  // ================================
  async removerChamado(agrupamentoId: string, chamado: Chamado): Promise<void> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const agrupamento = snap.data() as Agrupamento;

    const novosIds = agrupamento.chamadosIds.filter((id) => id !== chamado.id);

    const novasDescricoes = agrupamento.descricoes.filter(
      (d, idx) => agrupamento.chamadosIds[idx] !== chamado.id,
    );

    await updateDoc(ref, {
      chamadosIds: novosIds,
      descricoes: novasDescricoes,
    });

    await this.chamadosService.updateChamado(chamado.id!, {
      agrupamentoId: null as any,
    });
  }

  // ================================
  // 6. DESFAZER AGRUPAMENTO
  // ================================
  async desfazerAgrupamento(agrupamentoId: string): Promise<void> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);

    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const agrupamento = snap.data() as Agrupamento;

    for (const chamadoId of agrupamento.chamadosIds) {
      await this.chamadosService.updateChamado(chamadoId, {
        agrupamentoId: null as any,
      });
    }

    await deleteDoc(ref);
  }

  // ================================
  // 7. LISTAR AGRUPAMENTOS
  // ================================
  getAgrupamentos(): Observable<Agrupamento[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'agrupamentos');

      const unsub = onSnapshot(ref, (snap) => {
        observer.next(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Agrupamento[],
        );
      });

      return () => unsub();
    });
  }

  // ================================
  // 8. HELPERS
  // ================================
  private calcularStatus(chamados: Chamado[]): Agrupamento['status'] {
    return chamados.some((c) => c.status === 'Em Execução') ? 'Em Execução' : 'Aberto';
  }

  private calcularPrioridade(chamados: Chamado[]): Agrupamento['prioridade'] {
    const ordem = ['Baixa', 'Média', 'Alta', 'Crítica'];

    return chamados.sort((a, b) => ordem.indexOf(b.prioridade) - ordem.indexOf(a.prioridade))[0]
      .prioridade;
  }

  getChamadosDoAgrupamento(chamados: Chamado[], agrupamentoId: string): Chamado[] {
    return chamados.filter((c) => c.agrupamentoId === agrupamentoId);
  }
}
