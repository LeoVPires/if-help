import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Chamado } from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class ChamadosService {
  // Injeta o Firestore no serviço
  private firestore = inject(Firestore);

  // Referência para a coleção "chamados"
  private chamadosCollection = collection(this.firestore, 'chamados');

  // 1. BUSCAR todos os chamados
  getChamados(): Observable<Chamado[]> {
    // o { idField: 'id' } faz com que o ID gerado pelo Firebase seja mapeado para a propriedade 'id' da interface
    return collectionData(this.chamadosCollection, { idField: 'id' }) as Observable<Chamado[]>;
  }

  // 2. CRIAR um novo chamado
  async addChamado(chamado: Chamado): Promise<any> {
    // Remove o id caso ele venha vazio para não salvar uma string vazia no banco
    delete chamado.id;
    return addDoc(this.chamadosCollection, chamado);
  }

  // 3. ATUALIZAR um chamado (ex: mudar status)
  async updateStatusChamado(id: string, novoStatus: string): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${id}`);
    return updateDoc(chamadoDocRef, { status: novoStatus });
  }

  // 4. ADICIONAR NOTA (Subcoleção)
  async addNota(chamadoId: string, nota: any): Promise<any> {
    // Aponta direto para a subcoleção "notas" dentro do documento do chamado específico
    const notasCollection = collection(this.firestore, `chamados/${chamadoId}/notas`);
    return addDoc(notasCollection, nota);
  }
}
