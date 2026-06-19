import { TipoDemanda } from './../modals/chamado';
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { ChamadosService } from './chamados';
import {
  Agrupamento,
  Chamado,
  ChamadoSnapshot,
  PrioridadeChamado,
  StatusChamado,
  Nota,
} from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class AgrupamentosService {
  private firestore = inject(Firestore);
  private chamadosService = inject(ChamadosService);

  // =========================================================
  // CONSULTAS
  // =========================================================

  getAgrupamentos(): Observable<Agrupamento[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'agrupamentos');
      const q = query(ref, orderBy('criadoEm', 'desc'));

      const unsub = onSnapshot(
        q,
        (snap) => {
          observer.next(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Agrupamento[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsub();
    });
  }

  async getAgrupamentoPorId(agrupamentoId: string): Promise<Agrupamento | null> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as Agrupamento),
    };
  }

  async existeAgrupamentoParaIdGrupo(idGrupo: string): Promise<boolean> {
    const ref = collection(this.firestore, 'agrupamentos');
    const q = query(ref, where('idGrupo', '==', idGrupo), limit(1));
    const snap = await getDocs(q);

    return !snap.empty;
  }

  async chamadoJaPertenceAAlgumAgrupamento(chamadoId: string): Promise<boolean> {
    const chamado = await this.carregarChamado(chamadoId);
    return !!chamado?.agrupamentoId;
  }

  // =========================================================
  // CRIAÇÃO DO AGRUPAMENTO
  // =========================================================

  async criarAgrupamento(chamados: Chamado[]): Promise<string> {
    const chamadosValidos = this.removerDuplicadosPorId(chamados);

    if (chamadosValidos.length < 2) {
      throw new Error('É necessário selecionar pelo menos 2 chamados para agrupar.');
    }

    const idGrupoBase = chamadosValidos[0].idGrupo;

    if (!chamadosValidos.every((c) => c.idGrupo === idGrupoBase)) {
      throw new Error('Todos os chamados do agrupamento precisam ter o mesmo idGrupo.');
    }

    const chamadosComId = chamadosValidos.filter((c) => !!c.id);

    if (chamadosComId.length !== chamadosValidos.length) {
      throw new Error('Todos os chamados precisam ter ID válido para serem agrupados.');
    }

    // Garante que nenhum deles já esteja em outro agrupamento
    for (const chamado of chamadosComId) {
      if (chamado.agrupamentoId) {
        throw new Error(`O chamado #${chamado.id} já está em um agrupamento.`);
      }
    }

    const agrupamentoRef = doc(collection(this.firestore, 'agrupamentos'));
    const agrupamentoId = agrupamentoRef.id;

    const snapshotMembros = chamadosComId.map((chamado) => this.criarSnapshotChamado(chamado));

    const agrupamento: Agrupamento = {
      id: agrupamentoId,
      idGrupo: idGrupoBase,
      localCampus: chamadosComId[0].localCampus,
      ambienteLocal: chamadosComId[0].ambienteLocal,
      status: this.calcularStatusInicial(chamadosComId),
      prioridade: this.calcularPrioridadeInicial(chamadosComId),
      atribuidoPara: this.calcularAtribuicaoInicial(chamadosComId).uid,
      atribuidoParaNome: this.calcularAtribuicaoInicial(chamadosComId).nome,
      chamadosIds: chamadosComId.map((c) => c.id!),
      membros: snapshotMembros,
      tipoDemanda: chamadosComId[0].tipoDemanda,
      descricoes: chamadosComId.map((c) => c.descricao),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ativo: true,
    };

    const batch = writeBatch(this.firestore);
    batch.set(agrupamentoRef, agrupamento);

    for (const chamado of chamadosComId) {
      batch.update(doc(this.firestore, `chamados/${chamado.id}`), {
        agrupamentoId,
        status: agrupamento.status,
        prioridade: agrupamento.prioridade,
        atribuidoPara: agrupamento.atribuidoPara,
        atribuidoParaNome: agrupamento.atribuidoParaNome,
      });
    }

    await batch.commit();

    return agrupamentoId;
  }

  // =========================================================
  // ATUALIZAÇÃO DO AGRUPAMENTO
  // =========================================================

  async atualizarAgrupamento(
    agrupamentoId: string,
    dados: Partial<
      Pick<
        Agrupamento,
        | 'status'
        | 'prioridade'
        | 'atribuidoPara'
        | 'atribuidoParaNome'
        | 'localCampus'
        | 'ambienteLocal'
      >
    >,
  ): Promise<void> {
    const ref = doc(this.firestore, `agrupamentos/${agrupamentoId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error('Agrupamento não encontrado.');
    }

    const atual = {
      id: snap.id,
      ...(snap.data() as Agrupamento),
    };

    const atualizado: Agrupamento = {
      ...atual,
      ...dados,
      atualizadoEm: new Date().toISOString(),
    };

    const batch = writeBatch(this.firestore);

    batch.update(ref, {
      ...dados,
      atualizadoEm: atualizado.atualizadoEm,
    });

    for (const chamadoId of atualizado.chamadosIds) {
      const patchChamado: Partial<Chamado> = {};

      if (dados.status !== undefined) patchChamado.status = dados.status;
      if (dados.prioridade !== undefined) patchChamado.prioridade = dados.prioridade;
      if (dados.atribuidoPara !== undefined) patchChamado.atribuidoPara = dados.atribuidoPara;
      if (dados.atribuidoParaNome !== undefined) {
        patchChamado.atribuidoParaNome = dados.atribuidoParaNome;
      }
      if (dados.localCampus !== undefined) patchChamado.localCampus = dados.localCampus;
      if (dados.ambienteLocal !== undefined) patchChamado.ambienteLocal = dados.ambienteLocal;

      batch.update(doc(this.firestore, `chamados/${chamadoId}`), patchChamado);
    }

    await batch.commit();
  }
  // =========================================================
  // ADICIONAR CHAMADO AO AGRUPAMENTO
  // =========================================================

  async adicionarChamado(agrupamentoId: string, chamadoId: string): Promise<void> {
    const agrupRef = doc(this.firestore, `agrupamentos/${agrupamentoId}`);
    const chamadoRef = doc(this.firestore, `chamados/${chamadoId}`);

    const [agrupSnap, chamadoSnap] = await Promise.all([getDoc(agrupRef), getDoc(chamadoRef)]);

    if (!agrupSnap.exists()) {
      throw new Error('Agrupamento não encontrado.');
    }

    if (!chamadoSnap.exists()) {
      throw new Error('Chamado não encontrado.');
    }

    const agrupamento = {
      id: agrupSnap.id,
      ...(agrupSnap.data() as Agrupamento),
    };

    const chamado = {
      id: chamadoSnap.id,
      ...(chamadoSnap.data() as Chamado),
    } as Chamado;

    if (chamado.agrupamentoId) {
      throw new Error(`O chamado #${chamado.id} já pertence a outro agrupamento.`);
    }

    if (chamado.idGrupo !== agrupamento.idGrupo) {
      throw new Error('Só é possível adicionar chamados com o mesmo idGrupo.');
    }

    if (agrupamento.chamadosIds.includes(chamadoId)) {
      return;
    }

    const novosChamadosIds = [...agrupamento.chamadosIds, chamadoId];
    const novosMembros = [...agrupamento.membros, this.criarSnapshotChamado(chamado)];

    const novasDescricoes = [...agrupamento.descricoes, chamado.descricao];

    const batch = writeBatch(this.firestore);
    batch.update(agrupRef, {
      chamadosIds: novosChamadosIds,
      membros: novosMembros,
      descricoes: novasDescricoes,
      atualizadoEm: new Date().toISOString(),
    });

    batch.update(chamadoRef, {
      agrupamentoId,
      status: agrupamento.status,
      prioridade: agrupamento.prioridade,
      atribuidoPara: agrupamento.atribuidoPara,
      atribuidoParaNome: agrupamento.atribuidoParaNome,
    });

    await batch.commit();
  }

  // =========================================================
  // REMOVER CHAMADO DO AGRUPAMENTO
  // =========================================================

  async removerChamado(agrupamentoId: string, chamadoId: string): Promise<void> {
    const agrupRef = doc(this.firestore, `agrupamentos/${agrupamentoId}`);
    const snap = await getDoc(agrupRef);

    if (!snap.exists()) {
      throw new Error('Agrupamento não encontrado.');
    }

    const agrupamento = {
      id: snap.id,
      ...(snap.data() as Agrupamento),
    };

    const membroRemovido = agrupamento.membros.find((m) => m.chamadoId === chamadoId);

    if (!membroRemovido) {
      throw new Error('O chamado informado não pertence a este agrupamento.');
    }

    const membrosRestantes = agrupamento.membros.filter((m) => m.chamadoId !== chamadoId);
    const chamadosIdsRestantes = agrupamento.chamadosIds.filter((id) => id !== chamadoId);

    // Se sobrar menos de 2 membros, o agrupamento deixa de fazer sentido.
    // Então desfazemos tudo e restauramos o estado original de cada chamado.
    if (membrosRestantes.length < 2) {
      await this.desfazerAgrupamento(agrupamentoId);
      return;
    }

    const batch = writeBatch(this.firestore);

    batch.update(agrupRef, {
      chamadosIds: chamadosIdsRestantes,
      membros: membrosRestantes,
      descricoes: membrosRestantes.map((m) => m.descricao),
      atualizadoEm: new Date().toISOString(),
    });

    batch.update(doc(this.firestore, `chamados/${chamadoId}`), {
      agrupamentoId: null,
      status: membroRemovido.status,
      prioridade: membroRemovido.prioridade,
      atribuidoPara: membroRemovido.atribuidoPara,
      atribuidoParaNome: membroRemovido.atribuidoParaNome,
    });

    await batch.commit();
  }

  // =========================================================
  // DESFAZER AGRUPAMENTO
  // =========================================================

  async desfazerAgrupamento(agrupamentoId: string): Promise<void> {
    const agrupRef = doc(this.firestore, `agrupamentos/${agrupamentoId}`);
    const snap = await getDoc(agrupRef);

    if (!snap.exists()) {
      return;
    }

    const agrupamento = {
      id: snap.id,
      ...(snap.data() as Agrupamento),
    };
    const batch = writeBatch(this.firestore);

    for (const membro of agrupamento.membros) {
      batch.update(doc(this.firestore, `chamados/${membro.chamadoId}`), {
        agrupamentoId: null,
        status: membro.status,
        prioridade: membro.prioridade,
        atribuidoPara: membro.atribuidoPara,
        atribuidoParaNome: membro.atribuidoParaNome,
      });
    }

    const notasSnap = await getDocs(
      collection(this.firestore, `agrupamentos/${agrupamentoId}/notas`),
    );

    notasSnap.forEach((notaDoc) => {
      batch.delete(notaDoc.ref);
    });

    batch.delete(agrupRef);

    await batch.commit();
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private async carregarChamado(chamadoId: string): Promise<Chamado | null> {
    const ref = doc(this.firestore, `chamados/${chamadoId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as Chamado),
    };
  }

  private criarSnapshotChamado(chamado: Chamado): ChamadoSnapshot {
    return {
      chamadoId: chamado.id!,
      idGrupo: chamado.idGrupo,
      localCampus: chamado.localCampus,
      ambienteLocal: chamado.ambienteLocal,
      tipoDemanda: chamado.tipoDemanda,
      descricao: chamado.descricao,
      canalAbertura: chamado.canalAbertura,
      status: chamado.status,
      prioridade: chamado.prioridade,
      criadoPor: chamado.criadoPor,
      criadoPorNome: chamado.criadoPorNome,
      criadoEm: chamado.criadoEm,
      atribuidoPara: chamado.atribuidoPara,
      atribuidoParaNome: chamado.atribuidoParaNome,
    };
  }

  private removerDuplicadosPorId(chamados: Chamado[]): Chamado[] {
    const mapa = new Map<string, Chamado>();

    for (const chamado of chamados) {
      if (!chamado.id) continue;
      mapa.set(chamado.id, chamado);
    }

    return [...mapa.values()];
  }

  private calcularStatusInicial(chamados: Chamado[]): StatusChamado {
    if (chamados.some((c) => c.status === 'Em Execução')) return 'Em Execução';
    if (chamados.some((c) => c.status === 'Aberto')) return 'Aberto';
    if (chamados.some((c) => c.status === 'Fechado')) return 'Fechado';
    return 'Cancelado';
  }

  private calcularPrioridadeInicial(chamados: Chamado[]): PrioridadeChamado {
    const ordem: PrioridadeChamado[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

    return chamados.reduce((acumulado, atual) => {
      return ordem.indexOf(atual.prioridade) > ordem.indexOf(acumulado.prioridade)
        ? atual
        : acumulado;
    }).prioridade;
  }

  private calcularAtribuicaoInicial(chamados: Chamado[]): { uid: string; nome: string } {
    const chamadoComResponsavel = chamados.find((c) => !!c.atribuidoPara);

    if (chamadoComResponsavel) {
      return {
        uid: chamadoComResponsavel.atribuidoPara,
        nome: chamadoComResponsavel.atribuidoParaNome,
      };
    }

    return { uid: '', nome: '' };
  }

  getChamadosDoAgrupamento(chamados: Chamado[], agrupamentoId: string): Chamado[] {
    return chamados.filter((c) => c.agrupamentoId === agrupamentoId);
  }

  // =========================================================
  // NOTAS
  // =========================================================

  getNotasAgrupamento(agrupamentoId: string): Observable<Nota[]> {
    return new Observable((observer) => {
      const notasRef = collection(this.firestore, `agrupamentos/${agrupamentoId}/notas`);
      const q = query(notasRef, orderBy('criadoEm', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Nota[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  async addNotaAgrupamento(agrupamentoId: string, nota: Nota): Promise<any> {
    const notasCollection = collection(this.firestore, `agrupamentos/${agrupamentoId}/notas`);

    return addDoc(notasCollection, {
      autorNome: nota.autorNome,
      autorFuncao: nota.autorFuncao,
      texto: nota.texto,
      criadoEm: new Date().toISOString(),
    });
  }
}
